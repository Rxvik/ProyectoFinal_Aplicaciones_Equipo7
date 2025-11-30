document.addEventListener('DOMContentLoaded', () => {
    //Verificamos que tenemos el rol de admin
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('admin') 
    }

    const path = window.location.pathname

    // Inicializacion de dashboard
    if (path.includes('admin_dashboard.html')) {
        console.log('Inicializando Dashboard...')
        setupAdminDashboard()
    }

    // Inicializacion de Gestor Citas
    if (path.includes('admin_gestor_citas.html')) {
        setupGestorCitas()
    }

    // Inicializacion del gestor de Medicos 
    if (path.includes('admin_gestor_medicos.html')) {
        setupGestorMedicos()
    }

    // Inicializacion de Gestor Pacientes
    if (path.includes('admin_gestor_pacientes.html')) {
        setupGestorPacientes()
    }

    // Inicialización de reportes
    if (path.includes('admin_reportes.html')) {
        setupAdminReportes()
    }

})

//////////////////////////////////
// Funcionalidad del Dashboard (admin_dashboard.html)
const loadDashboardData = async () => {
    try {
        const data = await fetchAPI('usuarios/admin/resumen.php', { method: 'GET' }) 
        
        if (!data.status || !data.resumen) {
            console.error('API Error: Datos de dashboard incompletos.', data.message)
            return 
        }

        const resumen = data.resumen
        document.getElementById('citas-hoy-count').textContent = resumen.citas_hoy ?? 0
        document.getElementById('medicos-activos-count').textContent = resumen.medicos_activos ?? 0
        document.getElementById('pacientes-total-count').textContent = resumen.pacientes_total ?? 0 
        document.getElementById('citas-completadas-count').textContent = resumen.citas_completadas ?? 0

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
    }
}
const setupAdminDashboard = async () => {
    await loadDashboardData()
}


/////////////////////////////////////////
//Funcionalidad del Generador de reportes (pagina Reportes)
/**
* @param {HTMLSelectElement} selectElement - El elemento <select> donde se cargarán los médicos.
*/
const loadMedicosParaReporte = async (selectElement) => {
    // Este se carga primero
    selectElement.innerHTML = '<option value="todos">Cargando médicos...</option>'
    
    try {
        const data = await fetchAPI('citas/listar_medicos.php', { method: 'GET' }) 
        if (data.status && data.medicos && Array.isArray(data.medicos)) {
            let optionsHtml = '<option value="todos">Todos los médicos</option>'
            
            data.medicos.forEach(medico => { // Recorre a todos los ids de los medicos
                const nombre = medico.nombre_completo || 'N/A'
                const especialidad = medico.especialidad || 'Sin Especialidad'
                const id = medico.id_medico

                const display = `Dr. ${nombre} (${especialidad})`
                optionsHtml += `<option value="${id}">${display} (ID ${id})</option>`
            })

            selectElement.innerHTML = optionsHtml
            
            if (data.medicos.length === 0) {
                 selectElement.innerHTML = '<option value="todos">Todos los médicos (No se encontraron)</option>'
            }
            
        } else {
             console.error('Error de API o datos vacíos:', data)
             selectElement.innerHTML = '<option value="todos">Todos los médicos (Error de datos)</option>'
        }
    } catch (error) {
        console.error('Fallo de conexión al cargar médicos:', error)
        selectElement.innerHTML = '<option value="todos">Todos los médicos (Fallo de conexión)</option>'
    }
}

const setupAdminReportes = async () => {
    const medicoSelect = document.getElementById('medico')
    const form = document.querySelector('.report-form')
    const fechaInicioInput = document.getElementById('fecha_inicio')
    const fechaFinInput = document.getElementById('fecha_fin')
    
    if (medicoSelect) {
        await loadMedicosParaReporte(medicoSelect)
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            if (fechaInicioInput.value && fechaFinInput.value) {
                const inicio = new Date(fechaInicioInput.value)
                const fin = new Date(fechaFinInput.value)

                if (inicio > fin) {
                    e.preventDefault()
                    alert('La "Fecha de Fin" no puede ser anterior a la "Fecha de Inicio". Por favor, verifica el rango.')
                }
            }
        })
    }
}

