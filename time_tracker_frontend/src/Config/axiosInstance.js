import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // 🔴 FOARTE IMPORTANT
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
