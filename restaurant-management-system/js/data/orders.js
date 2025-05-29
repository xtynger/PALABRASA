const orders = [
    {
        id: 1,
        tableNumber: 5,
        items: [
            { id: 1, name: "Pollo a la Brasa", price: 35.00, quantity: 1 },
            { id: 7, name: "Coca Cola", price: 5.00, quantity: 2 }
        ],
        total: 45.00,
        status: "new",
        timestamp: new Date().toISOString(),
        waiter: "Juan Pérez"
    },
    {
        id: 2,
        tableNumber: 3,
        items: [
            { id: 4, name: "Parrillada Familiar", price: 65.00, quantity: 1 },
            { id: 8, name: "Chicha Morada", price: 6.00, quantity: 1 }
        ],
        total: 71.00,
        status: "preparing",
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        waiter: "María González"
    },
    {
        id: 3,
        tableNumber: 8,
        items: [
            { id: 2, name: "Pollo Broaster", price: 30.00, quantity: 1 },
            { id: 6, name: "Papas Fritas", price: 8.00, quantity: 1 }
        ],
        total: 38.00,
        status: "ready",
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        waiter: "Carlos López"
    }
];

function addOrder(order) {
    order.id = orders.length + 1;
    order.timestamp = new Date().toISOString();
    orders.push(order);
}

function getOrders() {
    return orders;
}

function updateOrderStatus(orderId, status) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
    }
}

function clearOrders() {
    orders.length = 0;
}

// Make functions available globally
window.addOrder = addOrder;
window.getOrders = getOrders;
window.updateOrderStatus = updateOrderStatus;
window.clearOrders = clearOrders;