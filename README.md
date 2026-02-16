# Node.js Express Authentication API

A RESTful authentication API built with Node.js, Express, Sequelize ORM, and PostgreSQL. Features enterprise-grade logging, session management with access/refresh tokens, multi-language support, email verification, and file upload capabilities.

## Features

- User registration and login with account locking
- JWT-based authentication with access/refresh token flow (separate secrets)
- Password hashing with bcrypt (10 rounds)
- Email verification with configurable requirements
- File upload with quota management and security features
- Request validation with Joi
- Layered architecture (Controller → Service → Model)
- PostgreSQL/MySQL database with Sequelize ORM
- Protected routes with authentication middleware
- Session management with device tracking (max 2 active sessions)
- Enterprise-grade logging with Winston and Better Stack integration
- Request correlation IDs for tracing
- Multi-language support (Thai/English)
- Account security (5 failed attempts → 30-minute lock)
- Input sanitization utilities (XSS, SQL injection prevention)
- Swagger/OpenAPI 3.0 documentation (YAML-based)
- API versioning (`/api/v1/`)

## Tech Stack

- **Node.js** - Runtime environment (ES modules)
- **Express** - Web framework
- **Sequelize** - ORM for PostgreSQL/MySQL
- **PostgreSQL/MySQL** - Database support
- **JWT** - Authentication with separate access/refresh token secrets
- **Bcrypt** - Password hashing
- **Joi** - Request validation
- **Nodemailer** - Email sending (SMTP/Gmail)
- **Multer** - File upload handling
- **Winston** - Structured logging
- **Better Stack** - Centralized log management (optional)
- **Swagger UI Express** - API documentation
- **YAML** - Swagger spec files

## Project Structure

```
node-auth-api/
├── src/
│   ├── config/
│   │   ├── env/              # Environment configuration files
│   │   │   ├── .env.example  # Environment template
│   │   │   ├── .env          # Production config (not in git)
│   │   │   └── .env.dev      # Development config (not in git)
│   │   ├── app-config.js     # Application configuration
│   │   ├── constants.js      # Response codes
│   │   ├── database.js       # Database connection with retry
│   │   ├── swagger.config.js # Swagger documentation loader
│   │   └── message.*.js      # Multi-language messages
│   ├── controllers/          # Request handlers
│   ├── core/                 # Core handlers (response, error)
│   ├── services/             # Business logic
│   ├── models/               # Sequelize models
│   ├── routes/
│   │   ├── routes.js         # Main aggregator (/api prefix)
│   │   └── v1/               # v1 API endpoints
│   ├── middleware/           # Custom middleware (auth, rate limit, sanitize)
│   ├── utils/                # Utilities (jwt, db, logger, trace, sanitize)
│   ├── validators/           # Joi validation schemas
│   ├── app.js                # Express app configuration
│   └── server.js             # Entry point
├── swagger/                  # OpenAPI 3.0 documentation
│   ├── swagger.yaml          # Main spec
│   ├── paths/                # Endpoint definitions
│   └── components/           # Shared schemas
├── tests/                    # Unit and integration tests
├── jest.config.js            # Jest configuration
├── babel.config.cjs          # Babel configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher) with ES modules support
- PostgreSQL (v12 or higher) or MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd node-auth-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp src/config/env/.env.example src/config/env/.env
   ```

4. Configure your environment (`src/config/env/.env`):
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Database
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=test-auth
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT (IMPORTANT: Use different secrets, ≥32 characters)
   JWT_SECRET=your_access_token_secret_at_least_32_chars
   JWT_REFRESH_SECRET=your_refresh_token_secret_different_from_access
   JWT_ACCESS_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d

   # Email (optional)
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   EMAIL_VERIFICATION_ENABLED=true
   ```

5. Generate JWT secrets (recommended):
   ```bash
   openssl rand -base64 32  # Run twice for both secrets
   ```

6. Create PostgreSQL database:
   ```sql
   CREATE DATABASE test-auth;
   ```

7. Start the server:
   ```bash
   npm run dev
   ```

The API will be available at:
- **API**: `http://localhost:3000/api`
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/api/health`

## API Documentation

Interactive API documentation is available via Swagger UI:
- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://your-domain.com/api-docs`

Documentation is defined in YAML files under `swagger/` directory.

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | User login |
| `GET` | `/api/health` | Health check |

### Protected Endpoints

Require `Authorization: Bearer <access-token>` header

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/refresh-token` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Logout current session |
| `POST` | `/api/v1/auth/logout-all` | Logout all sessions |
| `POST` | `/api/v1/auth/change-password` | Change password |

#### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/user/profile` | Get user profile |
| `PUT` | `/api/v1/user/profile` | Update user profile |

#### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/email-verification/status` | Check verification status |
| `POST` | `/api/v1/email-verification/resend` | Resend verification email |
| `POST` | `/api/v1/email-verification/verify` | Verify email with token |
| `POST` | `/api/v1/email-verification/request-password-reset` | Request password reset |
| `POST` | `/api/v1/email-verification/reset-password` | Reset password with token |

#### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/files/upload` | Upload file (multipart/form-data) |
| `GET` | `/api/v1/files` | List user's files |
| `GET` | `/api/v1/files/:fileId` | Get file metadata |
| `GET` | `/api/v1/files/download` | Download file |
| `DELETE` | `/api/v1/files/:fileId` | Delete file |
| `GET` | `/api/v1/files/storage/info` | Get storage quota |

### Example Requests

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password@123"
}
```

#### Get Profile
```http
GET /api/v1/user/profile
Authorization: Bearer <your-access-token>
x-language: en
```

#### Upload File
```http
POST /api/v1/files/upload
Authorization: Bearer <your-access-token>
Content-Type: multipart/form-data

file: <file>
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
    "user": { "id": 1, "email": "john@example.com" },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Error Response
```json
{
  "status": false,
  "transactionId": "...",
  "resCode": "40100",
  "error": {
    "developerMessage": "Authentication required",
    "userMessage": "Authentication required"
  }
}
```

## Scripts

```bash
# Development
npm run dev            # Start development server with nodemon
npm start              # Start production server

# Testing
npm test               # Run all tests with coverage
npm test -- --testNamePattern="should login user"  # Run specific test
npm test -- tests/unit/services/auth.service.test.js  # Run specific file

# Database
npm run db:migrate     # Run Sequelize migrations
npm run db:migrate:undo # Undo last migration
npm run db:seed        # Run database seeders
```

## Security Features

- **Password Security**: bcrypt with 10 rounds, complexity requirements
- **JWT Security**: Separate secrets for access/refresh tokens (validated at startup)
- **Account Locking**: 5 failed attempts → 30-minute lock
- **Session Management**: Max 2 active sessions, device tracking
- **Token Storage**: Database-stored tokens for revocation
- **Request Validation**: Joi schema validation
- **Input Sanitization**: XSS, SQL injection prevention utilities
- **CORS**: Configurable origin whitelist
- **Security Headers**: Helmet middleware (CSP, HSTS, XSS protection)
- **Request Correlation**: Transaction IDs for monitoring

## Authentication Flow

### Access/Refresh Token Pattern
- **Access Tokens**: 15-minute expiration for API requests
- **Refresh Tokens**: 7-day expiration for obtaining new access tokens
- **Separate Secrets**: Different JWT secrets for each token type
- **Session Limit**: Maximum 2 active sessions per user
- **Device Tracking**: Logs device info for security monitoring

### Registration Flow
1. User submits registration data
2. Service validates input (Joi)
3. Creates User + UserAuth + UserToken records
4. Returns access and refresh tokens
5. Sends verification email (if enabled)

### Login Flow
1. User submits credentials
2. Service validates and checks account lock status
3. Success: resets failed attempts, creates new session
4. Failure: increments failed attempts, locks account if needed
5. Returns tokens on successful authentication

### Token Refresh Flow
1. Client submits refresh token
2. Service validates refresh token and database record
3. Generates new access and refresh tokens
4. Updates UserToken record

## Logging & Monitoring

Enterprise-grade logging with structured JSON output:

- **Winston Logger**: Multi-level logging (DEBUG, INFO, WARN, ERROR, FATAL)
- **Request Correlation**: Automatic correlation ID tracking via AsyncLocalStorage
- **File Logging**: Separate error.log and combined.log files
- **Better Stack**: Optional centralized log management
- **Trace Context**: Automatic user_id and correlation_id injection

## Multi-Language Support

Error messages support Thai and English via `src/config/message.properties.js`:

- Set language via `x-language` header (`th` or `en`)
- Response codes map to localized messages
- Defaults to Thai if not specified

## Development

### Adding New Features

1. Create Joi validation schema in `src/validators/`
2. Create service in `src/services/` (business logic + db.util calls)
3. Create controller in `src/controllers/` (request/response handling)
4. Create route in `src/routes/v1/` (define endpoints + middleware)
5. Import route in `src/routes/v1/index.js`
6. Add Swagger documentation to `swagger/paths/*.yaml`

### Database Models

Three-table user system:

**User** (`src/models/user.model.js`):
- Profile information (username, email, firstName, lastName, isActive)

**UserAuth** (`src/models/user-auth.model.js`):
- Authentication data (password hash, failedAttempts, lockedUntil, isVerified)
- One-to-one with User via shared primary key
- Automatic password hashing via Sequelize hooks

**UserToken** (`src/models/user-token.model.js`):
- Session management (accessToken, refreshToken, deviceInfo)
- One-to-many with User
- Device tracking and session enforcement

### Testing

Jest with ES modules support:

```bash
npm test                           # All tests with coverage
npm test -- --testNamePattern="test name"  # Specific test
npm test -- tests/unit/services/auth.service.test.js  # Specific file
```

Test structure:
- `tests/unit/` - Unit tests for services and utilities
- `tests/integration/` - Integration tests for API endpoints
- `tests/setup.js` - Test setup and mocks

## License

ISC
