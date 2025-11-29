let selectedSlot = null
let selectedDate = null
let selectedMedicoId = null

document.addEventListener('DOMContentLoaded', () => {
//Verificamos que tenemos el rol de paciente
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('paciente'); 
    }

    // Inicialización de todas las páginas
    if (document.getElementById('perfil-form')) { // Para el Perfil
        loadPerfilPaciente();
        document.getElementById('perfil-form').addEventListener('submit', handlePerfilUpdate);
    }

    if (document.getElementById('citas-proximas-list')) {   // Para Observar las Citas
        loadCitasPaciente();
        setupCitasListeners();
    }

    if (document.getElementById('select-medico')) { // Para agendar las citas
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

// Cargamos el dashboard en pacientes_dashboard
const loadDashboardPaciente = async () => {
    try {
        const data = await fetchAPI('/citas/mis_citas.php', { method: 'GET' })

        const infoElement = document.getElementById('dashboard-proxima-info')
        const detalleElement = document.getElementById('dashboard-proxima-detalle')

        if (infoElement && data.status && data.data.length > 0) {
            const hoy = new Date()
            const proximasCitas = data.data.filter(c => 
                c.estado !== 'cancelada' && c.estado !== 'completada' && new Date(`${c.fecha_cita}T${c.hora_cita}`) > hoy
            )

            if (proximasCitas.length > 0) {
                const cita = proximasCitas[proximasCitas.length - 1] 
                
                const fechaFormat = new Date(cita.fecha_cita).toLocaleDateString('es-ES', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                })

                infoElement.textContent = `${fechaFormat} a las ${cita.hora_cita.substring(0, 5)}`
                detalleElement.textContent = `Dr. ${cita.nombre_medico} (${cita.especialidad})`
                
            } else {
                 infoElement.textContent = 'No tienes citas programadas.'
                 if(detalleElement) detalleElement.textContent = '¡Agenda una ahora!'
            }
        } else if (infoElement) {
             infoElement.textContent = 'No tienes citas programadas.'
             if(detalleElement) detalleElement.textContent = '¡Agenda una ahora!'
        }

    } catch (error) {
        console.error('No se pudo cargar el dashboard:', error.message)
    }
}

//Cargamos al paciente que tiene la sesion iniciada
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
            alert('Error al cargar perfil: ' + data.message)
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
        alert('Las nuevas contraseñas no coinciden.')
        return
    }
    
    try {
        const result = await fetchAPI('usuarios/pacientes/actualizar_perfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        })

        if (result.status) {
            alert(result.message || 'Perfil actualizado con éxito.')
            window.location.reload() 
        } else {
            alert(result.message || 'Error al actualizar el perfil.')
        }

    } catch (error) {
        alert(`Fallo en la actualización: ${error.message}`)
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
        ? `<button class="neumorph-btn-alt" style="color: var(--text-color-medium); text-transform: capitalize;">${estadoDisplay}</button>`
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
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
        return
    }

    try {
        const result = await fetchAPI('/citas/cancelar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_cita: citaId }) 
        })

        if (result.status) {
            alert(result.message || 'Cita cancelada correctamente.')
            loadCitasPaciente() 
        } else {
            alert(result.message || 'Error al cancelar la cita.')
        }

    } catch (error) {
        alert(`Fallo en la cancelación: ${error.message}`)
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


// Obtenemos la fecha actual
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

const setupAgendarCitaFlujo = async () => {
    const medicoSelect = document.getElementById('select-medico')
    const confirmarBtn = document.getElementById('confirmar-cita-btn')
    const fechaInput = document.getElementById('input-fecha')
    const horaInput = document.getElementById('input-hora')
    
    if (fechaInput) {
        fechaInput.min = getTodayDate();
    }
    
    await loadMedicos(medicoSelect)
    
    medicoSelect.addEventListener('change', () => {
        selectedMedicoId = medicoSelect.value
        validateAndEnableConfirm()
    })

    if (fechaInput) fechaInput.addEventListener('change', validateAndEnableConfirm)
    if (horaInput) horaInput.addEventListener('change', validateAndEnableConfirm)
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
             selectElement.innerHTML = '<option value="" disabled selected>Error: Datos no válidos de la API</option>'
        }
    } catch (error) {
        console.error('Error al cargar médicos:', error)
        selectElement.innerHTML = '<option value="" disabled selected>Fallo de conexión. Revisa la ruta.</option>'
    }
}

const validateAndEnableConfirm = () => {
    const confirmarBtn = document.getElementById('confirmar-cita-btn')
    const fechaInput = document.getElementById('input-fecha')
    const horaInput = document.getElementById('input-hora')

    selectedDate = fechaInput ? fechaInput.value : null
    selectedSlot = horaInput ? horaInput.value : null

    if (selectedMedicoId && selectedDate && selectedSlot) {
        confirmarBtn.disabled = false
    } else {
        confirmarBtn.disabled = true
    }
}

const handleAgendarCita = async () => {
    if (!selectedDate || !selectedSlot || !selectedMedicoId) {
        alert('Debes seleccionar un médico, una fecha y una hora.')
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
            alert(result.message || '¡Cita agendada con éxito!')
            window.location.href = 'paciente_miscitas.html' 
        } else {
            alert(result.message || 'Error al agendar la cita. Verifica el horario y disponibilidad.')
        }
    } catch (error) {
        alert(`Fallo en el agendamiento: ${error.message}`)
    }
}