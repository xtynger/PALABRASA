// Kitchen Module - Handles order queue management and status updates

window.KitchenModule = (() => {
    let currentView = null;

    // View templates
    const templates = {
        orders: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Cola de Órdenes</h2>
                    <div class="flex items-center space-x-4">
                        <div class="bg-white rounded-lg shadow px-4 py-2">
                            <span class="text-sm text-gray-600">Órdenes pendientes:</span>
                            <span class="font-bold text-lg text-secondary ml-2">${getPendingOrdersCount()}</span>
                        </div>
                        <button class="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-md" onclick="location.reload()">
                            <i class="fas fa-refresh mr-2"></i>Actualizar
                        </button>
                    </div>
                </div>

                <!-- Order Queue -->
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    ${getKitchenOrders().map(order => `
                        <div class="bg-white rounded-lg shadow-md border-l-4 ${getBorderColor(order.status)} order-item">
                            <div class="p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-800">Mesa ${order.table}</h3>
                                        <p class="text-sm text-gray-500">Orden #${order.id}</p>
                                        <p class="text-sm text-gray-500">${Utils.formatTime(new Date(order.timestamp))}</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                                        <p class="text-sm text-gray-600 mt-1">${getOrderAge(order.timestamp)}</p>
                                    </div>
                                </div>

                                <!-- Order Items -->
                                <div class="space-y-3 mb-6">
                                    <h4 class="font-semibold text-gray-700 border-b pb-2">Items a preparar:</h4>
                                    ${order.items.map(item => `
                                        <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                                            <div class="flex items-center space-x-3">
                                                <span class="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                                                    ${item.quantity}
                                                </span>
                                                <span class="font-medium text-gray-800">${item.name}</span>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-sm text-gray-600">S/ ${item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Order Notes -->
                                ${order.notes ? `
                                    <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <h5 class="font-semibold text-yellow-800 mb-1">Notas especiales:</h5>
                                        <p class="text-sm text-yellow-700">${order.notes}</p>
                                    </div>
                                ` : ''}

                                <!-- Action Buttons -->
                                <div class="flex space-x-2">
                                    ${order.status === 'new' ? `
                                        <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium" 
                                                onclick="KitchenModule.startPreparation(${order.id})">
                                            <i class="fas fa-play mr-2"></i>Iniciar Preparación
                                        </button>
                                    ` : ''}
                                    
                                    ${order.status === 'prep' ? `
                                        <button class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium" 
                                                onclick="KitchenModule.markReady(${order.id})">
                                            <i class="fas fa-check mr-2"></i>Marcar como Listo
                                        </button>
                                    ` : ''}
                                    
                                    ${order.status !== 'ready' && order.status !== 'served' && order.status !== 'paid' ? `
                                        <button class="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md" 
                                                onclick="KitchenModule.cancelOrder(${order.id})" title="Cancelar orden">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    ` : ''}
                                </div>

                                <!-- Total -->
                                <div class="mt-4 pt-4 border-t border-gray-200">
                                    <div class="flex justify-between items-center">
                                        <span class="font-semibold text-gray-700">Total:</span>
                                        <span class="text-xl font-bold text-primary">S/ ${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${getKitchenOrders().length === 0 ? `
                    <div class="text-center py-12">
                        <i class="fas fa-utensils text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-500 mb-2">No hay órdenes pendientes</h3>
                        <p class="text-gray-400">Todas las órdenes están completadas</p>
                    </div>
                ` : ''}
            </div>
        `,

        queue: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Estado de la Cola</h2>
                    <div class="text-sm text-gray-500">
                        Tiempo promedio de preparación: <span class="font-bold">15 min</span>
                    </div>
                </div>

                <!-- Queue Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                <i class="fas fa-clock text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Nuevas</h3>
                                <p class="text-2xl font-bold text-blue-600">${getOrdersByStatus('new').length}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-orange-100 text-orange-600">
                                <i class="fas fa-fire text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">En Preparación</h3>
                                <p class="text-2xl font-bold text-orange-600">${getOrdersByStatus('prep').length}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 text-green-600">
                                <i class="fas fa-check-circle text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Listas</h3>
                                <p class="text-2xl font-bold text-green-600">${getOrdersByStatus('ready').length}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                                <i class="fas fa-history text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Tiempo Promedio</h3>
                                <p class="text-2xl font-bold text-purple-600">18min</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Queue Timeline -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800">Línea de Tiempo de Órdenes</h3>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            ${getTimelineOrders().map(order => `
                                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div class="flex-shrink-0">
                                        <div class="w-12 h-12 rounded-full ${getStatusColor(order.status)} flex items-center justify-center">
                                            <span class="text-white font-bold">${order.table}</span>
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <h4 class="font-medium text-gray-800">Mesa ${order.table} - Orden #${order.id}</h4>
                                                <p class="text-sm text-gray-500">${order.items.length} items • ${Utils.formatTime(new Date(order.timestamp))}</p>
                                            </div>
                                            <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                                        </div>
                                        <div class="mt-2">
                                            <div class="bg-gray-200 rounded-full h-2">
                                                <div class="h-2 rounded-full ${getProgressColor(order.status)}" style="width: ${getProgress(order.status)}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm text-gray-500">${getOrderAge(order.timestamp)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    // Helper functions
    function getKitchenOrders() {
        return window.orders.filter(order => 
            order.status !== 'served' && order.status !== 'paid'
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    function getPendingOrdersCount() {
        return window.orders.filter(order => 
            order.status === 'new' || order.status === 'prep'
        ).length;
    }

    function getOrdersByStatus(status) {
        return window.orders.filter(order => order.status === status);
    }

    function getTimelineOrders() {
        return window.orders
            .filter(order => order.status !== 'paid')
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(0, 10);
    }

    function getStatusText(status) {
        const statusMap = {
            'new': 'Nuevo',
            'prep': 'Preparando',
            'ready': 'Listo',
            'served': 'Servido',
            'paid': 'Pagado'
        };
        return statusMap[status] || status;
    }

    function getBorderColor(status) {
        const colorMap = {
            'new': 'border-blue-500',
            'prep': 'border-orange-500',
            'ready': 'border-green-500',
            'served': 'border-purple-500'
        };
        return colorMap[status] || 'border-gray-300';
    }

    function getStatusColor(status) {
        const colorMap = {
            'new': 'bg-blue-500',
            'prep': 'bg-orange-500',
            'ready': 'bg-green-500',
            'served': 'bg-purple-500'
        };
        return colorMap[status] || 'bg-gray-500';
    }

    function getProgressColor(status) {
        const colorMap = {
            'new': 'bg-blue-500',
            'prep': 'bg-orange-500',
            'ready': 'bg-green-500',
            'served': 'bg-purple-500'
        };
        return colorMap[status] || 'bg-gray-500';
    }

    function getProgress(status) {
        const progressMap = {
            'new': 25,
            'prep': 75,
            'ready': 100,
            'served': 100
        };
        return progressMap[status] || 0;
    }

    function getOrderAge(timestamp) {
        const now = new Date();
        const orderTime = new Date(timestamp);
        const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Recién creada';
        if (diffMinutes === 1) return '1 minuto';
        if (diffMinutes < 60) return `${diffMinutes} minutos`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours === 1) return '1 hora';
        return `${diffHours} horas`;
    }

    // Public methods
    return {
        showView: (viewId) => {
            currentView = viewId;
            const container = document.getElementById('content-container');
            if (templates[viewId]) {
                container.innerHTML = templates[viewId]();
                bindEventListeners(viewId);
            } else {
                container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Vista no encontrada</p></div>';
            }
        },

        startPreparation: (orderId) => {
            const order = window.orders.find(o => o.id === orderId);
            if (order && order.status === 'new') {
                order.status = 'prep';
                order.prepStartTime = new Date().toISOString();
                Utils.showNotification('Preparación Iniciada', `Orden ${orderId} - Mesa ${order.table}`, 'success');
                
                // Refresh current view
                if (currentView) {
                    const container = document.getElementById('content-container');
                    container.innerHTML = templates[currentView]();
                    bindEventListeners(currentView);
                }
            }
        },

        markReady: (orderId) => {
            const order = window.orders.find(o => o.id === orderId);
            if (order && order.status === 'prep') {
                order.status = 'ready';
                order.readyTime = new Date().toISOString();
                Utils.showNotification('Orden Lista', `Mesa ${order.table} - Orden lista para servir`, 'success');
                
                // Refresh current view
                if (currentView) {
                    const container = document.getElementById('content-container');
                    container.innerHTML = templates[currentView]();
                    bindEventListeners(currentView);
                }
            }
        },

        cancelOrder: (orderId) => {
            if (confirm('¿Está seguro de cancelar esta orden?')) {
                const orderIndex = window.orders.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    const order = window.orders[orderIndex];
                    window.orders.splice(orderIndex, 1);
                    Utils.showNotification('Orden Cancelada', `Mesa ${order.table} - Orden cancelada`, 'info');
                    
                    // Refresh current view
                    if (currentView) {
                        const container = document.getElementById('content-container');
                        container.innerHTML = templates[currentView]();
                        bindEventListeners(currentView);
                    }
                }
            }
        }
    };

    function bindEventListeners(viewId) {
        // No specific event listeners needed for kitchen views
        // All interactions are handled through onclick attributes
    }
})();