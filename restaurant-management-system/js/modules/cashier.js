// Cashier Module - Handles payment processing and order completion

window.CashierModule = (() => {
    let currentView = null;

    // View templates
    const templates = {
        orders: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Órdenes Listas para Pago</h2>
                    <div class="flex items-center space-x-4">
                        <div class="bg-white rounded-lg shadow px-4 py-2">
                            <span class="text-sm text-gray-600">Pendientes de pago:</span>
                            <span class="font-bold text-lg text-secondary ml-2">${getPayableOrders().length}</span>
                        </div>
                        <button class="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-md" onclick="location.reload()">
                            <i class="fas fa-refresh mr-2"></i>Actualizar
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    ${getPayableOrders().map(order => `
                        <div class="bg-white rounded-lg shadow-md border-l-4 border-green-500">
                            <div class="p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-xl font-bold text-gray-800">Mesa ${order.table}</h3>
                                        <p class="text-sm text-gray-500">Orden #${order.id}</p>
                                        <p class="text-sm text-gray-500">${Utils.formatTime(new Date(order.timestamp))}</p>
                                    </div>
                                    <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                                </div>

                                <!-- Order Items -->
                                <div class="space-y-2 mb-6">
                                    <h4 class="font-semibold text-gray-700 border-b pb-2">Items:</h4>
                                    ${order.items.map(item => `
                                        <div class="flex justify-between items-center">
                                            <span class="text-sm">${item.quantity}x ${item.name}</span>
                                            <span class="text-sm font-medium">S/ ${item.subtotal.toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Total and Actions -->
                                <div class="border-t pt-4">
                                    <div class="flex justify-between items-center mb-4">
                                        <span class="text-lg font-bold text-gray-700">Total:</span>
                                        <span class="text-2xl font-bold text-primary">S/ ${order.total.toFixed(2)}</span>
                                    </div>
                                    
                                    <button class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium mb-2" 
                                            onclick="CashierModule.processPayment(${order.id})">
                                        <i class="fas fa-credit-card mr-2"></i>Procesar Pago
                                    </button>
                                    
                                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md" 
                                            onclick="CashierModule.printReceipt(${order.id})">
                                        <i class="fas fa-print mr-2"></i>Imprimir Ticket
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${getPayableOrders().length === 0 ? `
                    <div class="text-center py-12">
                        <i class="fas fa-cash-register text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-500 mb-2">No hay órdenes pendientes de pago</h3>
                        <p class="text-gray-400">Todas las órdenes están completadas o en proceso</p>
                    </div>
                ` : ''}
            </div>
        `,

        payments: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Procesamiento de Pagos</h2>
                    <div class="text-sm text-gray-500">
                        Total del día: <span class="font-bold text-lg text-green-600">S/ ${getDailyTotal()}</span>
                    </div>
                </div>

                <!-- Payment Methods Summary -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 text-green-600">
                                <i class="fas fa-money-bill-wave text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Efectivo</h3>
                                <p class="text-2xl font-bold text-green-600">S/ ${getCashTotal()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                <i class="fas fa-credit-card text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Tarjeta</h3>
                                <p class="text-2xl font-bold text-blue-600">S/ ${getCardTotal()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                                <i class="fas fa-mobile-alt text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Digital</h3>
                                <p class="text-2xl font-bold text-purple-600">S/ ${getDigitalTotal()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Payments -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800">Pagos Recientes</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesa</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${getRecentPayments().map(order => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.id}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.table}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">S/ ${order.total.toFixed(2)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(order.paymentMethod)}">
                                                ${order.paymentMethod || 'Efectivo'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Utils.formatTime(new Date(order.paidAt || order.timestamp))}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="CashierModule.printReceipt(${order.id})">
                                                <i class="fas fa-print"></i>
                                            </button>
                                            <button class="text-green-600 hover:text-green-900" onclick="CashierModule.viewOrderDetails(${order.id})">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `,

        reports: () => `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Reportes de Ventas</h2>
                    <div class="flex space-x-2">
                        <input type="date" id="date-from" class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary">
                        <input type="date" id="date-to" class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary">
                        <button class="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-md">
                            <i class="fas fa-search mr-2"></i>Filtrar
                        </button>
                    </div>
                </div>

                <!-- Daily Summary -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 text-green-600">
                                <i class="fas fa-dollar-sign text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Ventas Hoy</h3>
                                <p class="text-2xl font-bold text-green-600">S/ ${getDailyTotal()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                <i class="fas fa-receipt text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Órdenes</h3>
                                <p class="text-2xl font-bold text-blue-600">${getOrdersToday()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                                <i class="fas fa-chart-line text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Promedio</h3>
                                <p class="text-2xl font-bold text-yellow-600">S/ ${getAverageOrderValue()}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                                <i class="fas fa-users text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Clientes</h3>
                                <p class="text-2xl font-bold text-purple-600">${getCustomersToday()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sales Chart Placeholder -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Ventas por Hora</h3>
                    <div class="h-64 bg-gray-100 rounded flex items-center justify-center">
                        <p class="text-gray-500">Gráfico de ventas por hora (función en desarrollo)</p>
                    </div>
                </div>
            </div>
        `
    };

    // Helper functions
    function getPayableOrders() {
        return window.orders.filter(order => order.status === 'served');
    }

    function getRecentPayments() {
        return window.orders
            .filter(order => order.status === 'paid')
            .sort((a, b) => new Date(b.paidAt || b.timestamp) - new Date(a.paidAt || a.timestamp))
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

    function getDailyTotal() {
        const today = new Date().toDateString();
        return window.orders
            .filter(order => new Date(order.timestamp).toDateString() === today && order.status === 'paid')
            .reduce((total, order) => total + order.total, 0)
            .toFixed(2);
    }

    function getCashTotal() {
        const today = new Date().toDateString();
        return window.orders
            .filter(order => 
                new Date(order.timestamp).toDateString() === today && 
                order.status === 'paid' && 
                order.paymentMethod === 'cash'
            )
            .reduce((total, order) => total + order.total, 0)
            .toFixed(2);
    }

    function getCardTotal() {
        const today = new Date().toDateString();
        return window.orders
            .filter(order => 
                new Date(order.timestamp).toDateString() === today && 
                order.status === 'paid' && 
                order.paymentMethod === 'card'
            )
            .reduce((total, order) => total + order.total, 0)
            .toFixed(2);
    }

    function getDigitalTotal() {
        const today = new Date().toDateString();
        return window.orders
            .filter(order => 
                new Date(order.timestamp).toDateString() === today && 
                order.status === 'paid' && 
                (order.paymentMethod === 'yape' || order.paymentMethod === 'plin')
            )
            .reduce((total, order) => total + order.total, 0)
            .toFixed(2);
    }

    function getOrdersToday() {
        const today = new Date().toDateString();
        return window.orders.filter(order => 
            new Date(order.timestamp).toDateString() === today && order.status === 'paid'
        ).length;
    }

    function getAverageOrderValue() {
        const todayOrders = window.orders.filter(order => {
            const today = new Date().toDateString();
            return new Date(order.timestamp).toDateString() === today && order.status === 'paid';
        });
        
        if (todayOrders.length === 0) return '0.00';
        
        const total = todayOrders.reduce((sum, order) => sum + order.total, 0);
        return (total / todayOrders.length).toFixed(2);
    }

    function getCustomersToday() {
        const today = new Date().toDateString();
        return window.orders.filter(order => 
            new Date(order.timestamp).toDateString() === today && order.status === 'paid'
        ).length; // Assuming one customer per order
    }

    function getPaymentMethodColor(method) {
        const colorMap = {
            'cash': 'bg-green-100 text-green-800',
            'card': 'bg-blue-100 text-blue-800',
            'yape': 'bg-purple-100 text-purple-800',
            'plin': 'bg-purple-100 text-purple-800'
        };
        return colorMap[method] || 'bg-gray-100 text-gray-800';
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

        processPayment: (orderId) => {
            const order = window.orders.find(o => o.id === orderId);
            if (!order || order.status !== 'served') return;

            // Show payment method selection modal
            const paymentMethods = [
                { id: 'cash', name: 'Efectivo', icon: 'fas fa-money-bill-wave' },
                { id: 'card', name: 'Tarjeta', icon: 'fas fa-credit-card' },
                { id: 'yape', name: 'Yape', icon: 'fas fa-mobile-alt' },
                { id: 'plin', name: 'Plin', icon: 'fas fa-mobile-alt' }
            ];

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Método de Pago</h3>
                    <p class="text-gray-600 mb-6">Mesa ${order.table} - Total: S/ ${order.total.toFixed(2)}</p>
                    
                    <div class="space-y-3 mb-6">
                        ${paymentMethods.map(method => `
                            <button class="payment-method-btn w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50" 
                                    data-method="${method.id}">
                                <div class="flex items-center space-x-3">
                                    <i class="${method.icon} text-xl text-primary"></i>
                                    <span class="font-medium">${method.name}</span>
                                </div>
                                <i class="fas fa-chevron-right text-gray-400"></i>
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="flex space-x-3">
                        <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md" onclick="this.closest('.fixed').remove()">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners for payment methods
            modal.querySelectorAll('.payment-method-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const method = btn.dataset.method;
                    order.status = 'paid';
                    order.paymentMethod = method;
                    order.paidAt = new Date().toISOString();
                    
                    modal.remove();
                    Utils.showNotification('Pago Procesado', `Mesa ${order.table} - Pago con ${btn.textContent.trim()}`, 'success');
                    
                    // Refresh current view
                    if (currentView) {
                        const container = document.getElementById('content-container');
                        container.innerHTML = templates[currentView]();
                        bindEventListeners(currentView);
                    }
                });
            });
        },

        printReceipt: (orderId) => {
            const order = window.orders.find(o => o.id === orderId);
            if (!order) return;

            const receiptContent = `
                ===============
                PA' LA BRASA
                ===============
                
                Mesa: ${order.table}
                Orden: #${order.id}
                Fecha: ${Utils.formatTime(new Date(order.timestamp))}
                
                ${order.items.map(item => 
                    `${item.quantity}x ${item.name} - S/ ${item.subtotal.toFixed(2)}`
                ).join('\n')}
                
                ===============
                TOTAL: S/ ${order.total.toFixed(2)}
                Método: ${order.paymentMethod || 'Efectivo'}
                ================
                
                ¡Gracias por su visita!
            `;

            // For demo purposes, show alert. In real implementation, this would interface with a printer
            alert('Ticket enviado a impresora:\n\n' + receiptContent);
            Utils.showNotification('Ticket Impreso', `Ticket de la mesa ${order.table} enviado a impresora`, 'success');
        },

        viewOrderDetails: (orderId) => {
            const order = window.orders.find(o => o.id === orderId);
            if (!order) return;

            Utils.showNotification('Detalles de Orden', `Ver detalles de la orden #${orderId} (función en desarrollo)`, 'info');
        }
    };

    function bindEventListeners(viewId) {
        // No specific event listeners needed for cashier views
        // All interactions are handled through onclick attributes or method calls
    }
})();