//////////////////////////////////////////////////////////////////////
// Gestor de Pacientes 
const pacientesTableBody = document.getElementById('pacientes-table-body')
const loadingMessage = document.getElementById('loading-message')

/**
* Renderiza la lista de pacientes en la tabla.
* @param {Array<Object>} pacientes - El arreglo de objetos paciente.
*/
const renderPacientes = (pacientes) => {
    if (!pacientesTableBody) return
    
    let html = ''

    if (pacientes.length === 0) {
        html = '<tr><td colspan="5" style="text-align: center;">No se encontraron pacientes registrados.</td></tr>'
    } else {
        pacientes.forEach(paciente => {
            const fechaRegistro = new Date(paciente.fecha_creacion).toLocaleDateString()
            html += `
                <tr data-id="${paciente.id_paciente}">
                    <td>${paciente.nombre_completo}</td>
                    <td>${paciente.email}</td>
                    <td>${paciente.telefono}</td>
                    <td>${fechaRegistro}</td>
                    <td class="table-actions">
                        <button class="btn-danger btn-eliminar-paciente" data-id="${paciente.id_paciente}">Eliminar</button>
                    </td>
                </tr>
            `
        })
    }

    pacientesTableBody.innerHTML = html
    if (loadingMessage) loadingMessage.style.display = 'none'
    setupPacientesTableListeners()
}

