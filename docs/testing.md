# Testing Patterns

## Framework
- Use **Vitest** for all tests
- Test files use `.test.ts` suffix
- Mirror the source file structure in test files

## Test Execution
- `npm run test` - Runs lint-staged checks and unit tests with coverage
- `npm run test:unit` - Runs unit tests only (with 11s timeout)
- Tests run with `NODE_ENV=test`

## Test Patterns
- Write unit tests for all new functionality
- Maintain existing test coverage levels
- Use AAA pattern (Arrange, Act, Assert) where applicable

## Coverage
- Coverage reports are generated automatically
- Maintain coverage for critical paths
