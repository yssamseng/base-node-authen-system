# Node.js Express Authentication API

A RESTful authentication API built with Node.js, Express, Sequelize ORM, and PostgreSQL. Features enterprise-grade logging with Winston, session management with access/refresh tokens, and multi-language support.

## Features

- User registration and login with account locking
- JWT-based authentication with access/refresh token flow
- Password hashing with bcrypt (10 rounds)
- Request validation with Joi
- Layered architecture (Controller → Service → Model)
- PostgreSQL database with Sequelize ORM
- Protected routes with authentication middleware
- Session management with device tracking (max 2 active sessions)
- Enterprise-grade logging with Winston and Better Stack
- Request correlation IDs for tracing
- Multi-language support (Thai/English)
- Account security (5 failed attempts → 30-minute lock)

## Tech Stack

- **Node.js** - Runtime environment (ES modules)
- **Express** - Web framework
- **Sequelize** - ORM for PostgreSQL/MySQL
- **PostgreSQL** - Primary database
- **JWT** - Authentication with access/refresh tokens
- **Bcrypt** - Password hashing
- **Joi** - Validation
- **Moment** - Date/time handling
- **Winston** - Structured logging
- **Better Stack** - Centralized log management

## Project Structure

```
node-auth-api/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers
│   ├── core/           # Core handlers and utilities
│   ├── services/        # Business logic
│   ├── models/          # Sequelize models (User, UserAuth, UserToken)
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── validators/      # Joi validation schemas
│   ├── app.js           # Express app configuration
│   └── server.js         # Entry point
├── tests/               # Test files (unit/integration)
├── jest.config.js       # Jest configuration
├── babel.config.cjs     # Babel configuration for ES modules
├── .env.example         # Environment variables template
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher) with ES modules support
- PostgreSQL (v12 or higher) or MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd node-auth-api
   npm install
   ```

3. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=auth_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   JWT_SECRET=your_secret_key
   JWT_EXPIRE=24h
   CORS_ORIGIN=http://localhost:3000
   ```

5. Create PostgreSQL database:
   ```sql
   CREATE DATABASE auth_db;
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Public Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "status": true,
  "transactionId": "...",
  "resCode": "20000",
  "data": {
    "user": { "id": 1, "email": "john@example.com", "username": "johndoe" },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": true,
  "transactionId": "...",
  "resCode": "20000",
  "data": {
    "user": { "id": 1, "email": "john@example.com" },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Health Check
```http
GET /api/health
```

### Protected Endpoints

Require `Authorization: Bearer <token>` header

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<your-refresh-token>"
}
```

#### Get Profile
```http
GET /api/user/profile
Authorization: Bearer <your-access-token>
```

#### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <your-access-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith"
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <your-access-token>
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

#### Logout (Current Session)
```http
POST /api/auth/logout
Authorization: Bearer <your-access-token>
```

#### Logout (All Sessions)
```http
POST /api/auth/logout-all
Authorization: Bearer <your-access-token>
```

## Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run Jest tests with coverage
npm run db:migrate     # Run Sequelize migrations
npm run db:migrate:undo # Undo last migration
npm run db:seed        # Run database seeders

# Testing individual files
npm test -- --testNamePattern="should login user"
npm test -- tests/auth.test.js
```

## Response Format

All API responses use a standardized format with transaction tracking:

### Success Response
```json
{
  "status": true,
  "transactionId": "...",
  "resCode": "20000",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": false,
  "transactionId": "...",
  "resCode": "40000",
  "error": {
    "developerMessage": "Detailed error for developers",
    "userMessage": "User-friendly error message"
  }
}
```

### Validation Error Response
```json
{
  "status": false,
  "transactionId": "...",
  "resCode": "40000",
  "error": {
    "developerMessage": "Validation failed",
    "userMessage": "Invalid input data",
    "errors": [
      // Specific validation errors
    ]
  }
}
```

## Security Features

- Passwords hashed with bcrypt (salt rounds: 10)
- Access/refresh token flow with separate expirations
- Account locking after 5 failed login attempts (30-minute lock)
- Session management with device tracking (max 2 active sessions)
- Protected routes with authentication middleware
- Request validation with Joi
- SQL injection prevention via Sequelize ORM
- CORS configuration
- Request correlation IDs for security monitoring
- Token revocation and session cleanup

## Authentication Flow

### Access/Refresh Token Pattern
- **Access Tokens**: 15-minute expiration for API requests
- **Refresh Tokens**: 7-day expiration for obtaining new access tokens
- **Session Management**: Maximum 2 active sessions per user
- **Device Tracking**: Logs device info for security monitoring

### Registration Flow
1. User submits registration data
2. Service validates input and creates User + UserAuth + UserToken records
3. Returns access and refresh tokens
4. User can immediately access protected routes

### Login Flow
1. User submits credentials
2. Service validates and checks account lock status
3. On success: resets failed attempts, creates new session
4. On failure: increments failed attempts, locks account if needed
5. Returns tokens on successful authentication

### Token Refresh Flow
1. Client submits refresh token
2. Service validates refresh token and user session
3. Generates new access and refresh tokens
4. Updates UserToken record with new tokens

## Logging & Monitoring

The API includes enterprise-grade logging:

- **Structured JSON logging** with Winston
- **Request correlation IDs** via `X-Correlation-ID` header
- **Better Stack integration** for centralized log management
- **Multi-level logging**: DEBUG, INFO, WARN, ERROR, FATAL
- **File logging**: Separate error.log and combined.log files
- **Development vs Production** log levels

## Multi-Language Support

Error messages support multiple languages (Thai/English) via `src/config/message.properties.js`. Response codes in `src/config/constants.js` map to appropriate localized messages.

## Development

### Adding New Features

1. Create service in `src/services/` following `*.service.js` naming
2. Create controller in `src/controllers/` following `*.controller.js` naming
3. Define routes in `src/routes/` following `*.route.js` naming
4. Add validation schemas in `src/validators/` following `*.validator.js` naming
5. Update `src/routes/index.js` to include new routes

### Testing

The project uses Jest for testing with ES modules support:

```bash
npm test                           # Run all tests with coverage
npm test -- --testNamePattern="test name"  # Run specific test
npm test -- tests/auth.test.js     # Run specific test file
```

Test structure:
- `tests/unit/` - Unit tests for services and utilities
- `tests/integration/` - Integration tests for API endpoints
- `tests/setup.js` - Test setup and configuration
- `jest.config.js` - Jest configuration with Babel support

### Database Models

The project uses a three-table user system:

**User Model** (`src/models/user.model.js`):
- Profile information (username, email, firstName, lastName, isActive)
- Primary table for user data

**UserAuth Model** (`src/models/user-auth.model.js`):
- Authentication data (password, lastLogin, failedAttempts, isVerified, lockedUntil)
- One-to-one relationship with User via shared primary key
- Automatic password hashing via Sequelize hooks
- Account locking functionality

**UserToken Model** (`src/models/user-token.model.js`):
- Session management (accessToken, refreshToken, deviceInfo)
- One-to-many relationship with User
- Device tracking and session enforcement
- Automatic token cleanup

All models exclude sensitive fields from JSON responses via `toJSON()` method.

## License

ISC
