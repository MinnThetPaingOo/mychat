import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to My Chat !",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }

  console.log("Welcome Email sent successfully", data);
};
