import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsUUID,
  IsEmail,
  Matches,
  IsEnum,
} from 'class-validator';
import { ReservationStatus } from '../entities/Reservation';

export class CreateReservationDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @IsOptional()
  @IsUUID()
  tableId?: string; // Optional - system can auto-assign

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  customerPhone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  customerEmail?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  partySize!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  reservationDate!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime!: string;

  @IsInt()
  @Min(30)
  @Max(240)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequests?: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  customerEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  partySize?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  reservationDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(240)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequests?: string;
}

export class CancelReservationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cancellationReason?: string;
}

export class ConfirmReservationDto {
  @IsOptional()
  sendConfirmation?: boolean;
}

export class ReservationQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AvailabilityQueryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  partySize!: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(240)
  durationMinutes?: number;
}

export class ReservationResponseDto {
  id!: string;
  restaurantId!: string;
  tableId!: string;
  customerName!: string;
  customerPhone!: string;
  customerEmail?: string;
  partySize!: number;
  reservationDate!: string;
  startTime!: string;
  endTime!: string;
  durationMinutes!: number;
  status!: ReservationStatus;
  specialRequests?: string;
  confirmationSent!: boolean;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt!: Date;
  updatedAt!: Date;
  table?: {
    id: string;
    tableNumber: number;
    capacity: number;
    location?: string;
  };
}