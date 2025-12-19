# Giải Thích Ý Nghĩa Các Biểu Đồ Báo Cáo

## 📊 Tổng Quan

Trang báo cáo hiển thị các biểu đồ khác nhau tùy theo **role** của người dùng:
- **Lab Manager**: Quản lý thiết bị trong Lab và sinh viên
- **School Admin**: Quản lý toàn bộ kho (warehouse) và hệ thống

---

## 🔵 ROLE: LAB_MANAGER

### 1. Thống Kê Tổng Quan (4 Thẻ Số)

#### 📌 Tổng sinh viên
- **Ý nghĩa**: Tổng số sinh viên đã được kích hoạt (`isActive = true`) trong hệ thống
- **Mục đích**: Biết tổng số sinh viên có thể sử dụng hệ thống
- **Ứng dụng**: 
  - Đánh giá quy mô người dùng
  - Lập kế hoạch phân bổ tài nguyên

#### 👥 Sinh viên đang mượn
- **Ý nghĩa**: Số lượng sinh viên hiện đang có thiết bị mượn (status = "borrowed" hoặc "return_pending")
- **Mục đích**: Theo dõi số sinh viên đang sử dụng thiết bị
- **Ứng dụng**:
  - Đánh giá mức độ sử dụng thiết bị
  - Quản lý tài nguyên hiện tại

#### ⚠️ Đơn mượn quá hạn
- **Ý nghĩa**: Số đơn mượn đã vượt quá `return_due_date` nhưng chưa được trả
- **Mục đích**: Phát hiện các đơn mượn cần xử lý ngay
- **Ứng dụng**:
  - Ưu tiên xử lý các đơn quá hạn
  - Đánh giá tuân thủ của sinh viên
  - Cảnh báo sớm để tránh mất mát thiết bị

#### ⏳ Sinh viên chờ duyệt
- **Ý nghĩa**: Số sinh viên mới đăng ký chưa được kích hoạt (`isActive = false`)
- **Mục đích**: Theo dõi số lượng tài khoản cần duyệt
- **Ứng dụng**:
  - Quản lý quy trình duyệt tài khoản
  - Đảm bảo sinh viên mới có thể sử dụng hệ thống kịp thời

---

### 2. Biểu Đồ Tròn - Phân Bổ Trạng Thái Thiết Bị

**Dữ liệu**: Thiết bị trong Lab (`location = "lab"`)

**Các trạng thái**:
- 🟢 **Sẵn sàng** (Available): Thiết bị có thể cho mượn ngay
- 🔵 **Đang mượn** (Borrowed): Thiết bị đang được sinh viên sử dụng
- 🟡 **Đang sửa** (Repairing/Maintenance): Thiết bị đang trong quá trình sửa chữa
- 🔴 **Hỏng** (Broken): Thiết bị không thể sử dụng

**Ý nghĩa**:
- Hiển thị tỷ lệ phân bổ thiết bị theo trạng thái
- Giúp Lab Manager nắm được:
  - Tỷ lệ thiết bị sẵn sàng để cho mượn
  - Tỷ lệ thiết bị đang được sử dụng
  - Tỷ lệ thiết bị cần bảo trì/sửa chữa

**Ứng dụng**:
- Quyết định có cần mua thêm thiết bị không
- Lập kế hoạch bảo trì
- Đánh giá hiệu quả sử dụng thiết bị

---

### 3. Biểu Đồ Tròn - Trạng Thái Yêu Cầu Mượn

**Dữ liệu**: Tất cả yêu cầu mượn trong hệ thống

**Các trạng thái**:
- 🟡 **Chờ duyệt** (Pending): Yêu cầu mới, chưa được xử lý
- 🔵 **Đã duyệt** (Approved): Yêu cầu đã được chấp nhận nhưng chưa mượn
- 🟢 **Đang mượn** (Borrowed): Sinh viên đang sử dụng thiết bị
- 🔷 **Đã trả** (Returned): Đã hoàn trả thiết bị
- 🔴 **Từ chối** (Rejected): Yêu cầu bị từ chối

**Ý nghĩa**:
- Phân tích tỷ lệ các trạng thái yêu cầu mượn
- Đánh giá hiệu quả quy trình duyệt và quản lý

**Ứng dụng**:
- Xác định số lượng yêu cầu cần xử lý
- Đánh giá tỷ lệ chấp nhận/từ chối
- Theo dõi số lượng thiết bị đang được mượn

---

### 4. Biểu Đồ Cột - Yêu Cầu Mượn Theo Tháng

**Dữ liệu**: Số lượng yêu cầu mượn được tạo trong 6 tháng gần nhất

