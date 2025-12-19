import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Để nhận Cookie từ Backend
    timeout: 10000, // 10 giây timeout
});

// Request interceptor để thêm token vào header
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Xử lý lỗi mạng (không có response từ server)
        if (!error.response) {
            // Kiểm tra các loại lỗi mạng phổ biến
            if (error.code === 'ECONNREFUSED') {
                return Promise.reject({
                    success: false,
                    message: "Không thể kết nối đến máy chủ. Vui lòng đảm bảo backend server đang chạy tại http://localhost:5000"
                });
            }
            if (error.message === 'Network Error' || error.message.includes('Network')) {
                return Promise.reject({
                    success: false,
                    message: "Lỗi kết nối mạng. Vui lòng kiểm tra:\n1. Backend server đã chạy chưa (http://localhost:5000)\n2. CORS đã được cấu hình đúng chưa\n3. Firewall/Antivirus có chặn kết nối không"
                });
            }
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                return Promise.reject({
                    success: false,
                    message: "Kết nối quá thời gian chờ. Vui lòng thử lại sau."
                });
            }
            // Log chi tiết lỗi để debug
            console.error("Axios network error details:", {
                message: error.message,
                code: error.code,
                config: error.config
            });
            return Promise.reject({
                success: false,
                message: error.message || "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau."
            });
        }
        // Xử lý lỗi từ server (có response)
        return Promise.reject(error.response.data || {
            success: false,
            message: error.response.statusText || "Đã xảy ra lỗi không xác định."
        });
    }
);

export default instance;