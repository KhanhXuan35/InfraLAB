# Luồng Mượn Thiết Bị - Borrow Request Flow

## 📁 Cấu trúc thư mục

Thư mục này chứa các controller cho luồng mượn thiết bị từ warehouse về lab.

## 📄 Các file trong thư mục

### 1. `createBorrowRequest.js`
- **Chức năng**: Lab Manager tạo yêu cầu mượn thiết bị
- **API**: `POST /api/request-lab`
- **Input**: `{ device_id, qty, user_id }`
- **Output**: Tạo document mới trong `requestswarehouses` với `status: "WAITING"`

### 2. `listBorrowRequests.js`
- **Chức năng**: School Admin xem danh sách yêu cầu mượn
- **API**: `GET /api/request-lab?status=WAITING`
- **Output**: Danh sách yêu cầu với thông tin device và người tạo

### 3. `approveBorrowRequest.js` ⭐ QUAN TRỌNG
- **Chức năng**: School Admin duyệt yêu cầu mượn
- **API**: `PATCH /api/request-lab/:id/approve`
- **Logic**:
  1. Kiểm tra tồn kho warehouse
  2. Trừ kho warehouse (giảm `available`)
  3. Cộng vào kho lab (tăng `total` và `available`)
  4. Cập nhật trạng thái yêu cầu: `WAITING` → `APPROVED`

### 4. `rejectBorrowRequest.js`
- **Chức năng**: School Admin từ chối yêu cầu mượn
- **API**: `PATCH /api/request-lab/:id/reject`
- **Logic**: Chỉ cập nhật trạng thái yêu cầu: `WAITING` → `REJECTED`

## 🔄 Luồng hoạt động

```
1. Lab Manager → createBorrowRequest.js
   └─> Tạo yêu cầu trong requestswarehouses

2. School Admin → listBorrowRequests.js
   └─> Xem danh sách yêu cầu chờ duyệt

3. School Admin → approveBorrowRequest.js
   └─> Duyệt yêu cầu → Thiết bị chuyển từ warehouse → lab

4. Lab Manager → Xem thiết bị trong kho lab
   └─> inventoryController.js → getLabDevices()
```

## 📊 Database Collections

- **requestswarehouses**: Lưu yêu cầu mượn
- **inventories**: Lưu tồn kho (warehouse và lab)

## 🎯 Khi demo

1. Mở `createBorrowRequest.js` → Lab Manager tạo yêu cầu
2. Mở `listBorrowRequests.js` → School Admin xem danh sách
3. Mở `approveBorrowRequest.js` → School Admin duyệt ⭐
4. Kiểm tra database: `inventories` với `location: "lab"`

