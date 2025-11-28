import { CONFIG } from './config.js';
import { qs } from './utils.js';

function getPageFilename() {
    const parts = location.pathname.split('/');
    return parts.pop() || parts.pop() || 'index.html';
}
 
const pageModuleMap = {
    'index.html': 'main',
    'login.html': 'auth',
    'registro_paciente.html': 'auth',
    'admin_dashboard.html': 'admin',
    'admin_gestor_citas.html': 'admin',
    'admin_gestor_medicos.html': 'admin',
    'admin_gestor_pacientes.html': 'admin',
    'admin_reportes.html': 'admin',
    'medico_dashboard.html': 'medico',
    'medico_agenda.html': 'medico',
    'medico_horarios.html': 'medico',
    'medico_pacientes.html': 'medico',
    'paciente_dashboard.html': 'paciente',
    'paciente_agendar_cita.html': 'paciente',
    'paciente_miscitas.html': 'paciente',
    'paciente_perfil.html': 'paciente',
    'registro_paciente.html': 'auth'
};

async function loadModule(name) {
    if (!name) return;
    try {
        await import(`./${name}.js`);
        console.info('Módulo cargado:', name);
    } catch (err) {
        console.info('No se cargo el modulo:', name, err.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const page = getPageFilename();
    window.APP = { CONFIG, page };
    console.log('APP inicializada. page=', page, 'CONFIG=', CONFIG);

    const moduleName = pageModuleMap[page];
    if (moduleName) {
        loadModule(moduleName);
    }
});