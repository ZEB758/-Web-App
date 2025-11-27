import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8081', // Replace with your API base URL
});
export default instance;