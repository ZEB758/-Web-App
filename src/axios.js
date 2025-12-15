import axios from 'axios';
const instance = axios.create({
    baseURL: 'http://localhost:8081',
});

// Add a request interceptor
instance.interceptors.request.use(
    (config) => {
        // Check if token exists in localStorage
        const token = localStorage.getItem("token");
        
        // If token exists, attach it to the Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;