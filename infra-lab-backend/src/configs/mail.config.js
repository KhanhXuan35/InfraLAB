import dotenv from "dotenv";
dotenv.config();

export default {
  MAILER: process.env.MAIL_MAILER,
  HOST: process.env.MAIL_HOST,
  PORT: process.env.MAIL_PORT,
  SERVICE: process.env.MAIL_SERVICE,
  USERNAME: process.env.MAIL_USERNAME,
  PASSWORD: process.env.MAIL_PASSWORD,
  ENCRYPTION: process.env.MAIL_ENCRYPTION,
  FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
  FROM_NAME: process.env.MAIL_FROM_NAME,
};