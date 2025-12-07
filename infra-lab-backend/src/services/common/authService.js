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
            data: { id: user._id, name: user.name, role: user.role, avatar: user.avatar }
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
            data: { id: user._id, name: user.name, role: user.role, avatar: user.avatar }
        };

    } catch (error) {
        return { status: 500, success: false, message: error.message };
    }
};