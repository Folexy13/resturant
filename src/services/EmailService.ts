import nodemailer from 'nodemailer';
import config from '../config';
import { Reservation } from '../entities/Reservation';
import { Waitlist } from '../entities/Waitlist';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean;

  constructor() {
    // Check if SMTP host is configured (MailHog doesn't need auth)
    this.isConfigured = !!(config.email.host && config.email.host !== 'smtp.ethereal.email');

    if (this.isConfigured) {
      const transportOptions: nodemailer.TransportOptions = {
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
      } as nodemailer.TransportOptions;

      // Only add auth if credentials are provided (MailHog doesn't need them)
      if (config.email.user && config.email.password) {
        (transportOptions as any).auth = {
          user: config.email.user,
          pass: config.email.password,
        };
      }

      this.transporter = nodemailer.createTransport(transportOptions);
      console.log(`📧 Email service configured with SMTP host: ${config.email.host}:${config.email.port}`);
    } else {
      // Mock mode - just log emails
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'testpassword',
        },
      });
      console.log('📧 Email service running in mock mode (no SMTP configured)');
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      if (this.isConfigured) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log(`📧 Email sent: ${info.messageId}`);
        return true;
      } else {
        // Log email in development mode
        console.log('============================================================');
        console.log('📧 EMAIL (Mock Mode)');
        console.log('============================================================');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('------------------------------------------------------------');
        console.log(options.text || this.htmlToText(options.html));
        console.log('============================================================');
        return true;
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  async sendReservationConfirmation(reservation: Reservation, restaurantName: string): Promise<boolean> {
    const confirmationNumber = reservation.id.substring(0, 8).toUpperCase();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .confirmation-number { font-size: 24px; font-weight: bold; color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reservation Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${reservation.customerName},</p>
            <p>Thank you for your reservation at <strong>${restaurantName}</strong>!</p>
            
            <div class="details">
              <p><strong>Confirmation Number:</strong> <span class="confirmation-number">${confirmationNumber}</span></p>
              <p><strong>Date:</strong> ${reservation.reservationDate}</p>
              <p><strong>Time:</strong> ${reservation.startTime} - ${reservation.endTime}</p>
              <p><strong>Party Size:</strong> ${reservation.partySize} guests</p>
              <p><strong>Duration:</strong> ${reservation.durationMinutes} minutes</p>
              ${reservation.specialRequests ? `<p><strong>Special Requests:</strong> ${reservation.specialRequests}</p>` : ''}
            </div>
            
            <p>Your reservation is currently <strong>${reservation.status.toUpperCase()}</strong>.</p>
            
            <p>To modify or cancel your reservation, please contact us or use our online system.</p>
            
            <p>We look forward to seeing you!</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: reservation.customerEmail || '',
      subject: `Reservation Confirmation - ${restaurantName} - ${confirmationNumber}`,
      html,
    });
  }

  async sendReservationStatusUpdate(reservation: Reservation, restaurantName: string): Promise<boolean> {
    const confirmationNumber = reservation.id.substring(0, 8).toUpperCase();
    const statusMessages: Record<string, string> = {
      confirmed: 'Your reservation has been confirmed!',
      cancelled: 'Your reservation has been cancelled.',
      seated: 'You have been seated. Enjoy your meal!',
      completed: 'Thank you for dining with us!',
      no_show: 'We missed you! Your reservation was marked as no-show.',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .status { font-size: 18px; font-weight: bold; padding: 10px; border-radius: 5px; text-align: center; margin: 15px 0; }
          .status.confirmed { background-color: #4CAF50; color: white; }
          .status.cancelled { background-color: #f44336; color: white; }
          .status.seated { background-color: #FF9800; color: white; }
          .status.completed { background-color: #9C27B0; color: white; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reservation Update</h1>
          </div>
          <div class="content">
            <p>Dear ${reservation.customerName},</p>
            
            <div class="status ${reservation.status}">
              ${statusMessages[reservation.status] || `Status: ${reservation.status}`}
            </div>
            
            <p><strong>Confirmation Number:</strong> ${confirmationNumber}</p>
            <p><strong>Restaurant:</strong> ${restaurantName}</p>
            <p><strong>Date:</strong> ${reservation.reservationDate}</p>
            <p><strong>Time:</strong> ${reservation.startTime}</p>
            
            ${reservation.cancellationReason ? `<p><strong>Reason:</strong> ${reservation.cancellationReason}</p>` : ''}
            
            <p>If you have any questions, please contact us.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: reservation.customerEmail || '',
      subject: `Reservation ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)} - ${restaurantName}`,
      html,
    });
  }

  async sendWaitlistNotification(waitlist: Waitlist, restaurantName: string, availableSlot?: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .highlight { background-color: #FFF3E0; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #FF9800; }
          .cta { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 A Table is Available!</h1>
          </div>
          <div class="content">
            <p>Dear ${waitlist.customerName},</p>
            
            <p>Great news! A table has become available at <strong>${restaurantName}</strong>!</p>
            
            <div class="highlight">
              <p><strong>Your Waitlist Request:</strong></p>
              <p>Date: ${waitlist.requestedDate}</p>
              <p>Preferred Time: ${waitlist.preferredStartTime} - ${waitlist.preferredEndTime}</p>
              <p>Party Size: ${waitlist.partySize} guests</p>
              ${availableSlot ? `<p><strong>Available Slot:</strong> ${availableSlot}</p>` : ''}
            </div>
            
            <p>Please book your table as soon as possible, as availability is limited!</p>
            
            <p>This offer is valid for a limited time. If we don't hear from you, your spot may be given to the next person on the waitlist.</p>
            
            <p>Contact us to confirm your reservation.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: waitlist.customerEmail || '',
      subject: `Table Available! - ${restaurantName}`,
      html,
    });
  }

  async sendWelcomeEmail(name: string, email: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #673AB7; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .features { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .feature { padding: 10px 0; border-bottom: 1px solid #eee; }
          .feature:last-child { border-bottom: none; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Restaurant!</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            
            <p>Welcome! Your account has been successfully created.</p>
            
            <div class="features">
              <p><strong>With your account, you can:</strong></p>
              <div class="feature">✓ Make and manage reservations easily</div>
              <div class="feature">✓ View your reservation history</div>
              <div class="feature">✓ Join waitlists for busy times</div>
              <div class="feature">✓ Receive personalized notifications</div>
            </div>
            
            <p>Start by making your first reservation today!</p>
            
            <p>If you have any questions, our team is here to help.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Our Restaurant Reservation System!',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .cta { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .warning { background-color: #FFF3E0; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #FF9800; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <p style="text-align: center;">
              <a href="${resetLink}" class="cta">Reset Password</a>
            </p>
            
            <div class="warning">
              <p><strong>⚠️ Important:</strong></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }
}