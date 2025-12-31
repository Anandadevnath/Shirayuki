export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

export const API_CONFIG = {
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
};
