# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (with nodemon)
npm run dev

# Start production server
npm start

# Run all tests with coverage
npm test

# Run specific test file
npm test -- tests/unit/services/auth.service.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should login user"

# Database operations (requires migrations to be set up)
npm run db:migrate
npm run db:migrate:undo
npm run db:seed
```

## Architecture Overview

### Three-Layer Pattern
All API features follow this flow:
```
Controller (request handler) → Service (business logic) → Model (Sequelize ORM)
```

- **Controllers** (`src/controllers/`): Handle HTTP requests/responses only. Delegate to services.
- **Services** (`src/services/`): Business logic, validation, database operations via `db.util.js`.
- **Models** (`src/models/`): Sequelize models with hooks, associations, and `toJSON()` for hiding sensitive fields.

### Three-Table User System
Critical for understanding user data structure:
1. **User**: Profile info (username, email, firstName, lastName, isActive)
2. **UserAuth**: Authentication data (password hash, failedAttempts, lockedUntil, isVerified) - shares primary key with User
3. **UserToken**: Session management (accessToken, refreshToken, deviceInfo) - one-to-many with User

### Response Format Standardization
All responses use this format (see `src/core/handler.js`):

**Success:**
```javascript
{ status: true, transactionId: "...", resCode: "20000", data: {...} }
```

**Error:**
```javascript
{ status: false, transactionId: "...", resCode: "40001", error: { developerMessage: "...", userMessage: "..." } }
```

Response codes (`resCode`) are numeric codes defined in `src/config/constants.js` - first 3 digits map to HTTP status. Multi-language messages mapped via `src/config/message.maping.js` to `src/config/message.properties.js` (Thai/English).

### Response Code Mapping Architecture

The API uses a three-tier response code system for consistent, localized error handling:

**1. RES_CODE Constants (`src/config/constants.js`)**
```javascript
export const RES_CODE = {
  // 200 - Success
  SUCCESS: 20000,
  REGISTRATION_SUCCESS: 20010,
  LOGIN_SUCCESS: 20011,

  // 400 - Bad Request
  INVALID_REQUEST: 40000,
  INVALID_PARAMETER: 40001,
  PARAMETER_IS_MISSING: 40002,

  // 401 - Unauthorized
  AUTHENTICATION_REQUIRED: 40100,
  TOKEN_INVALID: 40111,
  TOKEN_EXPIRED: 40112,

  // 403 - Forbidden
  FORBIDDEN: 40300,
  ACCESS_DENIED: 40321,

  // 404 - Not Found
  USER_NOT_FOUND: 40402,
  FILE_NOT_FOUND: 40403,

  // 409 - Conflict
  EMAIL_ALREADY_EXISTS: 40900,
  USERNAME_ALREADY_EXISTS: 40902,

  // 500 - Server Error
  INTERNAL_ERROR: 50000,
  PLEASE_TRY_AGAIN: 50001,
};
```

**Code Format**: `{HTTP_STATUS}{SEQUENTIAL_NUMBER}`
- First 3 digits = HTTP status code (200, 400, 401, 403, 404, 409, 500)
- Last 2 digits = sequential identifier for that status type

**2. RES_CODE_MESSAGE_MAPPING (`src/config/message.maping.js`)**
```javascript
import { RES_CODE } from './constants.js';
import { resMessage } from './message.properties.js';

export const RES_CODE_MESSAGE_MAPPING = {
  [RES_CODE.SUCCESS]: resMessage.common.success,
  [RES_CODE.USER_NOT_FOUND]: resMessage.notFound.userNotFound,
  [RES_CODE.EMAIL_ALREADY_EXISTS]: resMessage.auth.emailAlreadyExists,
  // ... maps all RES_CODE to message objects
};
```

**3. Response Messages (`src/config/message.properties.js`)**
```javascript
export const resMessage = {
  common: {
    success: { en: 'Successful with data.', th: 'ทำรายการสำเร็จ' },
    error: { en: 'Sorry, system not available.', th: 'ระบบไม่สามารถให้บริการได้' },
  },
  auth: {
    loginSuccess: { en: 'Login successful', th: 'เข้าสู่ระบบสำเร็จ' },
    emailAlreadyExists: { en: 'Email already exists', th: 'อีเมลนี้มีผู้ใช้งานแล้ว' },
  },
  // ... organized by category matching HTTP status codes
};
```

### Usage Pattern

**In Services (throwing errors):**
```javascript
import { RES_CODE } from '../config/constants.js';
import { genErrorResponseObj } from '../core/handler.js';

