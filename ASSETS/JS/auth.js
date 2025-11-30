const API_BASE_URL = '../api/';
const ROL_STORAGE_KEY = 'sistema_citas_session';
const EMAIL_STORAGE_KEY = 'userEmail';

const fetchAPI = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error en la solicitud: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error de conexión o API:", error.message)
        throw error;
    }
}

const handleLogout = () => {
    localStorage.removeItem(ROL_STORAGE_KEY);
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    window.location.href = 'login.html'
}

const checkRoleAccess = async (requiredRole) => {
    const currentRole = localStorage.getItem(ROL_STORAGE_KEY);

    if (!currentRole) {
        await Swal.fire({
            icon: 'warning',
            title: 'Sesión no encontrada',
            text: 'Por favor, inicia sesión.',
            confirmButtonText: 'Ir al Login'
        });
        window.location.href = 'login.html';
        return;
    }

    if (currentRole !== requiredRole) {
        await Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: `Redirigiendo a tu dashboard (${currentRole}).`
        });
        window.location.href = `${currentRole}_dashboard.html`;
        return;
    }

    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault()
            handleLogout()
        });
    }

    const userEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
    const navbarUsernameSpan = document.getElementById('navbar-username');
    if (navbarUsernameSpan && userEmail) {
        navbarUsernameSpan.textContent = userEmail.split('@')[0];
    }
}

const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
        const data = await fetchAPI('/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (data.status) {
            localStorage.setItem(ROL_STORAGE_KEY, data.rol);
            localStorage.setItem(EMAIL_STORAGE_KEY, data.email)

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            
            await Toast.fire({
                icon: 'success',
                title: 'Sesión iniciada correctamente'
            });

            switch (data.rol) {
                case 'admin':
                    window.location.href = 'admin_dashboard.html';
                    break;
                case 'medico':
                    window.location.href = 'medico_dashboard.html';
                    break;
                case 'paciente':
                    window.location.href = 'paciente_dashboard.html';
                    break;
                default:
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error de Rol',
                        text: 'Rol de usuario desconocido.'
                    });
                    handleLogout();
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de acceso',
                text: data.message || 'Credenciales incorrectas.'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error del sistema',
            text: error.message
        });
    }
}

const handleRegistro = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fullname = form.fullname.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;

    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'warning',
            title: 'Contraseñas no coinciden',
            text: 'Por favor verifica que ambas contraseñas sean iguales.'
        });
        return;
    }

    try {
        const data = await fetchAPI('/auth/registro_paciente.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullname, email, password })
        });

        if (data.status) {
            await Swal.fire({
                icon: 'success',
                title: 'Registro exitoso',
                text: 'Ahora puedes iniciar sesión.'
            });
            window.location.href = 'login.html';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error en registro',
                text: data.message || 'No se pudo registrar el paciente.'
            });
        }

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error del sistema',
            text: error.message
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistro);
    }
});