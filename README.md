# InfraLAB - Hệ Thống Quản Lý Thiết Bị Phòng Lab

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
4. [Luồng Hoạt Động Chính](#luồng-hoạt-động-chính)
5. [Chi Tiết Từng File](#chi-tiết-từng-file)
6. [Cài Đặt và Chạy Dự Án](#cài-đặt-và-chạy-dự-án)
7. [API Endpoints](#api-endpoints)
8. [Các Tính Năng Chính](#các-tính-năng-chính)

---

## 🎯 Tổng Quan Dự Án

**InfraLAB** là hệ thống quản lý thiết bị phòng lab được xây dựng để hỗ trợ quản lý thiết bị, theo dõi tồn kho, và xử lý các yêu cầu sửa chữa trong môi trường giáo dục.

### Công Nghệ Sử Dụng

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Email verification)

**Frontend:**
- React 19
- React Router v7
- Ant Design
- Vite

### Các Vai Trò Người Dùng

1. **Student (Sinh viên)**: Xem danh sách thiết bị, mượn/trả thiết bị
2. **Lab Manager (Giáo viên)**: Quản lý thiết bị trong lab, tạo yêu cầu sửa chữa
3. **School Admin (Quản trị viên trường)**: Quản lý toàn bộ hệ thống, duyệt yêu cầu, quản lý kho

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │  HTTP   │   Backend       │  ODM    │   MongoDB       │
│   (React)       │◄───────►│   (Express)     │◄───────►│   Database      │
│   Port: 5173    │         │   Port: 5000    │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Luồng Dữ Liệu

1. **User Request** → Frontend (React)
2. **API Call** → Backend (Express)
3. **Database Query** → MongoDB (Mongoose)
4. **Response** → Backend → Frontend → User

---

## 📁 Cấu Trúc Thư Mục

```
InfraLAB/
├── infra-lab-backend/          # Backend API Server
│   ├── server.js               # Entry point của backend
│   ├── package.json
│   └── src/
│       ├── app.js              # Cấu hình Express app chính
│       ├── configs/            # Cấu hình (DB, Mail)
│       ├── controllers/        # Business logic
│       ├── models/             # Mongoose schemas
│       ├── routes/             # API routes
│       ├── middlewares/        # Authentication middleware
│       ├── services/           # Service layer (JWT, Auth)
│       └── utils/              # Utilities (Email)
│
└── infra-lab-frontend/         # Frontend React App
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx            # Entry point của frontend
        ├── App.jsx             # Root component & routing
        ├── components/          # Reusable components
        ├── pages/              # Page components
        ├── contexts/           # React contexts
        ├── services/           # API services
        └── constants/          # Constants (routes)
```

---

## 🔄 Luồng Hoạt Động Chính

### 1. Luồng Xác Thực (Authentication Flow)

```
User → Login Page → API /api/auth/login
  ↓
Backend: authService.loginService()
  ↓
Verify Password → Generate JWT Tokens
  ↓
Return: { accessToken, refreshToken, user }
  ↓
Frontend: Save to localStorage
  ↓
Redirect to Dashboard (based on role)
```

### 2. Luồng Quản Lý Thiết Bị (Device Management Flow)

```
School Admin → School Dashboard
  ↓
Click "Quản lý thiết bị" → Navigate to /school/dashboard
  ↓
SchoolDashboard Component
  ↓
Load Data: GET /api/device-categories, GET /api/devices
  ↓
Display devices in table
  ↓
Filter by category → filteredDevices useMemo
  ↓
User Actions:
  - Add Device → POST /api/devices
  - Edit Device → PUT /api/devices/:id
  - Delete Device → DELETE /api/devices/:id
```

### 3. Luồng Duyệt Yêu Cầu Sửa Chữa (Repair Request Flow)

```
Lab Manager → Create Repair Request
  ↓
POST /api/repairs { device_id, reason, quantity }
  ↓
Backend: Check duplicate → Create Repair
  ↓
School Admin → View Requests (/requests)
  ↓
GET /api/repairs?status=pending
  ↓
Approve/Reject → PATCH /api/repairs/:id/status
  ↓
Update status: pending → approved/rejected
```

---

## 📄 Chi Tiết Từng File

### 🔵 Backend Files

#### **server.js** (Entry Point)
```javascript
// Vai trò: Khởi động server và kết nối database
// Luồng:
// 1. Load environment variables
// 2. Import app từ src/app.js
// 3. Kết nối MongoDB
// 4. Start Express server trên port 5000
```

**Chức năng:**
- Load biến môi trường từ `.env`
- Kết nối MongoDB thông qua `connectDB()`
- Khởi động Express server
- Xử lý lỗi khi khởi động

---

#### **src/app.js** (Express Application Configuration)
```javascript
// Vai trò: Cấu hình Express app, middleware, và routes
// Luồng:
// 1. Import các routes
// 2. Cấu hình CORS (cho phép frontend gọi API)
// 3. Setup middleware (JSON parser, cookie parser, morgan)
// 4. Đăng ký các routes
// 5. Error handling middleware
```

**Các phần chính:**
- **CORS Configuration**: Cho phép frontend (localhost:5173) gọi API
- **Middleware Stack**: 
  - `express.json()`: Parse JSON body
  - `express.urlencoded()`: Parse form data
  - `cookieParser()`: Đọc/ghi cookies
  - `morgan("dev")`: Log HTTP requests
- **Routes Registration**: Đăng ký tất cả API endpoints
- **Error Handling**: Xử lý 404 và lỗi server

**Routes được đăng ký:**
- `/api` → General routes (auth, devices, categories)
- `/api/inventory` → Lab Manager inventory routes
- `/api/categories` → Category management
- `/api/device-detail` → Device detail
- `/api/dashboard` → Lab Manager dashboard
- `/api/school-dashboard` → School dashboard
- `/api/user-dashboard` → User dashboard
- `/api/inventories` → School inventory management
- `/api/device-categories` → School device categories
- `/api/devices` → School device management
- `/api/repairs` → Repair request management

---

#### **src/configs/db.js** (Database Connection)
```javascript
// Vai trò: Kết nối đến MongoDB
// Luồng:
// 1. Lấy connection string từ environment
// 2. Kết nối với Mongoose
// 3. Log thông tin kết nối
// 4. List tất cả collections
```

**Chức năng:**
- Kết nối MongoDB sử dụng Mongoose
- Xử lý lỗi kết nối
- Hiển thị thông tin database và collections

---

#### **src/models/User.js** (User Model)
```javascript
// Vai trò: Định nghĩa schema cho User
// Các trường:
// - username, email, password (required)
// - name, gender, date_of_birth, address
// - role: student | lab_manager | school_admin
// - isActive: tài khoản đã được admin duyệt chưa
// - verified: email đã được xác thực chưa
// - emailToken: token để verify email
// - refreshToken: JWT refresh token
```

**Quan hệ:**
- Không có quan hệ trực tiếp với models khác
- Được tham chiếu trong các models khác (BorrowLab, RequestsWarehouse, etc.)

---

#### **src/models/Device.js** (Device Model)
```javascript
// Vai trò: Định nghĩa schema cho Device
// Các trường:
// - name (required)
// - category_id: ObjectId ref to Category (required)
// - description, image
```

**Quan hệ:**
- `category_id` → References `Category` model
- Được tham chiếu trong `Inventory` model

---

#### **src/models/Inventory.js** (Inventory Model)
```javascript
// Vai trò: Quản lý tồn kho thiết bị
// Các trường:
// - device_id: ObjectId ref to Device (required)
// - location: "warehouse" | "lab" (required)
// - total: tổng số lượng
// - available: số lượng có sẵn
// - broken: số lượng hỏng
```

**Quan hệ:**
- `device_id` → References `Device` model
- Một device có thể có nhiều inventory (warehouse và lab)

---

#### **src/models/Repair.js** (Repair Request Model)
```javascript
// Vai trò: Quản lý yêu cầu sửa chữa
// Các trường:
// - device_id: ObjectId ref to Device (required)
// - reason: lý do hỏng (required)
// - quantity: số lượng
// - status: pending | approved | in_progress | done | rejected
// - reviewed_at: ngày trường duyệt
// - completed_at: ngày sửa xong
```

**Quan hệ:**
- `device_id` → References `Device` model

---

#### **src/services/jwt.js** (JWT Service)
```javascript
// Vai trò: Tạo và verify JWT tokens
// Functions:
// - generateAccessToken(): Tạo access token (15 phút)
// - generateRefreshToken(): Tạo refresh token (7 ngày)
// - verifyRefreshToken(): Verify refresh token
```

**Luồng sử dụng:**
1. User login → Generate accessToken + refreshToken
2. Access token dùng cho mỗi request (trong Authorization header)
3. Khi access token hết hạn → Dùng refresh token để lấy token mới

---

#### **src/services/common/authService.js** (Authentication Service)
```javascript
// Vai trò: Xử lý logic xác thực
// Functions:
// - registerService(): Đăng ký tài khoản mới
// - verifyEmailService(): Xác thực email
// - loginService(): Đăng nhập
// - refreshTokenService(): Làm mới access token
// - logoutService(): Đăng xuất
// - googleLoginService(): Đăng nhập bằng Google
```

**Luồng đăng ký:**
1. Validate input (username, email, password)
2. Check trùng lặp (email, username)
3. Hash password với bcrypt
4. Tạo emailToken để verify
5. Lưu user vào database
6. Gửi email xác thực

**Luồng đăng nhập:**
1. Tìm user theo email/username
2. Verify password
3. Check verified và isActive
4. Generate tokens
5. Lưu refreshToken vào database
6. Return tokens và user info

---

#### **src/middlewares/authMiddleware.js** (Authentication Middleware)
```javascript
// Vai trò: Bảo vệ routes cần authentication
// Functions:
// - checkAuthMiddleware(): Verify JWT token
// - authorize(...roles): Kiểm tra role có quyền truy cập
```

**Luồng hoạt động:**
1. Extract token từ `Authorization: Bearer <token>`
2. Verify token với JWT
3. Tìm user trong database
4. Attach user vào `req.user`
5. Call `next()` để tiếp tục

---

#### **src/controllers/common/authController.js** (Auth Controller)
```javascript
// Vai trò: Xử lý HTTP requests cho authentication
// Endpoints:
// - POST /api/auth/register
// - GET /api/auth/verify-email/:token
// - POST /api/auth/login
// - POST /api/auth/refresh-token
// - POST /api/auth/logout
// - POST /api/auth/google-login
```

**Luồng:**
1. Nhận request từ client
2. Gọi service tương ứng
3. Trả về response với status code phù hợp

---

#### **src/controllers/School/schoolDeviceController.js** (School Device Controller)
```javascript
// Vai trò: Xử lý quản lý thiết bị cho School Admin
// Functions:
// - getInventories(): Lấy danh sách inventory từ warehouse
// - getDeviceCategories(): Lấy categories với devices
// - getDevices(): Lấy devices với category populated
// - createDeviceWithInventory(): Tạo device + inventory
// - updateDeviceWithInventory(): Cập nhật device + inventory
// - deleteDeviceWithInventory(): Xóa device + inventory
```

**Luồng getDevices:**
1. Lấy deviceIds từ Inventory (location = warehouse)
2. Find devices với populate category_id
3. Return devices với category đầy đủ

---

#### **src/controllers/LabManager/repairController.js** (Repair Controller)
```javascript
// Vai trò: Xử lý yêu cầu sửa chữa
// Functions:
// - createRepairRequest(): Tạo yêu cầu sửa chữa
// - getRepairs(): Lấy danh sách yêu cầu (có filter status)
// - updateRepairStatus(): Cập nhật trạng thái (duyệt/từ chối)
```

**Luồng createRepairRequest:**
1. Validate input (device_id, reason)
2. Check device tồn tại
3. Check duplicate (đã có yêu cầu pending/approved/in_progress chưa)
4. Tạo repair request với status = "pending"

**Luồng updateRepairStatus:**
1. Validate status (approved/in_progress/done/rejected)
2. Update repair status
3. Set reviewed_at nếu approved/rejected
4. Set completed_at nếu done

---

#### **src/routes/LabManager/repairRoutes.js** (Repair Routes)
```javascript
// Vai trò: Định nghĩa routes cho repair
// Routes:
// - POST /api/repairs → createRepairRequest
// - GET /api/repairs → getRepairs
// - PATCH /api/repairs/:id/status → updateRepairStatus
```

---

#### **src/routes/device_school/devices.routes.js** (School Device Routes)
```javascript
// Vai trò: Định nghĩa routes cho school device management
// Routes:
// - GET /api/devices → getDevices
// - POST /api/devices → createDeviceWithInventory
// - PUT /api/devices/:id → updateDeviceWithInventory
// - DELETE /api/devices/:id → deleteDeviceWithInventory
```

---

### 🟢 Frontend Files

#### **src/main.jsx** (Frontend Entry Point)
```javascript
// Vai trò: Khởi tạo React app
// Luồng:
// 1. Wrap app với GoogleOAuthProvider
// 2. Render App component vào root
```

---

#### **src/App.jsx** (Root Component & Routing)
```javascript
// Vai trò: Cấu hình routing và layout chính
// Luồng:
// 1. Setup Router (BrowserRouter)
// 2. Định nghĩa tất cả routes
// 3. Bảo vệ routes với PrivateRoute
// 4. ConditionalHeader (hiển thị header tùy route)
```

**Routes được định nghĩa:**
- Public routes: `/login`, `/register`, `/verify-email`
- Student routes: `/user-dashboard`, `/devices`, `/device/:id`, `/borrow/:id`, `/cart`
- Lab Manager routes: `/teacher-dashboard`, `/lab-manager/devices`, `/lab-manager/device/:id`
- School Admin routes: `/school-dashboard`, `/requests`, `/school/dashboard`

**PrivateRoute:**
- Kiểm tra accessToken trong localStorage
- Kiểm tra role có trong allowedRoles
- Redirect về login nếu không hợp lệ

---

#### **src/components/PrivateRoute.jsx** (Route Protection)
```javascript
// Vai trò: Bảo vệ routes cần authentication
// Logic:
// 1. Check accessToken trong localStorage
// 2. Check user role
// 3. Redirect nếu không hợp lệ
// 4. Render Outlet nếu hợp lệ
```

---

#### **src/pages/SchoolAdmin/SchoolAdminHomePage.jsx** (School Admin Dashboard)
```javascript
// Vai trò: Trang dashboard chính cho School Admin
// Components:
// - Sidebar với menu navigation
// - Stats cards (tổng thiết bị, yêu cầu chờ duyệt, etc.)
// - Quick actions (Quản lý thiết bị, Duyệt yêu cầu, etc.)
// - Recent activities
```

**Luồng:**
1. Load user info từ localStorage
2. Fetch dashboard stats (TODO: chưa implement)
3. Render dashboard với Ant Design components
4. Handle navigation khi click menu/quick actions

---

#### **src/SchoolDashboard/SchoolDashboard.jsx** (Device Management Page)
```javascript
// Vai trò: Trang quản lý thiết bị cho School Admin
// Features:
// - Xem danh sách thiết bị
// - Filter theo category
// - Search theo tên
// - Sort (mới nhất/cũ nhất)
// - Add/Edit/Delete device
```

**State Management:**
- `devices`: Danh sách thiết bị
- `categories`: Danh sách categories
- `inventories`: Danh sách inventory
- `selectedCategoryKey`: Category đang filter
- `search`: Từ khóa tìm kiếm
- `sort`: Cách sắp xếp

**Luồng loadData:**
1. Check `activeSection === 'inventory'`
2. Fetch categories và devices từ API
3. Fetch inventories
4. Parse response (handle format `{success, data}` hoặc array)
5. Update state

**Luồng filteredDevices:**
1. Filter theo tên (search)
2. Filter theo category (selectedCategoryKey)
3. Sort theo createdAt
4. Return filtered list

**Luồng handleSubmit:**
1. Validate form data
2. POST (create) hoặc PUT (update)
3. Refresh data sau khi thành công
4. Close modal

---

#### **src/pages/School/RepairRequestList.jsx** (Repair Request List)
```javascript
// Vai trò: Trang duyệt yêu cầu sửa chữa
// Features:
// - Xem danh sách yêu cầu
// - Filter theo status
// - Duyệt/Từ chối yêu cầu
// - Cập nhật trạng thái (bắt đầu sửa, hoàn thành)
```

**Luồng:**
1. Fetch repairs từ API với status filter
2. Display trong table
3. Handle approve/reject → PATCH `/api/repairs/:id/status`
4. Refresh list sau khi update

---

#### **src/constants/routes.js** (Route Constants)
```javascript
// Vai trò: Định nghĩa constants cho routes
// Giúp dễ maintain và tránh hardcode paths
```

---

## 🚀 Cài Đặt và Chạy Dự Án

### Yêu Cầu Hệ Thống
- Node.js >= 18
- MongoDB >= 5.0
- npm hoặc yarn

### Backend Setup

```bash
cd infra-lab-backend

# Cài đặt dependencies
npm install

# Tạo file .env
# MONGODB_URI=mongodb://localhost:27017
# DB_NAME=InfraLab
# ACCESS_TOKEN=your_access_token_secret
# REFRESH_TOKEN=your_refresh_token_secret
# CLIENT_URL=http://localhost:5173
# GOOGLE_CLIENT_ID=your_google_client_id

# Chạy server
npm start
# hoặc
npm run dev  # với nodemon (auto-reload)
```

### Frontend Setup

```bash
cd infra-lab-frontend

# Cài đặt dependencies
npm install

# Tạo file .env
# VITE_API_URL=http://localhost:5000/api

# Chạy development server
npm run dev
```

### Database Setup

1. Đảm bảo MongoDB đang chạy
2. Backend sẽ tự động kết nối khi start
3. Collections sẽ được tạo tự động khi có dữ liệu

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/verify-email/:token` - Xác thực email
- `POST /api/auth/refresh-token` - Làm mới token
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/google-login` - Đăng nhập Google

### Devices (School)
- `GET /api/devices?location=warehouse` - Lấy danh sách devices
- `POST /api/devices` - Tạo device mới
- `PUT /api/devices/:id` - Cập nhật device
- `DELETE /api/devices/:id` - Xóa device

### Device Categories (School)
- `GET /api/device-categories` - Lấy categories với devices

### Inventories (School)
- `GET /api/inventories` - Lấy danh sách inventories

### Repairs
- `POST /api/repairs` - Tạo yêu cầu sửa chữa
- `GET /api/repairs?status=pending` - Lấy danh sách yêu cầu
- `PATCH /api/repairs/:id/status` - Cập nhật trạng thái

### Dashboard
- `GET /api/dashboard/stats` - Lab Manager dashboard stats
- `GET /api/dashboard/activities` - Recent activities
- `GET /api/school-dashboard/stats` - School dashboard stats
- `GET /api/user-dashboard/stats` - User dashboard stats

---

## ✨ Các Tính Năng Chính

### 1. Quản Lý Người Dùng
- Đăng ký với validation
- Xác thực email
- Đăng nhập (local + Google OAuth)
- Phân quyền theo role
- Refresh token mechanism

### 2. Quản Lý Thiết Bị (School Admin)
- Xem danh sách thiết bị
- Thêm/Sửa/Xóa thiết bị
- Quản lý inventory (warehouse/lab)
- Filter theo category
- Search theo tên

### 3. Quản Lý Yêu Cầu Sửa Chữa
- Lab Manager tạo yêu cầu
- School Admin duyệt/từ chối
- Theo dõi trạng thái sửa chữa
- Chặn duplicate requests

### 4. Dashboard
- Thống kê tổng quan
- Recent activities
- Quick actions

---

## 🔒 Bảo Mật

1. **JWT Authentication**: Access token (15 phút) + Refresh token (7 ngày)
2. **Password Hashing**: Bcrypt với salt rounds
3. **CORS**: Chỉ cho phép frontend origin
4. **Input Validation**: Validate ở cả frontend và backend
5. **Role-based Access Control**: Kiểm tra role trước khi truy cập

---

## 📝 Ghi Chú Quan Trọng

1. **Environment Variables**: Cần cấu hình đầy đủ trong file `.env`
2. **CORS**: Backend đã cấu hình cho `http://localhost:5173`
3. **Database**: Cần MongoDB đang chạy trước khi start backend
4. **Email Service**: Cần cấu hình SMTP để gửi email xác thực

---

## 🐛 Troubleshooting

### Lỗi kết nối database
- Kiểm tra MongoDB đang chạy
- Kiểm tra MONGODB_URI trong .env

### Lỗi CORS
- Kiểm tra CLIENT_URL trong backend .env
- Đảm bảo frontend chạy trên port 5173

### Lỗi authentication
- Kiểm tra accessToken trong localStorage
- Kiểm tra token secret trong .env

---

## 📞 Liên Hệ & Hỗ Trợ

Để biết thêm chi tiết về dự án, vui lòng xem code comments trong từng file.

---

**Phiên bản:** 1.0.0  
**Cập nhật lần cuối:** 2024

