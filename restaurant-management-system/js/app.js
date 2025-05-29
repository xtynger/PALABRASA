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
        if (Auth.isLoggedIn()) {
            this.currentUser = Auth.getCurrentUser();
            this.showMainApp();
        }
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        
        // Toast close button
        document.getElementById('close-toast').addEventListener('click', () => {
            document.getElementById('notification-toast').classList.add('hidden');
        });

        // Enter key on login form
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('login-screen').classList.contains('hidden')) {
                this.handleLogin();
            }
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const role = document.getElementById('role').value;

        if (!username || !password) {
            Utils.showNotification('Error', 'Por favor ingrese usuario y contraseña', 'error');
            return;
        }

        if (Auth.login(username, password, role)) {
            this.currentUser = Auth.getCurrentUser();
            this.showMainApp();
            Utils.showNotification('Bienvenido', `Sesión iniciada como ${Utils.getRoleDisplayName(role)}`, 'success');
        } else {
            Utils.showNotification('Error', 'Credenciales inválidas', 'error');
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
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        this.updateUserInfo();
        this.setupNavigation();
        this.loadDefaultView();
    }

    updateUserInfo() {
        const userRole = document.getElementById('user-role');
        userRole.textContent = Utils.getRoleDisplayName(this.currentUser.role);
    }

    setupNavigation() {
        const navContainer = document.getElementById('nav-container');
        const userRole = this.currentUser.role;
        const navItems = this.navItems[userRole] || [];

        navContainer.innerHTML = '';

        navItems.forEach(item => {
            const navButton = document.createElement('button');
            navButton.className = 'nav-item px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 border-b-2 border-transparent hover:border-primary transition-colors duration-200';
            navButton.innerHTML = `
                <i class="${item.icon} mr-2"></i>
                <span class="mobile-hidden">${item.label}</span>
            `;
            navButton.addEventListener('click', () => this.switchView(item.id));
            navContainer.appendChild(navButton);
        });
    }

    switchView(viewId) {
        // Remove active state from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active', 'text-white', 'bg-secondary', 'border-secondary');
            item.classList.add('text-gray-700');
        });

        // Add active state to clicked nav item
        event.target.closest('.nav-item').classList.add('active', 'text-white', 'bg-secondary', 'border-secondary');
        event.target.closest('.nav-item').classList.remove('text-gray-700');

        this.activeView = viewId;
        this.loadView(viewId);
    }

    loadDefaultView() {
        const userRole = this.currentUser.role;
        const defaultViews = {
            admin: 'dashboard',
            waiter: 'tables',
            kitchen: 'orders',
            cashier: 'orders'
        };
        
        const defaultView = defaultViews[userRole] || 'dashboard';
        
        // Trigger the first nav item
        const firstNavItem = document.querySelector('.nav-item');
        if (firstNavItem) {
            firstNavItem.click();
        } else {
            this.loadView(defaultView);
        }
    }

    loadView(viewId) {
        const contentContainer = document.getElementById('content-container');
        const userRole = this.currentUser.role;

        // Clear current content
        contentContainer.innerHTML = '<div class="flex justify-center items-center h-64"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';

        // Load the appropriate module and view
        try {
            switch(userRole) {
                case 'admin':
                    if (window.AdminModule) {
                        window.AdminModule.showView(viewId);
                    }
                    break;
                case 'waiter':
                    if (window.WaiterModule) {
                        window.WaiterModule.showView(viewId);
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