const loadPacientes = async () => {
    if (loadingMessage) loadingMessage.style.display = 'block'
    
    try {
        const data = await fetchAPI('usuarios/admin/gestion_pacientes.php?accion=listar', { method: 'GET' }) 
        
        if (data.status && Array.isArray(data.data)) {
            renderPacientes(data.data)
        } else {
            console.error('Error al listar pacientes:', data.message || 'Datos no válidos')
            renderPacientes([])
        }
    } catch (error) {
        console.error('Fallo de conexión al cargar pacientes:', error)
        if (pacientesTableBody) {
             pacientesTableBody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Error de conexión.</td></tr>`
        }
        if (loadingMessage) loadingMessage.style.display = 'none'
    }
}

/**
* Aqui se maneja la eliminacion de un paciente
* @param {number} idPaciente - ID del paciente a eliminar.
*/
const handleDeletePaciente = async (idPaciente) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este paciente? Esta acción es irreversible y eliminará el registro de usuario asociado.')) {
        return
    }

    try {
        const data = await fetchAPI('usuarios/admin/gestion_pacientes.php?accion=eliminar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_paciente: idPaciente })
        })

        if (data.status) {
            alert(data.message || 'Paciente eliminado con éxito.')
            await loadPacientes() 
        } else {
            alert('Error al eliminar: ' + (data.message || 'Error desconocido.'))
        }
    } catch (error) {
        console.error('Error de eliminación:', error)
        alert('Fallo de conexión al intentar eliminar el paciente.')
    }
}

const setupPacientesTableListeners = () => {
    pacientesTableBody.removeEventListener('click', handlePacientesTableClick)

    pacientesTableBody.addEventListener('click', handlePacientesTableClick)
}

const handlePacientesTableClick = (e) => {
    const target = e.target
    const id = target.dataset.id
    
    if (!id) return
    
    if (target.classList.contains('btn-eliminar-paciente')) {
        handleDeletePaciente(id)
    } 
}

const setupGestorPacientes = () => {
    loadPacientes()
}

/////////////////////////////////////////////////////////////////////////
// Funcionalidad de Gestión de Citas (admin_gestor_citas.html)
const citasTableBody = document.getElementById('citas-table-body')
const citaModal = document.getElementById('cita-modal')
const citaForm = document.getElementById('cita-form')
const medicoSelect = document.getElementById('medico-select')

/**
 * @param {string} estado - ya sea cancelada, completada, Confirmada o pendiente
 * @returns {string} 
 */
const getStatusBadgeClass = (estado) => {
    switch (estado) {
        case 'confirmada':
            return 'confirmed'
        case 'completada':
            return 'completed'
        case 'cancelada':
            return 'canceled'
        case 'pendiente':
        default:
            return 'pendiente'
    }
}

/**
 * Renderiza la lista de citas en la tabla.
 * @param {Array<Object>} citas - Arreglo 
 */
const renderCitas = (citas) => {
    if (!citasTableBody) return

    let html = ''

    if (citas.length === 0) {
        html = '<tr><td colspan="6" style="text-align: center;">No se encontraron citas registradas.</td></tr>'
    } else {
        citas.forEach(cita => {
            const fechaHora = new Date(`${cita.fecha_cita}T${cita.hora_cita}`)
            const fechaDisplay = fechaHora.toLocaleDateString('es-ES')
            const horaDisplay = fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            const estadoClass = getStatusBadgeClass(cita.estado)
            const medicoDisplay = `Dr. ${cita.medico} (${cita.especialidad})`
            
            let acciones = ''
            if (cita.estado === 'pendiente' || cita.estado === 'confirmada') {
                 acciones += `<button class="neumorph-btn-alt btn-editar-cita" data-id="${cita.id_cita}">Editar</button>`
                 acciones += `<button class="btn-danger btn-cancelar-cita" data-id="${cita.id_cita}">Cancelar</button>`
            } else {
                 acciones += `<button class="neumorph-btn-alt btn-ver-cita" data-id="${cita.id_cita}" disabled>Ver</button>`
            }

            html += `
                <tr data-id="${cita.id_cita}" data-medico-id="${cita.id_medico}">
                    <td>${cita.id_cita}</td>
                    <td>${cita.paciente}</td>
                    <td>${medicoDisplay}</td>
                    <td>${fechaDisplay} - ${horaDisplay}</td>
                    <td><span class="badge ${estadoClass}">${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}</span></td>
                    <td class="table-actions">${acciones}</td>
                </tr>
            `
        })
    }

    citasTableBody.innerHTML = html
    const citaLoadingMessage = document.getElementById('loading-message')
    if (citaLoadingMessage) citaLoadingMessage.style.display = 'none'
    
    setupCitasTableListeners()
}

//Carga los médicos disponibles para el modal de edicion de citas.
const loadMedicosParaEdicion = async (currentMedicoId = null) => {
    if (!medicoSelect) return
    medicoSelect.innerHTML = '<option value="">Cargando médicos...</option>'
    try {
        const data = await fetchAPI('citas/listar_medicos.php', { method: 'GET' }) 
        
        if (data.status && data.medicos && Array.isArray(data.medicos)) {
            let optionsHtml = '<option value="">-- Selecciona un Médico --</option>'
            
            data.medicos.forEach(medico => {
                const nombre = medico.nombre_completo || 'N/A'
                const especialidad = medico.especialidad || 'Sin Especialidad'
                const id = medico.id_medico
                const display = `${nombre} (${especialidad})`
                const selected = (id == currentMedicoId) ? 'selected' : '' 
                optionsHtml += `<option value="${id}" ${selected}>${display}</option>`
            })

            medicoSelect.innerHTML = optionsHtml
        } else {
             console.error('Error de API o datos vacíos al cargar médicos:', data)
             medicoSelect.innerHTML = '<option value="">Error al cargar médicos</option>'
        }
    } catch (error) {
        console.error('Fallo de conexión al cargar médicos:', error)
        medicoSelect.innerHTML = '<option value="">Fallo de conexión</option>'
    }
}



//Carga las citas de lapi y llama a la función de renderizado.
const loadCitas = async () => {
    const citaLoadingMessage = document.getElementById('loading-message')
    if (citaLoadingMessage) citaLoadingMessage.style.display = 'block'
    
    try {
        const data = await fetchAPI('usuarios/admin/gestion_citas.php?accion=listar', { method: 'GET' }) 
        
        if (data.status && Array.isArray(data.data)) {
            renderCitas(data.data)
        } else {
            console.error('Error al listar citas:', data.message || 'Datos no válidos')
            renderCitas([])
        }
    } catch (error) {
        console.error('Fallo de conexión al cargar citas:', error)
        if (citasTableBody) {
             citasTableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Error de conexión.</td></tr>`
        }
        if (citaLoadingMessage) citaLoadingMessage.style.display = 'none'
    }
}

