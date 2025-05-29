// Waiter Module - Complete waiter functionality
// Handles table management, digital menu, order taking, and order serving

window.WaiterModule = (() => {
    let currentView = null;
    let selectedTable = null;
    let currentOrder = {
        table: null,
        items: [],
        total: 0,
        waiter: null
    };

    // Initialize table statuses
    const tableStatuses = {};
    for (let i = 1; i <= 12; i++) {
        tableStatuses[i] = 'available'; // available, occupied, needs_cleaning
    }

    // Get current waiter info
    function getCurrentWaiter() {
        const result = window.Auth ? window.Auth.getCurrentUser() : { name: 'Mesero', id: 1, username: 'mesero1' };
        console.log('getCurrentWaiter result:', result);
        return result;
    }

    // Helper functions for stats
    function getAvailableTablesCount() {
        return Object.values(tableStatuses).filter(status => status === 'available').length;
    }

    function getOccupiedTablesCount() {
        return Object.values(tableStatuses).filter(status => status === 'occupied').length;
    }

    function getActiveOrdersCount() {
        if (!window.orders) return 0;
        return window.orders.filter(order => ['new', 'preparing', 'ready'].includes(order.status)).length;
    }

    function getOrdersByStatus(status) {
        if (!window.orders) return [];
        return window.orders.filter(order => order.status === status);
    }

    function getWaiterOrdersToday() {
        if (!window.orders) return 0;
        const today = new Date().toDateString();
        const waiter = getCurrentWaiter();
        return window.orders.filter(order => 
            order.waiterId === waiter.id && 
            new Date(order.timestamp).toDateString() === today
        ).length;
    }

    function getWaiterSalesToday() {
        if (!window.orders) return '0.00';
        const today = new Date().toDateString();
        const waiter = getCurrentWaiter();
        const todayOrders = window.orders.filter(order => 
            order.waiterId === waiter.id && 
            new Date(order.timestamp).toDateString() === today &&
            order.status === 'paid'
        );
        return todayOrders.reduce((total, order) => total + order.total, 0).toFixed(2);
    }

    function getWaiterTablesServed() {
        if (!window.orders) return 0;
        const today = new Date().toDateString();
        const waiter = getCurrentWaiter();
        const todayOrders = window.orders.filter(order => 
            order.waiterId === waiter.id && 
            new Date(order.timestamp).toDateString() === today
        );
        const uniqueTables = [...new Set(todayOrders.map(order => order.table))];
        return uniqueTables.length;
    }

    // View templates
    const templates = {
        tables: () => {
            console.log('Generating tables template...');
            try {
                const waiter = getCurrentWaiter();
                const currentTime = Utils.formatTime(new Date());
                const availableTables = getAvailableTablesCount();
                const occupiedTables = getOccupiedTablesCount();
                const activeOrders = getActiveOrdersCount();
                const tableGrid = generateTableGrid();
                
                console.log('Template data:', { waiter, currentTime, availableTables, occupiedTables, activeOrders });
                
                return `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Gestión de Mesas</h2>
                        <p class="text-gray-600">Mesero: ${waiter.name}</p>
                    </div>
                    <div class="text-sm text-gray-500">${currentTime}</div>
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                        <div class="flex items-center">
                            <i class="fas fa-chair text-green-600 text-2xl mr-3"></i>
                            <div>
                                <h3 class="font-semibold text-green-800">Mesas Disponibles</h3>
                                <p class="text-2xl font-bold text-green-600">${availableTables}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-red-100 rounded-lg p-4 border-l-4 border-red-500">
                        <div class="flex items-center">
                            <i class="fas fa-utensils text-red-600 text-2xl mr-3"></i>
                            <div>
                                <h3 class="font-semibold text-red-800">Mesas Ocupadas</h3>
                                <p class="text-2xl font-bold text-red-600">${occupiedTables}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                        <div class="flex items-center">
                            <i class="fas fa-receipt text-blue-600 text-2xl mr-3"></i>
                            <div>
                                <h3 class="font-semibold text-blue-800">Órdenes Activas</h3>
                                <p class="text-2xl font-bold text-blue-600">${activeOrders}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table Grid -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Estado de Mesas</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${tableGrid}
                    </div>
                </div>

                <!-- Legend -->
                <div class="bg-white rounded-lg shadow p-4">
                    <h3 class="font-semibold mb-3">Leyenda</h3>
                    <div class="flex flex-wrap gap-4 text-sm">
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-green-500 rounded mr-2"></div>
                            <span>Disponible</span>
                        </div>
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-red-500 rounded mr-2"></div>
                            <span>Ocupada</span>
                        </div>
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                            <span>Necesita limpieza</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
            } catch (error) {
                console.error('Error in tables template:', error);
                throw error;
            }
        },

        menu: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Carta Digital</h2>
                        <p class="text-gray-600">Seleccione items para una nueva orden</p>
                    </div>
                    <button onclick="WaiterModule.showCurrentOrder()" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                        <i class="fas fa-shopping-cart mr-2"></i>
                        Ver Orden Actual (${currentOrder.items.length})
                    </button>
                </div>

                <!-- Table Selection -->
                ${currentOrder.table ? `
                    <div class="bg-blue-100 border border-blue-300 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-table text-blue-600 mr-2"></i>
                                <span class="font-medium text-blue-800">Mesa seleccionada: ${currentOrder.table}</span>
                            </div>
                            <button onclick="WaiterModule.clearSelectedTable()" 
                                    class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-times"></i> Cambiar mesa
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                            <span class="text-yellow-800">Seleccione una mesa antes de tomar la orden</span>
                            <button onclick="WaiterModule.showView('tables')" 
                                    class="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm">
                                Ir a Mesas
                            </button>
                        </div>
                    </div>
                `}

                <!-- Category Filter -->
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex flex-wrap gap-2">
                        <button onclick="WaiterModule.filterByCategory('all')" 
                                class="category-filter active px-4 py-2 rounded-md bg-blue-600 text-white">
                            Todos
                        </button>
                        <button onclick="WaiterModule.filterByCategory('Pollo')" 
                                class="category-filter px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Pollo
                        </button>
                        <button onclick="WaiterModule.filterByCategory('Acompañamientos')" 
                                class="category-filter px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Acompañamientos
                        </button>
                        <button onclick="WaiterModule.filterByCategory('Bebidas')" 
                                class="category-filter px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Bebidas
                        </button>
                        <button onclick="WaiterModule.filterByCategory('Postres')" 
                                class="category-filter px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Postres
                        </button>
                    </div>
                </div>

                <!-- Menu Items -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="menu-items-container">
                    ${generateMenuItems()}
                </div>
            </div>
        `,

        orders: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Órdenes Activas</h2>
                        <p class="text-gray-600">Gestione las órdenes de sus mesas</p>
                    </div>
                    <button onclick="WaiterModule.showView('menu')" 
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                        <i class="fas fa-plus mr-2"></i>Nueva Orden
                    </button>
                </div>

                <!-- Orders Summary -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
                        <div class="text-center">
                            <i class="fas fa-clock text-yellow-600 text-2xl mb-2"></i>
                            <h3 class="font-semibold text-yellow-800">Nuevas</h3>
                            <p class="text-2xl font-bold text-yellow-600">${getOrdersByStatus('new').length}</p>
                        </div>
                    </div>
                    <div class="bg-orange-100 rounded-lg p-4 border-l-4 border-orange-500">
                        <div class="text-center">
                            <i class="fas fa-fire text-orange-600 text-2xl mb-2"></i>
                            <h3 class="font-semibold text-orange-800">En Preparación</h3>
                            <p class="text-2xl font-bold text-orange-600">${getOrdersByStatus('preparing').length}</p>
                        </div>
                    </div>
                    <div class="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                        <div class="text-center">
                            <i class="fas fa-check text-blue-600 text-2xl mb-2"></i>
                            <h3 class="font-semibold text-blue-800">Listas</h3>
                            <p class="text-2xl font-bold text-blue-600">${getOrdersByStatus('ready').length}</p>
                        </div>
                    </div>
                    <div class="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                        <div class="text-center">
                            <i class="fas fa-utensils text-green-600 text-2xl mb-2"></i>
                            <h3 class="font-semibold text-green-800">Servidas</h3>
                            <p class="text-2xl font-bold text-green-600">${getOrdersByStatus('served').length}</p>
                        </div>
                    </div>
                </div>

                <!-- Active Orders List -->
                <div class="space-y-4">
                    ${generateActiveOrders()}
                </div>
            </div>
        `,

        profile: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Mi Perfil</h2>
                    <div class="text-sm text-gray-500">${Utils.formatTime(new Date())}</div>
                </div>

                <!-- Waiter Info -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center space-x-4">
                        <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-blue-600 text-3xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800">${getCurrentWaiter().name}</h3>
                            <p class="text-gray-600">Mesero</p>
                            <p class="text-sm text-gray-500">Usuario: ${getCurrentWaiter().username}</p>
                        </div>
                    </div>
                </div>

                <!-- Today's Performance -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Rendimiento del Día</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <i class="fas fa-receipt text-blue-600 text-2xl mb-2"></i>
                            <h4 class="font-semibold text-blue-800">Órdenes Tomadas</h4>
                            <p class="text-2xl font-bold text-blue-600">${getWaiterOrdersToday()}</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <i class="fas fa-dollar-sign text-green-600 text-2xl mb-2"></i>
                            <h4 class="font-semibold text-green-800">Ventas Generadas</h4>
                            <p class="text-2xl font-bold text-green-600">S/ ${getWaiterSalesToday()}</p>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <i class="fas fa-star text-purple-600 text-2xl mb-2"></i>
                            <h4 class="font-semibold text-purple-800">Mesas Atendidas</h4>
                            <p class="text-2xl font-bold text-purple-600">${getWaiterTablesServed()}</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Actividad Reciente</h3>
                    <div class="space-y-3">
                        ${generateWaiterActivity()}
                    </div>
                </div>
            </div>
        `
    };

    // Generate functions
    function generateTableGrid() {
        let html = '';
        for (let i = 1; i <= 12; i++) {
            const status = tableStatuses[i];
            const statusClass = getTableStatusClass(status);
            const statusText = getTableStatusText(status);
            
            html += `
                <div class="relative">
                    <button onclick="WaiterModule.selectTable(${i})" 
                            class="w-full p-6 rounded-lg border-2 transition-all hover:shadow-lg ${statusClass} ${status === 'available' ? 'hover:bg-green-600' : ''}">
                        <div class="text-center">
                            <div class="text-lg font-bold">Mesa ${i}</div>
                            <div class="text-sm mt-1">${statusText}</div>
                            ${status === 'available' ? `
                                <div class="mt-3">
                                    <i class="fas fa-chair text-2xl"></i>
                                </div>
                            ` : ''}
                            ${status === 'occupied' ? `
                                <div class="mt-3">
                                    <i class="fas fa-utensils text-2xl"></i>
                                </div>
                            ` : ''}
                            ${status === 'needs_cleaning' ? `
                                <div class="mt-3">
                                    <i class="fas fa-broom text-2xl"></i>
                                </div>
                            ` : ''}
                        </div>
                    </button>
                </div>
            `;
        }
        return html;
    }

    function getTableStatusClass(status) {
        const classMap = {
            'available': 'bg-green-500 text-white border-green-600',
            'occupied': 'bg-red-500 text-white border-red-600',
            'needs_cleaning': 'bg-yellow-500 text-white border-yellow-600'
        };
        return classMap[status] || 'bg-gray-500 text-white border-gray-600';
    }

    function getTableStatusText(status) {
        const textMap = {
            'available': 'Disponible',
            'occupied': 'Ocupada',
            'needs_cleaning': 'Necesita limpieza'
        };
        return textMap[status] || 'Desconocido';
    }

    function generateMenuItems(category = 'all') {
        if (!window.menu) return '<div class="col-span-full text-center py-8 text-gray-500">No hay items disponibles</div>';
        
        const filteredMenu = category === 'all' ? window.menu : window.menu.filter(item => item.category === category);
        
        if (filteredMenu.length === 0) {
            return '<div class="col-span-full text-center py-8 text-gray-500">No hay items en esta categoría</div>';
        }
        
        return filteredMenu.map(item => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="h-48 bg-gray-200 flex items-center justify-center">
                    <i class="fas fa-utensils text-4xl text-gray-400"></i>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-semibold text-gray-800">${item.name}</h3>
                        <span class="text-lg font-bold text-green-600">S/ ${item.price.toFixed(2)}</span>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">${item.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            ${item.category}
                        </span>
                        <button onclick="WaiterModule.addToOrder(${item.id})" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm ${!currentOrder.table ? 'opacity-50 cursor-not-allowed' : ''}"
                                ${!currentOrder.table ? 'disabled' : ''}>
                            <i class="fas fa-plus mr-1"></i>Agregar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function generateActiveOrders() {
        if (!window.orders) return '<div class="text-center py-8 text-gray-500">No hay órdenes activas</div>';
        
        const activeOrders = window.orders.filter(order => 
            ['new', 'preparing', 'ready'].includes(order.status)
        );
        
        if (activeOrders.length === 0) {
            return '<div class="text-center py-8 text-gray-500">No hay órdenes activas</div>';
        }
        
        return activeOrders.map(order => `
            <div class="bg-white rounded-lg shadow-md border-l-4 ${getOrderBorderColor(order.status)} p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Orden #${order.id}</h3>
                        <p class="text-gray-600">Mesa ${order.table} • ${order.waiterName || 'Mesero'}</p>
                        <p class="text-sm text-gray-500">${Utils.formatTime(new Date(order.timestamp))}</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                        <p class="text-lg font-bold text-gray-800 mt-1">S/ ${order.total.toFixed(2)}</p>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h4 class="font-medium text-gray-700 mb-2">Items:</h4>
                    <div class="space-y-1">
                        ${order.items.map(item => `
                            <div class="flex justify-between text-sm">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>S/ ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex justify-end space-x-2">
                    ${order.status === 'ready' ? `
                        <button onclick="WaiterModule.serveOrder(${order.id})" 
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm">
                            <i class="fas fa-check mr-1"></i>Servir
                        </button>
                    ` : ''}
                    <button onclick="WaiterModule.viewOrderDetails(${order.id})" 
                            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm">
                        <i class="fas fa-eye mr-1"></i>Ver Detalles
                    </button>
                </div>
            </div>
        `).join('');
    }

    function getOrderBorderColor(status) {
        const colorMap = {
            'new': 'border-yellow-500',
            'preparing': 'border-orange-500',
            'ready': 'border-blue-500',
            'served': 'border-green-500'
        };
        return colorMap[status] || 'border-gray-500';
    }

    function getStatusBadgeClass(status) {
        const classMap = {
            'new': 'bg-yellow-100 text-yellow-800',
            'preparing': 'bg-orange-100 text-orange-800',
            'ready': 'bg-blue-100 text-blue-800',
            'served': 'bg-green-100 text-green-800'
        };
        return classMap[status] || 'bg-gray-100 text-gray-800';
    }

    function getStatusText(status) {
        const textMap = {
            'new': 'Nueva',
            'preparing': 'En Preparación',
            'ready': 'Lista',
            'served': 'Servida'
        };
        return textMap[status] || status;
    }

    function generateWaiterActivity() {
        const activities = [
            { icon: 'fas fa-plus-circle', text: 'Orden tomada para Mesa 3', time: '5 min', color: 'blue' },
            { icon: 'fas fa-check-circle', text: 'Orden servida en Mesa 7', time: '12 min', color: 'green' },
            { icon: 'fas fa-utensils', text: 'Nueva orden enviada a cocina', time: '18 min', color: 'orange' },
            { icon: 'fas fa-chair', text: 'Mesa 5 marcada como disponible', time: '25 min', color: 'gray' }
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

    // Public methods
    function showView(viewId) {
        console.log('WaiterModule.showView called with viewId:', viewId);
        currentView = viewId;
        const container = document.getElementById('content-container');
        console.log('Content container found:', !!container);
        
        if (templates[viewId]) {
            console.log('Template found for viewId:', viewId);
            try {
                const templateHTML = templates[viewId]();
                console.log('Template generated successfully, length:', templateHTML.length);
                container.innerHTML = templateHTML;
                bindEventListeners(viewId);
                console.log('View loaded successfully');
            } catch (error) {
                console.error('Error generating template:', error);
                container.innerHTML = '<div class="text-center py-8"><p class="text-red-500">Error: ' + error.message + '</p></div>';
            }
        } else {
            console.log('Template not found for viewId:', viewId);
            console.log('Available templates:', Object.keys(templates));
            container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Vista no encontrada: ' + viewId + '</p></div>';
        }
    }

    function selectTable(tableNumber) {
        if (tableStatuses[tableNumber] === 'available') {
            currentOrder.table = tableNumber;
            currentOrder.waiter = getCurrentWaiter().id;
            tableStatuses[tableNumber] = 'occupied';
            
            Utils.showNotification('Mesa Seleccionada', `Mesa ${tableNumber} seleccionada para nueva orden`, 'success');
            
            // Redirect to menu to start taking order
            showView('menu');
        } else {
            const statusText = getTableStatusText(tableStatuses[tableNumber]);
            Utils.showNotification('Mesa No Disponible', `La mesa ${tableNumber} está ${statusText.toLowerCase()}`, 'warning');
        }
    }

    function clearSelectedTable() {
        if (currentOrder.table) {
            if (currentOrder.items.length > 0) {
                if (confirm('¿Está seguro de cambiar la mesa? Se perderá la orden actual.')) {
                    tableStatuses[currentOrder.table] = 'available';
                    currentOrder = { table: null, items: [], total: 0, waiter: null };
                    showView('tables');
                }
            } else {
                tableStatuses[currentOrder.table] = 'available';
                currentOrder = { table: null, items: [], total: 0, waiter: null };
                showView('tables');
            }
        }
    }

    function addToOrder(itemId) {
        if (!currentOrder.table) {
            Utils.showNotification('Error', 'Seleccione una mesa primero', 'error');
            return;
        }

        const menuItem = window.menu.find(item => item.id === itemId);
        if (!menuItem) {
            Utils.showNotification('Error', 'Item no encontrado', 'error');
            return;
        }

        // Check if item already exists in order
        const existingItem = currentOrder.items.find(item => item.id === itemId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            currentOrder.items.push({
                id: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: 1
            });
        }

        currentOrder.total = currentOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        Utils.showNotification('Item Agregado', `${menuItem.name} agregado a la orden`, 'success');
        
        // Update the view to reflect changes
        showView('menu');
    }

    function filterByCategory(category) {
        // Update active filter button
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        event.target.classList.add('active', 'bg-blue-600', 'text-white');
        event.target.classList.remove('bg-gray-200', 'text-gray-700');
        
        // Update menu items
        const container = document.getElementById('menu-items-container');
        container.innerHTML = generateMenuItems(category);
    }

    function showCurrentOrder() {
        if (currentOrder.items.length === 0) {
            Utils.showNotification('Orden Vacía', 'No hay items en la orden actual', 'info');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'current-order-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-screen overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Orden Actual - Mesa ${currentOrder.table}</h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    <div class="space-y-3">
                        ${currentOrder.items.map(item => `
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div class="font-medium">${item.name}</div>
                                    <div class="text-sm text-gray-500">S/ ${item.price.toFixed(2)} c/u</div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button onclick="WaiterModule.decreaseQuantity(${item.id})" 
                                            class="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="w-8 text-center font-medium">${item.quantity}</span>
                                    <button onclick="WaiterModule.increaseQuantity(${item.id})" 
                                            class="w-8 h-8 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button onclick="WaiterModule.removeFromOrder(${item.id})" 
                                            class="w-8 h-8 bg-gray-100 text-red-600 rounded-full hover:bg-gray-200 ml-2">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex justify-between items-center text-lg font-bold">
                            <span>Total:</span>
                            <span>S/ ${currentOrder.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200">
                    <div class="flex space-x-3">
                        <button onclick="WaiterModule.submitOrder()" 
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
                            <i class="fas fa-paper-plane mr-2"></i>Enviar Orden
                        </button>
                        <button onclick="WaiterModule.hideCurrentOrderModal()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
                            Continuar Editando
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function hideCurrentOrderModal() {
        const modal = document.getElementById('current-order-modal');
        if (modal) {
            modal.remove();
        }
    }

    function increaseQuantity(itemId) {
        const item = currentOrder.items.find(item => item.id === itemId);
        if (item) {
            item.quantity += 1;
            currentOrder.total = currentOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            showCurrentOrder();
        }
    }

    function decreaseQuantity(itemId) {
        const item = currentOrder.items.find(item => item.id === itemId);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            currentOrder.total = currentOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            showCurrentOrder();
        }
    }

    function removeFromOrder(itemId) {
        currentOrder.items = currentOrder.items.filter(item => item.id !== itemId);
        currentOrder.total = currentOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        if (currentOrder.items.length === 0) {
            hideCurrentOrderModal();
            Utils.showNotification('Orden Vacía', 'Todos los items han sido removidos', 'info');
        } else {
            showCurrentOrder();
        }
    }

    function submitOrder() {
        if (currentOrder.items.length === 0) {
            Utils.showNotification('Error', 'La orden está vacía', 'error');
            return;
        }

        if (!window.orders) window.orders = [];

        const newOrder = {
            id: Date.now(),
            table: currentOrder.table,
            items: [...currentOrder.items],
            total: currentOrder.total,
            status: 'new',
            timestamp: new Date().toISOString(),
            waiterId: getCurrentWaiter().id,
            waiterName: getCurrentWaiter().name
        };

        window.orders.push(newOrder);
        
        // Clear current order
        currentOrder = { table: null, items: [], total: 0, waiter: null };
        
        hideCurrentOrderModal();
        Utils.showNotification('Orden Enviada', `Orden enviada a cocina para Mesa ${newOrder.table}`, 'success');
        
        // Redirect to orders view
        showView('orders');
    }

    function serveOrder(orderId) {
        const order = window.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'served';
            order.servedAt = new Date().toISOString();
            
            // Free up the table
            tableStatuses[order.table] = 'needs_cleaning';
            
            Utils.showNotification('Orden Servida', `Orden #${orderId} marcada como servida`, 'success');
            
            // Refresh orders view
            if (currentView === 'orders') {
                showView('orders');
            }
        }
    }

    function viewOrderDetails(orderId) {
        const order = window.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.createElement('div');
        modal.id = 'order-details-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Detalles de Orden #${order.id}</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="font-medium">Mesa:</span>
                            <span>${order.table}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Mesero:</span>
                            <span>${order.waiterName}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Estado:</span>
                            <span class="px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}">
                                ${getStatusText(order.status)}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Hora:</span>
                            <span>${Utils.formatTime(new Date(order.timestamp))}</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="font-medium mb-2">Items:</h4>
                        <div class="space-y-2">
                            ${order.items.map(item => `
                                <div class="flex justify-between text-sm">
                                    <span>${item.quantity}x ${item.name}</span>
                                    <span>S/ ${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-2 pt-2 border-t border-gray-200 flex justify-between font-bold">
                            <span>Total:</span>
                            <span>S/ ${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200">
                    <button onclick="WaiterModule.hideOrderDetailsModal()" 
                            class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function hideOrderDetailsModal() {
        const modal = document.getElementById('order-details-modal');
        if (modal) {
            modal.remove();
        }
    }

    function bindEventListeners(viewId) {
        // Additional event listeners can be added here if needed
    }

    // Public API
    return {
        showView,
        selectTable,
        clearSelectedTable,
        addToOrder,
        filterByCategory,
        showCurrentOrder,
        hideCurrentOrderModal,
        increaseQuantity,
        decreaseQuantity,
        removeFromOrder,
        submitOrder,
        serveOrder,
        viewOrderDetails,
        hideOrderDetailsModal
    };
})();