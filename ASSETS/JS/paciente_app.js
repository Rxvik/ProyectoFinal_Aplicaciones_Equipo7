document.addEventListener('DOMContentLoaded', () => {
//Verificamos que tenemos el rol de paciente
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('paciente'); 
    }
});
