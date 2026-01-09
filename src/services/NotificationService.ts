import { Reservation } from '../entities/Reservation';
import { Waitlist } from '../entities/Waitlist';

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'sms';
  recipient: string;
  message: string;
  timestamp: Date;
}

export class NotificationService {
  async sendReservationConfirmation(reservation: Reservation): Promise<NotificationResult> {
    const message = this.formatReservationConfirmation(reservation);

    // Mock email/SMS sending - in production, integrate with actual service
    console.log('='.repeat(60));
    console.log('📧 RESERVATION CONFIRMATION');
    console.log('='.repeat(60));
    console.log(`To: ${reservation.customerName}`);
    console.log(`Phone: ${reservation.customerPhone}`);
    if (reservation.customerEmail) {
      console.log(`Email: ${reservation.customerEmail}`);
    }
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    // Update reservation to mark confirmation as sent
    reservation.confirmationSent = true;

    return {
      success: true,
      method: reservation.customerEmail ? 'email' : 'sms',
      recipient: reservation.customerEmail || reservation.customerPhone,
      message,
      timestamp: new Date(),
    };
  }

  async sendConfirmationNotification(reservation: Reservation): Promise<NotificationResult> {
    const message = `Your reservation at our restaurant has been CONFIRMED!

Reservation Details:
- Date: ${reservation.reservationDate}
- Time: ${reservation.startTime} - ${reservation.endTime}
- Party Size: ${reservation.partySize}
- Confirmation #: ${reservation.id.substring(0, 8).toUpperCase()}

We look forward to seeing you!`;

    console.log('='.repeat(60));
    console.log('✅ RESERVATION CONFIRMED');
    console.log('='.repeat(60));
    console.log(`To: ${reservation.customerName}`);
    console.log(`Phone: ${reservation.customerPhone}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    return {
      success: true,
      method: reservation.customerEmail ? 'email' : 'sms',
      recipient: reservation.customerEmail || reservation.customerPhone,
      message,
      timestamp: new Date(),
    };
  }

  async sendCancellationNotification(reservation: Reservation): Promise<NotificationResult> {
    const message = `Your reservation has been cancelled.

Cancelled Reservation:
- Date: ${reservation.reservationDate}
- Time: ${reservation.startTime}
- Party Size: ${reservation.partySize}
${reservation.cancellationReason ? `- Reason: ${reservation.cancellationReason}` : ''}

We hope to see you again soon!`;

    console.log('='.repeat(60));
    console.log('❌ RESERVATION CANCELLED');
    console.log('='.repeat(60));
    console.log(`To: ${reservation.customerName}`);
    console.log(`Phone: ${reservation.customerPhone}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    return {
      success: true,
      method: reservation.customerEmail ? 'email' : 'sms',
      recipient: reservation.customerEmail || reservation.customerPhone,
      message,
      timestamp: new Date(),
    };
  }

  async sendWaitlistNotification(
    waitlist: Waitlist,
    availableSlot: { date: string; startTime: string; endTime: string }
  ): Promise<NotificationResult> {
    const message = `Great news! A table is now available!

Available Slot:
- Date: ${availableSlot.date}
- Time: ${availableSlot.startTime} - ${availableSlot.endTime}
- Party Size: ${waitlist.partySize}

Please respond within 30 minutes to confirm your reservation.
Reply YES to confirm or NO to decline.`;

    console.log('='.repeat(60));
    console.log('🔔 WAITLIST NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`To: ${waitlist.customerName}`);
    console.log(`Phone: ${waitlist.customerPhone}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    return {
      success: true,
      method: waitlist.customerEmail ? 'email' : 'sms',
      recipient: waitlist.customerEmail || waitlist.customerPhone,
      message,
      timestamp: new Date(),
    };
  }

  async sendReminderNotification(reservation: Reservation): Promise<NotificationResult> {
    const message = `Reminder: You have a reservation tomorrow!

Reservation Details:
- Date: ${reservation.reservationDate}
- Time: ${reservation.startTime}
- Party Size: ${reservation.partySize}
- Confirmation #: ${reservation.id.substring(0, 8).toUpperCase()}

See you soon!`;

    console.log('='.repeat(60));
    console.log('⏰ RESERVATION REMINDER');
    console.log('='.repeat(60));
    console.log(`To: ${reservation.customerName}`);
    console.log(`Phone: ${reservation.customerPhone}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    return {
      success: true,
      method: reservation.customerEmail ? 'email' : 'sms',
      recipient: reservation.customerEmail || reservation.customerPhone,
      message,
      timestamp: new Date(),
    };
  }

  private formatReservationConfirmation(reservation: Reservation): string {
    return `Thank you for your reservation!

Reservation Details:
- Date: ${reservation.reservationDate}
- Time: ${reservation.startTime} - ${reservation.endTime}
- Party Size: ${reservation.partySize}
- Duration: ${reservation.durationMinutes} minutes
- Confirmation #: ${reservation.id.substring(0, 8).toUpperCase()}
${reservation.specialRequests ? `- Special Requests: ${reservation.specialRequests}` : ''}

Your reservation is currently PENDING and will be confirmed shortly.

To modify or cancel your reservation, please contact us.`;
  }
}