**Ý nghĩa**:
- Hiển thị xu hướng số lượng yêu cầu mượn theo thời gian
- Phát hiện các tháng có nhiều/ít yêu cầu

**Ứng dụng**:
- Dự đoán nhu cầu mượn trong tương lai
- Lập kế hoạch phân bổ thiết bị theo mùa
- Đánh giá tác động của các sự kiện/chính sách mới

**Ví dụ phân tích**:
- Tháng cao điểm → Cần chuẩn bị nhiều thiết bị hơn
- Tháng thấp điểm → Có thể lên kế hoạch bảo trì

---

### 5. Biểu Đồ Đường - Yêu Cầu Sửa Chữa Theo Tháng

**Dữ liệu**: Số lượng yêu cầu sửa chữa được tạo trong 6 tháng gần nhất

**Ý nghĩa**:
- Theo dõi xu hướng số lượng thiết bị hỏng theo thời gian
- Phát hiện các tháng có nhiều thiết bị hỏng

**Ứng dụng**:
- Đánh giá chất lượng thiết bị
- Xác định nguyên nhân gây hỏng (theo mùa, theo loại thiết bị)
- Lập ngân sách sửa chữa
- Quyết định có nên thay thế thiết bị cũ không

**Ví dụ phân tích**:
- Đường tăng dần → Thiết bị đang xuống cấp, cần thay thế
- Đường giảm dần → Chất lượng thiết bị được cải thiện

---

### 6. Biểu Đồ Thanh Ngang - Top 10 Thiết Bị Được Mượn Nhiều Nhất

**Dữ liệu**: Top 10 thiết bị có tổng số lượng mượn cao nhất

**Thông tin hiển thị**:
- Tên thiết bị
- Tổng số lượng đã mượn (quantity)
- Số lần mượn (count)

**Ý nghĩa**:
- Xác định thiết bị nào được sử dụng nhiều nhất
- Đánh giá mức độ phổ biến của từng loại thiết bị

**Ứng dụng**:
- Quyết định mua thêm thiết bị phổ biến
- Ưu tiên bảo trì thiết bị được sử dụng nhiều
- Đánh giá nhu cầu thực tế của sinh viên
- Lập kế hoạch mua sắm thiết bị mới

**Ví dụ phân tích**:
- Arduino được mượn nhiều → Cần mua thêm Arduino
- Thiết bị nào đó không được mượn → Có thể không cần thiết

---

### 7. Biểu Đồ Tròn - Trạng Thái Yêu Cầu Sửa Chữa

**Dữ liệu**: Tất cả yêu cầu sửa chữa trong hệ thống

**Các trạng thái**:
- 🟡 **Chờ duyệt** (Pending): Yêu cầu sửa chữa mới
- 🔵 **Đã duyệt** (Approved): Đã chấp nhận yêu cầu sửa
- 🟣 **Đang sửa** (In Progress): Đang trong quá trình sửa chữa
- 🟢 **Hoàn thành** (Completed): Đã sửa xong
- 🔴 **Từ chối** (Rejected): Yêu cầu bị từ chối

**Ý nghĩa**:
- Phân tích tỷ lệ các trạng thái sửa chữa
- Đánh giá hiệu quả quy trình sửa chữa

**Ứng dụng**:
- Xác định số lượng yêu cầu cần xử lý
- Đánh giá thời gian xử lý sửa chữa
- Theo dõi tỷ lệ hoàn thành

---

## 🟢 ROLE: SCHOOL_ADMIN

### 1. Thống Kê Tổng Quan (4 Thẻ Số)

#### 📦 Tổng thiết bị
- **Ý nghĩa**: Tổng số thiết bị trong kho (warehouse)
- **Dữ liệu**: Tổng của tất cả `Inventory` với `location = "warehouse"`

#### ✅ Thiết bị sẵn sàng
- **Ý nghĩa**: Số thiết bị có thể xuất kho ngay (`available`)
- **Ứng dụng**: Biết số lượng thiết bị có thể phân phối

#### 🔧 Đang sửa chữa
- **Ý nghĩa**: Số thiết bị đang trong quá trình sửa chữa (status = "in_progress", "approved", "pending")
- **Ứng dụng**: Theo dõi thiết bị không thể sử dụng tạm thời

#### ⚠️ Thiết bị hỏng
- **Ý nghĩa**: Số thiết bị hỏng trong kho (`broken`)
- **Ứng dụng**: Đánh giá tổn thất và lập kế hoạch thay thế

---

### 2. Biểu Đồ Tròn - Phân Bổ Trạng Thái Thiết Bị

**Dữ liệu**: Thiết bị trong kho (warehouse)

**Khác biệt với Lab Manager**:
- Lab Manager: Chỉ thiết bị trong Lab
- School Admin: Tất cả thiết bị trong kho (warehouse)

