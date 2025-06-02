const settings = {
    apiEndpoints: {
        userManagement: '/api/users',
        menuManagement: '/api/menu',
        orderManagement: '/api/orders',
        paymentProcessing: '/api/payments',
    },
    featureFlags: {
        enableUserRoles: true,
        enableOrderTracking: true,
        enableNotifications: false,
    },
    appSettings: {
        appName: "Restaurant Management System",
        version: "1.0.0",
        defaultLanguage: "en",
    },
};

export default settings;