// User not found
throw genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, 'User not found');

// Invalid parameter
throw genErrorResponseObj(req, RES_CODE.INVALID_PARAMETER, 'Email is required');

// Email already exists
throw genErrorResponseObj(req, RES_CODE.EMAIL_ALREADY_EXISTS, 'User with this email already exists');
```

**In Controllers (success responses):**
```javascript
import { RES_CODE } from '../config/constants.js';
import { genResponseObj, response } from '../core/handler.js';

// Success response
return response(req, res, genResponseObj(req, RES_CODE.SUCCESS, result));

// Specific success
return response(req, res, genResponseObj(req, RES_CODE.LOGIN_SUCCESS, result));
```

### Message Resolution Flow

1. Service throws: `genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, '...')`
2. Handler receives error with `resCode: 40402`
3. `resolveMessageObj()` in `src/core/handler.js` looks up `RES_CODE_MESSAGE_MAPPING[40402]`
4. Returns `resMessage.notFound.userNotFound` object
5. `getLanguage(req)` extracts language from `x-language` header
6. Returns appropriate `userMessage` in Thai or English

### Adding New Response Codes

When adding new error/success scenarios:

1. **Add RES_CODE** to `src/config/constants.js` in appropriate HTTP section:
   ```javascript
   // 400 - Bad Request
   YOUR_NEW_ERROR: 40005,  // Next sequential number
   ```

2. **Add message** to `src/config/message.properties.js`:
   ```javascript
   yourCategory: {
     yourNewError: {
       en: 'Your error message in English',
       th: 'ข้อความผิดพลาดภาษาไทย',
     },
   }
   ```

3. **Add mapping** to `src/config/message.maping.js`:
   ```javascript
   [RES_CODE.YOUR_NEW_ERROR]: resMessage.yourCategory.yourNewError,
   ```

4. **Use in code**:
   ```javascript
   throw genErrorResponseObj(req, RES_CODE.YOUR_NEW_ERROR, 'Developer message');
   ```

### Authentication Flow
- JWT with **separate secrets** for access tokens (15min) and refresh tokens (7d) - security requirement
- Tokens stored in `UserToken` table for validation and revocation
- Max 2 active sessions per user with device tracking
- Account locking: 5 failed attempts → 30-minute lock

### Key Utilities
- `src/utils/db.util.js`: Wrapper for Sequelize operations (`findOne`, `findAll`, `create`, `update`, `delete`) - services use this instead of calling models directly
- `src/utils/jwt.util.js`: Token generation and verification with type checking (`access` vs `refresh`)
- `src/utils/app-logger.util.js`: Structured logging with trace data support (see Logging Architecture below)
- `src/utils/trace.util.js`: AsyncLocalStorage for request correlation tracking
- `src/utils/sanitize.util.js`: Input sanitization utilities (XSS prevention, SQL injection protection, etc.)
- `src/middleware/sanitize.middleware.js`: Automatic request body/query/params sanitization middleware
- `src/validators/`: Joi schemas - validate before service layer

### Input Sanitization Usage

**Available sanitization functions:**
```javascript
import {
  sanitizeString,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeUsername,
  sanitizePath,
  sanitizeSQL,
  sanitizeNoSQL,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeURL,
  stripTags
} from './utils/sanitize.util.js';
```

**Using sanitization middleware:**
```javascript
import { sanitizeAll } from './middleware/sanitize.middleware.js';

// Apply to all routes (comprehensive sanitization)
router.use(sanitizeAll);

// Or apply selectively
router.use(sanitizeBody);  // Body only
router.use(sanitizeQuery);  // Query params only
router.use(sanitizeParams);  // URL params only
```

**Manual sanitization in controllers/services:**
```javascript
import { sanitizeString, sanitizeHTML } from './utils/sanitize.util.js';

