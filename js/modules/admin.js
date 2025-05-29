// This file contains functions and logic specific to the Administrator profile, including user management and static options management.

const adminModule = (() => {
    let users = [
        { id: 1, name: "Juan Pérez", username: "juan.perez", role: "waiter", status: "active" },
        { id: 2, name: "María García", username: "maria.garcia", role: "kitchen", status: "active" },
        { id: 3, name: "Carlos López", username: "carlos.lopez", role: "cashier", status: "active" },
        { id: 4, name: "Ana Martín", username: "ana.martin", role: "admin", status: "active" }
    ];

    let menuItems = [
        { id: 1, name: "Pollo a la Brasa", price: 35, category: "pollos", image: "https://images.unsplash.com/photo-1600804385506-5f2bb3a689b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", status: "active" },
        { id: 2, name: "Pollo Broaster", price: 30, category: "pollos", image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", status: "active" },
        { id: 3, name: "1/2 Pollo a la Brasa", price: 20, category: "pollos", image: "https://images.unsplash.com/photo-1600804385506-5f2bb3a689b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", status: "active" },
        { id: 4, name: "Parrillada Familiar", price: 65, category: "platos", image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", status: "active" },
        { id: 5, name: "Inca Kola 1L", price: 8, category: "bebidas", image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", status: "active" },
        { id: 6, name: "Coca Cola 500ml", price: 5, category: "bebidas", image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", status: "active" }
    ];

    let staticOptions = {
        categories: ['pollos', 'platos', 'bebidas', 'postres'],
        roles: ['admin', 'waiter', 'kitchen', 'cashier'],
        tables: { min: 1, max: 20 },
        businessHours: { open: '10:00', close: '22:00' }
    };

    // Function to add a new user
    const addUser = (user) => {
        const newUser = {
            id: Date.now(),
            ...user,
            status: 'active'
        };
        users.push(newUser);
        console.log('User added:', newUser);
        renderUsersTable();
        showNotification('Éxito', `Usuario ${newUser.name} agregado correctamente`, 'success');
    };

    // Function to remove a user
    const removeUser = (userId) => {
        const index = users.findIndex(user => user.id === userId);
        if (index !== -1) {
            const removedUser = users.splice(index, 1)[0];
            console.log('User removed:', removedUser);
            renderUsersTable();
            showNotification('Éxito', `Usuario ${removedUser.name} eliminado`, 'success');
        } else {
            console.log('User not found');
            showNotification('Error', 'Usuario no encontrado', 'error');
        }
    };

    // Function to update user details
    const updateUser = (userId, updatedInfo) => {
        const user = users.find(user => user.id === userId);
        if (user) {
            Object.assign(user, updatedInfo);
            console.log('User updated:', user);
            renderUsersTable();
            showNotification('Éxito', `Usuario ${user.name} actualizado`, 'success');
        } else {
            console.log('User not found');
            showNotification('Error', 'Usuario no encontrado', 'error');
        }
    };

    // Function to get all users
    const getUsers = () => {
        return users;
    };

    // Function to render users table with styles
    const renderUsersTable = () => {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3">${user.name}</td>
                <td class="px-4 py-3">${user.username}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        ${getRoleDisplayName(user.role)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="adminModule.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800" onclick="adminModule.confirmDeleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    };

    // Function to add menu item
    const addMenuItem = (item) => {
        const newItem = {
            id: Date.now(),
            ...item,
            status: 'active'
        };
        menuItems.push(newItem);
        console.log('Menu item added:', newItem);
        renderMenuItems();
        showNotification('Éxito', `Producto ${newItem.name} agregado correctamente`, 'success');
    };

    // Function to remove menu item
    const removeMenuItem = (itemId) => {
        const index = menuItems.findIndex(item => item.id === itemId);
        if (index !== -1) {
            const removedItem = menuItems.splice(index, 1)[0];
            console.log('Menu item removed:', removedItem);
            renderMenuItems();
            showNotification('Éxito', `Producto ${removedItem.name} eliminado`, 'success');
        } else {
            showNotification('Error', 'Producto no encontrado', 'error');
        }
    };

    // Function to update menu item
    const updateMenuItem = (itemId, updatedInfo) => {
        const item = menuItems.find(item => item.id === itemId);
        if (item) {
            Object.assign(item, updatedInfo);
            console.log('Menu item updated:', item);
            renderMenuItems();
            showNotification('Éxito', `Producto ${item.name} actualizado`, 'success');
        } else {
            showNotification('Error', 'Producto no encontrado', 'error');
        }
    };

    // Function to render menu items with styles
    const renderMenuItems = (filterCategory = 'all') => {
        const grid = document.getElementById('menu-items-grid');
        if (!grid) return;

        grid.innerHTML = '';
        
        const filteredItems = filterCategory === 'all' ? menuItems : menuItems.filter(item => item.category === filterCategory);
        
        filteredItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow';
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="w-full h-32 object-cover">
                <div class="p-4">
                    <h4 class="font-bold text-gray-800">${item.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">Categoría: ${item.category}</p>
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-primary">S/ ${item.price.toFixed(2)}</span>
                        <div class="flex space-x-2">
                            <button class="text-blue-600 hover:text-blue-800" onclick="adminModule.editMenuItem(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="text-red-600 hover:text-red-800" onclick="adminModule.confirmDeleteMenuItem(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    };

    // Function to manage static options (like menu categories, roles, etc.)
    const manageStaticOptions = (optionType, newOptions) => {
        if (staticOptions[optionType]) {
            staticOptions[optionType] = newOptions;
            console.log('Static options updated:', optionType, newOptions);
            showNotification('Éxito', `Configuración ${optionType} actualizada`, 'success');
        } else {
            console.log('Option type not found:', optionType);
            showNotification('Error', 'Tipo de configuración no encontrado', 'error');
        }
    };

    // Function to show user edit modal
    const editUser = (userId) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            showUserModal(user);
        }
    };

    // Function to show menu item edit modal
    const editMenuItem = (itemId) => {
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
            showMenuItemModal(item);
        }
    };

    // Function to confirm user deletion
    const confirmDeleteUser = (userId) => {
        const user = users.find(u => u.id === userId);
        if (user && confirm(`¿Estás seguro de eliminar al usuario ${user.name}?`)) {
            removeUser(userId);
        }
    };

    // Function to confirm menu item deletion
    const confirmDeleteMenuItem = (itemId) => {
        const item = menuItems.find(i => i.id === itemId);
        if (item && confirm(`¿Estás seguro de eliminar el producto ${item.name}?`)) {
            removeMenuItem(itemId);
        }
    };

    // Function to show user modal
    const showUserModal = (user = null) => {
        const isEdit = user !== null;
        const modalHTML = `
            <div id="user-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                        <button id="close-modal" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="user-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input type="text" id="user-name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" value="${user ? user.name : ''}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Usuario</label>
                            <input type="text" id="user-username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" value="${user ? user.username : ''}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Rol</label>
                            <select id="user-role" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required>
                                <option value="waiter" ${user && user.role === 'waiter' ? 'selected' : ''}>Mesero</option>
                                <option value="kitchen" ${user && user.role === 'kitchen' ? 'selected' : ''}>Cocina</option>
                                <option value="cashier" ${user && user.role === 'cashier' ? 'selected' : ''}>Caja</option>
                                <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                        ${!isEdit ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input type="password" id="user-password" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required>
                        </div>
                        ` : ''}
                        <div class="flex justify-end space-x-2 pt-4">
                            <button type="button" id="cancel-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md">
                                Cancelar
                            </button>
                            <button type="submit" class="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-md">
                                ${isEdit ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Event listeners
        document.getElementById('close-modal').addEventListener('click', closeModal);
        document.getElementById('cancel-btn').addEventListener('click', closeModal);
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('user-name').value,
                username: document.getElementById('user-username').value,
                role: document.getElementById('user-role').value
            };

            if (!isEdit) {
                formData.password = document.getElementById('user-password').value;
            }

            if (isEdit) {
                updateUser(user.id, formData);
            } else {
                addUser(formData);
            }
            closeModal();
        });
    };

    // Function to show menu item modal
    const showMenuItemModal = (item = null) => {
        const isEdit = item !== null;
        const modalHTML = `
            <div id="menu-item-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <button id="close-modal" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="menu-item-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                            <input type="text" id="item-name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" value="${item ? item.name : ''}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Precio</label>
                            <input type="number" step="0.01" id="item-price" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" value="${item ? item.price : ''}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Categoría</label>
                            <select id="item-category" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required>
                                <option value="pollos" ${item && item.category === 'pollos' ? 'selected' : ''}>Pollos</option>
                                <option value="platos" ${item && item.category === 'platos' ? 'selected' : ''}>Platos</option>
                                <option value="bebidas" ${item && item.category === 'bebidas' ? 'selected' : ''}>Bebidas</option>
                                <option value="postres" ${item && item.category === 'postres' ? 'selected' : ''}>Postres</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">URL de Imagen</label>
                            <input type="url" id="item-image" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" value="${item ? item.image : ''}" required>
                        </div>
                        <div class="flex justify-end space-x-2 pt-4">
                            <button type="button" id="cancel-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md">
                                Cancelar
                            </button>
                            <button type="submit" class="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-md">
                                ${isEdit ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Event listeners
        document.getElementById('close-modal').addEventListener('click', closeModal);
        document.getElementById('cancel-btn').addEventListener('click', closeModal);
        document.getElementById('menu-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('item-name').value,
                price: parseFloat(document.getElementById('item-price').value),
                category: document.getElementById('item-category').value,
                image: document.getElementById('item-image').value
            };

            if (isEdit) {
                updateMenuItem(item.id, formData);
            } else {
                addMenuItem(formData);
            }
            closeModal();
        });
    };

    // Function to close modal
    const closeModal = () => {
        const modals = document.querySelectorAll('#user-modal, #menu-item-modal');
        modals.forEach(modal => modal.remove());
    };

    // Helper function to get role display name
    const getRoleDisplayName = (role) => {
        const roles = {
            admin: 'Administrador',
            waiter: 'Mesero',
            kitchen: 'Cocina',
            cashier: 'Caja'
        };
        return roles[role] || role;
    };

    // Function to initialize admin module
    const init = () => {
        console.log('Admin module initialized');
        
        // Setup event listeners for admin buttons
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => showUserModal());
        }

        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => showMenuItemModal());
        }

        // Setup menu category filter buttons
        const categoryBtns = document.querySelectorAll('.menu-category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active button
                categoryBtns.forEach(b => {
                    b.classList.remove('active', 'bg-primary', 'text-white');
                    b.classList.add('bg-gray-200', 'text-gray-800');
                });
                btn.classList.add('active', 'bg-primary', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-800');

                // Filter menu items
                const category = btn.dataset.category;
                renderMenuItems(category);
            });
        });

        // Initial render
        renderUsersTable();
        renderMenuItems();
    };

    return {
        addUser,
        removeUser,
        updateUser,
        getUsers,
        addMenuItem,
        removeMenuItem,
        updateMenuItem,
        renderMenuItems,
        manageStaticOptions,
        editUser,
        editMenuItem,
        confirmDeleteUser,
        confirmDeleteMenuItem,
        init
    };
})();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof showNotification === 'undefined') {
        // Define showNotification if not available globally
        window.showNotification = (title, message, type = 'info') => {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        };
    }
});