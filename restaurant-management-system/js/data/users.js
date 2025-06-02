const users = [
    {
        id: 1,
        username: "admin",
        password: "admin123",
        role: "admin",
        name: "Administrador Principal",
        permissions: ["manage_users", "view_reports", "manage_settings"]
    },
    {
        id: 2,
        username: "cashier",
        password: "cashier123",
        role: "cashier",
        name: "Cajero Principal",
        permissions: ["process_orders", "handle_payments"]
    },
    {
        id: 3,
        username: "kitchen",
        password: "kitchen123",
        role: "kitchen",
        name: "Chef Principal",
        permissions: ["view_orders", "update_order_status"]
    },
    {
        id: 4,
        username: "waiter",
        password: "waiter123",
        role: "waiter",
        name: "Mesero Principal",
        permissions: ["view_menu", "add_orders"]
    }
];

// Make users available globally
window.users = users;