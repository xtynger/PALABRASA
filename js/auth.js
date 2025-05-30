// This file handles authentication logic, including user login and role management.

const authModule = (() => {    // State management
    let currentUser = null;
    let currentRole = null;

    // Get users from global users data
    function getUsers() {
        return window.users || [];
    }

    // Initialize auth module
    function init() {
        setupEventListeners();
        checkRememberedUser();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Note: Login button event handling is now managed by app.js
        // This avoids conflicts between multiple event listeners
        const logoutButton = document.getElementById('logout-btn');

        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }

    // Handle login process
    function handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const remember = document.getElementById('remember').checked;

        // Validation
        if (!username || !password) {
            if (window.Utils) {
                Utils.showNotification('Error', 'Por favor complete todos los campos', 'error');
            }
            return false;
        }

        return authenticateUser(username, password, role, remember);
    }

    // Direct login function for programmatic use
    function login(username, password, role) {
        const result = authenticateUser(username, password, role, false);
        return result;
    }    // Authenticate user
    function authenticateUser(username, password, role, remember = false) {
        const users = getUsers();
        const user = users.find(user => 
            user.username === username && 
            user.password === password && 
            user.role === role
        );

        if (user) {
            // Successful authentication
            currentUser = user;
            currentRole = user.role;

            // Save user data if remember is checked
            if (remember) {
                localStorage.setItem('rememberedUser', JSON.stringify({
                    username: user.username,
                    role: user.role
                }));
            } else {
                localStorage.removeItem('rememberedUser');
            }

            // Save current session
            sessionStorage.setItem('currentUser', JSON.stringify(user));

            return true;
        } else {
            return false;
        }
    }

    // Handle logout
    function handleLogout() {
        currentUser = null;
        currentRole = null;
        
        // Clear session data
        sessionStorage.removeItem('currentUser');
        
        // Show login screen
        showLoginScreen();
        
        // Clear login form
        clearLoginForm();
        
        if (window.Utils) {
            Utils.showNotification('Información', 'Sesión cerrada correctamente', 'info');
        }
    }

    // Check for remembered user
    function checkRememberedUser() {
        const rememberedUser = localStorage.getItem('rememberedUser');
        if (rememberedUser) {
            const userData = JSON.parse(rememberedUser);
            document.getElementById('username').value = userData.username;
            document.getElementById('role').value = userData.role;
            document.getElementById('remember').checked = true;
        }

        // Check for active session
        const currentSession = sessionStorage.getItem('currentUser');
        if (currentSession) {
            const user = JSON.parse(currentSession);
            currentUser = user;
            currentRole = user.role;
            showAppInterface();
            
            if (window.appModule && window.appModule.setupRoleBasedInterface) {
                window.appModule.setupRoleBasedInterface(user.role);
            }
        }
    }

    // Show app interface
    function showAppInterface() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    }

    // Show login screen
    function showLoginScreen() {
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    }

    // Clear login form
    function clearLoginForm() {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('role').value = 'waiter';
        document.getElementById('remember').checked = false;
    }

    // Get current user
    function getCurrentUser() {
        return currentUser;
    }

    // Get current role
    function getCurrentRole() {
        return currentRole;
    }

    // Check if user is authenticated
    function isAuthenticated() {
        return currentUser !== null;
    }

    // Check if user has specific role
    function hasRole(role) {
        return currentRole === role;
    }

    // Get all users (admin only)
    function getAllUsers() {
        if (currentRole === 'admin') {
            return users;
        }
        return [];
    }

    return {
        init,
        login,
        logout: handleLogout,
        getCurrentUser,
        getCurrentRole,
        isLoggedIn: isAuthenticated,
        isAuthenticated,
        hasRole,
        getAllUsers
    };
})();

// Make Auth available globally
window.Auth = authModule;

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    authModule.init();
});