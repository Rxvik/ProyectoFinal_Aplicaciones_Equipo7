/* */

let selectedSlot = null
let selectedDate = null
let selectedMedicoId = null

document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('paciente'); 
    }

    if (document.getElementById('perfil-form')) {
        loadPerfilPaciente();
        document.getElementById('perfil-form').addEventListener('submit', handlePerfilUpdate);
    }

    if (document.getElementById('citas-proximas-list')) {
        loadCitasPaciente();
        setupCitasListeners();
    }

    if (document.getElementById('select-medico')) {
        setupAgendarCitaFlujo();
    }

    loadDashboardPaciente();
    updateNavbarUsername();
});

const updateNavbarUsername = () => {
    const usernameSpan = document.getElementById('navbar-username')
    const storedName = localStorage.getItem('NOMBRE_USUARIO')
    if (usernameSpan && storedName) {
        usernameSpan.textContent = storedName
    }
}

const loadDashboardPaciente = async () => {
    try {
        const data = await fetchAPI('/citas/mis_citas.php', { method: 'GET' })

        // Elementos Dashboard original
        const infoProxima = document.getElementById('dashboard-proxima-info')
        const detalleProxima = document.getElementById('dashboard-proxima-detalle')
        
        // Elementos nuevos (si aplicaste el cambio anterior de 3 tarjetas)
        const infoUltima = document.getElementById('dashboard-ultima-cita')
        const detalleUltima = document.getElementById('dashboard-ultima-detalle')

        if (data.status && data.data.length > 0) {
            const hoy = new Date()
            
            // 1. Lógica para Próxima Cita
            const proximasCitas = data.data.filter(c => 
                c.estado !== 'cancelada' && c.estado !== 'completada' && new Date(`${c.fecha_cita}T${c.hora_cita}`) > hoy
            )

            if (proximasCitas.length > 0) {
                // Ordenar por fecha más cercana
                proximasCitas.sort((a, b) => new Date(`${a.fecha_cita}T${a.hora_cita}`) - new Date(`${b.fecha_cita}T${b.hora_cita}`));
                const cita = proximasCitas[0];
                
                const fechaFormat = new Date(cita.fecha_cita).toLocaleDateString('es-ES', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                })

                if(infoProxima) infoProxima.textContent = `${fechaFormat} - ${cita.hora_cita.substring(0, 5)}`
                if(detalleProxima) detalleProxima.textContent = `Dr. ${cita.nombre_medico} (${cita.especialidad})`
            } else {
                 if(infoProxima) infoProxima.textContent = 'Sin citas pendientes'
                 if(detalleProxima) detalleProxima.textContent = 'Agenda una nueva cita en el menú lateral.'
            }

            // 2. Lógica para Última Consulta
            const historialCitas = data.data.filter(c => 
                c.estado === 'completada' || (new Date(`${c.fecha_cita}T${c.hora_cita}`) < hoy && c.estado !== 'cancelada')
            )

            if (historialCitas.length > 0 && infoUltima) {
                historialCitas.sort((a, b) => new Date(`${b.fecha_cita}T${b.hora_cita}`) - new Date(`${a.fecha_cita}T${a.hora_cita}`));
                const ultima = historialCitas[0];

                const fechaUltima = new Date(ultima.fecha_cita).toLocaleDateString('es-ES', { 
                    day: 'numeric', month: 'short' 
                })
                
                if(infoUltima) infoUltima.textContent = `${fechaUltima} - ${ultima.estado.charAt(0).toUpperCase() + ultima.estado.slice(1)}`
                if(detalleUltima) detalleUltima.textContent = `Con: Dr. ${ultima.nombre_medico}`
            } else if (infoUltima) {
                infoUltima.textContent = 'Sin historial'
                if(detalleUltima) detalleUltima.textContent = 'Aún no has tenido consultas.'
            }

        } else if (infoProxima) {
             infoProxima.textContent = 'Bienvenido'
             if(detalleProxima) detalleProxima.textContent = 'Comienza agendando tu primera cita.'
        }

    } catch (error) {
        console.error('No se pudo cargar el dashboard:', error.message)
    }
}

const loadPerfilPaciente = async () => {
    try {
        const data = await fetchAPI('/usuarios/obtener_perfil.php', { method: 'GET' })

        if (data.status && data.usuario) {
            document.getElementById('fullname').value = data.usuario.nombre_completo || ''
            document.getElementById('email').value = data.usuario.email || ''
            document.getElementById('phone').value = data.usuario.telefono || ''
            
            localStorage.setItem('NOMBRE_USUARIO', data.usuario.nombre_completo) 
            updateNavbarUsername()
        } else {
            Swal.fire('Error', 'Error al cargar perfil: ' + data.message, 'error')
        }

    } catch (error) {
        console.error('No se pudo cargar el perfil:', error.message)
    }
}

