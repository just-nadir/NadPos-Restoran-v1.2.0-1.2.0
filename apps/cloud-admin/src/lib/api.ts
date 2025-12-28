import axios from 'axios';

const api = axios.create({
    baseURL: 'https://halboldi.uz/api', // Proxied via Nginx
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
