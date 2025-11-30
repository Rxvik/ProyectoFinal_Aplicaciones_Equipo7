document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('admin') 
    }

    const path = window.location.pathname

    if (path.includes('admin_dashboard.html')) {
        setupAdminDashboard()
    }

    if (path.includes('admin_gestor_citas.html')) {
        setupGestorCitas()
    }

    if (path.includes('admin_gestor_medicos.html')) {
        setupGestorMedicos()
    }

    if (path.includes('admin_gestor_pacientes.html')) {
        setupGestorPacientes()
    }

    if (path.includes('admin_reportes.html')) {
        setupAdminReportes()
    }
})

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

const loadMedicosParaReporte = async (selectElement) => {
    selectElement.innerHTML = '<option value="todos">Cargando médicos...</option>'
    
    try {
        const data = await fetchAPI('citas/listar_medicos.php', { method: 'GET' }) 
        if (data.status && data.medicos && Array.isArray(data.medicos)) {
            let optionsHtml = '<option value="todos">Todos los médicos</option>'
            
            data.medicos.forEach(medico => {
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
             selectElement.innerHTML = '<option value="todos">Todos los médicos (Error de datos)</option>'
        }
    } catch (error) {
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
                    Swal.fire({
                        icon: 'warning',
                        title: 'Fechas incorrectas',
                        text: 'La Fecha de Fin no puede ser anterior a la Fecha de Inicio.'
                    });
                }
            }
        })
    }
}

const pacientesTableBody = document.getElementById('pacientes-table-body')
const loadingMessage = document.getElementById('loading-message')
const pacienteModal = document.getElementById('paciente-modal')
const pacienteForm = document.getElementById('paciente-form')

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
            renderPacientes([])
        }
    } catch (error) {
        if (pacientesTableBody) {
             pacientesTableBody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Error de conexión.</td></tr>`
        }
        if (loadingMessage) loadingMessage.style.display = 'none'
    }
}

const handleDeletePaciente = async (idPaciente) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará al paciente y su usuario permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        const data = await fetchAPI('usuarios/admin/gestion_pacientes.php?accion=eliminar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_paciente: idPaciente })
        })

        if (data.status) {
            Swal.fire('¡Eliminado!', data.message || 'Paciente eliminado con éxito.', 'success');
            await loadPacientes() 
        } else {
            Swal.fire('Error', data.message || 'Error desconocido.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Fallo de conexión al intentar eliminar.', 'error');
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

const handleSavePaciente = async (e) => {
    e.preventDefault()
    
    const formData = new FormData(pacienteForm)
    const dataToSend = Object.fromEntries(formData)
    dataToSend.accion = 'crear'

    try {
        const result = await fetchAPI('usuarios/admin/gestion_pacientes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        })

        if (result.status) {
            await Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: result.message || 'Paciente registrado con éxito.'
            });
            pacienteModal.style.display = 'none'
            pacienteForm.reset()
            await loadPacientes()
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Error desconocido.'
            });
        }
    } catch (error) {
        Swal.fire('Error', 'Fallo de conexión al guardar el paciente.', 'error');
    }
}

const setupGestorPacientes = () => {
    loadPacientes()
    
    const addBtn = document.getElementById('btn-add-paciente')
    if (addBtn && pacienteModal) {
        addBtn.addEventListener('click', () => {
            pacienteForm.reset()
            pacienteModal.style.display = 'block'
        })
    }
    
    if (pacienteForm) {
        pacienteForm.addEventListener('submit', handleSavePaciente)
    }
    
    if (pacienteModal) {
        const closeBtn = pacienteModal.querySelector('.close-btn')
        if (closeBtn) closeBtn.addEventListener('click', () => pacienteModal.style.display = 'none')
        window.addEventListener('click', (e) => { if (e.target === pacienteModal) pacienteModal.style.display = 'none' })
    }
}

const citasTableBody = document.getElementById('citas-table-body')
const citaModal = document.getElementById('cita-modal')
const citaForm = document.getElementById('cita-form')
const medicoSelect = document.getElementById('medico-select')
const pacienteSelect = document.getElementById('select-paciente')

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
             medicoSelect.innerHTML = '<option value="">Error al cargar médicos</option>'
        }
    } catch (error) {
        medicoSelect.innerHTML = '<option value="">Fallo de conexión</option>'
    }
}

const loadPacientesParaCita = async () => {
    if (!pacienteSelect) return
    pacienteSelect.innerHTML = '<option value="">Cargando pacientes...</option>'
    try {
        const data = await fetchAPI('usuarios/admin/gestion_pacientes.php?accion=listar', { method: 'GET' })
        if (data.status && Array.isArray(data.data)) {
            let optionsHtml = '<option value="">-- Selecciona un Paciente --</option>'
            data.data.forEach(p => {
                optionsHtml += `<option value="${p.id_paciente}">${p.nombre_completo}</option>`
            })
            pacienteSelect.innerHTML = optionsHtml
        }
    } catch (error) {
        console.error('Error cargando pacientes:', error)
    }
}

const loadCitas = async () => {
    const citaLoadingMessage = document.getElementById('loading-message')
    if (citaLoadingMessage) citaLoadingMessage.style.display = 'block'
    
    try {
        const data = await fetchAPI('usuarios/admin/gestion_citas.php?accion=listar', { method: 'GET' }) 
        
        if (data.status && Array.isArray(data.data)) {
            renderCitas(data.data)
        } else {
            renderCitas([])
        }
    } catch (error) {
        if (citasTableBody) {
             citasTableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Error de conexión.</td></tr>`
        }
        if (citaLoadingMessage) citaLoadingMessage.style.display = 'none'
    }
}