const handlePerfilUpdate = async (e) => {
    e.preventDefault()
    const form = e.target
    const dataToSend = {
        fullname: form.fullname.value,
        email: form.email.value,
        phone: form.phone.value,
        new_password: form.new_password.value,
        confirm_password: form.confirm_password.value,
    }
    if (dataToSend.new_password !== dataToSend.confirm_password) {
        Swal.fire('Atención', 'Las nuevas contraseñas no coinciden.', 'warning')
        return
    }
    
    try {
        const result = await fetchAPI('usuarios/pacientes/actualizar_perfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        })

        if (result.status) {
            await Swal.fire('Actualizado', result.message || 'Perfil actualizado con éxito.', 'success')
            window.location.reload() 
        } else {
            Swal.fire('Error', result.message || 'Error al actualizar el perfil.', 'error')
        }

    } catch (error) {
        Swal.fire('Error', `Fallo en la actualización: ${error.message}`, 'error')
    }
}

const createCitaCard = (cita, isPast = false) => {
    const estadoDisplay = (cita.estado === 'pendiente' || cita.estado === 'confirmada') ? 'Próxima' : 
                          (cita.estado === 'completada' ? 'Completada' : 'Cancelada')
    
    const fecha = new Date(cita.fecha_cita).toLocaleDateString('es-ES', { 
        weekday: 'long', day: 'numeric', month: 'short' 
    })
    const hora = cita.hora_cita.substring(0, 5)

    const actionButton = isPast || estadoDisplay === 'Cancelada' || estadoDisplay === 'Completada'
        ? `<button class="neumorph-btn-alt" style="color: var(--text-color-medium); text-transform: capitalize; cursor: default;">${estadoDisplay}</button>`
        : `<button class="btn-danger cancelar-cita" data-cita-id="${cita.id_cita}">Cancelar</button>`

    return `
        <li class="cita-card ${isPast ? 'pasada' : ''}">
            <div class="cita-info">
                <span class="fecha">${fecha}</span>
                <span class="doctor">${hora} - Dr. ${cita.nombre_medico}</span>
                <span class="especialidad">${cita.especialidad}</span>
            </div>
            <div class="cita-actions">
                ${actionButton}
            </div>
        </li>
    `
}

const loadCitasPaciente = async () => {
    try {
        const data = await fetchAPI('/citas/mis_citas.php', { method: 'GET' })

        const proximasList = document.getElementById('citas-proximas-list')
        const historialList = document.getElementById('historial-citas-list')
        
        if (data.status) {
            proximasList.innerHTML = ''
            historialList.innerHTML = ''
            
            const hoy = new Date()
            const proximas = []
            const historial = []

            data.data.forEach(cita => {
                const citaDateTime = new Date(`${cita.fecha_cita}T${cita.hora_cita}`)
                
                if (citaDateTime > hoy && cita.estado !== 'cancelada') {
                    proximas.push(cita)
                } else {
                    historial.push(cita)
                }
            })
            
            proximas.reverse() 

            proximas.forEach(cita => {
                proximasList.insertAdjacentHTML('beforeend', createCitaCard(cita, false))
            })

            historial.forEach(cita => {
                historialList.insertAdjacentHTML('beforeend', createCitaCard(cita, true))
            })

        } else {
             proximasList.innerHTML = `<li><p style="text-align: center;">${data.message || 'No hay citas cargadas.'}</p></li>`
             historialList.innerHTML = `<li><p style="text-align: center;">${data.message || 'No hay citas cargadas.'}</p></li>`
        }

    } catch (error) {
        console.error('No se pudieron cargar las citas:', error.message)
    }
}

const handleCancelacionCita = async (citaId) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas cancelar esta cita?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No',
        reverseButtons: true
    });

    if (!result.isConfirmed) return

    try {
        const apiResult = await fetchAPI('/citas/cancelar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_cita: citaId }) 
        })

        if (apiResult.status) {
            Swal.fire('Cancelada', apiResult.message || 'Cita cancelada correctamente.', 'success')
            loadCitasPaciente() 
        } else {
            Swal.fire('Error', apiResult.message || 'Error al cancelar la cita.', 'error')
        }

    } catch (error) {
        Swal.fire('Error', `Fallo en la cancelación: ${error.message}`, 'error')
    }
}

