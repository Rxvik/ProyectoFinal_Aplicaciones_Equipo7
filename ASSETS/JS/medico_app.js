const DIAS_SEMANA = [
    { id: 1, nombre: 'Lunes', campo: 'Lunes' },
    { id: 2, nombre: 'Martes', campo: 'Martes' },
    { id: 3, nombre: 'Miércoles', campo: 'Miercoles' },
    { id: 4, nombre: 'Jueves', campo: 'Jueves' },
    { id: 5, nombre: 'Viernes', campo: 'Viernes' },
    { id: 6, nombre: 'Sabado', campo: 'Sabado' },
]

document.addEventListener('DOMContentLoaded', () => {
    // Verificar rol de acceso
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('medico')
    }

    const path = window.location.pathname

    // Inicialización del Dashboard
    if (path.includes('medico_dashboard.html')) {
        setupMedicoDashboard()
    } 
    
    // Inicialización de Horarios
    if (path.includes('medico_horarios.html')) {
        setupMedicoHorarios()
    } 

    // Inicialización de Pacientes
    if (path.includes('medico_pacientes.html')) {
        setupMedicoPacientes()
    }
    
    // Incializacion de la Agenda
    if (path.includes('medico_agenda.html')) {
        setupMedicoAgenda()
    }

})

///////////////////////////////////
// Funcionalidad del Dashboard
const handleCompletarCita = async (e) => {
    const button = e.target
    const citaId = button.getAttribute('data-cita-id')
    const nuevoEstado = 'completada'

    if (!confirm(`¿Estás seguro de que deseas marcar la cita ${citaId} como COMPLETADA?`)) {
        return
    }
    button.disabled = true
    button.textContent = '...'

    try {
        const result = await fetchAPI('citas/cambiar_estado.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_cita: citaId, 
                estado: nuevoEstado 
            })
        })

        if (result.status) {
            alert(result.message || 'Cita completada con éxito.')
            await loadDashboardData() 
        } else {
            alert(`Error al completar la cita: ${result.message || 'Respuesta de API inválida.'}`)
        }

    } catch (error) {
        console.error('Error al completar cita:', error)
        alert(`Fallo en la conexión al servidor.`)
    } finally {
        button.disabled = false
        button.textContent = 'Completada' 
    }
}

const loadDashboardData = async () => {
    try {
        const data = await fetchAPI('usuarios/medicos/dashboard_medico.php', { method: 'GET' })
        if (!data.status || !data.resumen) {
            console.error('API Error:', data.message || 'Datos de dashboard incompletos.')
            document.getElementById('citas-hoy-total').textContent = 'N/A'
            document.getElementById('pacientes-atendidos-count').textContent = 'N/A'
            return
        }
        const resumen = data.resumen
        const proximaCita = resumen.proxima_cita

        document.getElementById('citas-hoy-total').textContent = resumen.citas_hoy || 0
        document.getElementById('pacientes-atendidos-count').textContent = `${resumen.atendidos_hoy || 0} / ${resumen.citas_hoy || 0}`
        if (proximaCita) {
            document.getElementById('proxima-cita-hora').textContent = `${proximaCita.hora_cita.substring(0, 5)} - ${proximaCita.fecha_cita}`
            document.getElementById('proxima-cita-paciente').textContent = `Paciente: ${proximaCita.paciente}`
        } else {
            document.getElementById('proxima-cita-hora').textContent = 'N/A'
            document.getElementById('proxima-cita-paciente').textContent = 'No hay citas pendientes próximas.'
        }
        const citasListElement = document.getElementById('citas-hoy-list')
        const todasLasCitas = data.lista_completa || []
        const fechaHoy = new Date().toISOString().slice(0, 10) 
        const citasHoy = todasLasCitas.filter(cita => 
            cita.fecha_cita === fechaHoy && cita.estado !== 'cancelada'
        )
        if (citasListElement) {
            if (citasHoy.length === 0) {
                citasListElement.innerHTML = '<li class="cita-card"><div class="cita-info">No hay citas agendadas para hoy.</div></li>'
                return
            }
            citasListElement.innerHTML = citasHoy.map(cita => {
                const estado = cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)
                const estadoClase = cita.estado === 'completada' ? 'cita-completada' : ''
                const pacienteNombre = cita.paciente
                const accionHTML = (cita.estado === 'pendiente' || cita.estado === 'confirmada') 
                    ? `<button class="btn-primary marcar-completada-btn" data-cita-id="${cita.id_cita}" style="padding: 0.5rem 0.75rem; font-size: 0.8rem;">Completada</button>`
                    : `<span style="color: var(--text-color-light); font-weight: 600;">${estado}</span>`
                return `
                    <li class="cita-card ${estadoClase}">
                        <div class="cita-info">
                            <span class="fecha">${cita.hora_cita.substring(0, 5)}</span>
                            <span class="doctor">${pacienteNombre}</span>
                            <span class="especialidad">Estado: ${estado}</span>
                        </div>
                        <div class="cita-actions">
                            ${accionHTML}
                        </div>
                    </li>
                `
            }).join('')

            document.querySelectorAll('.marcar-completada-btn').forEach(button => {
                button.addEventListener('click', handleCompletarCita)
            })
        }

    } catch (error) {
        console.error('Error fatal al cargar dashboard:', error)
        alert('Error al cargar el dashboard. Ver consola.')
    }
}
const setupMedicoDashboard = async () => {
    await loadDashboardData()
}