const openCitaModal = async (idCita) => {
    if (!citaModal) return
    
    const row = document.querySelector(`tr[data-id="${idCita}"]`)
    if (!row) {
        Swal.fire('Error', 'Cita no encontrada en la tabla.', 'error')
        return
    }

    const medicoId = row.dataset.medicoId
    const [fechaStr, horaAMPM] = row.cells[3].textContent.split(' - ')
    const estado = row.cells[4].querySelector('.badge').textContent.toLowerCase()
    
    const [day, month, year] = fechaStr.split('/')
    const fechaInput = `${year}-${month}-${day}`
    const horaInput = horaAMPM.replace(' AM', '').replace(' PM', '').slice(0, 5)
    
    await loadMedicosParaEdicion(medicoId)
    
    document.getElementById('cita-id-edit').value = idCita
    document.getElementById('fecha-cita').value = fechaInput
    document.getElementById('hora-cita').value = horaInput
    document.getElementById('estado-select').value = estado

    document.getElementById('modal-title').textContent = 'Editar Cita'
    if(pacienteSelect) pacienteSelect.parentElement.style.display = 'none'
    document.getElementById('paciente-name').parentElement.style.display = 'block'
    document.getElementById('paciente-name').value = row.cells[1].textContent
    
    citaModal.style.display = 'block'
}

