// Simple test version of waiter module
window.WaiterModule = (() => {
    console.log('WaiterModule loading...');
    
    const templates = {
        tables: () => {
            console.log('Generating simple tables template');
            return `
                <div class="p-6">
                    <h1 class="text-2xl font-bold mb-4">Gestión de Mesas - FUNCIONA!</h1>
                    <p class="text-gray-600">Esta es una versión simple para probar que el módulo funciona.</p>
                    <div class="mt-4 grid grid-cols-3 gap-4">
                        <div class="bg-green-100 p-4 rounded">
                            <h3 class="font-bold">Mesa 1</h3>
                            <p>Disponible</p>
                        </div>
                        <div class="bg-red-100 p-4 rounded">
                            <h3 class="font-bold">Mesa 2</h3>
                            <p>Ocupada</p>
                        </div>
                        <div class="bg-green-100 p-4 rounded">
                            <h3 class="font-bold">Mesa 3</h3>
                            <p>Disponible</p>
                        </div>
                    </div>
                </div>
            `;
        },
        
        menu: () => {
            console.log('Generating simple menu template');
            return `
                <div class="p-6">
                    <h1 class="text-2xl font-bold mb-4">Menú Digital</h1>
                    <p class="text-gray-600">Selecciona items del menú.</p>
                </div>
            `;
        },
        
        orders: () => {
            console.log('Generating simple orders template');
            return `
                <div class="p-6">
                    <h1 class="text-2xl font-bold mb-4">Órdenes</h1>
                    <p class="text-gray-600">Gestión de órdenes.</p>
                </div>
            `;
        }
    };
    
    function showView(viewId) {
        console.log('showView called with:', viewId);
        const container = document.getElementById('content-container');
        console.log('Container found:', !!container);
        
        if (container && templates[viewId]) {
            console.log('Loading template for:', viewId);
            container.innerHTML = templates[viewId]();
            console.log('Template loaded successfully');
        } else {
            console.log('Template not found or container missing');
            if (container) {
                container.innerHTML = `<div class="p-6"><p class="text-red-500">Error: Vista "${viewId}" no encontrada</p></div>`;
            }
        }
    }
    
    console.log('WaiterModule loaded successfully');
    
    return {
        showView
    };
})();
