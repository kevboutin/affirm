# API Design

## Endpoints
- Use RESTful conventions
- Authentication routes: `src/routes/auth/`
- User routes: `src/routes/users/`
- Role routes: `src/routes/roles/`

## Validation
- Use Zod for request validation
- Define schemas in OpenAPI format using `@hono/zod-openapi`
- Validate all inputs before processing

## Documentation
- Document new endpoints using OpenAPI schemas
- Schemas are located in `src/openapi/schemas/`
- Use OpenAPI helpers for consistent documentation
- API documentation is available at `/reference` (Scalar UI)

## Response Format
- Maintain consistent response formats
- Use appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
- See existing route handlers for response format examples
