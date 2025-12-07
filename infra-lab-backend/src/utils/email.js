import nodemailer from "nodemailer";
import mailConfig from "../configs/mail.config.js";

const transporter = nodemailer.createTransport({
    host: mailConfig.HOST,
    port: mailConfig.PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: mailConfig.USERNAME,
        pass: mailConfig.PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"${mailConfig.FROM_NAME}" <${mailConfig.FROM_ADDRESS}>`,
            to,
            subject,
            text, // bản text thường (cho client không load được html)
            html, // bản html đẹp
        });

        console.log("📧 Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return null;
    }
};