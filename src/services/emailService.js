const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send email verification OTP
 */
const sendVerificationEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"OptiFit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your OptiFit account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f172a; border-radius: 16px; color: white;">
        <h1 style="color: #38bdf8; text-align: center;">OPTIFIT</h1>
        <h2 style="text-align: center;">Verify Your Email</h2>
        <p style="color: #cbd5e1; text-align: center;">Use the OTP below to verify your email address. It expires in 10 minutes.</p>
        <div style="background: #1e3a8a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <h1 style="color: #38bdf8; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't create an OptiFit account, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send forgot password OTP
 */
const sendPasswordResetEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"OptiFit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your OptiFit password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f172a; border-radius: 16px; color: white;">
        <h1 style="color: #38bdf8; text-align: center;">OPTIFIT</h1>
        <h2 style="text-align: center;">Reset Your Password</h2>
        <p style="color: #cbd5e1; text-align: center;">Use the OTP below to reset your password. It expires in 10 minutes.</p>
        <div style="background: #1e3a8a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <h1 style="color: #f87171; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request a password reset, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
};