/**
 *  se abre el modal de edicion para las citas y carga los datos de la cita que queremos editar
 * @param {number} idCita - ID de la cita a editar.
 */
const openCitaModal = async (idCita) => {
    if (!citaModal) return
    
    const row = document.querySelector(`tr[data-id="${idCita}"]`)
    if (!row) {
        alert('Error: Cita no encontrada en la tabla para edición.')
        return
    }

    const pacienteName = row.cells[1].textContent
    const medicoId = row.dataset.medicoId
    const [fechaStr, horaAMPM] = row.cells[3].textContent.split(' - ')
    const estado = row.cells[4].querySelector('.badge').textContent.toLowerCase()
    
    // Formato de fecha para uqe pase de input type="date": DD/MM/YYYY a esto => YYYY-MM-DD
    const [day, month, year] = fechaStr.split('/')
    const fechaInput = `${year}-${month}-${day}`
    const horaInput = horaAMPM.replace(' AM', '').replace(' PM', '').slice(0, 5)
    await loadMedicosParaEdicion(medicoId)
    
    // ids del formulacio de la cita para editar
    document.getElementById('cita-id-edit').value = idCita
    document.getElementById('paciente-name').value = pacienteName
    document.getElementById('fecha-cita').value = fechaInput
    document.getElementById('hora-cita').value = horaInput
    document.getElementById('estado-select').value = estado
    
    citaModal.style.display = 'block'
}

//Maneja el envío del formulario de edición en gestion citas.
const handleSaveCita = async (e) => {
    e.preventDefault()
    const idCita = document.getElementById('cita-id-edit').value
    const idMedico = medicoSelect.value
    const fechaCita = document.getElementById('fecha-cita').value
    const horaCita = document.getElementById('hora-cita').value
    const estado = document.getElementById('estado-select').value
    if (!idCita || !idMedico || !fechaCita || !horaCita || !estado) {
        alert('Todos los campos son obligatorios.')
        return
    }
    
    const dataToSend = {
        accion: 'editar',
        id_cita: idCita,
        id_medico: idMedico,
        fecha_cita: fechaCita,
        hora_cita: horaCita,
        estado: estado,
    }
    
    try {
        const result = await fetchAPI('usuarios/admin/gestion_citas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        })

        if (result.status) {
            alert(result.message || 'Cita actualizada con éxito.')
            citaModal.style.display = 'none'
            await loadCitas()
        } else {
            alert('Error al actualizar: ' + (result.message || 'Error desconocido.'))
        }
    } catch (error) {
        console.error('Error al enviar formulario de edición:', error)
        alert('Fallo de conexión al actualizar la cita.')
    }
}

/**
 * manejo de la cancelacion de una cita.
 * @param {number} idCita - ID de la cita a cancelar.
 */
const handleCancelCita = async (idCita) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
        return
    }
    try {
        const data = await fetchAPI('usuarios/admin/gestion_citas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'cancelar', id_cita: idCita })
        })

        if (data.status) {
            alert(data.message || 'Cita cancelada con éxito.')
            await loadCitas() 
        } else {
            alert('Error al cancelar: ' + (data.message || 'Error desconocido.'))
        }
    } catch (error) {
        console.error('Error de cancelación:', error)
        alert('Fallo de conexión al intentar cancelar la cita.')
    }
}

const setupCitasTableListeners = () => {
    citasTableBody.removeEventListener('click', handleCitasActionsClick)
    citasTableBody.addEventListener('click', handleCitasActionsClick)
}

const handleCitasActionsClick = (e) => {
    const target = e.target
    const id = target.dataset.id
    
    if (!id) return
    
    if (target.classList.contains('btn-editar-cita')) {
        openCitaModal(id)
    } else if (target.classList.contains('btn-cancelar-cita')) {
        handleCancelCita(id)
    }
}

