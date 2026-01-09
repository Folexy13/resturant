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
import { WaitlistStatus } from '../entities/Waitlist';

export class CreateWaitlistDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

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
  requestedDate!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Preferred start time must be in HH:MM format',
  })
  preferredStartTime!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Preferred end time must be in HH:MM format',
  })
  preferredEndTime!: string;

  @IsInt()
  @Min(30)
  @Max(240)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequests?: string;
}

export class UpdateWaitlistDto {
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
  requestedDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Preferred start time must be in HH:MM format',
  })
  preferredStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Preferred end time must be in HH:MM format',
  })
  preferredEndTime?: string;

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

export class WaitlistQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date?: string;

  @IsOptional()
  @IsEnum(WaitlistStatus)
  status?: WaitlistStatus;

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

export class WaitlistResponseDto {
  id!: string;
  restaurantId!: string;
  customerName!: string;
  customerPhone!: string;
  customerEmail?: string;
  partySize!: number;
  requestedDate!: string;
  preferredStartTime!: string;
  preferredEndTime!: string;
  durationMinutes!: number;
  status!: WaitlistStatus;
  notificationCount!: number;
  lastNotifiedAt?: Date;
  specialRequests?: string;
  convertedReservationId?: string;
  createdAt!: Date;
  updatedAt!: Date;
}