// Sanitize user input
const cleanInput = sanitizeString(userInput);
const safeHTML = sanitizeHTML(userContent);
```

### Response Handling Pattern
Controllers use this pattern for all responses (see `src/core/handler.js`):

**Success Response:**
```javascript
import { RES_CODE } from '../config/constants.js';
import { genResponseObj, response } from '../core/handler.js';

return response(req, res, genResponseObj(req, RES_CODE.SUCCESS, result));
```

**Error Response (from services):**
```javascript
import { RES_CODE } from '../config/constants.js';
import { genErrorResponseObj } from '../core/handler.js';

// Throw error in service
throw genErrorResponseObj(req, RES_CODE.USER_NOT_FOUND, 'User not found');

// Controller handles with responseError
return responseError(req, res, error);
```

**Handler Functions (`src/core/handler.js`):**
- `genResponseObj(req, resCode, data)` → Creates `{ status: true, transactionId, resCode, data }`
- `response(req, res, responseObj)` → Logs, sets HTTP status from resCode (first 3 digits), sends JSON
- `responseError(req, res, error)` → Handles errors, auto-maps to localized messages via RES_CODE_MESSAGE_MAPPING
- `genErrorResponseObj(req, resCode, developerMessage)` → Creates error object for throwing

**Language Detection:**
Messages are localized based on `x-language` header (`th` or `en`, defaults to `th`):
```javascript
// Request header
headers: {
  'x-language': 'en'  // or 'th'
}

// Response will use corresponding language
{
  "status": false,
  "resCode": 40402,
  "error": {
    "userMessage": "User not found"  // English version
  }
}
```

## Logging Architecture

### Application Logger (`src/utils/app-logger.util.js`)

The app provides structured logging with automatic trace data injection via AsyncLocalStorage. All log methods automatically include `correlation_id` and `user_id` from request context.

### Log Levels (Syslog Severity)
- **FATAL (CRIT)**: Critical errors causing service failure
- **ERROR**: Error-level logging
- **WARNING**: Warning-level for client errors (4xx) and slow operations
- **NOTICE**: Normal but significant messages (info, service calls, performance)
- **INFO**: HTTP requests/responses, email events
- **DEBUG**: Database operations, verbose debugging

### Logger Methods

```javascript
import { appLogger } from './utils/app-logger.util.js';

// Fatal/Critical errors
appLogger.logFatal(message, error, details);

// Debug logging
appLogger.logDebug(message, details);

// Info logging
appLogger.logInfo(message);

// Warning logging
appLogger.logWarn(message, details);

// Error logging
appLogger.logError(message, error, details);

// HTTP request/response logging (with timing)
appLogger.logRequestReceived(req);
appLogger.logResponse(req, res, responseData, statusCode);
appLogger.logResponseError(req, error, statusCode);

// Database operations (with slow query tracking)
appLogger.logDatabase(operation, tableName, details);

// Service call logging
appLogger.logService(serviceName, operation, details);

// Performance metrics (>1000ms triggers WARNING)
appLogger.logPerformance(operation, duration, details);

