export const config = {

    API_BASE_URL: "https://npm-test-3.onrender.com",

    API_VERSION: "1.0.0",

    REQUEST_TIMEOUT: 10000,

    ENABLE_LOGGING: import.meta.env.DEV,

    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
};

export default config;