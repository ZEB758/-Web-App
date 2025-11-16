import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3500/api', // Replace with your API base URL
});
export default instance;