# Restaurant Table Reservation System API

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Folexy13/resturant)

A comprehensive REST API for managing restaurant table reservations, built with Node.js, Express, TypeScript, PostgreSQL, and Redis.

**Repository:** [https://github.com/Folexy13/resturant](https://github.com/Folexy13/resturant)

## Features

### Core Features
- **Restaurant Management**: Create, update, and manage restaurants with operating hours and timezone support
- **Table Management**: Add tables with capacity constraints and location information
- **Reservation System**: Full reservation lifecycle management
  - Create reservations with automatic table assignment
  - Prevent double-booking with overlap detection
  - Operating hours validation
  - Peak hours duration restrictions
- **Availability Checking**: Real-time availability with Redis caching

### Advanced Features
- **JWT Authentication**: Secure API with role-based access control (Customer, Staff, Manager, Admin)
- **Timezone Support**: Full timezone handling for restaurants in different locations
- **Real Email Notifications**: Nodemailer integration with HTML templates via MailHog (development) or SMTP (production)
- **Rate Limiting**: Configurable rate limits for API endpoints
- **Recurring Reservations**: Daily, weekly, bi-weekly, and monthly recurring bookings
- **Redis Caching**: Availability checks cached for performance
- **Cancel/Modify Reservations**: Full reservation lifecycle management
- **Peak Hours Handling**: Configurable duration limits during busy times
- **Waitlist Functionality**: Automatic waitlist when tables are unavailable
- **Docker Compose Setup**: Complete containerized environment with PostgreSQL, Redis, and MailHog
- **Reservation Status Management**: pending, confirmed, seated, completed, cancelled, no-show
- **Seating Optimization**: Best-fit table selection algorithm

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

## Setup Instructions

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Folexy13/resturant.git
   cd resturant
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **The API will be available at**
   ```
   http://localhost:3000
   ```

5. **View emails in MailHog**
   ```
   http://localhost:8025
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL, Redis, and MailHog**
   ```bash
   docker-compose up -d postgres redis mailhog
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   docker-compose up -d postgres-test
   npm test
   ```

## Email Notifications

The system sends email notifications for the following events:

### Email Types
1. **Welcome Email**: Sent when a new user registers
2. **Reservation Confirmation**: Sent when a reservation is created
3. **Reservation Status Update**: Sent when reservation status changes (confirmed, cancelled, seated, completed, no-show)
4. **Waitlist Notification**: Sent when a table becomes available for a waitlisted customer
5. **Password Reset**: Sent when a user requests a password reset

### Development (MailHog)
In development, all emails are captured by MailHog and can be viewed at:
```
http://localhost:8025
```

MailHog provides:
- Web interface to view all sent emails
- HTML and plain text email preview
- Email source inspection
- No actual emails are sent to real addresses

### Production (SMTP)
For production, configure the following environment variables:
```
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@your-domain.com
```

## API Documentation

### Swagger UI (Interactive Documentation)

The API includes interactive Swagger documentation. Once the server is running, access it at:

```
http://localhost:3000/api-docs
```

**Features:**
- Interactive API explorer
- Try out endpoints directly from the browser
- View request/response schemas
- Authentication support (enter JWT token)
- Download OpenAPI specification

**OpenAPI JSON:**
```
http://localhost:3000/api-docs.json
```

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```
GET /api/v1/health
```

---

## Authentication

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "555-1234"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Get Profile (Protected)
```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

### Change Password (Protected)
```http
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### User Roles
- **customer**: Can make reservations, view own reservations
- **staff**: Can manage reservations, view all reservations
- **manager**: Can manage restaurant settings, tables, staff
- **admin**: Full system access

---

## Timezone Support

### Get Common Timezones
```http
GET /api/v1/timezones
```

### Get All Timezones
```http
GET /api/v1/timezones/all
```

### Validate Timezone
```http
GET /api/v1/timezones/validate/America%2FNew_York
```

### Restaurant with Timezone
```http
POST /api/v1/restaurants
Content-Type: application/json

{
  "name": "The Italian Place",
  "openingTime": "10:00",
  "closingTime": "22:00",
  "timezone": "America/New_York",
  "address": "123 Main Street"
}
```

---

## Recurring Reservations

### Create Recurring Reservation
```http
POST /api/v1/recurring-reservations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "restaurantId": "uuid",
  "customerName": "John Doe",
  "customerPhone": "555-1234",
  "partySize": 4,
  "recurrencePattern": "weekly",
  "dayOfWeek": 5,
  "startTime": "19:00",
  "durationMinutes": 90,
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "specialRequests": "Same table please"
}
```

**Recurrence Patterns:**
- `daily`: Every day
- `weekly`: Same day every week (requires `dayOfWeek`: 0-6)
- `biweekly`: Every two weeks
- `monthly`: Same day of month (requires `dayOfMonth`: 1-31)

### Get Upcoming Occurrences
```http
GET /api/v1/recurring-reservations/:id/occurrences?limit=10
```

### Pause Recurring Reservation
```http
POST /api/v1/recurring-reservations/:id/pause
```

### Resume Recurring Reservation
```http
POST /api/v1/recurring-reservations/:id/resume
```

### Cancel Recurring Reservation
```http
POST /api/v1/recurring-reservations/:id/cancel
Content-Type: application/json