const setupCitasListeners = () => {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('cancelar-cita')) {
            const citaId = e.target.getAttribute('data-cita-id')
            if (citaId) {
                handleCancelacionCita(citaId)
            }
        }
    })
}

const setupAgendarCitaFlujo = async () => {
    const medicoSelect = document.getElementById('select-medico')
    const confirmarBtn = document.getElementById('confirmar-cita-btn')
    const fechaInput = document.getElementById('input-fecha')
    const horaInput = document.getElementById('input-hora')
    let calendarInstance = null

    await loadMedicos(medicoSelect)
    
    medicoSelect.addEventListener('change', async () => {
        selectedMedicoId = medicoSelect.value
        
        if (!selectedMedicoId) return

        const ocupacion = await fetchAPI(`citas/ocupacion_medico.php?id_medico=${selectedMedicoId}`, { method: 'GET' })
        
        const calendarEl = document.getElementById('calendar-paciente')
        
        if (calendarEl) {
            if (calendarInstance) calendarInstance.destroy()
            
            calendarInstance = new FullCalendar.Calendar(calendarEl, {
                initialView: 'timeGridWeek',
                locale: 'es',
                slotDuration: '00:30:00', 
                slotLabelInterval: '00:30', 
                snapDuration: '00:30:00', 
                slotMinTime: '08:00:00',
                slotMaxTime: '20:00:00',
                allDaySlot: false,
                hiddenDays: [0],
                height: 500,
                events: ocupacion, 
                
                dateClick: function(info) {
                    const eventoAnterior = calendarInstance.getEventById('seleccion-temporal')
                    if (eventoAnterior) {
                        eventoAnterior.remove()
                    }

                    calendarInstance.addEvent({
                        id: 'seleccion-temporal',
                        title: '✅ Seleccionado',
                        start: info.dateStr,
                        allDay: false,
                        color: '#28a745', 
                        display: 'block'
                    })

                    const [fecha, horaCompleta] = info.dateStr.split('T')
                    const hora = horaCompleta.substring(0, 5)
                    
                    if(fechaInput) fechaInput.value = fecha
                    if(horaInput) horaInput.value = hora
                    
                    selectedDate = fecha
                    selectedSlot = hora

                    if(confirmarBtn) {
                        confirmarBtn.disabled = false
                        confirmarBtn.textContent = "Confirmar Cita"
                    }
                }
            })
            calendarInstance.render()
        }
    })

    if (confirmarBtn) confirmarBtn.addEventListener('click', handleAgendarCita)
}

const loadMedicos = async (selectElement) => {
    try {
        const data = await fetchAPI('/citas/listar_medicos.php', { method: 'GET' }) 

        if (data.status && data.medicos && Array.isArray(data.medicos)) {
            selectElement.innerHTML = '<option value="" disabled selected>Selecciona un Médico</option>'
            
            data.medicos.forEach(medico => { 
                const nombre = medico.nombre_completo || 'N/A'
                const especialidad = medico.especialidad || 'Sin Especialidad'

                const display = `Dr. ${nombre} (${especialidad})`
                selectElement.insertAdjacentHTML('beforeend', `<option value="${medico.id_medico}">${display}</option>`)
            })

            if (data.medicos.length === 0) {
                 selectElement.innerHTML = '<option value="" disabled selected>No se encontraron médicos</option>'
            }
            
        } else {
             selectElement.innerHTML = '<option value="" disabled selected>Error: Datos no válidos</option>'
        }
    } catch (error) {
        console.error('Error al cargar médicos:', error)
        selectElement.innerHTML = '<option value="" disabled selected>Fallo de conexión</option>'
    }
}

const handleAgendarCita = async () => {
    if (!selectedDate || !selectedSlot || !selectedMedicoId) {
        Swal.fire('Faltan datos', 'Debes seleccionar un médico, una fecha y una hora.', 'warning')
        return
    }

    const dataToSend = {
        id_medico: selectedMedicoId,
        fecha: selectedDate,
        hora: selectedSlot
    }
    
    try {
        const result = await fetchAPI('citas/agendar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        })

        if (result.status) {
            await Swal.fire('¡Agendada!', result.message || 'Cita agendada con éxito.', 'success')
            window.location.href = 'paciente_miscitas.html' 
        } else {
            Swal.fire('Error', result.message || 'Error al agendar la cita. Verifica el horario.', 'error')
        }
    } catch (error) {
        Swal.fire('Error', `Fallo en el agendamiento: ${error.message}`, 'error')
    }
}