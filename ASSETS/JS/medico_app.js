document.addEventListener('DOMContentLoaded', () => {
    //Verificamos que tenemos el rol de medico
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('medico'); 
    }
});