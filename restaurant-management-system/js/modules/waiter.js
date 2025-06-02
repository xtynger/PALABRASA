// Complete waiter module
window.WaiterModule = (() => {
    console.log('WaiterModule loading...');
    
    // Initialize orders data if not already present
    if (!window.ordersData) {
        window.ordersData = window.getOrders ? window.getOrders() : [];
    }
    
    // Listen for order and table updates
    window.addEventListener('ordersUpdated', (event) => {
        window.ordersData = event.detail;
        // Refresh current view if showing orders
        const container = document.getElementById('content-container');
        if (container && container.innerHTML.includes('Órdenes Activas')) {
            showView('orders');
        }
    });
    
    window.addEventListener('tablesUpdated', (event) => {
        // Update table information when tables change
        const container = document.getElementById('content-container');
        if (container && container.innerHTML.includes('Gestión de Mesas')) {
            showView('tables');
        }
    });
    
    // Data management
    let currentOrder = { items: [], table: null, total: 0 };
    let currentFilter = 'all';
      // Initialize tables based on actual data from order system
    function getTables() {
        return window.getTables ? window.getTables() : Array.from({length: 12}, (_, i) => ({
            id: i + 1,
            status: 'available',
            currentOrderId: null,
            waiter: null
        }));
    }

    // Get menu data from admin-created items, fallback to hardcoded if none exist
    function getMenuData() {
        // Use admin-created menu items if available
        if (window.menu && window.menu.length > 0) {
            return window.menu.filter(item => item.available !== false); // Only show available items
        }
        
        // Fallback to hardcoded menu if no admin items exist
        return [
            // Pollos
            { id: 1, name: "Pollo a la Brasa Entero", price: 35.00, category: "pollos", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400", available: true },
            { id: 2, name: "1/2 Pollo a la Brasa", price: 20.00, category: "pollos", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400", available: true },
            { id: 3, name: "1/4 Pollo a la Brasa", price: 12.00, category: "pollos", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400", available: true },
            { id: 4, name: "Pollo Broaster", price: 28.00, category: "pollos", image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=400", available: true },
            { id: 5, name: "Alitas a la Brasa", price: 18.00, category: "pollos", image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400", available: true },
            
            // Platos
            { id: 6, name: "Parrillada Familiar", price: 65.00, category: "platos", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400", available: true },
            { id: 7, name: "Bistec a lo Pobre", price: 25.00, category: "platos", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400", available: true },
            { id: 8, name: "Lomo Saltado", price: 28.00, category: "platos", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400", available: true },
            { id: 9, name: "Ají de Gallina", price: 22.00, category: "platos", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400", available: true },
            { id: 10, name: "Arroz Chaufa", price: 20.00, category: "platos", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", available: true },
            
            // Bebidas
            { id: 11, name: "Inca Kola 1L", price: 8.00, category: "bebidas", image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400", available: true },
            { id: 12, name: "Coca Cola 1L", price: 8.00, category: "bebidas", image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400", available: true },
            { id: 13, name: "Chicha Morada", price: 6.00, category: "bebidas", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400", available: true },
            { id: 14, name: "Limonada", price: 5.00, category: "bebidas", image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400", available: true },
            { id: 15, name: "Agua Mineral", price: 3.00, category: "bebidas", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400", available: true }
        ];
    }
    
    const templates = {
        tables: () => {
            return `
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-2xl font-bold text-gray-800">Gestión de Mesas</h1>
                        <div class="flex space-x-2">
                            <span class="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                                <i class="fas fa-circle mr-1"></i>Disponible
                            </span>
                            <span class="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">
                                <i class="fas fa-circle mr-1"></i>Ocupada
                            </span>
                            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                                <i class="fas fa-circle mr-1"></i>Necesita Limpieza
                            </span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center">
                        ${generateTablesGrid()}
                    </div>
                </div>
            `;
        },
        
        menu: () => {
            return `
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-2xl font-bold text-gray-800">Menú Digital</h1>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <span class="text-sm text-blue-600">Mesa: ${currentOrder.table || 'No seleccionada'}</span>
                        </div>
                    </div>
                      <div class="flex space-x-4 mb-6">
                        ${generateMenuFilters()}
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 justify-items-center" id="menu-items">
                        ${generateMenuItems()}
                    </div>
                    
                    ${currentOrder.items.length > 0 ? generateCurrentOrder() : ''}
                </div>
            `;
        },
        
        orders: () => {
            return `
                <div class="p-6">
                    <h1 class="text-2xl font-bold text-gray-800 mb-6">Órdenes Activas</h1>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 justify-items-center">
                        ${generateActiveOrders()}
                    </div>
                </div>
            `;
        }
    };
    
    // Helper functions
    function generateTablesGrid() {
        const tables = getTables();
        return tables.map(table => {
            const statusClass = {
                'available': 'bg-green-100 border-green-300 text-green-800',
                'occupied': 'bg-red-100 border-red-300 text-red-800',
                'cleaning': 'bg-yellow-100 border-yellow-300 text-yellow-800'
            };
            
            const currentOrder = window.getActiveOrders ? 
                window.getActiveOrders().find(order => order.table === table.id) : null;
            
            return `
                <div class="border-2 ${statusClass[table.status]} rounded-lg cursor-pointer hover:shadow-md transition-shadow" 
                     style="width: 160px; height: 140px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 12px;"
                     onclick="${table.status === 'occupied' ? `showTableDetailsModal(${table.id})` : table.status === 'cleaning' ? `showCleaningModal(${table.id})` : `selectTable(${table.id})`}">
                    <div class="text-center">
                        <h3 class="font-bold text-lg mb-2">Mesa ${table.id}</h3>
                        <p class="capitalize text-sm mb-2">${table.status === 'available' ? 'Disponible' : table.status === 'occupied' ? 'Ocupada' : 'Limpieza'}</p>                        ${table.status === 'occupied' && currentOrder ? 
                            `<div class="text-xs">
                                <div class="font-medium mb-1">Orden #${currentOrder.id}</div>
                                <div class="text-gray-600">${currentOrder.waiter}</div>
                                <div class="text-gray-600">S/ ${currentOrder.total.toFixed(2)}</div>
                            </div>` : 
                            table.status === 'available' ? 
                            `<button class="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium" onclick="event.stopPropagation(); takeOrder(${table.id})">Tomar Mesa</button>` : 
                            table.status === 'cleaning' ?
                            `<div class="text-xs">
                                <div class="text-orange-600 mb-1">Necesita limpieza</div>
                                ${table.cleaningAttempts > 2 ? '<div class="text-red-600 font-bold">¡URGENTE!</div>' : ''}
                                <button class="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium" onclick="event.stopPropagation(); showCleaningModal(${table.id})">Limpiar</button>
                            </div>` : ''
                        }
                    </div>
                </div>
            `;
        }).join('');    }

    function generateMenuFilters() {
        const categories = [
            { id: 'all', name: 'Todos', icon: '🍽️' },
            { id: 'Pollos', name: 'Pollos', icon: '🍗' },
            { id: 'Platos', name: 'Platos', icon: '🥘' },
            { id: 'Bebidas', name: 'Bebidas', icon: '🥤' },
            { id: 'Postres', name: 'Postres', icon: '🍰' }
        ];
        
        return categories.map(category => `
            <button onclick="filterMenu('${category.id}')" 
                    class="px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentFilter === category.id 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }">
                ${category.icon} ${category.name}
            </button>
        `).join('');
    }
      
    function generateMenuItems() {
        const menuData = getMenuData(); // Use the function instead of the hardcoded variable
        const filteredData = currentFilter === 'all' 
            ? menuData 
            : menuData.filter(item => item.category === currentFilter);
            
        return filteredData.map(item => `
            <div class="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow" style="width: 198px; height: 280px;">
                <img src="${item.image}" alt="${item.name}" class="w-full object-cover" style="height: 170px;">
                <div class="p-3" style="height: 110px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h4 class="font-bold text-gray-800 text-sm leading-tight mb-1">${item.name}</h4>
                        <p class="text-primary font-bold text-lg">S/ ${item.price.toFixed(2)}</p>
                    </div>
                    <button onclick="addToOrder(${item.id})" class="w-full bg-primary text-white py-2 rounded hover:bg-gray-700 text-sm font-medium">
                        Agregar
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    function generateCurrentOrder() {
        return `
            <div class="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 w-80">
                <h3 class="font-bold mb-2">Orden Actual - Mesa ${currentOrder.table}</h3>
                <div class="max-h-40 overflow-y-auto">
                    ${currentOrder.items.map(item => `
                        <div class="flex justify-between items-center py-1">
                            <span>${item.name} x${item.quantity}</span>
                            <span>S/ ${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="border-t pt-2 mt-2">
                    <div class="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>S/ ${currentOrder.total.toFixed(2)}</span>
                    </div>
                    <button onclick="sendOrder()" class="w-full mt-2 bg-green-500 text-white py-2 rounded hover:bg-green-600">
                        Enviar a Cocina
                    </button>
                </div>
            </div>
        `;
    }
    
    function generateActiveOrders() {
        const activeOrders = window.getActiveOrders ? window.getActiveOrders() : [];
        if (activeOrders.length === 0) {
            return '<div class="col-span-full text-center text-gray-500 py-8">No hay órdenes activas</div>';
        }
        
        return activeOrders.map(order => `
            <div class="bg-white border rounded-lg shadow-sm" style="width: 200px; height: 220px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-bold text-lg">Mesa ${order.table}</h3>
                        <span class="px-2 py-1 rounded text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'preparing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                            ${order.status === 'pending' ? 'Pendiente' : order.status === 'preparing' ? 'Preparando' : 'Listo'}
                        </span>
                    </div>
                    <div class="text-sm text-gray-600 mb-3 overflow-y-auto" style="max-height: 80px;">
                        ${order.items.map(item => `<div class="mb-1">${item.name} x${item.quantity}</div>`).join('')}
                    </div>
                </div>
                <div class="border-t pt-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-lg">S/ ${order.total.toFixed(2)}</span>
                    </div>
                    ${order.status === 'ready' ? `<button onclick="serveOrder(${order.id})" class="w-full bg-green-500 text-white py-2 rounded text-sm font-medium hover:bg-green-600">Servir</button>` : '<div class="text-xs text-gray-500 text-center py-2">' + (order.status === 'pending' ? 'Esperando cocina...' : 'En preparación...') + '</div>'}
                </div>
            </div>
        `).join('');
    }
    
    // Table details modal function
    window.showTableDetailsModal = (tableId) => {
        const table = getTables().find(t => t.id === tableId);
        const currentOrder = window.getActiveOrders ? 
            window.getActiveOrders().find(order => order.table === tableId) : null;
        
        if (!table || table.status !== 'occupied' || !currentOrder) {
            Utils.showNotification('Error', 'No se encontraron detalles de la mesa', 'error');
            return;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="tableModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeTableModal()">
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-gray-800">Detalles de Mesa ${tableId}</h2>
                        <button onclick="closeTableModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-700 mb-2">Información de la Orden</h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Orden #:</span>
                                    <span class="font-medium">${currentOrder.id}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Mesero:</span>
                                    <span class="font-medium">${currentOrder.waiter}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Estado:</span>
                                    <span class="font-medium capitalize">${currentOrder.status === 'pending' ? 'Pendiente' : currentOrder.status === 'preparing' ? 'Preparando' : 'Listo'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Hora:</span>
                                    <span class="font-medium">${new Date(currentOrder.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-700 mb-3">Items de la Orden</h3>
                            <div class="space-y-2">
                                ${currentOrder.items.map(item => `
                                    <div class="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                        <div>
                                            <span class="font-medium">${item.name}</span>
                                            <span class="text-gray-600 text-sm"> x${item.quantity}</span>
                                        </div>
                                        <span class="font-medium">S/ ${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-lg font-semibold text-gray-800">Total:</span>
                                <span class="text-xl font-bold text-blue-600">S/ ${currentOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3 pt-4">
                            ${currentOrder.status === 'ready' ? `
                                <button onclick="serveOrder(${currentOrder.id}); closeTableModal();" 
                                        class="flex-1 bg-green-500 text-white py-2 px-4 rounded font-medium hover:bg-green-600">
                                    <i class="fas fa-check mr-2"></i>Servir Orden
                                </button>
                            ` : ''}
                            <button onclick="closeTableModal()" 
                                    class="flex-1 bg-gray-500 text-white py-2 px-4 rounded font-medium hover:bg-gray-600">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };
    
    window.closeTableModal = () => {
        const modal = document.getElementById('tableModal');
        if (modal) {
            modal.remove();
        }
    };
      // Cleaning modal function
    window.showCleaningModal = (tableId) => {
        const tables = getTables();
        const table = tables.find(t => t.id === tableId);
        
        if (!table || table.status !== 'cleaning') {
            Utils.showNotification('Error', 'Esta mesa no necesita limpieza', 'error');
            return;
        }
        
        const isUrgent = table.cleaningAttempts > 2;
        
        // Create modal HTML
        const modalHTML = `
            <div id="cleaningModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeCleaningModal()">
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-gray-800">Limpieza Mesa ${tableId}</h2>
                        <button onclick="closeCleaningModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        ${isUrgent ? `
                            <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                                    <span class="text-red-700 font-semibold">¡LIMPIEZA URGENTE!</span>
                                </div>
                                <p class="text-red-600 text-sm mt-1">Esta mesa ha sido marcada para limpieza múltiples veces.</p>
                            </div>
                        ` : ''}
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-700 mb-2">Estado de la Mesa</h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Mesa:</span>
                                    <span class="font-medium">#${tableId}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Estado:</span>
                                    <span class="font-medium text-yellow-600">Necesita Limpieza</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Último uso:</span>
                                    <span class="font-medium">${table.lastUsed ? new Date(table.lastUsed).toLocaleTimeString() : 'N/A'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Intentos de limpieza:</span>
                                    <span class="font-medium ${table.cleaningAttempts > 2 ? 'text-red-600' : ''}">${table.cleaningAttempts || 0}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${isUrgent ? `
                            <div class="bg-yellow-50 p-4 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Comentario requerido <span class="text-red-500">*</span>
                                </label>
                                <textarea 
                                    id="cleaningComment" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                    rows="3" 
                                    placeholder="Explique por qué esta mesa no ha podido ser limpiada..."
                                    required></textarea>
                            </div>
                        ` : ''}
                        
                        <div class="flex space-x-3 pt-4">
                            <button onclick="markTableAsClean(${tableId})" 
                                    class="flex-1 bg-green-500 text-white py-2 px-4 rounded font-medium hover:bg-green-600">
                                <i class="fas fa-check mr-2"></i>Mesa Limpia
                            </button>
                            <button onclick="reportCleaningIssue(${tableId})" 
                                    class="flex-1 bg-yellow-500 text-white py-2 px-4 rounded font-medium hover:bg-yellow-600">
                                <i class="fas fa-exclamation mr-2"></i>Reportar Problema
                            </button>
                            <button onclick="closeCleaningModal()" 
                                    class="flex-1 bg-gray-500 text-white py-2 px-4 rounded font-medium hover:bg-gray-600">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    window.closeCleaningModal = () => {
        const modal = document.getElementById('cleaningModal');
        if (modal) {
            modal.remove();
        }
    };    window.markTableAsClean = (tableId) => {
        const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
        const cleanedBy = currentUser ? currentUser.name : 'Usuario Actual';
        
        const success = window.markTableCleaned(tableId, cleanedBy);
        
        if (success) {
            Utils.showNotification('Éxito', `Mesa ${tableId} marcada como limpia`, 'success');
            closeCleaningModal();
            showView('tables'); // Refresh the view
        } else {
            Utils.showNotification('Error', 'Error al marcar mesa como limpia', 'error');
        }
    };

    window.reportCleaningIssue = (tableId) => {
        const tables = getTables();
        const table = tables.find(t => t.id === tableId);
        const isUrgent = table && table.cleaningAttempts > 2;
        
        let comment = '';
        if (isUrgent) {
            const commentInput = document.getElementById('cleaningComment');
            comment = commentInput ? commentInput.value.trim() : '';
            
            if (!comment) {
                Utils.showNotification('Error', 'Debe proporcionar un comentario para limpieza urgente', 'error');
                return;
            }
        }
        
        const attempts = window.recordCleaningAttempt(tableId, comment || 'Problema reportado sin comentario específico');
        
        let message = `Problema reportado para Mesa ${tableId}`;
        if (attempts > 2) {
            message += ` (${attempts} intentos - URGENTE)`;
        }
        
        Utils.showNotification('Información', message, attempts > 2 ? 'error' : 'info');
        closeCleaningModal();
        showView('tables'); // Refresh the view
    };
    
    // Global functions (attached to window for onclick handlers)
    window.selectTable = (tableId) => {
        // Only select tables that are available
        const tables = getTables();
        const table = tables.find(t => t.id === tableId);
        
        if (table && table.status === 'available') {
            currentOrder.table = tableId;
            showView('menu');
        } else {
            Utils.showNotification('Error', 'Esta mesa no está disponible', 'error');
        }
    };
    
    window.takeOrder = (tableId) => {
        // Same as selectTable - only allow taking available tables
        window.selectTable(tableId);
    };
      window.addToOrder = (itemId) => {
        const menuData = getMenuData(); // Use the function to get current menu data
        const item = menuData.find(i => i.id === itemId);
        if (item) {
            const existingItem = currentOrder.items.find(i => i.id === itemId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                currentOrder.items.push({...item, quantity: 1});
            }
            currentOrder.total = currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            showView('menu'); // Refresh view
        }
    };    window.sendOrder = () => {
        if (currentOrder.items.length > 0 && currentOrder.table) {
            // Get current user from authentication system
            const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
            const waiterName = currentUser ? currentUser.name : 'Usuario Actual';
            
            // Create new order using the global addOrder function
            const newOrder = {
                table: currentOrder.table,
                items: [...currentOrder.items],
                total: currentOrder.total,
                status: 'pending',
                waiter: waiterName
            };
            
            // Add to global orders using the new system
            window.addOrder(newOrder);
            
            // Update table status to occupied using the global function
            window.updateTableStatus(currentOrder.table, 'occupied', waiterName);
            
            // Reset current order
            currentOrder = { items: [], table: null, total: 0 };
            
            Utils.showNotification('Éxito', 'Orden enviada a cocina', 'success');
            showView('orders');
        } else {
            Utils.showNotification('Error', 'Debe seleccionar una mesa y agregar items', 'error');
        }
    };
      window.serveOrder = (orderId) => {
        window.updateOrderStatus(orderId, 'completed');
        
        Utils.showNotification('Éxito', 'Orden servida - Mesa disponible para limpieza', 'success');
        showView('orders');
    };
    
    function filterMenu(category) {
        currentFilter = category;
        showView('menu');
    }
    
    // Alert system for urgent cleaning
    function checkCleaningAlerts() {
        const tables = getTables();
        const urgentTables = tables.filter(t => t.status === 'cleaning' && (t.cleaningAttempts || 0) > 2);
        
        if (urgentTables.length > 0) {
            const tableNumbers = urgentTables.map(t => t.id).join(', ');
            Utils.showNotification(
                'Alerta de Limpieza', 
                `¡Mesas ${tableNumbers} necesitan limpieza urgente!`, 
                'error'
            );
        }
    }

    // Call cleaning alerts check when showing tables view
    function showView(viewId) {
        console.log('showView called with:', viewId);
        const container = document.getElementById('content-container');
        
        if (container && templates[viewId]) {
            container.innerHTML = templates[viewId]();
            
            // Check for cleaning alerts when showing tables
            if (viewId === 'tables') {
                setTimeout(checkCleaningAlerts, 500);
            }
        } else {
            if (container) {
                container.innerHTML = `
                    <div class="p-6">
                        <p class="text-red-500">Error: Vista "${viewId}" no encontrada</p>
                    </div>
                `;
            }
        }
    }
      console.log('WaiterModule loaded successfully');
    
    return {
        showView,
        loadView: showView, // Alias for compatibility with app.js
        filterMenu
    };
})();