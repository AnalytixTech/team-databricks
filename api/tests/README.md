# Test Structure Documentation

This directory contains all tests for the Fleetly backend application, organized into a clear and maintainable structure.

## Directory Structure

```
tests/
├── unit/                          # Unit tests (fast, mocked dependencies)
│   └── controllers/               # Controller unit tests
│       ├── auth.controller.test.ts      (82.88% coverage)
│       ├── user.controller.test.ts      (91.66% coverage)
│       ├── car.controller.test.ts       (71.42% coverage)
│       ├── reservation.controller.test.ts (43.23% coverage)
│       ├── payment.controller.test.ts   (62.37% coverage)
│       ├── chat.controller.test.ts      (100% coverage)
│       └── dashboard.controller.test.ts (20.83% coverage)
├── helpers/                       # Shared test utilities
│   ├── test-utils.ts             # Test helper functions & assertions
│   └── mocks.ts                  # Mock configurations for services
├── setup/                         # Test environment setup
│   └── unit.ts                   # Unit test setup (all mocked)
└── README.md                     # This file
```

## Test Strategy

### Unit Tests (Current Approach)
- **Location**: `tests/unit/`
- **Purpose**: Test individual units in isolation
- **Speed**: Fast (< 1s per test, ~20s for all 73 tests)
- **Dependencies**: All external dependencies are mocked
- **Database**: Mocked (no real database)
- **Run Command**: `npm test`
- **Coverage**: ~48% overall, 56% controllers

## Available Test Scripts

### Main Commands
- **`npm test`** - Run all tests with coverage report (recommended)
- **`npm run test:watch`** - Run tests in watch mode for development
- **`npm run test:ci`** - Run tests in CI mode (optimized for CI/CD)

### Running Specific Tests
To run specific test files during development, use Jest directly:
```bash
# Run single test file
npx jest tests/unit/controllers/auth.controller.test.ts

# Run in watch mode
npx jest tests/unit/controllers/car.controller.test.ts --watch

# Run without coverage (faster)
npx jest tests/unit/controllers/payment.controller.test.ts --no-coverage
```

## Test Utilities

### Test Helper Functions
Located in `tests/helpers/test-utils.ts`:
- `createTestUser()` - Generate test user data
- `createTestCar()` - Generate test car data
- `createTestReservation()` - Generate test reservation data
- `createTestPayment()` - Generate test payment data
- `createTestChat()` - Generate test chat data
- `createMockRequest()` - Create mock Express request
- `createMockResponse()` - Create mock Express response
- `expectErrorWithStatus()` - Assert error responses
- `expectSuccessResponse()` - Assert success responses
- `expectCreatedResponse()` - Assert 201 responses

### Mock Configurations
Located in `tests/helpers/mocks.ts`:
- All external services are mocked
- Environment variables are set for testing
- Mongoose models are mocked for unit tests

## Writing Tests

### Unit Test Example
```typescript
import { createTestUser, expectSuccessResponse } from '../../helpers/test-utils';
import * as controller from '../../../src/controllers/example.controller';

describe('Example Controller', () => {
  it('should do something', async () => {
    const testData = createTestUser();
    // ... test implementation
    expectSuccessResponse(mockResponse, testData);
  });
});
```

### Best Practices
1. **Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should describe the behavior
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Keep unit tests fast
5. **Use Test Utilities**: Leverage shared helper functions
6. **Clean Up**: Tests should clean up after themselves

## Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Test Directory**: `tests/unit/`
- **Setup File**: `tests/setup/unit.ts`
- **Timeout**: 30 seconds per test
- **Coverage Thresholds**: 45% statements, 25% branches, 40% functions, 45% lines

### Test Environment
All external dependencies are mocked for fast, isolated testing:
- **Services**: Payment, Email, Cloudinary, Geocoding
- **Database**: Mongoose models are mocked
- **Environment Variables**: Automatically set in `tests/setup/unit.ts`

### Mocked Services
Located in `tests/helpers/mocks.ts`:
- `@sendgrid/mail` - Email service
- `cloudinary` - Image upload service
- `payment.service` - Paystack payment API
- `geocoding.service` - Location geocoding API

## Coverage Reports

Coverage reports are generated in the `coverage/` directory after running tests with the `--coverage` flag.

### Current Coverage (Unit Tests)
- **Overall:** ~48% statements, ~27% branches
- **Controllers:** 56% statements, 31% branches
- **High Coverage:**
  - Chat Controller: 100% 🎉
  - User Controller: 91.66%
  - Auth Controller: 82.88%
- **Medium Coverage:**
  - Car Controller: 71.42%
  - Payment Controller: 62.37%
- **Needs Improvement:**
  - Reservation Controller: 43.23%
  - Dashboard Controller: 20.83%

### Viewing Coverage Reports
Open `backend/coverage/index.html` in your browser to see:
- Line-by-line coverage highlighting
- Interactive navigation to uncovered code
- Visual indicators for covered/uncovered branches

## Current Test Statistics

- **Total Tests:** 73 passing
- **Test Suites:** 7 passing
- **Controllers Tested:** 7/7 (100%)
- **Average Test Execution Time:** ~20s for all unit tests

## Continuous Integration

For CI environments, use:
```bash
npm run test:ci
```

This command:
- Runs all tests once (no watch mode)
- Generates coverage reports
- Limits workers for CI environment (maxWorkers=2)
- Exits with appropriate status codes
- Perfect for GitHub Actions, GitLab CI, etc.

## Test Philosophy

This project uses **unit tests with comprehensive mocking** for the following reasons:

1. **Speed**: All 73 tests run in ~20 seconds
2. **Reliability**: No external dependencies or database required
3. **Isolation**: Each test verifies one specific behavior
4. **CI/CD Friendly**: Fast feedback loop in pipelines
5. **Developer Experience**: Instant feedback during development

## Future Enhancements

Potential areas for expanding test coverage:
- **Services Layer**: Add unit tests for payment, email, geocoding services
- **Middleware**: Test authentication, validation, error handling
- **Models**: Test mongoose schema validations and methods
- **Socket.IO**: Test real-time chat functionality
- **E2E Tests**: Full workflow tests with real API calls (if needed)