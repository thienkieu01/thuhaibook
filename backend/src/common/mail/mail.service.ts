import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendUserNotificationInput {
  email?: string | null;
  phone?: string | null;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn('Chưa cấu hình đầy đủ SMTP_HOST / SMTP_USER / SMTP_PASS trong .env');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    return this.transporter;
  }

  async sendRealEmail(to: string, subject: string, text: string, html?: string) {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.error(`[MAIL SKIPPED -> ${to}] Thiếu cấu hình SMTP`);
      return { sent: false, channel: 'EMAIL', reason: 'MISSING_SMTP_CONFIG' };
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${text.replace(/\n/g, '<br/>')}</div>`,
    });

    this.logger.log(`[REAL EMAIL SENT -> ${to}] ${subject}`);
    return { sent: true, channel: 'EMAIL' };
  }
  async sendEmailOrSms(params: {
  email?: string | null;
  phone?: string | null;
  subject: string;
  text: string;
  html?: string;
}) {
  const email = params.email?.trim();
  const phone = params.phone?.trim();

  if (email) {
    // Đổi `sendEmail` bên dưới thành tên hàm gửi mail thật có sẵn trong MailService của bạn nếu khác tên
    return this.sendRealEmail(email, params.subject, params.text, params.html);
  }

  if (phone) {
    console.log(`[MOCK SMS -> ${phone}] ${params.subject}: ${params.text}`);
    return { sent: true, channel: 'MOCK_SMS' };
  }

  return { sent: false, channel: 'NONE' };
}

  async notifyUser(input: SendUserNotificationInput) {
    const email = input.email?.trim();
    const phone = input.phone?.trim();

    if (email) {
      return this.sendRealEmail(email, input.subject, input.text, input.html);
    }

    if (phone) {
      // Không có email -> giả lập SMS
      this.logger.log(`[MOCK SMS -> ${phone}] ${input.subject}: ${input.text}`);
      return { sent: true, channel: 'MOCK_SMS' };
    }

    this.logger.warn(`[NOTIFY SKIPPED] Tài khoản không có Email lẫn SĐT`);
    return { sent: false, channel: 'NONE' };
  }
}