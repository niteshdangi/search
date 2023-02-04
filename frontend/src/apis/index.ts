import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3100',
});

export default apiClient;
