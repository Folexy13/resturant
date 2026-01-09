import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant Table Reservation API',
      version: '1.0.0',
      description: `
A comprehensive REST API for managing restaurant table reservations.

## Features
- **Restaurant Management**: Create and manage restaurants with operating hours
- **Table Management**: Add tables with capacity constraints
- **Reservation System**: Full reservation lifecycle management
- **Authentication**: JWT-based authentication with role-based access control
- **Timezone Support**: Full timezone handling for restaurants
- **Recurring Reservations**: Daily, weekly, bi-weekly, and monthly patterns
- **Waitlist**: Automatic waitlist when tables are unavailable
- **Email Notifications**: Confirmation and reminder emails

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

## Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 10 attempts per 15 minutes
- Reservations: 20 per hour
- Search: 60 per minute
      `,
      contact: {
        name: 'API Support',
        email: 'support@restaurant-api.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.restaurant-reservation.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                details: { type: 'object' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '555-1234' },
            role: {
              type: 'string',
              enum: ['customer', 'staff', 'manager', 'admin'],
              example: 'customer',
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8, example: 'securepassword123' },
            phone: { type: 'string', example: '555-1234' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'securepassword123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'integer', example: 900 },
                  },
                },
              },
            },
          },
        },

        // Restaurant schemas
        Restaurant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'The Italian Place' },
            openingTime: { type: 'string', example: '10:00' },
            closingTime: { type: 'string', example: '22:00' },
            timezone: { type: 'string', example: 'America/New_York' },
            totalTables: { type: 'integer', example: 20 },
            address: { type: 'string', example: '123 Main Street' },
            phone: { type: 'string', example: '555-1234' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRestaurantRequest: {
          type: 'object',
          required: ['name', 'openingTime', 'closingTime'],
          properties: {
            name: { type: 'string', example: 'The Italian Place' },
            openingTime: {
              type: 'string',
              pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '10:00',
            },
            closingTime: {
              type: 'string',
              pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '22:00',
            },
            timezone: { type: 'string', example: 'America/New_York' },
            address: { type: 'string', example: '123 Main Street' },
            phone: { type: 'string', example: '555-1234' },
          },
        },

        // Table schemas
        Table: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            restaurantId: { type: 'string', format: 'uuid' },
            tableNumber: { type: 'integer', example: 1 },
            capacity: { type: 'integer', example: 4 },
            minCapacity: { type: 'integer', example: 2 },
            location: { type: 'string', example: 'window' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTableRequest: {
          type: 'object',
          required: ['tableNumber', 'capacity'],
          properties: {
            tableNumber: { type: 'integer', minimum: 1, example: 1 },
            capacity: { type: 'integer', minimum: 1, maximum: 20, example: 4 },
            minCapacity: { type: 'integer', minimum: 1, example: 2 },
            location: { type: 'string', example: 'window' },
          },
        },

        // Reservation schemas
        Reservation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            restaurantId: { type: 'string', format: 'uuid' },
            tableId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            customerName: { type: 'string', example: 'John Doe' },
            customerPhone: { type: 'string', example: '555-1234' },
            customerEmail: { type: 'string', format: 'email' },
            partySize: { type: 'integer', example: 4 },
            reservationDate: { type: 'string', format: 'date', example: '2024-12-25' },
            startTime: { type: 'string', example: '19:00' },
            endTime: { type: 'string', example: '20:30' },
            durationMinutes: { type: 'integer', example: 90 },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
              example: 'pending',
            },
            specialRequests: { type: 'string', example: 'Window seat preferred' },
            confirmationCode: { type: 'string', example: 'ABC12345' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateReservationRequest: {
          type: 'object',
          required: ['restaurantId', 'customerName', 'customerPhone', 'partySize', 'reservationDate', 'startTime'],
          properties: {
            restaurantId: { type: 'string', format: 'uuid' },
            tableId: { type: 'string', format: 'uuid', description: 'Optional - system will auto-assign if not provided' },
            customerName: { type: 'string', example: 'John Doe' },
            customerPhone: { type: 'string', example: '555-1234' },
            customerEmail: { type: 'string', format: 'email', example: 'john@example.com' },
            partySize: { type: 'integer', minimum: 1, maximum: 20, example: 4 },
            reservationDate: { type: 'string', format: 'date', example: '2024-12-25' },
            startTime: {
              type: 'string',
              pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '19:00',
            },
            durationMinutes: { type: 'integer', minimum: 30, maximum: 240, example: 90 },
            specialRequests: { type: 'string', example: 'Window seat preferred' },
          },
        },

        // Availability schemas
        AvailabilitySlot: {
          type: 'object',
          properties: {
            startTime: { type: 'string', example: '19:00' },
            endTime: { type: 'string', example: '20:30' },
            availableTables: {
              type: 'array',
              items: { $ref: '#/components/schemas/Table' },
            },
          },
        },
        AvailabilityResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                partySize: { type: 'integer' },
                durationMinutes: { type: 'integer' },
                availableSlots: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AvailabilitySlot' },
                },
                suggestedTables: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Table' },
                },
              },
            },
          },
        },

        // Waitlist schemas
        Waitlist: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            restaurantId: { type: 'string', format: 'uuid' },
            customerName: { type: 'string', example: 'Jane Doe' },
            customerPhone: { type: 'string', example: '555-5678' },
            partySize: { type: 'integer', example: 6 },
            requestedDate: { type: 'string', format: 'date' },
            preferredStartTime: { type: 'string', example: '18:00' },
            preferredEndTime: { type: 'string', example: '21:00' },
            status: {
              type: 'string',
              enum: ['waiting', 'notified', 'converted', 'expired', 'cancelled'],
            },
            position: { type: 'integer', example: 3 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateWaitlistRequest: {
          type: 'object',
          required: ['restaurantId', 'customerName', 'customerPhone', 'partySize', 'requestedDate'],
          properties: {
            restaurantId: { type: 'string', format: 'uuid' },
            customerName: { type: 'string', example: 'Jane Doe' },
            customerPhone: { type: 'string', example: '555-5678' },
            customerEmail: { type: 'string', format: 'email' },
            partySize: { type: 'integer', minimum: 1, maximum: 20, example: 6 },
            requestedDate: { type: 'string', format: 'date', example: '2024-12-25' },
            preferredStartTime: { type: 'string', example: '18:00' },
            preferredEndTime: { type: 'string', example: '21:00' },
            durationMinutes: { type: 'integer', example: 120 },
          },
        },

        // Recurring Reservation schemas
        RecurringReservation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            restaurantId: { type: 'string', format: 'uuid' },
            customerName: { type: 'string', example: 'John Doe' },
            customerPhone: { type: 'string', example: '555-1234' },
            partySize: { type: 'integer', example: 4 },
            recurrencePattern: {
              type: 'string',
              enum: ['daily', 'weekly', 'biweekly', 'monthly'],
            },
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, description: '0=Sunday, 6=Saturday' },
            dayOfMonth: { type: 'integer', minimum: 1, maximum: 31 },
            startTime: { type: 'string', example: '19:00' },
            durationMinutes: { type: 'integer', example: 90 },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            status: {
              type: 'string',
              enum: ['active', 'paused', 'cancelled', 'completed'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRecurringReservationRequest: {
          type: 'object',
          required: ['restaurantId', 'customerName', 'customerPhone', 'partySize', 'recurrencePattern', 'startTime', 'startDate'],
          properties: {
            restaurantId: { type: 'string', format: 'uuid' },
            customerName: { type: 'string', example: 'John Doe' },
            customerPhone: { type: 'string', example: '555-1234' },
            customerEmail: { type: 'string', format: 'email' },
            partySize: { type: 'integer', minimum: 1, maximum: 20, example: 4 },
            recurrencePattern: {
              type: 'string',
              enum: ['daily', 'weekly', 'biweekly', 'monthly'],
              example: 'weekly',
            },
            dayOfWeek: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
              description: 'Required for weekly/biweekly patterns. 0=Sunday, 6=Saturday',
              example: 5,
            },
            dayOfMonth: {
              type: 'integer',
              minimum: 1,
              maximum: 31,
              description: 'Required for monthly pattern',
            },
            startTime: { type: 'string', example: '19:00' },
            durationMinutes: { type: 'integer', minimum: 30, maximum: 240, example: 90 },
            startDate: { type: 'string', format: 'date', example: '2024-01-01' },
            endDate: { type: 'string', format: 'date', example: '2024-06-30' },
            specialRequests: { type: 'string', example: 'Same table please' },
          },
        },

        // Timezone schemas
        Timezone: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'America/New_York' },
            offset: { type: 'string', example: '-05:00' },
            label: { type: 'string', example: '(UTC-05:00) Eastern Time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'No token provided',
                error: { code: 'UNAUTHORIZED' },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: { code: 'FORBIDDEN' },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Resource not found',
                error: { code: 'NOT_FOUND' },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: { field: ['Error message'] },
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Too many requests, please try again later',
                error: { code: 'RATE_LIMIT_EXCEEDED' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Restaurants', description: 'Restaurant management' },
      { name: 'Tables', description: 'Table management' },
      { name: 'Reservations', description: 'Reservation management' },
      { name: 'Availability', description: 'Availability checking' },
      { name: 'Waitlist', description: 'Waitlist management' },
      { name: 'Recurring Reservations', description: 'Recurring reservation management' },
      { name: 'Timezones', description: 'Timezone utilities' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);