import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  private transporter: Transporter | null = null;
  private isReady: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Check if required env vars are present
      const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        console.error('❌ Missing email environment variables:', missing.join(', '));
        console.error('⚠️  Email service will NOT work. Please set these in your .env file');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        debug: process.env.NODE_ENV === 'development', // Enable debug in development
        logger: process.env.NODE_ENV === 'development'  // Enable logging in development
      });

      // Verify connection
      this.verifyConnection();
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
    }
  }

  private async verifyConnection() {
    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return;
    }

    try {
      await this.transporter.verify();
      this.isReady = true;
      console.log('✅ Email service is ready');
      console.log(`   Host: ${process.env.EMAIL_HOST}`);
      console.log(`   Port: ${process.env.EMAIL_PORT}`);
      console.log(`   User: ${process.env.EMAIL_USER}`);
    } catch (error: any) {
      console.error('❌ Email service verification failed:');
      console.error('   Error:', error.message);
      
      // Provide helpful debugging info
      if (error.code === 'EAUTH') {
        console.error('\n   Authentication failed. Common fixes:');
        console.error('   1. For Gmail: Use App Password, not regular password');
        console.error('   2. Enable 2FA on your Google account');
        console.error('   3. Generate App Password at: https://myaccount.google.com/apppasswords');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.error('\n   Connection failed. Check:');
        console.error('   1. EMAIL_HOST is correct');
        console.error('   2. EMAIL_PORT is correct (587 for TLS, 465 for SSL)');
        console.error('   3. Firewall is not blocking connection');
      }
      
      this.isReady = false;
    }
  }

  private async sendEmail(mailOptions: any): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized. Check environment variables.');
    }

    if (!this.isReady) {
      throw new Error('Email service not ready. Check SMTP connection.');
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to}`);
      console.log(`   Message ID: ${info.messageId}`);
      return info;
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${mailOptions.to}`);
      console.error(`   Error: ${error.message}`);
      if (error.code) console.error(`   Code: ${error.code}`);
      if (error.response) console.error(`   Response: ${error.response}`);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    console.log(`📧 Attempting to send welcome email to: ${to}`);
    
    await this.sendEmail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Welcome to Our Platform! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1A5C6C 0%, #0F3D4A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FF8C42; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}! 👋</h2>
              <p>Thank you for registering with us. We're excited to have you on board!</p>
              <p>You can now:</p>
              <ul>
                <li>Browse our products</li>
                <li>Add items to your cart</li>
                <li>Place orders</li>
                <li>Track your orders</li>
              </ul>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <a href="${process.env.FRONTEND_URL || 'https://polycarpe-ecommerce-api.onrender.com/api-docs'}" class="button">Get Started</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  // Send order confirmation email
  async sendOrderConfirmation(
    to: string,
    firstName: string,
    orderId: string,
    orderTotal: number,
    items: any[]
  ): Promise<void> {
    console.log(`📧 Attempting to send order confirmation to: ${to}`);
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.subtotal.toFixed(2)}</td>
      </tr>
    `).join('');

    await this.sendEmail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Order Confirmation - #${orderId} 📦`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1A5C6C 0%, #0F3D4A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            .order-table th { background: #1A5C6C; color: white; padding: 12px; text-align: left; }
            .total { background: #FF8C42; color: white; padding: 15px; font-size: 18px; font-weight: bold; text-align: right; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed! ✅</h1>
              <p>Order #${orderId}</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Thank you for your order. We've received it and will start processing it soon.</p>
              
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div class="total">
                Total: $${orderTotal.toFixed(2)}
              </div>
              
              <p style="margin-top: 20px;">You can track your order status in your account dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  // Send order status update email
  async sendOrderStatusUpdate(
    to: string,
    firstName: string,
    orderId: string,
    newStatus: string
  ): Promise<void> {
    console.log(`📧 Attempting to send status update to: ${to}`);
    
    const statusMessages: { [key: string]: string } = {
      confirmed: 'Your order has been confirmed and is being prepared! 📦',
      shipped: 'Great news! Your order has been shipped! 🚚',
      delivered: 'Your order has been delivered! Enjoy! 🎉',
      cancelled: 'Your order has been cancelled. If you have questions, contact support. ❌'
    };

    const message = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`;

    await this.sendEmail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Order Update - #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1A5C6C 0%, #0F3D4A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; background: #FF8C42; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; text-transform: uppercase; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Status Update</h1>
              <p>Order #${orderId}</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>${message}</p>
              <div class="status-badge">${newStatus}</div>
              <p>You can view your order details in your account dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(to: string, firstName: string, resetToken: string): Promise<void> {
    console.log(`📧 Attempting to send password reset to: ${to}`);
    
    const resetUrl = `${process.env.FRONTEND_URL || 'https://polycarpe-ecommerce-api.onrender.com/api-docs'}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Password Reset Request 🔑',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1A5C6C 0%, #0F3D4A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FF8C42; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  // Get service status
  getStatus(): { ready: boolean; message: string } {
    if (!this.transporter) {
      return { ready: false, message: 'Email service not initialized - check environment variables' };
    }
    if (!this.isReady) {
      return { ready: false, message: 'Email service not ready - SMTP verification failed' };
    }
    return { ready: true, message: 'Email service is operational' };
  }
}

export default new EmailService();