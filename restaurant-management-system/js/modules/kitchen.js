// Kitchen Module - Advanced order management with timers and status tracking
window.KitchenModule = (() => {
    console.log('KitchenModule loading...');
    
    let currentView = 'orders';
    let timers = {};
    
    // Initialize module
    function init() {
        // Listen for order updates
        window.addEventListener('ordersUpdated', (event) => {
            if (currentView === 'orders' || currentView === 'history') {
                showView(currentView);
            }
        });
        
        // Start timer updates every second
        setInterval(updateTimers, 1000);
    }
      // Templates
    const templates = {
        orders: () => `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-800">Cocina - Órdenes Activas</h1>
                    <div class="flex items-center space-x-4">
                        <div class="bg-yellow-100 px-4 py-2 rounded-lg">
                            <span class="text-yellow-800 font-medium">
                                <i class="fas fa-clock mr-2"></i>
                                Pendientes: ${getPendingCount()}
                            </span>
                        </div>
                        <div class="bg-blue-100 px-4 py-2 rounded-lg">
                            <span class="text-blue-800 font-medium">
                                <i class="fas fa-fire mr-2"></i>
                                Preparando: ${getPreparingCount()}
                            </span>
                        </div>
                        <div class="bg-green-100 px-4 py-2 rounded-lg">
                            <span class="text-green-800 font-medium">
                                <i class="fas fa-check mr-2"></i>
                                Listos: ${getReadyCount()}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
                    ${generateOrderCards()}
                </div>
            </div>
        `,

        queue: () => `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-800">Cola de Cocina - Vista Priorizada</h1>
                    <div class="flex items-center space-x-4">
                        <div class="bg-red-100 px-4 py-2 rounded-lg">
                            <span class="text-red-800 font-medium">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                Urgente: ${getUrgentCount()}
                            </span>
                        </div>
                        <div class="bg-yellow-100 px-4 py-2 rounded-lg">
                            <span class="text-yellow-800 font-medium">
                                <i class="fas fa-clock mr-2"></i>
                                En Cola: ${getPendingCount()}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-4">
                    ${generateQueueView()}
                </div>
            </div>
        `,
        
        history: () => `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-800">Historial de Órdenes</h1>
                    <div class="bg-gray-100 px-4 py-2 rounded-lg">
                        <span class="text-gray-700 font-medium">
                            <i class="fas fa-history mr-2"></i>
                            Total completadas: ${getCompletedCount()}
                        </span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
                    ${generateHistoryCards()}
                </div>
            </div>
        `
    };
    
    // Helper functions
    function getPendingCount() {
        return window.getActiveOrders ? window.getActiveOrders().filter(o => o.status === 'pending').length : 0;
    }
    
    function getPreparingCount() {
        return window.getActiveOrders ? window.getActiveOrders().filter(o => o.status === 'preparing').length : 0;
    }
    
    function getReadyCount() {
        return window.getActiveOrders ? window.getActiveOrders().filter(o => o.status === 'ready').length : 0;
    }
      function getCompletedCount() {
        return window.getOrderHistory ? window.getOrderHistory().length : 0;
    }

    function getUrgentCount() {
        if (!window.getActiveOrders) return 0;
        const now = new Date();
        return window.getActiveOrders().filter(order => {
            const waitTime = Math.floor((now - new Date(order.timestamp)) / 60000); // minutes
            return order.status === 'pending' && waitTime > 15; // More than 15 minutes waiting
        }).length;
    }

    function generateQueueView() {
        const activeOrders = window.getActiveOrders ? window.getActiveOrders() : [];
        
        if (activeOrders.length === 0) {
            return '<div class="text-center text-gray-500 py-8">No hay órdenes en cola</div>';
        }

        // Sort orders by priority (urgent first, then by timestamp)
        const sortedOrders = activeOrders.sort((a, b) => {
            const now = new Date();
            const aWaitTime = Math.floor((now - new Date(a.timestamp)) / 60000);
            const bWaitTime = Math.floor((now - new Date(b.timestamp)) / 60000);
            
            // Urgent orders first
            const aUrgent = a.status === 'pending' && aWaitTime > 15;
            const bUrgent = b.status === 'pending' && bWaitTime > 15;
            
            if (aUrgent && !bUrgent) return -1;
            if (!aUrgent && bUrgent) return 1;
            
            // Then by timestamp (oldest first)
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        return sortedOrders.map(order => {
            const now = new Date();
            const waitTime = Math.floor((now - new Date(order.timestamp)) / 60000);
            const isUrgent = order.status === 'pending' && waitTime > 15;
            
            return `
                <div class="bg-white border-l-4 ${isUrgent ? 'border-red-500' : getQueueBorderColor(order.status)} rounded-lg shadow-sm p-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-gray-800">Mesa ${order.table}</div>
                                <div class="text-sm text-gray-600">Orden #${order.id}</div>
                            </div>
                            
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-2">
                                    <span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(order.status)}">
                                        ${getStatusText(order.status)}
                                    </span>
                                    ${isUrgent ? '<span class="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"><i class="fas fa-exclamation-triangle mr-1"></i>URGENTE</span>' : ''}
                                </div>
                                
                                <div class="text-sm text-gray-700">
                                    <strong>Items:</strong> ${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                                </div>
                                
                                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                    <span><i class="fas fa-user mr-1"></i>${order.waiter}</span>
                                    <span><i class="fas fa-clock mr-1"></i>${formatTime(order.timestamp)}</span>
                                    <span><i class="fas fa-dollar-sign mr-1"></i>S/ ${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex flex-col items-center space-y-2">
                            <div class="text-center">
                                <div class="text-lg font-mono font-bold ${isUrgent ? 'text-red-600' : getTimerColor(order.status)}" id="timer-${order.id}">
                                    ${getOrderTimer(order)}
                                </div>
                                <div class="text-xs text-gray-500">
                                    ${waitTime} min esperando
                                </div>
                            </div>
                            
                            <div class="flex space-x-2">
                                ${generateQueueActionButtons(order)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function getQueueBorderColor(status) {
        switch (status) {
            case 'pending': return 'border-yellow-400';
            case 'preparing': return 'border-blue-400';
            case 'ready': return 'border-green-400';
            default: return 'border-gray-300';
        }
    }

    function generateQueueActionButtons(order) {
        switch (order.status) {
            case 'pending':
                return `
                    <button onclick="KitchenModule.startOrder(${order.id})" 
                            class="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-600">
                        <i class="fas fa-play mr-1"></i>Iniciar
                    </button>
                `;
            case 'preparing':
                return `
                    <button onclick="KitchenModule.finishOrder(${order.id})" 
                            class="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600">
                        <i class="fas fa-check mr-1"></i>Listo
                    </button>
                    <button onclick="KitchenModule.cancelOrder(${order.id})" 
                            class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            case 'ready':
                return `
                    <div class="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                        <i class="fas fa-check-circle mr-1"></i>Listo
                    </div>
                `;
            default:
                return '';
        }
    }
    
    function generateOrderCards() {
        const activeOrders = window.getActiveOrders ? window.getActiveOrders() : [];
        
        if (activeOrders.length === 0) {
            return '<div class="col-span-full text-center text-gray-500 py-8">No hay órdenes activas</div>';
        }
        
        return activeOrders.map(order => `
            <div class="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow" 
                 style="width: 240px; height: 320px;">
                
                <!-- Header -->
                <div class="p-4 border-b ${getHeaderBorderColor(order.status)}">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-lg">Mesa ${order.table}</h3>
                        <span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                    <div class="flex justify-between items-center text-sm text-gray-600">
                        <span>Orden #${order.id}</span>
                        <span>${formatTime(order.timestamp)}</span>
                    </div>
                    
                    <!-- Timer -->
                    <div class="mt-2 text-center">
                        <div class="text-lg font-mono font-bold ${getTimerColor(order.status)}" id="timer-${order.id}">
                            ${getOrderTimer(order)}
                        </div>
                        <div class="text-xs text-gray-500">
                            ${order.status === 'pending' ? 'Tiempo de espera' : order.status === 'preparing' ? 'Tiempo de preparación' : 'Tiempo total'}
                        </div>
                    </div>
                </div>
                
                <!-- Items -->
                <div class="p-4" style="height: 140px; overflow-y: auto;">
                    <h4 class="font-semibold text-sm text-gray-700 mb-2">Items:</h4>
                    <div class="space-y-1">
                        ${order.items.map(item => `
                            <div class="flex justify-between text-sm">
                                <span>${item.name}</span>
                                <span class="font-medium">x${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="p-4 border-t">
                    <div class="flex justify-between items-center mb-3">
                        <span class="font-bold">S/ ${order.total.toFixed(2)}</span>
                        <span class="text-sm text-gray-600">${order.waiter}</span>
                    </div>
                    ${generateActionButtons(order)}
                </div>
            </div>
        `).join('');
    }
    
    function generateHistoryCards() {
        const historyOrders = window.getOrderHistory ? window.getOrderHistory() : [];
        
        if (historyOrders.length === 0) {
            return '<div class="col-span-full text-center text-gray-500 py-8">No hay órdenes en el historial</div>';
        }
        
        return historyOrders.map(order => `
            <div class="bg-white border rounded-lg shadow-sm" style="width: 240px; height: 280px;">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold text-lg">Mesa ${order.table}</h3>
                        <span class="px-2 py-1 rounded text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${order.status === 'completed' ? 'Entregado' : 'Cancelado'}
                        </span>
                    </div>
                    <div class="text-sm text-gray-600">
                        <div>Orden #${order.id}</div>
                        <div>${formatTime(order.timestamp)}</div>
                        ${order.preparationTime > 0 ? `<div class="font-medium text-blue-600">Tiempo: ${formatDuration(order.preparationTime)}</div>` : ''}
                    </div>
                </div>
                
                <div class="p-4" style="height: 120px; overflow-y: auto;">
                    <h4 class="font-semibold text-sm text-gray-700 mb-2">Items:</h4>
                    <div class="space-y-1">
                        ${order.items.map(item => `
                            <div class="flex justify-between text-sm">
                                <span>${item.name}</span>
                                <span class="font-medium">x${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="p-4 border-t">
                    <div class="flex justify-between items-center">
                        <span class="font-bold">S/ ${order.total.toFixed(2)}</span>
                        <span class="text-sm text-gray-600">${order.waiter}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    function generateActionButtons(order) {
        switch (order.status) {
            case 'pending':
                return `
                    <button onclick="KitchenModule.startOrder(${order.id})" 
                            class="w-full bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600">
                        <i class="fas fa-play mr-2"></i>Iniciar Preparación
                    </button>
                `;
            case 'preparing':
                return `
                    <div class="space-y-2">
                        <button onclick="KitchenModule.finishOrder(${order.id})" 
                                class="w-full bg-green-500 text-white py-2 rounded font-medium hover:bg-green-600">
                            <i class="fas fa-check mr-2"></i>Marcar Listo
                        </button>
                        <button onclick="KitchenModule.cancelOrder(${order.id})" 
                                class="w-full bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600">
                            <i class="fas fa-times mr-1"></i>Cancelar
                        </button>
                    </div>
                `;
            case 'ready':
                return `
                    <div class="text-center">
                        <div class="bg-green-100 text-green-800 py-2 rounded font-medium mb-2">
                            <i class="fas fa-check-circle mr-2"></i>Listo para entregar
                        </div>
                        <button onclick="KitchenModule.cancelOrder(${order.id})" 
                                class="w-full bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600">
                            <i class="fas fa-times mr-1"></i>Cancelar
                        </button>
                    </div>
                `;
            default:
                return '';
        }
    }
    
    // Status helper functions
    function getHeaderBorderColor(status) {
        switch (status) {
            case 'pending': return 'border-yellow-400';
            case 'preparing': return 'border-blue-400';
            case 'ready': return 'border-green-400';
            default: return 'border-gray-300';
        }
    }
    
    function getStatusBadgeClass(status) {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    function getStatusText(status) {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'preparing': return 'Preparando';
            case 'ready': return 'Listo';
            case 'completed': return 'Entregado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    }
    
    function getTimerColor(status) {
        switch (status) {
            case 'pending': return 'text-yellow-600';
            case 'preparing': return 'text-blue-600';
            case 'ready': return 'text-green-600';
            default: return 'text-gray-600';
        }
    }
    
    // Timer functions
    function getOrderTimer(order) {
        const now = new Date();
        let duration;
        
        if (order.status === 'pending') {
            duration = Math.floor((now - new Date(order.timestamp)) / 1000);
        } else if (order.status === 'preparing' && order.startTime) {
            duration = Math.floor((now - new Date(order.startTime)) / 1000);
        } else if (order.status === 'ready' && order.preparationTime) {
            return formatDuration(order.preparationTime);
        } else {
            duration = 0;
        }
        
        return formatDuration(duration);
    }
    
    function formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    function updateTimers() {
        const activeOrders = window.getActiveOrders ? window.getActiveOrders() : [];
        activeOrders.forEach(order => {
            const timerElement = document.getElementById(`timer-${order.id}`);
            if (timerElement) {
                timerElement.textContent = getOrderTimer(order);
            }
        });
    }
    
    // Action functions
    function startOrder(orderId) {
        window.updateOrderStatus(orderId, 'preparing');
        Utils.showNotification('Orden iniciada', 'La preparación ha comenzado', 'success');
    }
    
    function finishOrder(orderId) {
        window.updateOrderStatus(orderId, 'ready');
        Utils.showNotification('Orden lista', 'La orden está lista para entregar', 'success');
    }
    
    function cancelOrder(orderId) {
        if (confirm('¿Estás seguro de que deseas cancelar esta orden?')) {
            window.updateOrderStatus(orderId, 'cancelled');
            Utils.showNotification('Orden cancelada', 'La orden ha sido cancelada', 'warning');
        }
    }
    
    function showView(viewId) {
        console.log('KitchenModule showView called with:', viewId);
        currentView = viewId;
        const container = document.getElementById('content-container');
        
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
    
    // Initialize on load
    init();
      console.log('KitchenModule loaded successfully');
    
    return {
        showView,
        loadView: showView, // Alias for compatibility with app.js
        startOrder,
        finishOrder,
        cancelOrder
    };
})();