//Inicializa la funcionalidad de Gestión de Citas.
const setupGestorCitas = () => {
    loadCitas()
    
    if (citaForm) {
        citaForm.addEventListener('submit', handleSaveCita) 
    }
    
    if (citaModal) {
        const closeModal = citaModal.querySelector('.close-btn') 
        if (closeModal) {
            closeModal.addEventListener('click', () => citaModal.style.display = 'none')
        }
        window.addEventListener('click', (event) => {
            if (event.target === citaModal) {
                citaModal.style.display = 'none'
            }
        })
    }
}

//////////////////////////////////////////////////////////////////
// Funcionalidad de Gestión de Médicos (admin_gestor_medicos.html)
const medicosTableBody = document.getElementById('medicos-table-body')
const medicoModal = document.getElementById('medico-modal')
const medicoForm = document.getElementById('medico-form')
const modalTitle = document.getElementById('modal-title')
const passwordGroup = document.getElementById('password-group')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')

/**
 * renderiza la lista de medicos en la tabla.
 * @param {Array<Object>} medicos - El arreglo de objetos médico.
 */
const renderMedicos = (medicos) => {
    if (!medicosTableBody) return
    let html = ''

    if (medicos.length === 0) {
        html = '<tr><td colspan="6" style="text-align: center;">No se encontraron médicos registrados.</td></tr>'
    } else {
        medicos.forEach(medico => {
            html += `
                <tr data-id="${medico.id_medico}">
                    <td>${medico.id_medico}</td>
                    <td>${medico.nombre_completo}</td>
                    <td>${medico.especialidad}</td>
                    <td>${medico.email}</td>
                    <td>${medico.telefono || 'N/A'}</td>
                    <td class="table-actions">
                        <button class="neumorph-btn-alt btn-editar-medico" data-id="${medico.id_medico}">Editar</button>
                        <button class="btn-danger btn-eliminar-medico" data-id="${medico.id_medico}">Eliminar</button>
                    </td>
                </tr>
            `
        })
    }

    medicosTableBody.innerHTML = html
    const medicoLoadingMessage = document.getElementById('loading-message')
    if (medicoLoadingMessage) medicoLoadingMessage.style.display = 'none'
    setupMedicosTableListeners()
}

