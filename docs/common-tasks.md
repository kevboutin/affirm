# Common Tasks

## Adding New Endpoints

1. Create route handler in appropriate `src/routes/` directory
2. Implement proper validation using Zod schemas
3. Add error handling following error-handling patterns
4. Write tests following testing patterns
5. Update OpenAPI documentation

## Modifying Authentication

1. Understand existing auth flow in `src/routes/auth/`
2. Maintain security standards (see security guidelines)
3. Update tests for authentication changes
4. Document changes in OpenAPI schemas

## Database Changes

1. Use repository pattern (see database patterns)
2. Add proper validation for data models
3. Update tests for database operations
4. Consider migrations for schema changes

## Performance Optimization

- Optimize database queries
- Use appropriate caching strategies where applicable
- Monitor and optimize critical paths
