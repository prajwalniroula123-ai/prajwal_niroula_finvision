import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!, // Gmail App Password
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendOTPEmail(email: string, otpCode: string): Promise<boolean> {
    try {
      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FinVision - Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
              text-align: center;
              margin: 20px 0;
              letter-spacing: 4px;
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 2px dashed #2563eb;
            }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .warning { color: #dc2626; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FinVision</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <h2>Welcome to FinVision!</h2>
              <p>Thank you for registering with FinVision. To complete your account setup, please verify your email address using the verification code below:</p>

              <div class="otp-code">${otpCode}</div>

              <p>This verification code will expire in 15 minutes for security reasons.</p>

              <p>If you didn't request this verification, please ignore this email.</p>

              <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
              </div>
            </div>
            <div class="footer">
              <p>This email was sent by FinVision - AI-Powered Personal Finance Platform</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: {
          name: 'FinVision',
          address: process.env.GMAIL_USER!,
        },
        to: email,
        subject: 'FinVision - Email Verification Code',
        html: htmlTemplate,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