**Ý nghĩa tương tự Lab Manager**, nhưng phạm vi lớn hơn (toàn bộ kho)

---

### 3. Biểu Đồ Tròn - Trạng Thái Yêu Cầu Mượn

**Tương tự Lab Manager** - Hiển thị tỷ lệ các trạng thái yêu cầu mượn

---

### 4. Biểu Đồ Cột - Yêu Cầu Mượn Theo Tháng

**Tương tự Lab Manager** - Xu hướng yêu cầu mượn theo tháng

---

### 5. Biểu Đồ Đường - Yêu Cầu Sửa Chữa Theo Tháng

**Tương tự Lab Manager** - Xu hướng yêu cầu sửa chữa theo tháng

---

### 6. Biểu Đồ Thanh Ngang - Top 10 Thiết Bị Được Mượn Nhiều Nhất

**Tương tự Lab Manager** - Top thiết bị phổ biến nhất

---

### 7. Biểu Đồ Thanh - Sử Dụng Thiết Bị Theo Danh Mục ⭐ (CHỈ CÓ Ở SCHOOL_ADMIN)

**Dữ liệu**: Thiết bị được nhóm theo danh mục (category)

**Thông tin hiển thị**:
- Tên danh mục (ví dụ: "Vi điều khiển", "Laptop & PC", "Thiết bị đo lường")
- Tổng số thiết bị trong danh mục
- Số thiết bị sẵn sàng
- Số thiết bị hỏng
- Tỷ lệ sử dụng (usageRate = available / total * 100%)

**Ý nghĩa**:
- Phân tích mức độ sử dụng theo từng loại thiết bị
- Xác định danh mục nào được sử dụng nhiều/ít

**Ứng dụng**:
- Quyết định đầu tư vào danh mục nào
- Đánh giá hiệu quả phân bổ ngân sách
- Lập kế hoạch mua sắm theo danh mục
- Xác định danh mục cần ưu tiên bảo trì

**Ví dụ phân tích**:
- "Laptop & PC" có usageRate = 100% → Cần mua thêm
- "Thiết bị đo lường" có usageRate = 0% → Có thể không cần thiết hoặc cần quảng bá

---

### 8. Biểu Đồ Tròn - Trạng Thái Yêu Cầu Sửa Chữa

**Tương tự Lab Manager** - Tỷ lệ các trạng thái sửa chữa

---

## 📈 So Sánh Giữa Hai Role

| Biểu Đồ | Lab Manager | School Admin | Ghi Chú |
|---------|-------------|--------------|---------|
| Thống kê tổng quan | Về sinh viên | Về thiết bị | Khác nhau hoàn toàn |
| Phân bổ trạng thái thiết bị | ✅ (Lab) | ✅ (Warehouse) | Phạm vi khác nhau |
| Trạng thái yêu cầu mượn | ✅ | ✅ | Giống nhau |
| Yêu cầu mượn theo tháng | ✅ | ✅ | Giống nhau |
| Yêu cầu sửa chữa theo tháng | ✅ | ✅ | Giống nhau |
| Top thiết bị mượn nhiều nhất | ✅ | ✅ | Giống nhau |
| **Sử dụng theo danh mục** | ❌ | ✅ | **Chỉ School Admin có** |
| Trạng thái sửa chữa | ✅ | ✅ | Giống nhau |

---

## 🎯 Tóm Tắt Ý Nghĩa Tổng Thể

### Lab Manager
**Trọng tâm**: Quản lý **sinh viên** và thiết bị trong **Lab**
- Theo dõi sinh viên: số lượng, trạng thái, vi phạm
- Quản lý thiết bị trong Lab: phân bổ, sử dụng
- Xử lý yêu cầu mượn/trả
- Quản lý sửa chữa

### School Admin
**Trọng tâm**: Quản lý **toàn bộ kho** và **hệ thống**
- Quản lý tổng thể thiết bị trong warehouse
- Phân tích theo danh mục để ra quyết định đầu tư
- Đánh giá hiệu quả sử dụng trên toàn hệ thống
- Lập kế hoạch mua sắm và phân bổ ngân sách

---

## 💡 Cách Sử Dụng Báo Cáo Hiệu Quả

1. **Xem xu hướng**: Sử dụng biểu đồ theo tháng để phát hiện xu hướng
2. **So sánh**: So sánh giữa các tháng để đánh giá thay đổi
3. **Ưu tiên**: Sử dụng "Top 10" và "Quá hạn" để xác định ưu tiên
4. **Ra quyết định**: Dựa vào dữ liệu để quyết định mua sắm, bảo trì, thay thế
5. **Báo cáo**: Sử dụng dữ liệu để báo cáo lên cấp trên

