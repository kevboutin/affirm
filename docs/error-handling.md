# Error Handling

## HTTP Status Codes
- Use appropriate HTTP status codes:
  - `400` - Bad Request (invalid input)
  - `401` - Unauthorized (authentication required)
  - `403` - Forbidden (authorization failed)
  - `404` - Not Found
  - `500` - Internal Server Error

## Error Messages
- Provide meaningful error messages for debugging
- Never expose sensitive information in error responses
- Use consistent error response format (see OpenAPI error schemas)

## Error Response Format
- Follow the established error response patterns
- Use the OpenAPI error schema helpers (`createError`, `createAuthError`)
- Maintain consistent error structure across all endpoints

## Logging
- Log errors appropriately using the configured logger (Pino)
- Include relevant context without exposing secrets
- Use appropriate log levels (error, warn, info)
