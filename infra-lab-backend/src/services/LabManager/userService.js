import User from "../../models/User.js";
import { sendEmail } from "../../utils/email.js";

// 1. Lấy danh sách sinh viên đang hoạt động (Active)
export const getActiveStudentsService = async () => {
    // Lấy tất cả user có role student và đã kích hoạt
    const students = await User.find({ role: "student", isActive: true })
        .select("-password -refreshToken -emailToken") // Bỏ thông tin nhạy cảm
        .sort({ createdAt: -1 }); // Mới nhất lên đầu
    return students;
};

// 2. Lấy danh sách sinh viên chờ duyệt (Inactive)
export const getPendingStudentsService = async () => {
    // Lấy tất cả user có role student và CHƯA kích hoạt
    const students = await User.find({ role: "student", isActive: false })
        .select("-password -refreshToken -emailToken")
        .sort({ createdAt: -1 });
    return students;
};

// 3. Xem chi tiết sinh viên
export const getStudentDetailService = async (userId) => {
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new Error("Không tìm thấy sinh viên này.");
    }
    return user;
};

// 4. CẬP NHẬT THÔNG TIN SINH VIÊN (Đã vá lỗi bảo mật)
export const updateStudentService = async (userId, data) => {
    // Lấy data đầu vào
    const { name, username, email, gender, date_of_birth, address, phone, student_code } = data;

    // BƯỚC 1: Kiểm tra User có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("Không tìm thấy người dùng này.");
    }

    // 🔥 [BẢO MẬT] CHECK ROLE: Chỉ cho phép sửa tài khoản Student
    // Nếu ID gửi lên là của Admin hay Manager khác -> Chặn ngay lập tức!
    if (user.role !== "student") {
        throw new Error("Bạn chỉ có quyền cập nhật thông tin của Sinh viên!");
    }

    // BƯỚC 2: Validate các trường DUY NHẤT (Unique)

    // 2.1 Check Email trùng (Trừ chính mình ra)
    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email: email, _id: { $ne: userId } });
        if (emailExists) throw new Error("Email này đã được sử dụng bởi người khác.");
    }

    // 2.2 Check Username trùng
    if (username && username !== user.username) {
        const usernameExists = await User.findOne({ username: username, _id: { $ne: userId } });
        if (usernameExists) throw new Error("Username này đã tồn tại.");
    }

    // 2.3 Check Mã sinh viên trùng
    if (student_code && student_code !== user.student_code) {
        const codeExists = await User.findOne({ student_code: student_code, _id: { $ne: userId } });
        if (codeExists) throw new Error("Mã sinh viên này đã được cấp cho người khác.");
    }

    // BƯỚC 3: Validate Định dạng (Format) - Giữ nguyên như cũ
    if (phone) {
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!phoneRegex.test(phone)) throw new Error("Số điện thoại không hợp lệ.");
    }

    if (gender && !["Male", "Female", "Other"].includes(gender)) {
        throw new Error("Giới tính không hợp lệ.");
    }

    if (date_of_birth) {
        const dob = new Date(date_of_birth);
        const today = new Date();
        if (dob >= today) throw new Error("Ngày sinh phải nhỏ hơn ngày hiện tại.");
    }

    // BƯỚC 4: Thực hiện Update
    // Lưu ý: Chỉ đưa vào các field thông tin cá nhân.
    // TUYỆT ĐỐI KHÔNG update trường 'role' ở đây.
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            name,
            username,
            email,
            gender,
            date_of_birth,
            address,
            phone,
            student_code
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken -emailToken");

    return updatedUser;
};

// 5. Xóa mềm (Sửa thêm Check Role)
export const softDeleteStudentService = async (userId) => {
    const user = await User.findById(userId);

    if (!user) throw new Error("Không tìm thấy người dùng.");

    // 🔥 [BẢO MẬT] Check Role
    if (user.role !== "student") {
        throw new Error("Bạn chỉ có thể xóa tài khoản Sinh viên!");
    }

    // Thực hiện xóa mềm
    user.isActive = false;
    await user.save(); // Dùng save() thay vì findByIdAndUpdate để trigger middleware nếu có

    return { message: "Đã hủy kích hoạt sinh viên. Tài khoản đã chuyển sang danh sách chờ duyệt." };
};

// 6. Duyệt sinh viên (Số lượng lớn) & Gửi mail
export const approveStudentsService = async (userIds) => {
    // userIds là mảng: ["id1", "id2"]

    // 1. Cập nhật trạng thái isActive = true
    await User.updateMany(
        { _id: { $in: userIds } },
        { isActive: true }
    );

    // 2. Lấy danh sách email để gửi thông báo
    const approvedUsers = await User.find({ _id: { $in: userIds } }).select("email name");

    // 3. Gửi email (Chạy song song, không cần await để tránh block request)
    approvedUsers.forEach((user) => {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #F36F21;">InfraLab - Thông báo</h2>
                <p>Xin chào <strong>${user.name}</strong>,</p>
                <p>Tài khoản sinh viên của bạn đã được <strong>Quản lý phòng Lab phê duyệt</strong>.</p>
                <p>Bây giờ bạn có thể đăng nhập vào hệ thống để đăng ký thiết bị và sử dụng phòng Lab.</p>
                <div style="margin: 20px 0;">
                    <a href="${process.env.CLIENT_URL}/login" style="background-color: #333; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Đăng nhập ngay</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #777;">Nếu bạn có thắc mắc, vui lòng liên hệ quản trị viên.</p>
            </div>
        `;
        sendEmail(user.email, "Tài khoản của bạn đã được phê duyệt - InfraLab", "Account Approved", htmlContent);
    });

    return {
        message: `Đã duyệt thành công ${userIds.length} sinh viên.`
    };
};