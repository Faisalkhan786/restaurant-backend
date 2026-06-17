const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

const emailService = {
  async sendOTP(to, otp) {
    const mailOptions = {
      from: env.smtp.from,
      to,
      subject: 'Password Reset OTP - Restaurant App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #eee;">
          <h2 style="text-align: center; color: #F97316;">🍽️ Restaurant App</h2>
          <p style="font-size: 16px; color: #333;">You requested a password reset. Use the OTP below to reset your password:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #F97316; background: #FFF7ED; padding: 16px 32px; border-radius: 12px; border: 2px dashed #FDBA74;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #666;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="font-size: 13px; color: #999; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    return transporter.sendMail(mailOptions);
  },
};

module.exports = emailService;
