# Authentication API Tests

This directory contains comprehensive tests for the Node.js authentication API.

## Test Structure

```
tests/
├── setup.js                    # Test configuration and global setup
├── unit/                       # Unit tests
│   ├── controllers/            # Controller layer tests
│   ├── middleware/             # Middleware tests
│   ├── services/               # Business logic tests
│   └── utils/                  # Utility function tests
├── integration/                # Integration tests
└── README.md                   # This file
```

## Test Coverage

### Unit Tests
- **JWT Utility Tests** (`unit/utils/jwt.util.test.js`)
  - Token generation and verification
  - Error handling for invalid/expired tokens
  - Token payload validation

- **Auth Middleware Tests** (`unit/middleware/auth.middleware.test.js`)
  - Token extraction from headers
  - User authentication and validation
  - Error handling for various failure scenarios
  - Response format validation

- **Auth Controller Tests** (`unit/controllers/auth.controller.test.js`)
  - Request/response handling
  - Transaction management
  - Error propagation and rollback
  - Response object generation

- **Auth Service Tests** (`unit/services/auth.service.test.js`)
  - Business logic validation
  - Database interaction mocking
  - User registration and login flows
  - Profile management operations

### Integration Tests
- **Complete API Flow** (`integration/auth.integration.test.js`)
  - End-to-end authentication flow
  - Protected route access
  - Error response format validation
  - Request header handling
  - Multi-language support

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test Files
```bash
# Unit tests only
npm test -- tests/unit

# Integration tests only
npm test -- tests/integration

# Specific test file
npm test -- tests/unit/services/auth.service.test.js
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Generate Coverage Report
```bash
npm test -- --coverage --coverageReporters=text-lcov | coveralls
```

## Test Environment

Tests run in a controlled environment with:
- Mocked database connections
- Mocked external dependencies
- Controlled JWT secrets
- Isolated test data

## Mock Strategy

### Database Layer
- Sequelize models are mocked
- Database operations return predictable test data
- Transaction management is simulated

### External Services
- JWT operations use test secrets
- Logging is muted to reduce noise
- External API calls are mocked

### Time-dependent Operations
- Date/time operations use fixed values
- Token expiration scenarios are controllable

## Key Test Scenarios

### Authentication Flow
1. User registration with valid/invalid data
2. Duplicate user handling
3. Login with correct/incorrect credentials
4. Account locking scenarios
5. Token generation and validation

### Protected Resources
1. Access with valid JWT tokens
2. Access with invalid/expired tokens
3. Missing authentication headers
4. User profile management
5. Logout functionality

### Error Handling
1. Validation errors with detailed messages
2. Database connection failures
3. Malformed request data
4. Unsupported HTTP methods
5. Server error scenarios

### Response Format
1. Standardized success responses
2. Structured error responses
3. Transaction ID handling
4. Multi-language error messages
5. HTTP status code mapping

## Best Practices

### Test Organization
- Each test file focuses on a single responsibility
- Tests are grouped by functionality using `describe` blocks
- Clear, descriptive test names
- Proper setup and teardown

### Mocking Strategy
- Mock external dependencies, not internal logic
- Use consistent mock data across tests
- Reset mocks between tests
- Avoid over-mocking

### Assertions
- Test both positive and negative scenarios
- Validate response formats, not just status codes
- Check error message content and structure
- Verify side effects (database calls, etc.)

## Debugging Tests

### Console Output
Tests mock console methods to reduce noise. To enable logging:
```javascript
// In individual test files
beforeEach(() => {
  jest.restoreAllMocks();
});
```

### Breakpoints
Use `debugger;` statements in test files and run with:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

## Coverage Requirements

Aim for:
- **Lines**: >90%
- **Functions**: >90%
- **Branches**: >85%
- **Statements**: >90%

Coverage reports are generated in the `coverage/` directory.

## Continuous Integration

Tests are configured to run automatically in CI/CD pipelines with:
- Parallel test execution
- Coverage reporting
- Test result aggregation
- Failure notifications