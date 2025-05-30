// Admin Module - Complete administrative functionality
// Handles user management, menu management, permissions, and reports

window.AdminModule = (() => {
    let currentView = null;
    let editingUser = null;
    let editingMenuItem = null;
    let userPermissions = {};    // Initialize permissions for existing users
    function initializePermissions() {
        if (!window.userPermissions) {
            window.userPermissions = {};
            if (window.users) {
                window.users.forEach(user => {
                    window.userPermissions[user.id] = getDefaultPermissions(user.role);
                });
            }
        }
    }

    // Get default permissions for a role
    function getDefaultPermissions(role) {
        const defaultPerms = {
            'admin': ['dashboard', 'users', 'menu', 'reports', 'settings'],
            'waiter': ['tables', 'orders', 'menu_view'],
            'kitchen': ['kitchen_orders', 'preparation'],
            'cashier': ['payments', 'receipts', 'daily_reports']
        };
        return defaultPerms[role] || [];
    }

    // View templates
    const templates = {
        dashboard: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Panel de Administración</h2>
                    <div class="text-sm text-gray-500">${Utils.formatTime(new Date())}</div>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                <i class="fas fa-users text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-lg font-semibold text-gray-800">Total Usuarios</h3>
                                <p class="text-2xl font-bold text-blue-600">${window.users ? window.users.length : 0}</p>
                                <p class="text-sm text-gray-500">Activos en el sistema</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 text-green-600">
                                <i class="fas fa-utensils text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-lg font-semibold text-gray-800">Items Menú</h3>
                                <p class="text-2xl font-bold text-green-600">${window.menu ? window.menu.length : 0}</p>
                                <p class="text-sm text-gray-500">Platos disponibles</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                                <i class="fas fa-receipt text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-lg font-semibold text-gray-800">Órdenes Hoy</h3>
                                <p class="text-2xl font-bold text-yellow-600">${getOrdersToday()}</p>
                                <p class="text-sm text-gray-500">En total</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                                <i class="fas fa-dollar-sign text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-lg font-semibold text-gray-800">Ventas Hoy</h3>
                                <p class="text-2xl font-bold text-purple-600">S/ ${getTodaySales()}</p>
                                <p class="text-sm text-gray-500">Ingresos del día</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="AdminModule.showView('users')" 
                                class="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            <i class="fas fa-user-plus text-blue-600 text-2xl mr-3"></i>
                            <div class="text-left">
                                <div class="font-medium text-gray-800">Gestionar Usuarios</div>
                                <div class="text-sm text-gray-500">Crear, editar y administrar usuarios</div>
                            </div>
                        </button>
                        
                        <button onclick="AdminModule.showView('menu')" 
                                class="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                            <i class="fas fa-plus-circle text-green-600 text-2xl mr-3"></i>
                            <div class="text-left">
                                <div class="font-medium text-gray-800">Gestionar Menú</div>
                                <div class="text-sm text-gray-500">Agregar y editar platos</div>
                            </div>
                        </button>
                        
                        <button onclick="AdminModule.showView('reports')" 
                                class="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                            <i class="fas fa-chart-bar text-purple-600 text-2xl mr-3"></i>
                            <div class="text-left">
                                <div class="font-medium text-gray-800">Ver Reportes</div>
                                <div class="text-sm text-gray-500">Análisis y estadísticas</div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
                    <div class="space-y-3">
                        ${generateRecentActivity()}
                    </div>
                </div>
            </div>
        `,

        users: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
                    <button onclick="AdminModule.showCreateUserModal()" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                        <i class="fas fa-user-plus mr-2"></i>Nuevo Usuario
                    </button>
                </div>

                <!-- Users Table -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${generateUsersTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `,

        menu: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Menú</h2>
                    <button onclick="AdminModule.showCreateMenuItemModal()" 
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                        <i class="fas fa-plus mr-2"></i>Nuevo Plato
                    </button>
                </div>

                <!-- Menu Items Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${generateMenuItems()}
                </div>
            </div>
        `,

        reports: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Reportes y Análisis</h2>
                    <div class="flex space-x-2">
                        <select class="border border-gray-300 rounded-md px-3 py-2">
                            <option>Hoy</option>
                            <option>Esta Semana</option>
                            <option>Este Mes</option>
                        </select>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            <i class="fas fa-download mr-2"></i>Exportar
                        </button>
                    </div>
                </div>

                <!-- Reports Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Sales Chart -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Ventas por Día</h3>
                        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
                            <div class="text-center">
                                <i class="fas fa-chart-line text-4xl text-gray-400 mb-2"></i>
                                <p class="text-gray-500">Gráfico de ventas</p>
                            </div>
                        </div>
                    </div>

                    <!-- Top Products -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Productos Más Vendidos</h3>
                        <div class="space-y-3">
                            ${generateTopProducts()}
                        </div>
                    </div>

                    <!-- Payment Methods -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Métodos de Pago</h3>
                        <div class="space-y-3">
                            ${generatePaymentMethodStats()}
                        </div>
                    </div>

                    <!-- Performance Metrics -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Métricas de Rendimiento</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Tiempo promedio de preparación</span>
                                <span class="font-semibold">${getAverageTime()} min</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Satisfacción del cliente</span>
                                <span class="font-semibold text-green-600">95%</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Órdenes completadas</span>
                                <span class="font-semibold">${getCompletedOrdersToday()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,

        settings: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Restaurant Settings -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Información del Restaurante</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Restaurante</label>
                                <input type="text" value="Palabrasa Restaurant" class="w-full border border-gray-300 rounded-md px-3 py-2">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input type="text" value="Av. Principal 123, Lima" class="w-full border border-gray-300 rounded-md px-3 py-2">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input type="text" value="(01) 234-5678" class="w-full border border-gray-300 rounded-md px-3 py-2">
                            </div>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>

                    <!-- System Settings -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Configuración del Sistema</h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-700">Notificaciones por email</span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-700">Backup automático</span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Moneda del sistema</label>
                                <select class="w-full border border-gray-300 rounded-md px-3 py-2">
                                    <option>Soles Peruanos (S/)</option>
                                    <option>Dólares Americanos ($)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    // Helper functions for data generation
    function getOrdersToday() {
        if (!window.orders) return 0;
        const today = new Date().toDateString();
        return window.orders.filter(order => 
            new Date(order.timestamp).toDateString() === today
        ).length;
    }

    function getTodaySales() {
        if (!window.orders) return '0.00';
        const today = new Date().toDateString();
        const todayOrders = window.orders.filter(order => 
            new Date(order.timestamp).toDateString() === today && order.status === 'paid'
        );
        const total = todayOrders.reduce((sum, order) => sum + order.total, 0);
        return total.toFixed(2);
    }

    function getAverageTime() {
        // Mock data for average preparation time
        return '15';
    }

    function getCompletedOrdersToday() {
        if (!window.orders) return 0;
        const today = new Date().toDateString();
        return window.orders.filter(order => 
            new Date(order.timestamp).toDateString() === today && order.status === 'served'
        ).length;
    }

    function generateRecentActivity() {
        const activities = [
            { icon: 'fas fa-user-plus', text: 'Nuevo usuario creado: Juan Pérez', time: '2 min', color: 'blue' },
            { icon: 'fas fa-utensils', text: 'Menú actualizado: Pollo a la Brasa', time: '5 min', color: 'green' },
            { icon: 'fas fa-receipt', text: 'Nueva orden procesada: Mesa 5', time: '8 min', color: 'yellow' },
            { icon: 'fas fa-chart-bar', text: 'Reporte diario generado', time: '1 hr', color: 'purple' }
        ];

        return activities.map(activity => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="p-2 rounded-full bg-${activity.color}-100 text-${activity.color}-600">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-800">${activity.text}</p>
                    <p class="text-xs text-gray-500">Hace ${activity.time}</p>
                </div>
            </div>
        `).join('');
    }

    function generateUsersTable() {
        if (!window.users) return '<tr><td colspan="5" class="text-center py-4 text-gray-500">No hay usuarios disponibles</td></tr>';
        
        return window.users.map(user => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <i class="fas fa-user text-gray-600"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.name}</div>
                            <div class="text-sm text-gray-500">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${getRoleDisplayName(user.role)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.lastLogin || 'Nunca'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="AdminModule.editUser(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="AdminModule.managePermissions(${user.id})" class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-key"></i> Permisos
                    </button>
                    <button onclick="AdminModule.deleteUser(${user.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function generateMenuItems() {
        if (!window.menu) return '<p class="text-center text-gray-500">No hay items en el menú</p>';
        
        return window.menu.map(item => `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <i class="fas fa-utensils text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${item.name}</h3>
                <p class="text-gray-600 text-sm mb-3">${item.description}</p>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-xl font-bold text-green-600">S/ ${item.price.toFixed(2)}</span>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${item.category}</span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="AdminModule.editMenuItem(${item.id})" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm">
                        <i class="fas fa-edit mr-1"></i> Editar
                    </button>
                    <button onclick="AdminModule.deleteMenuItem(${item.id})" 
                            class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm">
                        <i class="fas fa-trash mr-1"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    function generateTopProducts() {
        const topProducts = [
            { name: 'Pollo a la Brasa Entero', sales: 45 },
            { name: 'Papas Fritas', sales: 38 },
            { name: 'Coca Cola 500ml', sales: 32 },
            { name: 'Ensalada Rusa', sales: 28 },
            { name: 'Chicha Morada', sales: 25 }
        ];

        return topProducts.map((product, index) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div class="flex items-center">
                    <span class="text-sm font-medium text-gray-500 mr-3">#${index + 1}</span>
                    <span class="text-sm font-medium text-gray-800">${product.name}</span>
                </div>
                <span class="text-sm font-bold text-green-600">${product.sales} ventas</span>
            </div>
        `).join('');
    }

    function generatePaymentMethodStats() {
        const paymentMethods = [
            { name: 'Efectivo', percentage: 45, amount: '1,250.00' },
            { name: 'Tarjeta', percentage: 30, amount: '890.50' },
            { name: 'Yape', percentage: 15, amount: '420.00' },
            { name: 'Plin', percentage: 10, amount: '280.75' }
        ];

        return paymentMethods.map(method => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                    <div class="text-sm font-medium text-gray-800">${method.name}</div>
                    <div class="text-xs text-gray-500">${method.percentage}% del total</div>
                </div>
                <div class="text-sm font-bold text-green-600">S/ ${method.amount}</div>
            </div>
        `).join('');
    }

    function getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Administrador',
            'waiter': 'Mesero',
            'kitchen': 'Cocina', 
            'cashier': 'Cajero'
        };
        return roleNames[role] || role;
    }

    // Public methods
    function showView(viewId) {
        currentView = viewId;
        initializePermissions();
        const container = document.getElementById('content-container');
        if (templates[viewId]) {
            container.innerHTML = templates[viewId]();
            bindEventListeners(viewId);
        } else {
            container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Vista no encontrada</p></div>';
        }
    }

    function showCreateUserModal() {
        const modal = document.createElement('div');
        modal.id = 'user-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Crear Nuevo Usuario</h3>
                </div>
                <form id="user-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input type="text" id="user-name" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                        <input type="text" id="user-username" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input type="password" id="user-password" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select id="user-role" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="">Seleccionar rol...</option>
                            <option value="admin">Administrador</option>
                            <option value="waiter">Mesero</option>
                            <option value="kitchen">Cocina</option>
                            <option value="cashier">Cajero</option>
                        </select>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                            Crear Usuario
                        </button>
                        <button type="button" onclick="AdminModule.hideUserModal()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind form submission
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('user-name').value,
                username: document.getElementById('user-username').value,
                password: document.getElementById('user-password').value,
                role: document.getElementById('user-role').value
            };
            createUser(formData);
        });
    }

    function hideUserModal() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.remove();
        }
    }

    function createUser(userData) {
        if (!window.users) window.users = [];
        
        // Check if username already exists
        if (window.users.find(u => u.username === userData.username)) {
            Utils.showNotification('Error', 'El nombre de usuario ya existe', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            name: userData.name,
            username: userData.username,
            password: userData.password,
            role: userData.role,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            active: true
        };

        window.users.push(newUser);
        
        // Initialize permissions for new user
        if (!window.userPermissions) window.userPermissions = {};
        window.userPermissions[newUser.id] = getDefaultPermissions(newUser.role);

        hideUserModal();
        Utils.showNotification('Usuario Creado', `Usuario ${userData.name} creado exitosamente`, 'success');
        
        // Refresh the users view if currently active
        if (currentView === 'users') {
            showView('users');
        }
    }

    function editUser(userId) {
        const user = window.users.find(u => u.id === userId);
        if (!user) return;

        editingUser = user;
        const modal = document.createElement('div');
        modal.id = 'user-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Editar Usuario</h3>
                </div>
                <form id="user-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input type="text" id="user-name" value="${user.name}" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                        <input type="text" id="user-username" value="${user.username}" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (dejar vacío para mantener)</label>
                        <input type="password" id="user-password" class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select id="user-role" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            <option value="waiter" ${user.role === 'waiter' ? 'selected' : ''}>Mesero</option>
                            <option value="kitchen" ${user.role === 'kitchen' ? 'selected' : ''}>Cocina</option>
                            <option value="cashier" ${user.role === 'cashier' ? 'selected' : ''}>Cajero</option>
                        </select>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="user-active" ${user.active ? 'checked' : ''} class="mr-2">
                        <label for="user-active" class="text-sm text-gray-700">Usuario activo</label>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                            Actualizar Usuario
                        </button>
                        <button type="button" onclick="AdminModule.hideUserModal()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind form submission
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            updateUser();
        });
    }

    function updateUser() {
        if (!editingUser) return;

        const name = document.getElementById('user-name').value;
        const username = document.getElementById('user-username').value;
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;
        const active = document.getElementById('user-active').checked;

        // Check if new username conflicts with existing users (excluding current user)
        if (window.users.find(u => u.username === username && u.id !== editingUser.id)) {
            Utils.showNotification('Error', 'El nombre de usuario ya existe', 'error');
            return;
        }

        editingUser.name = name;
        editingUser.username = username;
        if (password) editingUser.password = password;
        editingUser.role = role;
        editingUser.active = active;
        editingUser.updatedAt = new Date().toISOString();

        // Update permissions if role changed
        window.userPermissions[editingUser.id] = getDefaultPermissions(role);

        hideUserModal();
        Utils.showNotification('Usuario Actualizado', `Usuario ${name} actualizado exitosamente`, 'success');
        
        // Refresh the users view
        if (currentView === 'users') {
            showView('users');
        }

        editingUser = null;
    }

    function deleteUser(userId) {
        const user = window.users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`¿Está seguro de eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`)) {
            window.users = window.users.filter(u => u.id !== userId);
            
            // Remove permissions
            if (window.userPermissions) {
                delete window.userPermissions[userId];
            }

            Utils.showNotification('Usuario Eliminado', `Usuario ${user.name} eliminado exitosamente`, 'success');
            
            // Refresh the users view
            if (currentView === 'users') {
                showView('users');
            }
        }
    }

    function managePermissions(userId) {
        const user = window.users.find(u => u.id === userId);
        if (!user) return;

        const userPerms = window.userPermissions[userId] || [];
        const allPermissions = [
            { id: 'dashboard', name: 'Ver Dashboard', description: 'Acceso al panel principal' },
            { id: 'users', name: 'Gestión de Usuarios', description: 'Crear, editar y eliminar usuarios' },
            { id: 'menu', name: 'Gestión de Menú', description: 'Administrar items del menú' },
            { id: 'reports', name: 'Ver Reportes', description: 'Acceso a reportes y estadísticas' },
            { id: 'settings', name: 'Configuración', description: 'Configuración del sistema' },
            { id: 'tables', name: 'Gestión de Mesas', description: 'Administrar mesas del restaurante' },
            { id: 'orders', name: 'Gestión de Órdenes', description: 'Crear y administrar órdenes' },
            { id: 'kitchen_orders', name: 'Órdenes de Cocina', description: 'Ver y actualizar órdenes en cocina' },
            { id: 'payments', name: 'Procesar Pagos', description: 'Manejar pagos y transacciones' },
            { id: 'receipts', name: 'Imprimir Recibos', description: 'Generar recibos de venta' }
        ];

        const modal = document.createElement('div');
        modal.id = 'permissions-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-screen overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Gestionar Permisos - ${user.name}</h3>
                    <p class="text-sm text-gray-500">Rol: ${getRoleDisplayName(user.role)}</p>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    <div class="space-y-3">
                        ${allPermissions.map(perm => `
                            <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                                <input type="checkbox" id="perm-${perm.id}" 
                                       ${userPerms.includes(perm.id) ? 'checked' : ''} 
                                       class="mt-1">
                                <div class="flex-1">
                                    <label for="perm-${perm.id}" class="font-medium text-gray-800 cursor-pointer">
                                        ${perm.name}
                                    </label>
                                    <p class="text-sm text-gray-500">${perm.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200">
                    <div class="flex space-x-3">
                        <button onclick="AdminModule.savePermissions(${userId})" 
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                            Guardar Permisos
                        </button>
                        <button onclick="AdminModule.hidePermissionsModal()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function hidePermissionsModal() {
        const modal = document.getElementById('permissions-modal');
        if (modal) {
            modal.remove();
        }
    }

    function savePermissions(userId) {
        const checkboxes = document.querySelectorAll('#permissions-modal input[type="checkbox"]');
        const newPermissions = [];
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const permId = cb.id.replace('perm-', '');
                newPermissions.push(permId);
            }
        });

        window.userPermissions[userId] = newPermissions;
        hidePermissionsModal();
        Utils.showNotification('Permisos Actualizados', 'Los permisos del usuario han sido actualizados', 'success');
    }

    function showCreateMenuItemModal() {
        const modal = document.createElement('div');
        modal.id = 'menu-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Crear Nuevo Plato</h3>
                </div>
                <form id="menu-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Plato</label>
                        <input type="text" id="menu-name" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea id="menu-description" required class="w-full border border-gray-300 rounded-md px-3 py-2 h-20"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
                        <input type="number" id="menu-price" step="0.01" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select id="menu-category" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="">Seleccionar categoría...</option>
                            <option value="Pollo">Pollo</option>
                            <option value="Acompañamientos">Acompañamientos</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Postres">Postres</option>
                        </select>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="menu-available" checked class="mr-2">
                        <label for="menu-available" class="text-sm text-gray-700">Disponible</label>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
                            Crear Plato
                        </button>
                        <button type="button" onclick="AdminModule.hideMenuModal()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind form submission
        document.getElementById('menu-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('menu-name').value,
                description: document.getElementById('menu-description').value,
                price: parseFloat(document.getElementById('menu-price').value),
                category: document.getElementById('menu-category').value,
                available: document.getElementById('menu-available').checked
            };
            createMenuItem(formData);
        });
    }

    function hideMenuModal() {
        const modal = document.getElementById('menu-modal');
        if (modal) {
            modal.remove();
        }
    }

    function createMenuItem(itemData) {
        if (!window.menu) window.menu = [];

        const newItem = {
            id: Date.now(),
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            category: itemData.category,
            available: itemData.available,
            createdAt: new Date().toISOString()
        };

        window.menu.push(newItem);
        hideMenuModal();
        Utils.showNotification('Plato Creado', `Plato "${itemData.name}" creado exitosamente`, 'success');
        
        // Refresh the menu view if currently active
        if (currentView === 'menu') {
            showView('menu');
        }
    }

    function editMenuItem(itemId) {
        const item = window.menu.find(i => i.id === itemId);
        if (!item) return;

        editingMenuItem = item;
        const modal = document.createElement('div');
        modal.id = 'menu-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Editar Plato</h3>
                </div>
                <form id="menu-form" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Plato</label>
                        <input type="text" id="menu-name" value="${item.name}" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea id="menu-description" required class="w-full border border-gray-300 rounded-md px-3 py-2 h-20">${item.description}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
                        <input type="number" id="menu-price" value="${item.price}" step="0.01" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select id="menu-category" required class="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="Pollo" ${item.category === 'Pollo' ? 'selected' : ''}>Pollo</option>
                            <option value="Acompañamientos" ${item.category === 'Acompañamientos' ? 'selected' : ''}>Acompañamientos</option>
                            <option value="Bebidas" ${item.category === 'Bebidas' ? 'selected' : ''}>Bebidas</option>
                            <option value="Postres" ${item.category === 'Postres' ? 'selected' : ''}>Postres</option>
                        </select>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="menu-available" ${item.available ? 'checked' : ''} class="mr-2">
                        <label for="menu-available" class="text-sm text-gray-700">Disponible</label>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
                            Actualizar Plato
                        </button>
                        <button type="button" onclick="AdminModule.hideMenuModal()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind form submission
        document.getElementById('menu-form').addEventListener('submit', (e) => {
            e.preventDefault();
            updateMenuItem();
        });
    }

    function updateMenuItem() {
        if (!editingMenuItem) return;

        editingMenuItem.name = document.getElementById('menu-name').value;
        editingMenuItem.description = document.getElementById('menu-description').value;
        editingMenuItem.price = parseFloat(document.getElementById('menu-price').value);
        editingMenuItem.category = document.getElementById('menu-category').value;
        editingMenuItem.available = document.getElementById('menu-available').checked;
        editingMenuItem.updatedAt = new Date().toISOString();

        hideMenuModal();
        Utils.showNotification('Plato Actualizado', `Plato "${editingMenuItem.name}" actualizado exitosamente`, 'success');
        
        // Refresh the menu view
        if (currentView === 'menu') {
            showView('menu');
        }

        editingMenuItem = null;
    }

    function deleteMenuItem(itemId) {
        const item = window.menu.find(i => i.id === itemId);
        if (!item) return;

        if (confirm(`¿Está seguro de eliminar el plato "${item.name}"? Esta acción no se puede deshacer.`)) {
            window.menu = window.menu.filter(i => i.id !== itemId);
            Utils.showNotification('Plato Eliminado', `Plato "${item.name}" eliminado exitosamente`, 'success');
            
            // Refresh the menu view
            if (currentView === 'menu') {
                showView('menu');
            }
        }
    }

    function bindEventListeners(viewId) {
        // Additional event listeners can be added here if needed
    }

    // Public API
    return {
        showView,
        showCreateUserModal,
        hideUserModal,
        editUser,
        deleteUser,
        managePermissions,
        hidePermissionsModal,
        savePermissions,
        showCreateMenuItemModal,
        hideMenuModal,
        editMenuItem,
        deleteMenuItem
    };
})();
