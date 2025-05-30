// Utility functions for the restaurant management system

// Show notification toast
function showNotification(title, message, type = 'info') {
    const toast = document.getElementById('notification-toast');
    const titleEl = document.getElementById('toast-title');
    const messageEl = document.getElementById('toast-message');
    
    if (!toast || !titleEl || !messageEl) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Update toast color based on type
    toast.className = toast.className.replace(/bg-\w+-\d+/, '');
    switch(type) {
        case 'success':
            toast.classList.add('bg-green-600');
            break;
        case 'error':
            toast.classList.add('bg-red-600');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-600');
            break;
        default:
            toast.classList.add('bg-primary');
    }
    
    toast.classList.remove('hidden', 'translate-x-full');
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Close toast manually
document.addEventListener('DOMContentLoaded', () => {
    const closeToastBtn = document.getElementById('close-toast');
    if (closeToastBtn) {
        closeToastBtn.addEventListener('click', () => {
            const toast = document.getElementById('notification-toast');
            if (toast) {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    toast.classList.add('hidden');
                }, 300);
            }
        });
    }
});

// Helper function to get role display name
function getRoleDisplayName(role) {
    const roles = {
        admin: 'Administrador',
        waiter: 'Mesero',
        kitchen: 'Cocina',
        cashier: 'Caja'
    };
    return roles[role] || role;
}

// Function to format currency
function formatCurrency(amount) {
    return `S/ ${parseFloat(amount).toFixed(2)}`;
}

// Helper function to format time
function formatTime(date) {
    return date.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// Helper function to get time elapsed
function getTimeElapsed(startTime) {
    const now = new Date();
    const start = new Date(startTime);
    const diff = Math.floor((now - start) / (1000 * 60)); // minutes
    return diff;
}

// Function to generate a unique ID
function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}

// Helper function to generate unique ID
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Helper function to debounce function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Helper function to format date
function formatDate(date) {
    return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Function to get current date in a readable format
function getCurrentDate() {
    const date = new Date();
    return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Function to validate email format
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Helper function to capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Update current time display
function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = formatTime(now);
    }
}

// Start time updater
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
});

// Export functions for module use
window.utils = {
    showNotification,
    getRoleDisplayName,
    formatCurrency,
    formatTime,
    getTimeElapsed,
    generateId,
    generateUniqueId,
    debounce,
    formatDate,
    getCurrentDate,
    validateEmail,
    capitalize,
    updateTime
};

// Also expose as Utils for consistency
window.Utils = window.utils;