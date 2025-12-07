import * as AuthService from "../../services/common/authService.js";

export const register = async (req, res) => {
    const result = await AuthService.registerService(req.body);
    return res.status(result.status).json(result);
};

export const verifyEmail = async (req, res) => {
    const { token } = req.params;
    const result = await AuthService.verifyEmailService(token);
    return res.status(result.status).json(result); // Trả JSON cho Frontend
};

export const login = async (req, res) => {
    const result = await AuthService.loginService(req.body);
    if (result.refreshToken) {
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    }
    const { refreshToken, ...data } = result;
    return res.status(result.status).json(data);
};

export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    const result = await AuthService.refreshTokenService(token);
    return res.status(result.status).json(result);
};

export const googleLogin = async (req, res) => {
    const result = await AuthService.googleLoginService(req.body.token);
    if (result.refreshToken) {
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    }
    const { refreshToken, ...data } = result;
    return res.status(result.status).json(data);
};

export const logout = async (req, res) => {
    const result = await AuthService.logoutService(req.user._id);
    res.clearCookie("refreshToken");
    return res.status(result.status).json(result);
};