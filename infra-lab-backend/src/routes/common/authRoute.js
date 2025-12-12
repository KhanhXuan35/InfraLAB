import express from "express";
import { register, verifyEmail, login, refreshToken, googleLogin, logout, requestPasswordReset, resetPassword } from "../../controllers/common/authController.js";
import { checkAuthMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail); // Frontend gọi API này
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/google-login", googleLogin);

router.post("/logout", checkAuthMiddleware, logout);

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

export default router;