// Email events
appLogger.logEmail(action, success, details);
```

### Automatic Behavior

- **Trace Data**: All logs automatically include `correlation_id` and `user_id` from AsyncLocalStorage
- **Timing**: HTTP logs use `hrtime.bigint()` for nanosecond-precision duration tracking
- **Error Severity**: `logResponseError` automatically uses WARNING for 4xx, ERROR for 5xx
- **Performance**: `logPerformance` automatically uses WARNING for operations >1000ms
- **Response Size**: `logResponse` automatically calculates and sets `Content-Length` header

### Log Types
- `FATAL`: Critical system failures
- `DEBUG`: Debug information
- `HTTP`: HTTP request/response lifecycle
- `DB`: Database operations
- `SERVICE`: Service method calls
- `PERFORMANCE`: Performance metrics
- `EMAIL`: Email sending events

### Core Logger (`src/core/logger.js`)

Underlying Winston logger with:
- **File transports**: `error.log` (errors only), `combined.log` (all levels)
- **Console transport**: Colored output for development
- **Better Stack integration**: Optional centralized log management via `LOGTAIL_SOURCE_TOKEN`
- **Structured JSON**: All logs output as JSON for parsing

### Trace Context (`src/utils/trace.util.js`)

Uses AsyncLocalStorage to maintain request context across async operations:
- `correlation_id`: From `x-transaction-id` or `x-correlation-id` header, or generated UUID
- `user_id`: Attached from authenticated user in `req.user`

## API Endpoints

### API Versioning
All API endpoints use versioning: `/api/v1/...`

**Version Structure:**
- `/api/health` - Health check (no version)
- `/api/v1/*` - All versioned endpoints

**Adding New Features:**
New features should be added to the current version (v1) unless:
- Breaking changes are required
- Need for backward compatibility
- Separate feature set requiring independent versioning

### Public Endpoints (v1)
- `POST /api/v1/auth/register` - User registration (returns access + refresh tokens)
- `POST /api/v1/auth/login` - User login (returns access + refresh tokens)
- `GET /api/health` - Health check (no version)

### Protected Endpoints (require `Authorization: Bearer <token>`)
- `POST /api/v1/auth/refresh-token` - Refresh access token using refresh token
- `POST /api/v1/auth/logout` - Logout current session
- `POST /api/v1/auth/logout-all` - Logout all sessions
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/email-verification/status` - Check email verification status
- `POST /api/v1/email-verification/resend` - Resend verification email
- `POST /api/v1/email-verification/verify` - Verify email with token
- `POST /api/v1/email-verification/request-password-reset` - Request password reset
- `POST /api/v1/email-verification/reset-password` - Reset password with token
- `POST /api/v1/files/upload` - Upload file (multipart/form-data)
- `GET /api/v1/files` - List user's files
- `GET /api/v1/files/:fileId` - Get file metadata
- `GET /api/v1/files/download` - Download file
- `DELETE /api/v1/files/:fileId` - Delete file
- `GET /api/v1/files/storage/info` - Get storage quota

### Protected Endpoints (v1) - File Upload

All file upload endpoints require authentication and use the file upload system powered by Multer.

**File Upload Response Codes:**
- `20011` - FILE_UPLOAD_SUCCESS: File uploaded successfully
- `20012` - FILE_DOWNLOAD_SUCCESS: File download ready
- `20013` - FILE_DELETE_SUCCESS: File deleted successfully
- `50101` - INVALID_FILE_TYPE: Invalid file type
- `50102` - FILE_TOO_LARGE: File exceeds size limit (10MB)
- `50103` - STORAGE_ERROR: Storage write failure
- `40004` - FILE_NOT_FOUND: File not found
- `40005` - ACCESS_DENIED: Access denied (owner mismatch)
- `40006` - QUOTA_EXCEEDED: User quota exceeded
- `50401` - INVALID_FILENAME: Invalid filename characters
- `40001` - NO_FILE_PROVIDED: No file in request

**Endpoints:**
- `POST /api/v1/files/upload` - Upload file (multipart/form-data, field name: "file")
  - Max file size: 10MB
  - Allowed types: Images (jpg, png, gif), PDF, Office docs, CSV
  - Automatic filename sanitization (path traversal prevention)
- `GET /api/v1/files` - List user's files (with pagination)
- `GET /api/v1/files/:fileId` - Get file metadata
- `GET /api/v1/files/download?path=...` - Download file by path
- `DELETE /api/v1/files/:fileId` - Delete file (owner only)
- `GET /api/v1/files/storage/info` - Get user storage quota information

**File Upload Configuration:**
- Storage path: `uploads/` with user subdirectories
- Filename format: `{basename}-{timestamp}{random}{extension}`
- User quota: 10GB per user
- Max files per request: 5

**Security Features:**
- File type validation by MIME type
- File size limits enforced at middleware level
- Path traversal protection (`../` removed)
- Filename sanitization (special chars removed)
- Ownership verification (users can only access their own files)
- User-specific storage directories

## Security Features

- **Password Security**: bcrypt with 10 rounds, complexity requirements (8+ chars, uppercase, lowercase, number, special char)
- **Account Locking**: 5 failed login attempts → 30-minute account lock
- **Session Management**: Max 2 active sessions per user, device tracking, oldest session revoked when limit exceeded
- **Token Storage**: Tokens stored in database for revocation capability
- **Request Correlation**: Transaction IDs via `x-transaction-id` header for security monitoring (see Logging Architecture)
- **Input Sanitization**: Utilities available in `src/utils/sanitize.util.js` for preventing XSS, injection attacks

### Input Sanitization (Optional)

**Note:** Sanitization middleware is available but **NOT enabled by default**. Use selectively based on your security requirements.

**Available Middleware:**
- `src/middleware/sanitize.middleware.js`
  - `sanitizeBody` - Sanitize request body (POST/PUT)
  - `sanitizeQuery` - Sanitize query parameters (?key=value)
  - `sanitizeParams` - Sanitize URL parameters (/user/:id)
  - `sanitizeAll` - Apply all sanitizers (comprehensive)

**How to Enable:**
```javascript
// Option 1: Apply to all routes (comprehensive)
import { sanitizeAll } from './middleware/sanitize.middleware.js';
router.use(sanitizeAll);

// Option 2: Apply selectively
import { sanitizeBody } from './middleware/sanitize.middleware.js';
router.post('/api/v1/user/profile', sanitizeBody, userProfileController.updateProfile);
```

**Trade-offs:**
- ⚠️ **Performance**: Additional processing on every request
- ⚠️ **Trimming**: Strings are trimmed automatically (may affect user input)
- ⚠️ **Over-sanitization**: May sanitize legitimate content (edge cases)
- ⚠️ **Double Processing**: Joi validates + sanitization = duplicate work

**Best Practices:**
- ✅ Use for **external/untrusted input**: search params, user content, comments
- ✅ Use **selectively** based on route sensitivity
- ❌ **Avoid** for **Joi-validated fields**: credentials, emails already validated
- ❌ **Avoid** for **internal/trusted data**: database records, system data

## File Naming Conventions

- Services: `*.service.js` in `src/services/`
- Controllers: `*.controller.js` in `src/controllers/`
- Routes: `*.route.js` in `src/routes/v{N}/` (versioned)
- Version Aggregators: `index.js` in `src/routes/v{N}/`
- Validators: `*.validator.js` in `src/validators/`
- Models: `*.model.js` in `src/models/`

## Adding New Features

Follow this pattern when adding new API endpoints:

1. Create Joi validation schema in `src/validators/`
2. Create service in `src/services/` (business logic + db.util calls)
3. Create controller in `src/controllers/` (request/response handling)
4. Create route in `src/routes/v1/` (define endpoints + middleware)
5. Import route in `src/routes/v1/index.js`
6. Main routes are auto-mounted via `src/routes/routes.js`

**Important:**
- All new routes go into `src/routes/v1/` (or current version)
- Use `../../` for imports when in version subdirectories (e.g., `../../controllers/`)
- Health check stays in `src/routes/routes.js` (no version)

## Testing Strategy

Tests use ES modules with Babel transformation. Key setup in `tests/setup.js`:

**Mocking approach:**
- Database, app-config, app-logger are mocked globally before imports
- Integration tests mock models at class level (User.findOne = jest.fn())
- JWT tests can generate real tokens using test secrets from setup.js
- EmailSendingService is mocked as default export with `__esModule: true`

**Important:** ES modules evaluate imports before mocks execute. For integration tests, mocks must be declared before importing app:

```javascript
jest.mock('../../src/config/database.js');
jest.mock('../../src/models/model.js');
import app from '../../src/app.js'; // import AFTER mocks
```

## Configuration

Environment variables in `.env` - critical security requirements:
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be **different** and ≥32 characters (enforced at startup)
- Sequelize uses `DB_DIALECT` (postgres/mysql) for database selection
- Email verification has configurable requirements (login, profile, sensitive operations)

Config loaded via `src/config/app-config.js` with validation defaults.

See `.env.example` for all available configuration options including:
- Service configuration (name, version)
- Database connection settings
- Database retry configuration (max retries, delays, backoff multiplier)
- JWT token expiration times
- CORS origins (comma-separated for multiple)
- Email provider settings (SMTP or Gmail)
- Email verification behavior
- Better Stack logtail integration (optional)

## Route Registration

**Current Structure (v1):**
```
src/routes/
├── routes.js           # Main aggregator (mounts /api prefix)
└── v1/
    ├── index.js          # v1 aggregator (mounts /v1)
    ├── auth.route.js
    ├── user.route.js
    └── email-verification.route.js
```

**Adding Routes to v1:**
1. Create route file in `src/routes/v1/`
2. Import in `src/routes/v1/index.js`
3. Use `../../` for imports (e.g., `../../controllers/`)

**Adding New Versions:**
1. Create `src/routes/v2/` directory
2. Copy/adapt routes from v1
3. Create `src/routes/v2/index.js`
4. Add to `src/routes/routes.js`: `router.use('/v2', v2Routes);`

## Important Gotchas

### ES Module Specific
- **Import Order for Mocking**: ES modules evaluate imports **before** mocks execute. Mocks must be declared BEFORE importing the module being tested (see `tests/integration/auth.integration.test.js:5-16`)
- **__dirname/__filename**: Requires `fileURLToPath` pattern in ES modules (see `src/config/app-config.js:11-12`)

### Database/Sequelize
- **db.util Wrapper**: Services MUST use `src/utils/db.util.js` wrappers, not direct model calls. Pattern: `findOne(User, { criteria: { email } })` not `User.findOne({ where: { email } })`
- **Shared Primary Key**: UserAuth uses `userId` as PK (same as User.id) - this is intentional, not a mistake (see `src/models/user-auth.model.js:119-129`)
- **Model Hooks**: Password hashing is handled in `beforeCreate`/`beforeUpdate` hooks - never hash manually in services (see `src/models/user-auth.model.js:179-192`)
- **Transaction Flow**: Transactions pass Controller → Service → db.util → Sequelize. All db.util operations support transactions
- **Connection Retry**: Database connection has automatic retry with exponential backoff on startup and health check every 30s for runtime reconnection (see `src/config/database.js:46-144`)

### Authentication
- **JWT Secret Separation**: Access and refresh tokens MUST use different secrets (validated at import time in `src/utils/jwt.util.js:24-28`)
- **Token Validation Chain**: Middleware checks 5 things: token presence, JWT signature, database record exists, token not expired, user is active (see `src/middleware/auth.middleware.js:17-100`)
- **req.user Attachment**: Contains Sequelize User model instance, not plain data. Also has `req.token` for UserToken record (see `src/middleware/auth.middleware.js:86-87`)
- **Session Limit**: Max 2 active sessions per user - OLDEST session is revoked when limit exceeded (not newest) (see `src/models/user-token.model.js:171-200`)

### Error Handling
- **Throw vs Return**: Services throw errors (via `genErrorResponseObj`), middleware handles them via `responseError` (see `src/core/handler.js:66-90`)
- **Error Code Mapping**: First 3 digits of `resCode` map to HTTP status (e.g., `40401` → 404, `20002` → 200) (see `src/core/handler.js:9-13`)

### Testing
- **Mock Order**: Declare mocks before any imports that depend on them. Pattern in `tests/setup.js:34-91` and `tests/integration/auth.integration.test.js:5-16`
- **JWT Expiration Tests**: Don't use fake timers - manually construct a JWT with an expired `exp` timestamp (see `tests/unit/utils/jwt.util.test.js:60-84`)

### Configuration
- **JWT Validation**: Happens at module import time, not runtime. Invalid secrets will crash on startup (see `src/utils/jwt.util.js:8-29`)
- **Config Caching**: Config is cached when imported - changes to `.env` require server restart
- **Database Retry**: Automatic connection retry with exponential backoff (configured via `APP_CONFIG.database.retry` in `src/config/app-config.js`)
  - `maxRetries`: Maximum connection attempts (default: 10)
  - `initialDelay`: Initial retry delay in ms (default: 2000)
  - `maxDelay`: Maximum retry delay in ms (default: 30000)
  - `backoffMultiplier`: Exponential backoff multiplier (default: 2)
  - `retrySync`: Retry database sync if it fails after connection (default: true)
  - Runtime health checks every 30 seconds for automatic reconnection