///////////////////////////////////////////////////////
// Funcionalidad de los horarios (medico_horarios.html)
/**
 @param {string} diaNombre - Nombre del día (ej: Lunes)
 @param {string} diaCampo - Campo de la base de datos (ej: Lunes)
 @param {string} inicio - Hora de inicio predeterminada
 @param {string} fin - Hora de fin predeterminada
 @returns {string} HTML del selector de horario
*/

/**
@param {Array<Object>} horariosDB - obtenemos los horarios
*/
const renderHorariosForm = (horariosDB = []) => {
    const container = document.getElementById('horarios-container')
    if (!container) return
    const horariosMap = horariosDB.reduce((map, horario) => {
        map[horario.dia_semana] = {
            inicio: horario.hora_inicio.substring(0, 5),
            fin: horario.hora_fin.substring(0, 5)
        }
        return map
    }, {})

    let html = ''
    DIAS_SEMANA.forEach(dia => {
        const horarioExistente = horariosMap[dia.campo]
        const isChecked = !!horarioExistente
        const valInicio = horarioExistente ? horarioExistente.inicio : ''
        const valFin = horarioExistente ? horarioExistente.fin : ''

        html += `
            <div class="horario-item">
                <div class="dia-control">
                    <label class="switch">
                        <input type="checkbox" class="dia-check" name="dias_laborables" value="${dia.campo}" ${isChecked ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span class="day-name">${dia.nombre}</span>
                </div>

                <div class="time-inputs ${isChecked ? '' : 'disabled'}" id="inputs-${dia.campo}">
                    <input type="time" name="${dia.campo}_inicio" value="${valInicio}" class="input-neumorph">
                    <span style="font-weight:bold; color:var(--text-color-light); margin: 0 5px;">a</span>
                    <input type="time" name="${dia.campo}_fin" value="${valFin}" class="input-neumorph">
                </div>
            </div>
        `
    })

    container.innerHTML = html
    container.querySelectorAll('.dia-check').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const inputsDiv = document.getElementById(`inputs-${e.target.value}`)
            const inputs = inputsDiv.querySelectorAll('input')
            
            if (e.target.checked) {
                inputsDiv.classList.remove('disabled')
                inputs.forEach(input => input.disabled = false)
            } else {
                inputsDiv.classList.add('disabled')
                inputs.forEach(input => {
                    input.disabled = true
                    input.value = ''
                })
            }
        })
    })
}

const loadHorarios = async () => {
    try {
        const result = await fetchAPI('usuarios/medicos/ver_horario.php', { method: 'GET' })
        if (result.status && Array.isArray(result.data)) {
            renderHorariosForm(result.data)
        } else {
            console.error("Error al cargar horarios:", result.message || 'Datos de horarios no válidos.')
            renderHorariosForm([])
        }
    } catch (error) {
        console.error('Fallo de conexión al cargar horarios:', error)
        alert('Error de conexión al cargar horarios. Ver consola.')
        renderHorariosForm([])
    }
}

