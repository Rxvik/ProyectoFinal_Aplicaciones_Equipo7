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

///////////////////////////////////
// Gestor de Pacientes (de momento solo borra los pacientes)
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
    pacientesTableBody.removeEventListener('click', handleTableClick)

    pacientesTableBody.addEventListener('click', handleTableClick)
}

const handleTableClick = (e) => {
    const target = e.target
    const id = target.dataset.id
    
    if (!id) return
    
    if (target.classList.contains('btn-eliminar-paciente')) {
        handleDeletePaciente(id)
    } 
}