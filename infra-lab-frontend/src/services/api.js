import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Để nhận Cookie từ Backend
});

instance.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error.response ? error.response.data : error)
);

export default instance;