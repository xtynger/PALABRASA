// Main Application Controller
// Manages the overall application state, role-based navigation, and module loading

class RestaurantApp {
    constructor() {
        this.currentUser = null;
        this.currentModule = null;
        this.activeView = null;
        this.navItems = {
            admin: [
                { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
                { id: 'orders', label: 'Órdenes', icon: 'fas fa-receipt' },
                { id: 'users', label: 'Usuarios', icon: 'fas fa-users' },
                { id: 'menu', label: 'Menú', icon: 'fas fa-utensils' },
                { id: 'reports', label: 'Reportes', icon: 'fas fa-chart-bar' },
                { id: 'settings', label: 'Configuración', icon: 'fas fa-cog' }
            ],
            waiter: [
                { id: 'tables', label: 'Mesas', icon: 'fas fa-table' },
                { id: 'orders', label: 'Órdenes', icon: 'fas fa-receipt' },
                { id: 'menu', label: 'Menú', icon: 'fas fa-utensils' }
            ],
            kitchen: [
                { id: 'orders', label: 'Órdenes', icon: 'fas fa-receipt' },
                { id: 'queue', label: 'Cola de Cocina', icon: 'fas fa-clock' }
            ],
            cashier: [
                { id: 'orders', label: 'Órdenes', icon: 'fas fa-receipt' },
                { id: 'payments', label: 'Pagos', icon: 'fas fa-cash-register' },
                { id: 'reports', label: 'Reportes', icon: 'fas fa-chart-line' }
            ]
        };
        
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        // Check if user is already logged in
        if (window.Auth && Auth.isLoggedIn()) {
            this.currentUser = Auth.getCurrentUser();
            this.showMainApp();
        }
    }

    initializeEventListeners() {
        // Login form
        const loginBtn = document.getElementById('login-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Toast close button
        const closeToastBtn = document.getElementById('close-toast');
        if (closeToastBtn) {
            closeToastBtn.addEventListener('click', () => {
                document.getElementById('notification-toast').classList.add('hidden');
            });
        }

        // Enter key on login form
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('login-screen').classList.contains('hidden')) {
                e.preventDefault();
                this.handleLogin();
            }
        });
    }

    handleLogin() {
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const roleEl = document.getElementById('role');
        
        if (!usernameEl || !passwordEl || !roleEl) {
            Utils.showNotification('Error', 'Error en el formulario de login', 'error');
            return;
        }
        
        const username = usernameEl.value.trim();
        const password = passwordEl.value.trim();
        const role = roleEl.value;

        if (!username || !password) {
            Utils.showNotification('Error', 'Por favor ingrese usuario y contraseña', 'error');
            return;
        }

        if (!window.Auth) {
            Utils.showNotification('Error', 'Error del sistema de autenticación', 'error');
            return;
        }

        try {
            const loginResult = Auth.login(username, password, role);
            
            if (loginResult) {
                this.currentUser = Auth.getCurrentUser();
                this.showMainApp();
                Utils.showNotification('Bienvenido', `Sesión iniciada como ${Utils.getRoleDisplayName(role)}`, 'success');
            } else {
                Utils.showNotification('Error', 'Credenciales inválidas', 'error');
            }
        } catch (error) {
            Utils.showNotification('Error', 'Error durante el login: ' + error.message, 'error');
        }
    }

    handleLogout() {
        Auth.logout();
        this.currentUser = null;
        this.currentModule = null;
        this.activeView = null;
        this.showLoginScreen();
        Utils.showNotification('Sesión Cerrada', 'Ha cerrado sesión exitosamente', 'info');
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
        
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('role').value = 'waiter';
    }

    showMainApp() {
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.getElementById('app-container');
        
        if (loginScreen && appContainer) {
            loginScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            this.updateUserInfo();
            this.generateNavigation();
            this.loadDefaultView();
        }
    }

    updateUserInfo() {
        const userRoleElement = document.getElementById('user-role');
        const userNameElement = document.getElementById('user-name');
        
        if (userRoleElement && this.currentUser) {
            userRoleElement.textContent = Utils.getRoleDisplayName(this.currentUser.role);
        }
        
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.name;
        }
    }

    generateNavigation() {
        const navContainer = document.getElementById('nav-container');
        if (!navContainer || !this.currentUser) return;

        const role = this.currentUser.role;
        const navItems = this.navItems[role] || [];

        navContainer.innerHTML = navItems.map(item => `
            <div class="nav-item cursor-pointer px-4 py-3 hover:bg-white hover:bg-opacity-10 transition-colors border-l-4 border-transparent hover:border-white flex items-center space-x-3" data-view="${item.id}">
                <i class="${item.icon} text-lg"></i>
                <span class="mobile-hidden">${item.label}</span>
            </div>
        `).join('');

        // Add click event listeners
        navContainer.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (event) => {
                this.handleNavigation(event);
            });
        });
    }

    handleNavigation(event) {
        const viewId = event.target.closest('.nav-item').dataset.view;
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active', 'text-white', 'bg-secondary', 'border-secondary');
            item.classList.add('text-gray-700');
        });
        
        event.target.closest('.nav-item').classList.add('active', 'text-white', 'bg-secondary', 'border-secondary');
        
        this.loadView(viewId);
    }

    loadDefaultView() {
        const role = this.currentUser?.role;
        const defaultViews = {
            admin: 'dashboard',
            waiter: 'tables',
            kitchen: 'orders',
            cashier: 'orders'
        };

        const defaultView = defaultViews[role] || 'dashboard';
        
        // Auto-click the first nav item to load default view
        const firstNavItem = document.querySelector(`.nav-item[data-view="${defaultView}"]`);
        if (firstNavItem) {
            firstNavItem.click();
        }
    }

    loadView(viewId) {
        this.activeView = viewId;
        const contentContainer = document.getElementById('main-content');
        if (!contentContainer) return;

        // Clear current content
        contentContainer.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>';

        try {
            const role = this.currentUser?.role;
            
            switch(role) {
                case 'admin':
                    if (window.AdminModule) {
                        window.AdminModule.loadView(viewId, contentContainer);
                    }
                    break;
                case 'waiter':
                    if (window.WaiterModule) {
                        window.WaiterModule.loadView(viewId, contentContainer);
                    }
                    break;
                case 'kitchen':
                    if (window.KitchenModule) {
                        window.KitchenModule.loadView(viewId, contentContainer);
                    }
                    break;
                case 'cashier':
                    if (window.CashierModule) {
                        window.CashierModule.loadView(viewId, contentContainer);
                    }
                    break;
                default:
                    contentContainer.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Vista no disponible</p></div>';
            }
        } catch (error) {
            console.error('Error loading view:', error);
            contentContainer.innerHTML = '<div class="text-center py-8"><p class="text-red-500">Error cargando la vista</p></div>';
        }
    }

    updateClock() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = Utils.formatTime(new Date());
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RestaurantApp();
});