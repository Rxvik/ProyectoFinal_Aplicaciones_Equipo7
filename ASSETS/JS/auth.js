
const API_BASE_URL = '../api/'; // Api de php
const ROL_STORAGE_KEY = 'sistema_citas_session'; // variable donde se guardara el rol en localStorage
const EMAIL_STORAGE_KEY = 'userEmail'; // variable donde se guardara el email en localStorage

/**
 *Funcion para interactuar con la Api.
 * @param {string} endpoint - La ruta de la API (ej. '/auth/login.php').
 * @param {object} options - Opciones de la solicitud (method, body, headers).
 * @returns {Promise<object>}
 */
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
    // eliminacion del localStorage
    localStorage.removeItem(ROL_STORAGE_KEY);
    localStorage.removeItem(EMAIL_STORAGE_KEY);

    // volvemos al login sin ningun rol ni email
    window.location.href = 'login.html'
}

/**
 * Se ejecutara al cargar cualquier página del dashboard.
 * @param {string} requiredRole - El rol que debe tener el usuario para ver la página (admin, medico, paciente).
 */
const checkRoleAccess = (requiredRole) => {
    const currentRole = localStorage.getItem(ROL_STORAGE_KEY);

    if (!currentRole) {
        // Si no hay rol, no hay sesion entonces nos vamos al login.
        alert('Sesión no encontrada. Por favor, inicia sesión.');
        window.location.href = 'login.html';
        return;
    }

    if (currentRole !== requiredRole) {
        // Si el rol es incorrecto, redirige al dashboard de su respectivo rol.
        alert(`Acceso denegado. Redirigiendo a tu dashboard (${currentRole}).`);
        window.location.href = `${currentRole}_dashboard.html`;
        return;
    }

    const logoutBtn = document.getElementById('logout-btn') // evento para activar el cierre de sesion
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
                    alert('Rol de usuario desconocido.');
                    handleLogout(); // en caso de un error en el rol
            }
        } else {
            alert(data.message || 'Error al iniciar sesión. Credenciales incorrectas.');
        }
    } catch (error) {
        alert(error.message);
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
        alert('Las contraseñas no coinciden.');
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
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Error al registrar el paciente.');
        }

    } catch (error) {
        alert(error.message);
    }
};

// Añadir Listeners al cargar la página
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