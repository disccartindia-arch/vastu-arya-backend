/// <reference types="node" />
import nodemailer from 'nodemailer';

const env = (process as any).env;

interface EmailOptions { to: string; subject: string; html: string; }

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Vastu Arya" <${env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    (console as any).error('Email send error:', error);
  }
};

export const bookingConfirmationEmail = (name: string, serviceName: string, bookingId: string, amount: number): string => {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#FFF8F0;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#FF6B00,#FF9933);padding:30px;text-align:center;">
<h1 style="color:white;margin:0;">Vastu Arya</h1>
<p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">Booking Confirmed!</p>
</div>
<div style="padding:30px;">
<h2 style="color:#1A0A00;">Namaste ${name}!</h2>
<p style="color:#5C3D1E;">Your booking for <strong>${serviceName}</strong> is confirmed.</p>
<div style="background:#FFF8F0;border-left:4px solid #FF6B00;padding:16px;border-radius:8px;margin:20px 0;">
<p style="margin:4px 0;color:#1A0A00;"><strong>Booking ID:</strong> ${bookingId}</p>
<p style="margin:4px 0;color:#1A0A00;"><strong>Service:</strong> ${serviceName}</p>
<p style="margin:4px 0;color:#1A0A00;"><strong>Amount Paid:</strong> Rs.${amount}</p>
</div>
<p style="color:#5C3D1E;">Dr. PPS will contact you within 24 hours.</p>
</div></div></body></html>`;
};