const handleSaveCita = async (e) => {
    e.preventDefault()
    const idCita = document.getElementById('cita-id-edit').value
    const idMedico = medicoSelect.value
    const fechaCita = document.getElementById('fecha-cita').value
    const horaCita = document.getElementById('hora-cita').value
    const estado = document.getElementById('estado-select').value
    
    const idPaciente = pacienteSelect ? pacienteSelect.value : null

    if (!idMedico || !fechaCita || !horaCita) {
        Swal.fire('Atención', 'Todos los campos son obligatorios.', 'warning')
        return
    }
    
    const accion = idCita ? 'editar' : 'crear'
    
    if (accion === 'crear' && !idPaciente) {
        Swal.fire('Atención', 'Debes seleccionar un paciente.', 'warning')
        return
    }

    const dataToSend = {
        accion: accion,
        id_cita: idCita,
        id_paciente: idPaciente,
        id_medico: idMedico,
        fecha_cita: fechaCita,
        hora_cita: horaCita,
        estado: estado || 'pendiente',
    }
    
    try {
        const result = await fetchAPI('usuarios/admin/gestion_citas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        })

        if (result.status) {
            await Swal.fire('Éxito', result.message || 'Operación exitosa.', 'success')
            citaModal.style.display = 'none'
            await loadCitas()
        } else {
            Swal.fire('Error', result.message || 'Error desconocido.', 'error')
        }
    } catch (error) {
        Swal.fire('Error', 'Fallo de conexión.', 'error')
    }
}

const handleCancelCita = async (idCita) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "La cita será marcada como cancelada.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No',
        reverseButtons: true
    });

    if (!result.isConfirmed) return

    try {
        const data = await fetchAPI('usuarios/admin/gestion_citas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'cancelar', id_cita: idCita })
        })

        if (data.status) {
            Swal.fire('Cancelada', data.message || 'Cita cancelada con éxito.', 'success')
            await loadCitas() 
        } else {
            Swal.fire('Error', data.message || 'Error desconocido.', 'error')
        }
    } catch (error) {
        Swal.fire('Error', 'Fallo de conexión.', 'error')
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

const setupGestorCitas = () => {
    loadCitas()
    
    const addBtn = document.getElementById('btn-add-cita')
    if (addBtn && citaModal) {
        addBtn.addEventListener('click', async () => {
            document.getElementById('cita-form').reset()
            document.getElementById('cita-id-edit').value = ''
            document.getElementById('modal-title').textContent = 'Agendar Nueva Cita'
            if(pacienteSelect) {
                pacienteSelect.parentElement.style.display = 'block'
                await loadPacientesParaCita()
            }
            document.getElementById('paciente-name').parentElement.style.display = 'none'
            await loadMedicosParaEdicion()
            citaModal.style.display = 'block'
        })
    }
    
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

const medicosTableBody = document.getElementById('medicos-table-body')
const medicoModal = document.getElementById('medico-modal')
const medicoForm = document.getElementById('medico-form')
const modalTitle = document.getElementById('modal-title')
const passwordGroup = document.getElementById('password-group')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')

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

const loadMedicos = async () => {
    const medicoLoadingMessage = document.getElementById('loading-message')
    if (medicoLoadingMessage) medicoLoadingMessage.style.display = 'block'
    
    try {
        const data = await fetchAPI('usuarios/admin/gestion_medicos.php?accion=listar', { method: 'GET' })
        if (data.status && Array.isArray(data.data)) {
            renderMedicos(data.data)
        } else {
            renderMedicos([])
        }
    } catch (error) {
        if (medicosTableBody) {
             medicosTableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Error de conexión.</td></tr>`
        }
        if (medicoLoadingMessage) medicoLoadingMessage.style.display = 'none'
    }
}

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

const openEditModal = (idMedico) => {
    if (!medicoModal) return
    
    const row = document.querySelector(`tr[data-id="${idMedico}"]`)
    if (!row) {
        Swal.fire('Error', 'Médico no encontrado.', 'error')
        return
    }

    const [id, nombre, especialidad, email, telefono] = Array.from(row.cells).map(cell => cell.textContent)
    
    modalTitle.textContent = `Editar Médico #${idMedico}`
    medicoForm.dataset.mode = 'edit'
    document.getElementById('medico-id-edit').value = idMedico
    
    emailInput.disabled = true
    passwordGroup.style.display = 'none' 
    
    document.getElementById('nombre').value = nombre
    document.getElementById('especialidad').value = especialidad
    emailInput.value = email
    document.getElementById('telefono').value = (telefono === 'N/A' ? '' : telefono)
    medicoModal.style.display = 'block'
}

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
        Swal.fire('Atención', 'La contraseña es obligatoria.', 'warning')
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
        successMessage = 'Datos actualizados con éxito.'
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
            await Swal.fire('Guardado', result.message || successMessage, 'success')
            medicoModal.style.display = 'none'
            await loadMedicos()
        } else {
            Swal.fire('Error', result.message || 'Error desconocido.', 'error')
        }
    } catch (error) {
        Swal.fire('Error', 'Fallo de conexión.', 'error')
    }
}

const handleDeleteMedico = async (idMedico) => {
    const result = await Swal.fire({
        title: '¿Eliminar Médico?',
        text: "Esto eliminará su cuenta y accesos de forma permanente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    });

    if (!result.isConfirmed) return

    try {
        const data = await fetchAPI('usuarios/admin/gestion_medicos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'eliminar', id_medico: idMedico })
        })

        if (data.status) {
            Swal.fire('Eliminado', data.message || 'Médico eliminado.', 'success')
            await loadMedicos() 
        } else {
            Swal.fire('Error', data.message || 'Error desconocido.', 'error')
        }
    } catch (error) {
        Swal.fire('Error', 'Fallo de conexión.', 'error')
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