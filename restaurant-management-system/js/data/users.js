const users = [
    {
        id: 1,
        username: "admin",
        password: "admin123",
        role: "Administrator",
        permissions: ["manage_users", "view_reports", "manage_settings"]
    },
    {
        id: 2,
        username: "cashier",
        password: "cashier123",
        role: "Cashier",
        permissions: ["process_orders", "handle_payments"]
    },
    {
        id: 3,
        username: "kitchen",
        password: "kitchen123",
        role: "Kitchen",
        permissions: ["view_orders", "update_order_status"]
    },
    {
        id: 4,
        username: "waiter",
        password: "waiter123",
        role: "Waiter",
        permissions: ["view_menu", "add_orders"]
    }
];

// Make users available globally
window.users = users;