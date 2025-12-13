import dotenv from "dotenv";
dotenv.config();
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../jwt.js";
import { sendEmail } from "../../utils/email.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 1. Register Service
export const registerService = async (body) => {
    try {
        const { name, email, username, password, role, student_code } = body;

        // 1. Check rỗng
        if (!username || !email || !password || !name) {
            return { status: 400, success: false, message: "Vui lòng nhập đầy đủ thông tin!" };
        }

        // --- VALIDATE USERNAME ---
        // Giải thích Regex:
        // (?=.*[a-zA-Z]): Phải chứa ít nhất 1 chữ cái
        // (?=.*\d): Phải chứa ít nhất 1 số
        // [a-zA-Z0-9]{1,8}: Chỉ chấp nhận chữ và số, độ dài từ 1 đến 8
        const usernameRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{8,15}$/;

        if (!usernameRegex.test(username)) {
            return {
                status: 400,
                success: false,
                message: "Username phải từ 8-15 ký tự, chứa cả chữ và số, không ký tự đặc biệt!"
            };
        }

        // --- VALIDATE FULL NAME ---
        // Giải thích Regex:
        // a-zA-Z: Chữ cái không dấu
        // À-ỹ: Các ký tự tiếng Việt có dấu
        // \s: Khoảng trắng
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;

        if (!nameRegex.test(name)) {
            return {
                status: 400,
                success: false,
                message: "Họ tên chỉ được chứa chữ cái và khoảng trắng (không được có số hay ký tự đặc biệt)!"
            };
        }

        // --- VALIDATE EMAIL ---
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { status: 400, success: false, message: "Email không hợp lệ!" };
        }

        // --- VALIDATE PASSWORD ---
        // Ít nhất 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return {
                status: 400,
                success: false,
                message: "Mật khẩu quá yếu! (Cần 8 ký tự, Hoa, Thường, Số, Ký tự đặc biệt)"
            };
        }

        // 4. Check trùng lặp
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return { status: 400, success: false, message: "Username hoặc Email đã tồn tại!" };
        }

        // ... (Phần tạo token, hash password và lưu vào DB giữ nguyên như cũ) ...
        const emailToken = crypto.randomBytes(32).toString("hex");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            username,
            password: hashedPassword,
            role: role || "student",
            student_code: role === "student" ? student_code : undefined,
            verified: false,
            isActive: false,
            emailToken: emailToken
        });

        // ... (Phần gửi mail giữ nguyên) ...
        const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${emailToken}`;
        const htmlContent = `
            <h3>Xin chào ${newUser.name},</h3>
            <p>Vui lòng xác thực email bằng cách bấm vào link dưới đây:</p>
            <a href="${verifyUrl}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Xác Minh Email</a>
            <p>Sau khi xác minh, tài khoản sẽ chờ Admin duyệt.</p>
        `;

        sendEmail(newUser.email, "Xác thực tài khoản", "Verify Email", htmlContent);

        return { status: 201, success: true, message: "Đăng ký thành công! Vui lòng kiểm tra email." };

    } catch (error) {
        return { status: 500, success: false, message: error.message };
    }
};

// 2. Verify Email Service
export const verifyEmailService = async (token) => {
    try {
        const user = await User.findOne({ emailToken: token });
        if (!user) return { status: 400, success: false, message: "Link không hợp lệ hoặc hết hạn!" };

        user.verified = true;
        user.emailToken = null;
        await user.save();

        return { status: 200, success: true, message: "Xác thực email thành công! Vui lòng chờ Admin duyệt." };
    } catch (error) {
        return { status: 500, success: false, message: error.message };
    }
};

// 3. Login Service
export const loginService = async (body) => {
    try {
        const { login, password } = body;
        const user = await User.findOne({ $or: [{ email: login }, { username: login }] });

        if (!user) return { status: 404, success: false, message: "Tài khoản không tồn tại!" };

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return { status: 400, success: false, message: "Mật khẩu sai!" };

        if (!user.verified) return { status: 403, success: false, message: "Chưa xác thực email!" };
        if (!user.isActive) return { status: 403, success: false, message: "Tài khoản chưa được Admin duyệt!" };

        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user._id });

        user.refreshToken = refreshToken;
        await user.save();

        return {
            status: 200, success: true, message: "Đăng nhập thành công!",
            accessToken, refreshToken,
            data: { 
                _id: user._id,
                id: user._id,
                name: user.name, 
                username: user.username,
                email: user.email,
                role: user.role, 
                avatar: user.avatar,
                gender: user.gender,
                isActive: user.isActive,
                verified: user.verified,
                phone: user.phone,
                department: user.department,
                address: user.address,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        };
    } catch (error) {
        return { status: 500, success: false, message: error.message };
    }
};

// 4. Refresh Token Service
export const refreshTokenService = async (token) => {
    try {
        if (!token) return { status: 401, success: false, message: "Chưa đăng nhập!" };

        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            return { status: 403, success: false, message: "Token không hợp lệ!" };
        }

        const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
        return { status: 200, success: true, accessToken: newAccessToken };
    } catch (error) {
        return { status: 403, success: false, message: "Token hết hạn!" };
    }
};

// 5. Logout Service
export const logoutService = async (userId) => {
    try {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
        return { status: 200, success: true, message: "Đăng xuất thành công!" };
    } catch (error) {
        return { status: 500, success: false, message: error.message };
    }
};

// 6. Google Login Service
export const googleLoginService = async (token) => {
    try {
        // 1. Verify Token với Google
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
        } catch (err) {
            return { status: 400, success: false, message: "Google Token không hợp lệ!" };
        }

        const { email, name, picture } = ticket.getPayload();
        let user = await User.findOne({ email });
        let isNewUser = false;

        // 2. Nếu chưa có user -> Tự động tạo mới
        if (!user) {
            const randomPass = crypto.randomBytes(8).toString("hex");
            const hashedPass = await bcrypt.hash(randomPass, 10);
            const baseUsername = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);

            user = await User.create({
                email,
                name,
                username: baseUsername,
                password: hashedPass,
                role: "student",
                avatar: picture,
                verified: true, // Google login coi như đã xác thực email
                isActive: false // Quan trọng: Mặc định là FALSE để chờ Admin duyệt
            });
            isNewUser = true; // Đánh dấu là người mới
        }

        // --- TRƯỜNG HỢP 1: NGƯỜI MỚI VỪA TẠO ---
        if (isNewUser) {
            return {
                status: 201,
                success: true,
                message: "Tạo tài khoản thành công! Vui lòng chờ Admin phê duyệt để đăng nhập.",
                isNew: true // Cờ hiệu để Frontend nhận biết
            };
        }

        // --- TRƯỜNG HỢP 2: NGƯỜI CŨ NHƯNG CHƯA ĐƯỢC DUYỆT ---
        if (!user.isActive) {
            return {
                status: 403,
                success: false,
                message: "Tài khoản Google này đang chờ Admin duyệt hoặc đã bị khóa!"
            };
        }

        // --- TRƯỜNG HỢP 3: ĐĂNG NHẬP THÀNH CÔNG (Cũ + Active) ---
        const accessToken = generateAccessToken({ id: user._id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user._id });

        user.refreshToken = refreshToken;
        await user.save();

        return {
            status: 200,
            success: true,
            message: "Đăng nhập Google thành công!",
            accessToken,
            refreshToken,
            data: { 
                _id: user._id,
                id: user._id,
                name: user.name, 
                username: user.username,
                email: user.email,
                role: user.role, 
                avatar: user.avatar,
                gender: user.gender,
                isActive: user.isActive,
                verified: user.verified,
                phone: user.phone,
                department: user.department,
                address: user.address,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        };

    } catch (error) {
        return { status: 500, success: false, message: error.message };
    }
};

// 7. REQUEST PASSWORD RESET (Gửi mail) ---
export const requestPasswordResetService = async (email) => {
    // 1. Tìm user theo email
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new Error("Email không tồn tại trong hệ thống InfraLab.");
    }
    if (user.role === "school_admin") {
        throw new Error("Tài khoản School Admin không được phép đặt lại mật khẩu qua email. Vui lòng liên hệ bộ phận kỹ thuật.");
    }
    // 2. Tạo token reset (Hết hạn sau 15 phút)
    const tokenExpiry = "15m";
    const resetToken = jwt.sign(
        { email, id: user._id, type: "reset_password" },
        process.env.ACCESS_TOKEN, // Dùng chung secret hoặc tạo cái mới RESET_PASS_SECRET trong .env
        { expiresIn: tokenExpiry }
    );
    // 3. Tạo Link (Trỏ về Frontend Vite)
    // CLIENT_URL trong .env phải là http://localhost:5173
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    // 4. Nội dung Email
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background-color: #F36F21; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">InfraLab</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #333;">Xin chào <strong>${user.name || "Sinh viên"}</strong>,</p>
                    <p style="color: #555;">Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại hệ thống quản lý phòng Lab.</p>
                    <p style="color: #555;">Vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới (Link hết hạn sau 15 phút):</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #333; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
                    </div>

                    <p style="font-size: 13px; color: #777;">Nếu nút không hoạt động, hãy copy link này: <br> <a href="${resetUrl}">${resetUrl}</a></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                </div>
            </div>
        </div>
    `;
    // 5. Gửi mail
    await sendEmail(email, "Yêu cầu đặt lại mật khẩu - InfraLab", "Reset Password", htmlContent);
    return { message: "Link đặt lại mật khẩu đã được gửi vào email của bạn." };
};
// 8. RESET PASSWORD (Xử lý đổi pass) ---
export const resetPasswordService = async (token, newPassword) => {
    try {
        // 1. Xác thực token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        if (decoded.type !== "reset_password") {
            throw new Error("Token không hợp lệ.");
        }
        // 2. Validate độ mạnh mật khẩu (Regex 8 ký tự, hoa, thường, số, đặc biệt)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
        if (!passwordRegex.test(newPassword)) {
            throw new Error("Mật khẩu phải từ 8-15 ký tự, bao gồm chữ Hoa, Thường, Số và Ký tự đặc biệt.");
        }
        // 3. Tìm user
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            throw new Error("Tài khoản không tồn tại.");
        }
        // 4. Hash mật khẩu mới và lưu
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        return { success: true, message: "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay." };
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("Link đã hết hạn. Vui lòng gửi lại yêu cầu.");
        }
        if (error.name === "JsonWebTokenError") {
            throw new Error("Link không hợp lệ.");
        }
        throw error;
    }
};

