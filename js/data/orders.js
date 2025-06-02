// Orders data management with localStorage persistence
const STORAGE_KEY = 'restaurant_orders';
const TABLES_KEY = 'restaurant_tables';

// Initialize table management
function initializeTables() {
    const tables = [];
    for (let i = 1; i <= 12; i++) {
        tables.push({
            id: i,
            status: 'available', // available, occupied, cleaning
            currentOrderId: null,
            waiter: null,
            lastUsed: null,
            lastCleaned: new Date(),
            cleanedBy: null,
            cleaningAttempts: 0,
            cleaningComments: []
        });
    }
    return tables;
}

// Load/save tables
function loadTables() {
    try {
        const stored = localStorage.getItem(TABLES_KEY);
        return stored ? JSON.parse(stored) : initializeTables();
    } catch (error) {
        console.error('Error loading tables:', error);
        return initializeTables();
    }
}

function saveTables(tables) {
    try {
        localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    } catch (error) {
        console.error('Error saving tables:', error);
    }
}

let tables = loadTables();

// Load orders from localStorage or start with empty array
function loadOrders() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const orders = JSON.parse(stored);
            // Convert date strings back to Date objects
            return orders.map(order => ({
                ...order,
                timestamp: new Date(order.timestamp),
                startTime: order.startTime ? new Date(order.startTime) : null,
                endTime: order.endTime ? new Date(order.endTime) : null
            }));
        }
    } catch (error) {
        console.error('Error loading orders from localStorage:', error);
    }
    // Start with empty orders array for clean system
    return [];
}

// Save orders to localStorage
function saveOrders(orders) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error('Error saving orders to localStorage:', error);
    }
}

// Initialize orders
let orders = loadOrders();

function addOrder(order) {
    order.id = Date.now(); // Use timestamp as unique ID
    order.timestamp = new Date();
    order.startTime = null;
    order.endTime = null;
    order.preparationTime = 0;
    orders.push(order);
    saveOrders(orders);
    
    // Update table status
    const table = tables.find(t => t.id === order.table);
    if (table) {
        table.status = 'occupied';
        table.currentOrderId = order.id;
        table.waiter = order.waiter;
        saveTables(tables);
    }
    
    // Trigger custom event for real-time updates
    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: orders }));
    window.dispatchEvent(new CustomEvent('tablesUpdated', { detail: tables }));
}

function getOrders() {
    return orders;
}

function updateOrderStatus(orderId, status, additionalData = {}) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        
        // Update timing based on status
        if (status === 'preparing' && !order.startTime) {
            order.startTime = new Date();
        } else if (status === 'ready' && order.startTime && !order.endTime) {
            order.endTime = new Date();
            order.preparationTime = Math.floor((order.endTime - order.startTime) / 1000); // in seconds
        } else if (status === 'completed' || status === 'cancelled') {
            // Free up the table when order is completed or cancelled
            const table = tables.find(t => t.currentOrderId === orderId);
            if (table) {
                table.status = 'available';
                table.currentOrderId = null;
                table.waiter = null;
                saveTables(tables);
                window.dispatchEvent(new CustomEvent('tablesUpdated', { detail: tables }));
            }
        }
        
        // Merge any additional data
        Object.assign(order, additionalData);
        
        saveOrders(orders);
        
        // Update table status based on order status
        updateTableStatusForOrder(order);
        
        // Trigger events for immediate real-time updates
        window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: orders }));
        window.dispatchEvent(new CustomEvent('orderStatusChanged', { 
            detail: { orderId: order.id, status: order.status, order: order }
        }));
        
        console.log(`Order ${orderId} status updated to ${status}`);
    }
}

// Helper function to update table status based on order status
function updateTableStatusForOrder(order) {
    const table = tables.find(t => t.id === order.table);
    if (table) {
        if (order.status === 'completed') {
            // When order is completed, table needs cleaning
            table.status = 'cleaning';
            table.currentOrderId = null;
            table.waiter = null;
            table.lastUsed = new Date();
            table.cleaningAttempts = table.cleaningAttempts || 0;
        } else if (order.status === 'cancelled') {
            // If cancelled, make table available immediately
            table.status = 'available';
            table.currentOrderId = null;
            table.waiter = null;
        } else {
            table.status = 'occupied';
            table.currentOrderId = order.id;
            table.waiter = order.waiter;
        }
        saveTables(tables);
        window.dispatchEvent(new CustomEvent('tablesUpdated', { detail: tables }));
    }
}

function getActiveOrders() {
    return orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status));
}

function getOrderHistory() {
    return orders.filter(order => ['completed', 'cancelled'].includes(order.status));
}

function clearOrders() {
    orders = [];
    saveOrders(orders);
    // Reset all tables
    tables = initializeTables();
    saveTables(tables);
    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: orders }));
    window.dispatchEvent(new CustomEvent('tablesUpdated', { detail: tables }));
}

// Table management functions
function getTables() {
    return tables;
}

function updateTableStatus(tableId, status, waiter = null) {
    const table = tables.find(t => t.id === tableId);
    if (table) {
        table.status = status;
        if (waiter) table.waiter = waiter;
        saveTables(tables);
        window.dispatchEvent(new CustomEvent('tablesUpdated', { detail: tables }));
    }
}

function getAvailableTables() {
    return tables.filter(t => t.status === 'available');
}

function getOccupiedTables() {
    return tables.filter(t => t.status === 'occupied');
}

function getTablesNeedingCleaning() {
    return tables.filter(t => t.status === 'cleaning');
}

function markTableCleaned(tableId, cleanedBy = null) {
    const table = tables.find(t => t.id === tableId);
    if (table && table.status === 'cleaning') {
        table.status = 'available';
        table.lastCleaned = new Date();
        table.cleanedBy = cleanedBy;
        table.cleaningAttempts = 0;
        saveTables(tables);
        window.dispatchEvent(new CustomEvent('tablesUpdated', { detail: tables }));
        return true;
    }
    return false;
}

function recordCleaningAttempt(tableId, comment = null) {
    const table = tables.find(t => t.id === tableId);
    if (table && table.status === 'cleaning') {
        table.cleaningAttempts = (table.cleaningAttempts || 0) + 1;
        table.lastCleaningAttempt = new Date();
        if (comment) {
            table.cleaningComments = table.cleaningComments || [];
            table.cleaningComments.push({
                timestamp: new Date(),
                comment: comment
            });
        }
        saveTables(tables);
        window.dispatchEvent(new CustomEvent('tablesUpdated', { detail: tables }));
        return table.cleaningAttempts;
    }
    return 0;
}

// Make functions available globally
window.addOrder = addOrder;
window.getOrders = getOrders;
window.updateOrderStatus = updateOrderStatus;
window.getActiveOrders = getActiveOrders;
window.getOrderHistory = getOrderHistory;
window.clearOrders = clearOrders;
window.getTables = getTables;
window.updateTableStatus = updateTableStatus;
window.getAvailableTables = getAvailableTables;
window.getOccupiedTables = getOccupiedTables;
window.getTablesNeedingCleaning = getTablesNeedingCleaning;
window.markTableCleaned = markTableCleaned;
window.recordCleaningAttempt = recordCleaningAttempt;

// Initialize ordersData for compatibility
window.ordersData = orders;