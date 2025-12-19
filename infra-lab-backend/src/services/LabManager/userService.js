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

// 2. Lấy danh sách sinh viên chờ duyệt (Inactive - NEW only)
export const getPendingStudentsService = async () => {
    // Lấy tất cả user có role student, CHƯA kích hoạt VÀ CHƯA bị xóa mềm
    const students = await User.find({ role: "student", isActive: false, isDeleted: false })
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

//4. CẬP NHẬT THÔNG TIN SINH VIÊN
export const updateStudentService = async (userId, data) => {
    const { name, username, email, gender, date_of_birth, address, phone, student_code, isDeleted } = data;

    // 1. Kiểm tra tồn tại & Role
    const user = await User.findById(userId);
    if (!user) throw new Error("Không tìm thấy người dùng này.");
    if (user.role !== "student") throw new Error("Bạn chỉ có quyền cập nhật thông tin của Sinh viên!");

    // 2. Validate Check Trùng (Unique)
    if (email && email !== user.email) {
        const exists = await User.findOne({ email, _id: { $ne: userId } });
        if (exists) throw new Error("Email này đã được sử dụng.");
    }
    if (username && username !== user.username) {
        const exists = await User.findOne({ username, _id: { $ne: userId } });
        if (exists) throw new Error("Username này đã tồn tại.");
    }
    if (student_code && student_code !== user.student_code) {
        const exists = await User.findOne({ student_code, _id: { $ne: userId } });
        if (exists) throw new Error("Mã sinh viên này đã được cấp cho người khác.");
    }

    // 3. VALIDATE FORMAT (PHẦN QUAN TRỌNG MỚI)

    // 3.1 Validate Họ tên: Min 4 ký tự, Chấp nhận Tiếng Việt & Khoảng trắng
    if (name) {
        // Regex hỗ trợ full tiếng Việt có dấu
        const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]{4,}$/;
        if (!nameRegex.test(name)) {
            throw new Error("Họ tên phải từ 4 ký tự trở lên và chỉ chứa chữ cái (Tiếng Việt) hoặc khoảng trắng.");
        }
    }

    // 3.2 Validate Mã sinh viên: Chính xác 8 ký tự, Chữ và Số
    if (student_code) {
        const codeRegex = /^[a-zA-Z0-9]{8}$/;
        if (!codeRegex.test(student_code)) {
            throw new Error("Mã sinh viên phải có đúng 8 ký tự (chữ và số, không dấu).");
        }
    }

    // 3.3 Validate Username (Giống đăng ký): 3-20 ký tự, không dấu, không khoảng trắng
    if (username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            throw new Error("Username phải từ 3-20 ký tự, không dấu, không khoảng trắng.");
        }
    }

    // 3.4 Số điện thoại (VN)
    if (phone) {
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!phoneRegex.test(phone)) throw new Error("Số điện thoại không hợp lệ.");
    }

    // 3.5 Các trường khác
    if (gender && !["Male", "Female", "Other"].includes(gender)) throw new Error("Giới tính không hợp lệ.");
    if (date_of_birth) {
        if (new Date(date_of_birth) >= new Date()) throw new Error("Ngày sinh phải nhỏ hơn ngày hiện tại.");
    }

    // 4. Update - Hỗ trợ cập nhật isDeleted cho khôi phục
    const updateData = { name, username, email, gender, date_of_birth, address, phone, student_code };
    if (isDeleted !== undefined) {
        updateData.isDeleted = isDeleted;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select("-password -refreshToken -emailToken");

    return updatedUser;
};

// 5. Xóa mềm (Đánh dấu sinh viên bị vô hiệu hóa)
export const softDeleteStudentService = async (userId) => {
    const user = await User.findById(userId);

    if (!user) throw new Error("Không tìm thấy người dùng.");

    // 🔥 [BẢO MẬT] Check Role
    if (user.role !== "student") {
        throw new Error("Bạn chỉ có thể xóa tài khoản Sinh viên!");
    }

    // Thực hiện xóa mềm - set isDeleted = true VÀ isActive = false
    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    return { message: "Đã vô hiệu hóa sinh viên. Tài khoản đã chuyển sang danh sách bị vô hiệu hóa." };
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

// 7. Xóa cứng sinh viên (Xóa hoàn toàn khỏi DB)
export const hardDeleteStudentService = async (userId) => {
    const user = await User.findById(userId);

    if (!user) throw new Error("Không tìm thấy sinh viên này.");

    // 🔥 [BẢO MẬT] Check Role
    if (user.role !== "student") {
        throw new Error("Bạn chỉ có thể xóa tài khoản Sinh viên!");
    }

    // Xóa cứng từ database
    await User.findByIdAndDelete(userId);

    return { message: "Đã xóa cứng sinh viên khỏi hệ thống." };
};

// 8. Lấy danh sách sinh viên bị vô hiệu hóa (Deleted)
export const getDeletedStudentsService = async () => {
    // Lấy tất cả user có role student và bị xóa mềm (isDeleted = true)
    const students = await User.find({ role: "student", isDeleted: true })
        .select("-password -refreshToken -emailToken")
        .sort({ createdAt: -1 });
    return students;
};

// 9. Khôi phục sinh viên bị vô hiệu hóa (Restore)
export const restoreStudentService = async (userId) => {
    const user = await User.findById(userId);

    if (!user) throw new Error("Không tìm thấy sinh viên này.");

    // 🔥 [BẢO MẬT] Check Role
    if (user.role !== "student") {
        throw new Error("Bạn chỉ có thể khôi phục tài khoản Sinh viên!");
    }

    // Khôi phục: set isDeleted = false, giữ nguyên isActive = false (quay lại danh sách chờ duyệt)
    user.isDeleted = false;
    await user.save();

    return { message: "Đã khôi phục sinh viên. Tài khoản đã chuyển sang danh sách chờ duyệt." };
};