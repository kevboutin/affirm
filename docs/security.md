# Security Guidelines

## Sensitive Information
- **Never** expose private keys, secrets, or credentials in code
- Use environment variables for all configuration
- Never commit `.env` files or hardcoded secrets

## Input Validation
- Always validate user input using Zod schemas
- Validate all request parameters, body, and query strings
- Follow OAuth/OIDC security best practices

## Authentication & Authorization
- Maintain proper token validation for JWT tokens
- Keep security headers consistent across endpoints
- Understand the OAuth/OIDC flows implemented in the project (see `src/routes/auth/`)

## Error Handling
- Never expose sensitive information in error messages
- Log errors appropriately without leaking secrets
- Use appropriate HTTP status codes for security-related errors
