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

    // Menu data - 5 items per category
    const menuData = [
        // Pollos
        { id: 1, name: "Pollo a la Brasa Entero", price: 35.00, category: "pollos", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400" },
        { id: 2, name: "1/2 Pollo a la Brasa", price: 20.00, category: "pollos", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400" },
        { id: 3, name: "1/4 Pollo a la Brasa", price: 12.00, category: "pollos", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400" },
        { id: 4, name: "Pollo Broaster", price: 28.00, category: "pollos", image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=400" },
        { id: 5, name: "Alitas a la Brasa", price: 18.00, category: "pollos", image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400" },
        
        // Platos
        { id: 6, name: "Parrillada Familiar", price: 65.00, category: "platos", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400" },
        { id: 7, name: "Bistec a lo Pobre", price: 25.00, category: "platos", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
        { id: 8, name: "Lomo Saltado", price: 28.00, category: "platos", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400" },
        { id: 9, name: "Ají de Gallina", price: 22.00, category: "platos", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400" },
        { id: 10, name: "Arroz Chaufa", price: 20.00, category: "platos", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" },
        
        // Bebidas
        { id: 11, name: "Inca Kola 1L", price: 8.00, category: "bebidas", image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400" },
        { id: 12, name: "Coca Cola 1L", price: 8.00, category: "bebidas", image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400" },
        { id: 13, name: "Chicha Morada", price: 6.00, category: "bebidas", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400" },
        { id: 14, name: "Limonada", price: 5.00, category: "bebidas", image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400" },
        { id: 15, name: "Agua Mineral", price: 3.00, category: "bebidas", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400" }
    ];
    
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
                        <button onclick="WaiterModule.filterMenu('all')" 
                                class="filter-btn px-4 py-2 rounded ${currentFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}">
                            Todos
                        </button>
                        <button onclick="WaiterModule.filterMenu('pollos')" 
                                class="filter-btn px-4 py-2 rounded ${currentFilter === 'pollos' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}">
                            Pollos
                        </button>
                        <button onclick="WaiterModule.filterMenu('platos')" 
                                class="filter-btn px-4 py-2 rounded ${currentFilter === 'platos' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}">
                            Platos
                        </button>
                        <button onclick="WaiterModule.filterMenu('bebidas')" 
                                class="filter-btn px-4 py-2 rounded ${currentFilter === 'bebidas' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}">
                            Bebidas
                        </button>
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
                     onclick="${table.status === 'occupied' ? `showTableDetailsModal(${table.id})` : `selectTable(${table.id})`}">
                    <div class="text-center">
                        <h3 class="font-bold text-lg mb-2">Mesa ${table.id}</h3>
                        <p class="capitalize text-sm mb-2">${table.status === 'available' ? 'Disponible' : table.status === 'occupied' ? 'Ocupada' : 'Limpieza'}</p>
                        ${table.status === 'occupied' && currentOrder ? 
                            `<div class="text-xs">
                                <div class="font-medium mb-1">Orden #${currentOrder.id}</div>
                                <div class="text-gray-600">${currentOrder.waiter}</div>
                                <div class="text-gray-600">S/ ${currentOrder.total.toFixed(2)}</div>
                            </div>` : 
                            table.status === 'available' ? 
                            `<button class="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium" onclick="event.stopPropagation(); takeOrder(${table.id})">Tomar Mesa</button>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function generateMenuItems() {
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
    
    // Global functions (attached to window for onclick handlers)
    window.selectTable = (tableId) => {
        currentOrder.table = tableId;
        tables[tableId - 1].status = 'occupied';
        showView('menu');
    };
    
    window.takeOrder = (tableId) => {
        currentOrder.table = tableId;
        showView('menu');
    };
    
    window.addToOrder = (itemId) => {
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
    };
    
    window.sendOrder = () => {
        if (currentOrder.items.length > 0) {
            // Create new order using the global addOrder function
            const newOrder = {
                table: currentOrder.table,
                items: [...currentOrder.items],
                total: currentOrder.total,
                status: 'pending',
                waiter: 'Current User' // This should be the logged in waiter's name
            };
            
            // Add to global orders using the new system
            window.addOrder(newOrder);
            
            // Update table status to occupied
            if (currentOrder.table && currentOrder.table <= 12) {
                const tableIndex = currentOrder.table - 1;
                tables[tableIndex].status = 'occupied';
                tables[tableIndex].order = newOrder;
            }
            
            // Reset current order
            currentOrder = { items: [], table: null, total: 0 };
            
            Utils.showNotification('Éxito', 'Orden enviada a cocina', 'success');
            showView('orders');
        }
    };
    
    window.serveOrder = (orderId) => {
        window.updateOrderStatus(orderId, 'completed');
        
        // Free up the table
        const order = window.ordersData.find(o => o.id === orderId);
        if (order && order.table && order.table <= 12) {
            const tableIndex = order.table - 1;
            tables[tableIndex].status = 'available';
            tables[tableIndex].order = null;
            tables[tableIndex].lastCleaned = new Date();
        }
        
        Utils.showNotification('Éxito', 'Orden servida', 'success');
        showView('orders');
    };
    
    function filterMenu(category) {
        currentFilter = category;
        showView('menu');
    }
    
    function showView(viewId) {
        console.log('showView called with:', viewId);
        const container = document.getElementById('content-container');
        
        // Refresh table states before showing tables view
        if (viewId === 'tables') {
            tables = initializeTables();
        }
        
        if (container && templates[viewId]) {
            container.innerHTML = templates[viewId]();
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
        filterMenu
    };
})();