// 9. Change Password 
export const changePasswordService = async (userId, oldPassword, newPassword) => {
    // 1. Tìm user trong DB
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("Người dùng không tồn tại.");
    }

    // 2. [QUAN TRỌNG] Chặn School Admin 
    if (user.role === "school_admin") {
        throw new Error("Tài khoản Quản trị viên không được phép tự thay đổi mật khẩu.");
    }

    // 3. Kiểm tra mật khẩu cũ (So khớp với hash trong DB)
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new Error("Mật khẩu cũ không chính xác.");
    }

    // 4. Validate mật khẩu mới (Giống quy tắc lúc đăng ký)
    // - 8-15 ký tự
    // - Ít nhất 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new Error("Mật khẩu mới phải từ 8-15 ký tự, bao gồm chữ Hoa, Thường, Số và Ký tự đặc biệt.");
    }

    // 5. Kiểm tra trùng lặp (Optional: Không cho trùng mật khẩu cũ)
    if (isMatch && oldPassword === newPassword) { // Logic so sánh đơn giản nếu chưa hash, nhưng ở đây oldPassword là plain text, user.pass là hash
        // Cần so sánh newPassword với hash cũ
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ.");
        }
    }

    // 6. Hash mật khẩu mới và Lưu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // 7. Gửi email thông báo
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h2 style="color: #F36F21; text-align: center;">InfraLab Security</h2>
                <p>Xin chào <strong>${user.name}</strong>,</p>
                <p>Mật khẩu tài khoản của bạn vừa được thay đổi thành công.</p>
                <p>Thời gian thay đổi: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
                <p style="color: red;">Nếu bạn không thực hiện hành động này, vui lòng liên hệ ngay với Quản trị viên hoặc phản hồi email này ngay lập tức.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">Trân trọng,<br>InfraLab Team</p>
            </div>
        </div>
    `;

    await sendEmail(user.email, "Cảnh báo bảo mật: Mật khẩu đã thay đổi - InfraLab", "Password Changed", htmlContent);

    return { success: true, message: "Đổi mật khẩu thành công. Email xác nhận đã được gửi." };
};