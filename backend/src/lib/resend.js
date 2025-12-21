import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY is missing in environment variables");
}

export const resendClient = new Resend(process.env.RESEND_API_KEY);

export const sender = {
  email: process.env.EMAIL_FROM_ADDRESS,
  name: process.env.EMAIL_FROM_NAME,
};