// funcion para cargar a los megicos
const loadMedicos = async () => {
    const medicoLoadingMessage = document.getElementById('loading-message')
    if (medicoLoadingMessage) medicoLoadingMessage.style.display = 'block'
    
    try {
        const data = await fetchAPI('usuarios/admin/gestion_medicos.php?accion=listar', { method: 'GET' })
        if (data.status && Array.isArray(data.data)) {
            renderMedicos(data.data)
        } else {
            console.error('Error al listar médicos:', data.message || 'Datos no válidos')
            renderMedicos([])
        }
    } catch (error) {
        console.error('Fallo de conexión al cargar médicos:', error)
        if (medicosTableBody) {
             medicosTableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Error de conexión.</td></tr>`
        }
        if (medicoLoadingMessage) medicoLoadingMessage.style.display = 'none'
    }
}

// Funcion para abrir el modal de un nuevo medico
const openCreateModal = () => {
    if (!medicoModal) return
    modalTitle.textContent = 'Agregar Nuevo Médico'
    medicoForm.dataset.mode = 'create'
    document.getElementById('medico-id-edit').value = ''
    emailInput.disabled = false
    passwordGroup.style.display = 'block'
    passwordInput.required = true
    medicoForm.reset()
    
    medicoModal.style.display = 'block'
}

/**
 * Abre el modal para editar info de un medico.
 * @param {number} idMedico - ID del médico a editar.
 */
const openEditModal = (idMedico) => {
    if (!medicoModal) return
    
    const row = document.querySelector(`tr[data-id="${idMedico}"]`)
    if (!row) {
        alert('Error: Médico no encontrado en la tabla para edición.')
        return
    }

    const [id, nombre, especialidad, email, telefono] = Array.from(row.cells).map(cell => cell.textContent)
    
    //Configurar para editar
    modalTitle.textContent = `Editar Médico #${idMedico}`
    medicoForm.dataset.mode = 'edit'
    document.getElementById('medico-id-edit').value = idMedico
    
    // deshabilitamos la contraseña y el email ya que son campos que no se pueden editar
    emailInput.disabled = true
    passwordGroup.style.display = 'none' // no mostramos el campo de la contraseña
    
    //id para el formulario
    document.getElementById('nombre').value = nombre
    document.getElementById('especialidad').value = especialidad
    emailInput.value = email
    document.getElementById('telefono').value = (telefono === 'N/A' ? '' : telefono)
    medicoModal.style.display = 'block'
}

// Se maneja el envio del formulacio ya sea para crear o modificar un medico
const handleSaveMedico = async (e) => {
    e.preventDefault()
    const mode = medicoForm.dataset.mode
    const idMedico = document.getElementById('medico-id-edit').value
    const nombre = document.getElementById('nombre').value
    const especialidad = document.getElementById('especialidad').value
    const email = document.getElementById('email').value
    const telefono = document.getElementById('telefono').value
    const password = passwordInput.value
    
    if (mode === 'create' && !password) {
        alert('La contraseña es obligatoria para crear un nuevo médico.')
        return
    }
    let endpoint = 'usuarios/admin/gestion_medicos.php'
    let dataToSend = {}
    let successMessage = ''

    if (mode === 'create') {
        dataToSend = {
            accion: 'crear',
            nombre,
            especialidad,
            email,
            telefono,
            password
        }
        successMessage = 'Médico registrado con éxito.'
    } else if (mode === 'edit') {
        dataToSend = {
            accion: 'editar',
            id_medico: idMedico,
            nombre,
            especialidad,
            telefono,
        }
        successMessage = 'Datos del médico actualizados con éxito.'
    } else {
        return
    }
    
    try {
        const result = await fetchAPI(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        })

        if (result.status) {
            alert(result.message || successMessage)
            medicoModal.style.display = 'none'
            await loadMedicos()
        } else {
            alert('Error: ' + (result.message || 'Error desconocido.'))
        }
    } catch (error) {
        console.error('Error al enviar formulario de médico:', error)
        alert('Fallo de conexión al guardar el médico.')
    }
}

/**
 * Manejo para la eliminación de un médico.
 * @param {number} idMedico - ID del médico a eliminar.
 */
const handleDeleteMedico = async (idMedico) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este médico? Esto eliminará también su cuenta de usuario y todas las citas asociadas (si no hay restricción de DB). Esta acción es irreversible.')) {
        return
    }

    try {
        const data = await fetchAPI('usuarios/admin/gestion_medicos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'eliminar', id_medico: idMedico })
        })

        if (data.status) {
            alert(data.message || 'Médico eliminado del sistema con éxito.')
            await loadMedicos() 
        } else {
            alert('Error al eliminar: ' + (data.message || 'Error desconocido.'))
        }
    } catch (error) {
        console.error('Error de eliminación:', error)
        alert('Fallo de conexión al intentar eliminar el médico.')
    }
}

const setupMedicosTableListeners = () => {
    medicosTableBody.removeEventListener('click', handleMedicosActionsClick)
    medicosTableBody.addEventListener('click', handleMedicosActionsClick)
}

const handleMedicosActionsClick = (e) => {
    const target = e.target
    const id = target.dataset.id
    
    if (!id) return
    
    if (target.classList.contains('btn-editar-medico')) {
        openEditModal(id)
    } else if (target.classList.contains('btn-eliminar-medico')) {
        handleDeleteMedico(id)
    }
}

//Inicializa la funcionalidad de Gestión de Médicos.
const setupGestorMedicos = () => {
    loadMedicos()

    const addBtn = document.getElementById('agregar-medico-btn')
    if (addBtn) {
        addBtn.addEventListener('click', openCreateModal)
    }
    
    if (medicoForm) {
        medicoForm.addEventListener('submit', handleSaveMedico) 
    }
    
    if (medicoModal) {
        const closeModal = medicoModal.querySelector('.close-btn') 
        
        if (closeModal) {
            closeModal.addEventListener('click', () => medicoModal.style.display = 'none')
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === medicoModal) {
                medicoModal.style.display = 'none'
            }
        })
    }
}