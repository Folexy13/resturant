# Restaurant Table Reservation System API

A comprehensive REST API for managing restaurant table reservations, built with Node.js, Express, TypeScript, PostgreSQL, and Redis.

## 🚀 Features

### Core Features
- **Restaurant Management**: Create, update, and manage restaurants with operating hours
- **Table Management**: Add tables with capacity constraints and location information
- **Reservation System**: Full reservation lifecycle management
  - Create reservations with automatic table assignment
  - Prevent double-booking with overlap detection
  - Operating hours validation
  - Peak hours duration restrictions
- **Availability Checking**: Real-time availability with Redis caching

### Bonus Features
- ✅ TypeScript implementation
- ✅ Redis caching for availability checks
- ✅ Cancel/modify reservations
- ✅ Peak hours handling (configurable duration limits)
- ✅ Waitlist functionality
- ✅ Docker Compose setup
- ✅ Reservation status management (pending, confirmed, seated, completed, cancelled, no-show)
- ✅ Mock notification system (email/SMS logging)
- ✅ Seating optimization (best-fit table selection)

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

## 🛠️ Setup Instructions

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-reservation-api
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

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   docker-compose up -d postgres redis
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

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```
GET /api/v1/health
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

## 🏗️ Design Decisions

### Architecture
- **Layered Architecture**: Controllers → Services → Repositories
- **OOP Principles**: Classes for entities, services, and controllers
- **Dependency Injection**: Services are instantiated in controllers
- **Repository Pattern**: TypeORM repositories for data access

### Database Schema
- **Restaurants**: Core entity with operating hours
- **Tables**: Linked to restaurants with capacity constraints
- **Reservations**: Links customers to tables with time slots
- **Waitlist**: Manages overflow when tables are unavailable

### Key Design Choices

1. **Automatic Table Assignment**: When no table is specified, the system finds the optimal table (smallest capacity that fits the party)

2. **Overlap Detection**: Uses time-based comparison to prevent double-booking

3. **Peak Hours Handling**: Configurable peak hours with maximum duration limits

4. **Redis Caching**: Availability results are cached with automatic invalidation on reservation changes

5. **Status Workflow**: 
   ```
   PENDING → CONFIRMED → SEATED → COMPLETED
                ↓
            CANCELLED
                ↓
             NO_SHOW
   ```

6. **Waitlist Processing**: When a reservation is cancelled, the system automatically notifies waitlisted customers

### Assumptions

1. Reservations are for a single day (no overnight reservations)
2. All times are in the restaurant's local timezone
3. Tables can only be booked for one party at a time
4. Minimum reservation duration is 30 minutes, maximum is 240 minutes
5. Party size must be between 1 and 20

## ⚠️ Known Limitations

1. **No Authentication**: API endpoints are not protected
2. **Single Timezone**: No timezone handling for different locations
3. **No Real Notifications**: Email/SMS are mocked (logged to console)
4. **No Rate Limiting**: API endpoints are not rate-limited
5. **No Pagination Optimization**: Large datasets may be slow
6. **No Recurring Reservations**: Each reservation is a single occurrence

## 🔮 Future Improvements

With more time, I would add:

1. **Authentication & Authorization**: JWT-based auth with role-based access
2. **Real Notification Service**: Integration with SendGrid/Twilio
3. **Advanced Analytics**: Reservation patterns, peak times, no-show rates
4. **Multi-location Support**: Timezone handling, location-based search
5. **Table Combining**: Allow combining adjacent tables for larger parties
6. **Deposit/Payment Integration**: Stripe integration for deposits
7. **Customer Profiles**: Track customer preferences and history
8. **Staff Management**: Assign servers to tables/sections
9. **Real-time Updates**: WebSocket for live availability updates
10. **Mobile App**: React Native companion app

## 📈 Scaling for Multiple Restaurants

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

## 🧪 Testing

Run the test suite:

```bash
# Start test database
docker-compose up -d postgres-test

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📝 License

MIT License

## 👤 Author

Built for Tallie Backend Engineer Pre-Interview Exercise