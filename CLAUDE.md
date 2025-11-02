# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Node.js Express authentication API with JWT-based authentication, built using a layered architecture pattern with Sequelize ORM and PostgreSQL. Features enterprise-grade logging with Winston, request tracing with correlation IDs, and multi-language support (Thai/English).

**Important**: This project uses ES modules (`"type": "module"` in package.json). All import/export statements must use ES module syntax (`import/export`), not CommonJS (`require/module.exports`).

## Development Commands

```bash
cd node-auth-api          # Navigate to project directory
npm run dev              # Start development server with nodemon
npm start                # Start production server
npm test                 # Run Jest tests with coverage
npm run db:migrate       # Run Sequelize migrations
npm run db:migrate:undo  # Undo last migration
npm run db:seed          # Run database seeders

# Testing individual files
npm test -- --testNamePattern="should login user"
npm test -- src/tests/auth.test.js

# Database operations
npx sequelize-cli db:migrate    # Run migrations manually
npx sequelize-cli db:seed:all   # Run all seeders
```

## Testing Architecture

The project uses Jest for testing with ES modules support. Key testing configurations:

### Jest Setup
- Uses `babel-jest` for ES module transpilation
- Test environment: Node
- Coverage collection enabled
- Test files located in `tests/` directory

### Test Configuration Files
- `jest.config.js` - Main Jest configuration with Babel preset
- `babel.config.cjs` - Babel configuration for ES modules
- `.eslintrc.cjs` - ESLint configuration

### Common Test Patterns
```javascript
// Example test structure
import { authService } from '../src/services/auth.service.js';
import { genErrorResponseObj } from '../src/core/handler.js';

describe('Auth Service', () => {
  test('should register new user', async () => {
    // Test implementation
  });
});
```

## Architecture & Code Organization

### File Naming Convention

All application-layer files follow the pattern: `[name-file].[type].js`

- **Controllers**: `*.controller.js` - Handle HTTP requests/responses
- **Services**: `*.service.js` - Contain business logic
- **Routes**: `*.route.js` - Define API endpoints
- **Middleware**: `*.middleware.js` - Process requests before controllers
- **Utils**: `*.util.js` - Helper/utility functions
- **Validators**: `*.validator.js` - Request validation schemas
- **Models**: `*.model.js` - Sequelize ORM models

**Important**: `src/routes/index.js` is an exception and keeps its name as the main route aggregator.

### Request Flow Architecture

```
Request → Route → Validator → Middleware → Controller → Service → Model → Database
```

1. **Routes** (`src/routes/`) - Define endpoints and attach middleware/validators
2. **Validators** (`src/validators/`) - Joi schemas for request validation
3. **Middleware** (`src/middleware/`) - Authentication and request processing
4. **Controllers** (`src/controllers/`) - Parse requests, call services, format responses
5. **Services** (`src/services/`) - Business logic, transactions, data processing
6. **Models** (`src/models/`) - Sequelize models with associations and hooks

### Database Architecture

**Multi-Table User System:**

- `User` model - Profile information (username, email, firstName, lastName, isActive)
- `UserAuth` model - Authentication data (password, lastLogin, failedAttempts, isVerified, lockedUntil)
- `UserToken` model - Session management (accessToken, refreshToken, deviceInfo, session tracking)

**Relationships:**
- User ↔ UserAuth: One-to-One using shared primary key pattern
- User → UserToken: One-to-Many (user can have multiple active sessions)

**Key Features:**
- Password auto-hashing via Sequelize hooks (beforeCreate/beforeUpdate)
- Account locking after 5 failed login attempts (30-minute lock)
- Password fields excluded from JSON responses via `toJSON()` method
- Session management with max 2 active sessions per user
- Automatic token cleanup and session enforcement
- Device tracking for security monitoring
- Cascading deletes configured

### Model Association Pattern

Models define associations in static `associate(models)` methods called by `src/models/index.js`. This pattern avoids circular dependency issues:

```javascript
// In user.model.js
static associate(models) {
  User.hasOne(models.UserAuth, { foreignKey: 'userId', as: 'auth' });
}

// In user-auth.model.js  
static associate(models) {
  UserAuth.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
}
```

