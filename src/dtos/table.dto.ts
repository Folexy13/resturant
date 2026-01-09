import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  tableNumber!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  capacity!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  location?: string;
}

export class UpdateTableDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  tableNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  location?: string;

  @IsOptional()
  isActive?: boolean;
}

export class TableResponseDto {
  id!: string;
  restaurantId!: string;
  tableNumber!: number;
  capacity!: number;
  minCapacity!: number;
  location?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class TableAvailabilityDto {
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

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