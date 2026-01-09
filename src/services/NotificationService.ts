import { Reservation } from '../entities/Reservation';
import { Waitlist } from '../entities/Waitlist';
import { EmailService } from './EmailService';
import { RestaurantService } from './RestaurantService';

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'sms';
  recipient: string;
  message: string;
  timestamp: Date;
}

export class NotificationService {
  private emailService: EmailService;
  private restaurantService: RestaurantService;

  constructor() {
    this.emailService = new EmailService();
    this.restaurantService = new RestaurantService();
  }

  async sendReservationConfirmation(reservation: Reservation): Promise<NotificationResult> {
    const message = this.formatReservationConfirmation(reservation);

    // Log to console
    console.log('='.repeat(60));
    console.log('RESERVATION CONFIRMATION');
    console.log('='.repeat(60));
    console.log(`To: ${reservation.customerName}`);
    console.log(`Phone: ${reservation.customerPhone}`);
    if (reservation.customerEmail) {
      console.log(`Email: ${reservation.customerEmail}`);
    }
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    // Send email if customer has email
    if (reservation.customerEmail) {
      try {
        const restaurant = await this.restaurantService.findById(reservation.restaurantId);
        await this.emailService.sendReservationConfirmation(reservation, restaurant.name);
      } catch (error) {
        console.error('Failed to send reservation confirmation email:', error);
      }
    }

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
    console.log('RESERVATION CONFIRMED');
    console.log('='.repeat(60));
    console.log(`To: ${reservation.customerName}`);
    console.log(`Phone: ${reservation.customerPhone}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    // Send email if customer has email
    if (reservation.customerEmail) {
      try {
        const restaurant = await this.restaurantService.findById(reservation.restaurantId);
        await this.emailService.sendReservationStatusUpdate(reservation, restaurant.name);
      } catch (error) {
        console.error('Failed to send confirmation email:', error);
      }
    }

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
    console.log('RESERVATION CANCELLED');
    console.log('='.repeat(60));
    console.log(`To: ${reservation.customerName}`);
    console.log(`Phone: ${reservation.customerPhone}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    // Send email if customer has email
    if (reservation.customerEmail) {
      try {
        const restaurant = await this.restaurantService.findById(reservation.restaurantId);
        await this.emailService.sendReservationStatusUpdate(reservation, restaurant.name);
      } catch (error) {
        console.error('Failed to send cancellation email:', error);
      }
    }

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
    console.log('WAITLIST NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`To: ${waitlist.customerName}`);
    console.log(`Phone: ${waitlist.customerPhone}`);
    console.log('-'.repeat(60));
    console.log(message);
    console.log('='.repeat(60));

    // Send email if customer has email
    if (waitlist.customerEmail) {
      try {
        const restaurant = await this.restaurantService.findById(waitlist.restaurantId);
        await this.emailService.sendWaitlistNotification(
          waitlist,
          restaurant.name,
          `${availableSlot.date} ${availableSlot.startTime} - ${availableSlot.endTime}`
        );
      } catch (error) {
        console.error('Failed to send waitlist notification email:', error);
      }
    }

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
    console.log('RESERVATION REMINDER');
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