{
  "cancelFutureReservations": true
}
```

---

### Restaurants

#### Create Restaurant
```http
POST /api/v1/restaurants
Content-Type: application/json

{
  "name": "The Italian Place",
  "openingTime": "10:00",
  "closingTime": "22:00",
  "timezone": "America/New_York",
  "address": "123 Main Street",
  "phone": "555-1234"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {
    "id": "uuid",
    "name": "The Italian Place",
    "openingTime": "10:00",
    "closingTime": "22:00",
    "timezone": "America/New_York",
    "totalTables": 0,
    "address": "123 Main Street",
    "phone": "555-1234",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Restaurants
```http
GET /api/v1/restaurants
GET /api/v1/restaurants?includeInactive=true
```

#### Get Restaurant by ID
```http
GET /api/v1/restaurants/:id
```

#### Update Restaurant
```http
PUT /api/v1/restaurants/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "openingTime": "09:00"
}
```

#### Deactivate/Activate Restaurant
```http
PATCH /api/v1/restaurants/:id/deactivate
PATCH /api/v1/restaurants/:id/activate
```

---

### Tables

#### Add Table to Restaurant
```http
POST /api/v1/restaurants/:restaurantId/tables
Content-Type: application/json

{
  "tableNumber": 1,
  "capacity": 4,
  "minCapacity": 2,
  "location": "window"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Table created successfully",
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "tableNumber": 1,
    "capacity": 4,
    "minCapacity": 2,
    "location": "window",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Tables for Restaurant
```http
GET /api/v1/restaurants/:restaurantId/tables
```

#### Get Optimal Table for Party Size
```http
GET /api/v1/restaurants/:restaurantId/tables/optimal?partySize=4
```

#### Get Table Suggestions
```http
GET /api/v1/restaurants/:restaurantId/tables/suggest?partySize=6&limit=3
```

---

### Reservations

#### Create Reservation
```http
POST /api/v1/reservations
Content-Type: application/json

{
  "restaurantId": "uuid",
  "customerName": "John Doe",
  "customerPhone": "555-1234",
  "customerEmail": "john@example.com",
  "partySize": 4,
  "reservationDate": "2024-12-25",
  "startTime": "19:00",
  "durationMinutes": 90,
  "specialRequests": "Window seat preferred"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": "uuid",
    "restaurantId": "uuid",
    "tableId": "uuid",
    "customerName": "John Doe",
    "customerPhone": "555-1234",
    "customerEmail": "john@example.com",
    "partySize": 4,
    "reservationDate": "2024-12-25",
    "startTime": "19:00",
    "endTime": "20:30",
    "durationMinutes": 90,
    "status": "pending",
    "specialRequests": "Window seat preferred",
    "confirmationSent": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Reservations for Restaurant
```http
GET /api/v1/restaurants/:restaurantId/reservations
GET /api/v1/restaurants/:restaurantId/reservations?date=2024-12-25
GET /api/v1/restaurants/:restaurantId/reservations?status=confirmed
GET /api/v1/restaurants/:restaurantId/reservations?page=1&limit=20
```

#### Get Reservation by ID
```http
GET /api/v1/reservations/:id
```

#### Update Reservation
```http
PUT /api/v1/reservations/:id
Content-Type: application/json

{
  "partySize": 5,
  "startTime": "19:30"
}
```

#### Cancel Reservation
```http
POST /api/v1/reservations/:id/cancel
Content-Type: application/json

{
  "cancellationReason": "Change of plans"
}
```

#### Confirm Reservation
```http
POST /api/v1/reservations/:id/confirm
Content-Type: application/json

{
  "sendConfirmation": true
}
```

#### Mark as Seated
```http
POST /api/v1/reservations/:id/seat
```

#### Mark as Completed
```http
POST /api/v1/reservations/:id/complete
```

#### Mark as No-Show
```http
POST /api/v1/reservations/:id/no-show
```

---

### Availability

#### Check Availability
```http
GET /api/v1/restaurants/:restaurantId/availability?date=2024-12-25&partySize=4&durationMinutes=90
```

**Response**
```json
{
  "success": true,
  "data": {
    "date": "2024-12-25",
    "partySize": 4,
    "durationMinutes": 90,
    "availableSlots": [
      {
        "startTime": "10:00",
        "endTime": "11:30",
        "availableTables": [
          {
            "id": "uuid",
            "tableNumber": 1,
            "capacity": 4,
            "location": "window"
          }
        ]
      }
    ],
    "suggestedTables": [
      {
        "id": "uuid",
        "tableNumber": 1,
        "capacity": 4,
        "location": "window",
        "fitScore": 0
      }
    ]
  }
}
```

#### Check Specific Time Slot
```http
GET /api/v1/restaurants/:restaurantId/check-availability?date=2024-12-25&startTime=19:00&partySize=4
```

---

### Waitlist

#### Add to Waitlist
```http
POST /api/v1/waitlist
Content-Type: application/json

{
  "restaurantId": "uuid",
  "customerName": "Jane Doe",
  "customerPhone": "555-5678",
  "partySize": 6,
  "requestedDate": "2024-12-25",
  "preferredStartTime": "18:00",
  "preferredEndTime": "21:00",
  "durationMinutes": 120
}
```

#### Get Waitlist Position
```http
GET /api/v1/waitlist/:id/position
```

**Response**
```json
{
  "success": true,
  "data": {
    "position": 3,
    "estimatedWaitMinutes": 90,
    "message": "You are #3 on the waitlist"
  }
}
```

#### Cancel Waitlist Entry
```http
POST /api/v1/waitlist/:id/cancel
```

---

## Design Decisions

### Architecture
- **Layered Architecture**: Controllers -> Services -> Repositories
- **OOP Principles**: Classes for entities, services, and controllers
- **Dependency Injection**: Services are instantiated in controllers
- **Repository Pattern**: TypeORM repositories for data access

### Database Schema
- **Users**: Authentication and authorization
- **Restaurants**: Core entity with operating hours and timezone
- **Tables**: Linked to restaurants with capacity constraints
- **Reservations**: Links customers to tables with time slots
- **Recurring Reservations**: Template for recurring bookings
- **Waitlist**: Manages overflow when tables are unavailable

### Key Design Choices

1. **JWT Authentication**: Secure stateless authentication with refresh tokens

2. **Role-Based Access Control**: Four roles with hierarchical permissions

3. **Timezone Support**: Each restaurant can have its own timezone

4. **Automatic Table Assignment**: When no table is specified, the system finds the optimal table (smallest capacity that fits the party)

5. **Overlap Detection**: Uses time-based comparison to prevent double-booking

6. **Peak Hours Handling**: Configurable peak hours with maximum duration limits

7. **Redis Caching**: Availability results are cached with automatic invalidation on reservation changes

8. **Rate Limiting**: Configurable limits per endpoint type:
   - General API: 100 requests per 15 minutes
   - Authentication: 10 attempts per 15 minutes
   - Reservations: 20 per hour
   - Search: 60 per minute

9. **Status Workflow**: 
   ```
   PENDING -> CONFIRMED -> SEATED -> COMPLETED
                |
                v
            CANCELLED
                |
                v
             NO_SHOW
   ```

10. **Recurring Reservations**: Support for daily, weekly, bi-weekly, and monthly patterns

11. **Email Notifications**: HTML email templates sent via MailHog (development) or SMTP (production)

### Assumptions

1. Reservations are for a single day (no overnight reservations)
2. All times are in the restaurant's configured timezone
3. Tables can only be booked for one party at a time
4. Minimum reservation duration is 30 minutes, maximum is 240 minutes
5. Party size must be between 1 and 20

## Future Improvements

With more time, I would add:

1. **Advanced Analytics**: Reservation patterns, peak times, no-show rates
2. **Table Combining**: Allow combining adjacent tables for larger parties
3. **Deposit/Payment Integration**: Stripe integration for deposits
4. **Customer Profiles**: Track customer preferences and history
5. **Staff Management**: Assign servers to tables/sections
6. **Real-time Updates**: WebSocket for live availability updates
7. **Mobile App**: React Native companion app
8. **SMS Notifications**: Twilio integration for SMS
9. **Calendar Integration**: Google Calendar / iCal sync
10. **Multi-language Support**: i18n for international restaurants

## Scaling for Multiple Restaurants

To scale this system for multiple restaurants:

1. **Database Sharding**: Partition data by restaurant ID
2. **Read Replicas**: Use PostgreSQL read replicas for availability queries
3. **Redis Cluster**: Distribute cache across multiple Redis nodes
4. **Load Balancing**: Use nginx/HAProxy for API load balancing
5. **Microservices**: Split into separate services:
   - Restaurant Service
   - Reservation Service
   - Notification Service
   - Analytics Service
6. **Message Queue**: Use RabbitMQ/Kafka for async operations
7. **CDN**: Cache static assets and API responses
8. **Kubernetes**: Container orchestration for auto-scaling

## Testing

Run the test suite:

```bash
# Start test database
docker-compose up -d postgres-test

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Docker Services

The docker-compose.yml includes the following services:

| Service | Port | Description |
|---------|------|-------------|
| `app` | 3000 | Node.js API server |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis cache |
| `mailhog` | 8025 (Web), 1025 (SMTP) | Email testing tool |
| `postgres-test` | 5433 | Test database |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | `restaurant_db` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `SMTP_HOST` | SMTP server host | `mailhog` (Docker) |
| `SMTP_PORT` | SMTP server port | `1025` (Docker) |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `SMTP_FROM` | From email address | `noreply@tallie-restaurant.com` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

## License

MIT License

## Author

**Aluko Folajimi**

Portfolio: [github.com/folexy13](https://github.com/folexy13)

Built for Tallie Backend Engineer Pre-Interview Exercise