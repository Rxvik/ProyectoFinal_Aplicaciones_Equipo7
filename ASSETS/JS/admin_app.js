document.addEventListener('DOMContentLoaded', () => {
    //Verificamos que tenemos el rol de admin
    if (typeof checkRoleAccess === 'function') {
        checkRoleAccess('admin'); 
    }
});