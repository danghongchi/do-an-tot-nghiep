import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 45000
});

let token = null;
const setToken = (t) => {
  token = t;
  if (t) {
    API.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

API.interceptors.response.use(
  res => res, 
  err => {
    console.error('API Error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// Đảm bảo token được set khi khởi tạo
const savedToken = localStorage.getItem('mc_token');
if (savedToken) {
  setToken(savedToken);
}

export default {
  get: API.get.bind(API),
  post: API.post.bind(API),
  put: API.put.bind(API),
  delete: API.delete.bind(API),
  setToken
};