### Authentication Flow

1. **Registration**: Service creates User + UserAuth + UserToken in transaction, returns access/refresh tokens
2. **Login**: Service validates credentials, checks account lock status, manages failed attempts, creates new session with tokens
3. **Token Refresh**: Service validates refresh token, generates new token pair, updates session
4. **Protected Routes**: Middleware extracts Bearer token, verifies JWT via UserToken lookup, attaches user to `req.user`
5. **Logout**: Service revokes specific session or all sessions for user

JWT tokens generated with user ID and token type payload, configured via `JWT_SECRET` env var. Token storage managed through `UserToken` model for enhanced security and session management.

### Validation Pattern

Validators live in `src/validators/` folder (separate from middleware):

```javascript
// validators/auth.validator.js exports Joi schemas
const { registrationSchema, loginSchema } = require('../validators/auth.validator');

// validators/index.js provides the validateRequest wrapper function
const validateRequest = (schema) => (req, res, next) => { /* ... */ };
```

Routes import validators directly from `validators/` folder, not from `middleware/`.

### Service Layer Patterns

- Use Sequelize transactions for multi-model operations
- Use moment.js for date/time formatting
- Throw errors with descriptive messages (caught by controllers)
- Return data objects with formatted dates for API responses

### Database Connection

Database initializes on server startup via `src/server.js`:
1. Connects using Sequelize (`connectDB()`)
2. Auto-syncs models in development mode (`sync({ alter: true })`)
3. Connection pooling configured (max: 5, acquire: 30s, idle: 10s)

## Response Handling & Logging

### Response Format
All API responses use standardized format via `src/core/handler.js`:

```json
{
  "status": true|false,
  "transactionId": "...",
  "resCode": "20000",
  "data": { /* response data */ },
  "error": {
    "developerMessage": "...",
    "userMessage": "..."
  }
}
```

### Logging System
- **Winston-based logging** with structured JSON format
- **Request correlation IDs** via `X-Correlation-ID` header using AsyncLocalStorage
- **Better Stack integration** for centralized log management
- **Multi-level logging**: DEBUG, INFO, WARN, ERROR, FATAL
- **File logging**: Separate error.log and combined.log files
- **Log levels**: DEBUG in development, INFO in production

### Multi-Language Support
Error messages defined in `src/config/message.properties.js` with Thai/English variants. Response codes in `src/config/constants.js` map to appropriate localized messages.

## API Structure

All routes mounted under `/api` prefix:

### Authentication Routes (`/api/auth/*`)
- `/api/auth/register` - User registration (public)
- `/api/auth/login` - User login (public)
- `/api/auth/refresh-token` - Refresh access token (public)
- `/api/auth/logout` - User logout (protected)
- `/api/auth/logout-all` - Logout from all devices (protected)
- `/api/auth/change-password` - Change password (protected)

### User Profile Routes (`/api/user/*`)
- `/api/user/profile` - Get/update user profile (protected)

**Authentication:** Bearer token in Authorization header for protected routes.

### Access/Refresh Token Flow
The API implements OAuth-style authentication with separate access and refresh tokens:
- **Access tokens**: 15-minute expiration, used for API requests
- **Refresh tokens**: 7-day expiration, used to obtain new access tokens
- **Session management**: Max 2 active sessions per user with automatic cleanup
- **Token storage**: Managed via `UserToken` model with device tracking

## Environment Variables

Required in `.env` file (see `.env.example`):

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRE` - Token expiration (e.g., "24h")
- `CORS_ORIGIN` - CORS allowed origins

## Key Dependencies

- **express** - Web framework
- **sequelize** - ORM for PostgreSQL with MySQL support
- **joi** - Request validation schemas (not express-validator)
- **jsonwebtoken** - JWT generation/verification with access/refresh token support
- **bcryptjs** - Password hashing (10 rounds)
- **moment** - Date/time formatting for API responses
- **winston** - Structured logging with custom formatters
- **@logtail/node** - Better Stack integration for centralized logging
- **async-local-storage** - Request correlation ID management