const handleGuardarHorarios = async (e) => {
    e.preventDefault()

    const form = e.target
    const horarios = []
    let isValid = true
    const container = document.getElementById('horarios-container') 

    DIAS_SEMANA.forEach(dia => {
        // recorre todos los dias que estan definidos al inicio
        const checkbox = container.querySelector(`input[value="${dia.campo}"]`)
        if (checkbox && checkbox.checked) {
            const inicioInput = container.querySelector(`input[name="${dia.campo}_inicio"]`)
            const finInput = container.querySelector(`input[name="${dia.campo}_fin"]`)
            const inicio = inicioInput ? inicioInput.value : ''
            const fin = finInput ? finInput.value : ''
            if (!inicio || !fin) {
                alert(`Error: Debes especificar la hora de inicio y fin para el día ${dia.nombre}.`)
                isValid = false
                return 
            }
            // Validación de horas
            if (inicio >= fin) {
                alert(`Error: La hora de fin debe ser posterior a la hora de inicio para el día ${dia.nombre}.`)
                isValid = false
                return 
            }
            horarios.push({
                dia: dia.campo,
                inicio: inicio + ':00',
                fin: fin + ':00'
            })
        }
    })

    if (!isValid) return
    if (horarios.length === 0) {
        if (!confirm('No has marcado ningún día. ¿Deseas eliminar todos tus horarios laborales?')) {
            return
        }
    }
    try {
        const result = await fetchAPI('usuarios/medicos/guardar_horario.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(horarios) 
        })

        if (result.status) {
            alert(result.message || 'Horarios guardados con éxito.')
            await loadHorarios()
        } else {
            alert(`Error al guardar: ${result.message || 'Respuesta de API inválida.'}`)
        }

    } catch (error) {
        console.error('Error al guardar horarios:', error)
        alert(`Fallo en la conexión al servidor: ${error.message}`)
    }
}

const setupMedicoHorarios = async () => {
    await loadHorarios()
    const form = document.getElementById('horarios-form')
    if (form) {
        form.addEventListener('submit', handleGuardarHorarios)
    }
}

////////////////////////////////////////////////////////
// Funcionalidad de Mis pacientes (medico_pacientes.html)
/**
 * Función para renderizar la lista de pacientes en la tabla.
 * @param {Array<Object>} pacientes - arreglo de pacientes
 */
const renderPacientesTable = (pacientes) => {
    const tableBody = document.getElementById('pacientes-table-body')
    if (!tableBody) return

    if (pacientes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Aún no tienes pacientes registrados en el sistema.</td></tr>'
        return
    }
    const html = pacientes.map(p => {
        const ultimaCita = p.ultima_cita ? p.ultima_cita.split(' ')[0] : 'N/A'
        const telefono = p.telefono || 'Sin registrar'
        return `
            <tr>
                <td>${p.nombre_completo}</td>
                <td>${p.email}</td>
                <td>${telefono}</td>
                <td>${ultimaCita}</td>
            </tr>
        `
    }).join('')
    tableBody.innerHTML = html
}

const loadPacientes = async () => {
    const tableBody = document.getElementById('pacientes-table-body')
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando pacientes...</td></tr>'
    }
    try {
        const result = await fetchAPI(`usuarios/medicos/mis_pacientes.php`, { method: 'GET' })

        if (result.status && Array.isArray(result.data)) {
            renderPacientesTable(result.data)
        } else {
            console.error("Error al cargar pacientes:", result.message || 'Datos de pacientes no válidos.')
            renderPacientesTable([])
        }

    } catch (error) {
        console.error('Fallo de conexión al cargar pacientes:', error)
        alert('Error de conexión al cargar pacientes. Ver consola.')
        renderPacientesTable([])
    }
}
const setupMedicoPacientes = async () => {
    await loadPacientes()
}

///////////////////////////////////////////////
// funcionalidad de la Agenda (medico_agenda.html)
const setupMedicoAgenda = async () => {
    const calendarEl = document.getElementById('calendar')
    if (!calendarEl) return

    try {
        const citas = await fetchAPI('usuarios/medicos/agenda.php', { method: 'GET' })

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            height: 650,
            events: citas,
            
            eventClick: function(info) {
                const id = info.event.id
                const paciente = info.event.title
                const inicio = info.event.start.toLocaleString()
                
                Swal.fire({
                    title: 'Gestionar Cita',
                    html: `<p><b>Paciente:</b> ${paciente}</p><p><b>Fecha:</b> ${inicio}</p>`,
                    icon: 'info',
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Completar',
                    denyButtonText: 'Cancelar Cita',
                    cancelButtonText: 'Cerrar',
                    confirmButtonColor: '#28a745',
                    denyButtonColor: '#d33'
                }).then((result) => {
                    if (result.isConfirmed) {
                        cambiarEstadoCita(id, 'completada')
                    } else if (result.isDenied) {
                        cambiarEstadoCita(id, 'cancelada')
                    }
                })
            }
        })

        calendar.render()

    } catch (error) {
        console.error('Error cargando agenda:', error)
        calendarEl.innerHTML = '<p class="text-center">No se pudieron cargar las citas.</p>'
    }
}

const cambiarEstadoCita = async (id, estado) => {
    try {
        const res = await fetchAPI('citas/cambiar_estado.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_cita: id, estado: estado })
        })
        
        if(res.status) {
            Swal.fire('Actualizado', `Cita ${estado}`, 'success')
            setupMedicoAgenda() // Recargar calendario
        } else {
            Swal.fire('Error', res.message, 'error')
        }
    } catch (e) {
        console.error(e)
    }
}