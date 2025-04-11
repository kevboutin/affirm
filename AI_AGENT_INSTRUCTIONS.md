# AI Agent Instructions

## Project Overview

This is a TypeScript/Node.js project that implements an authentication system with various OAuth/OIDC endpoints. The project uses modern JavaScript/TypeScript practices and follows a structured architecture.

## Key Components

- Authentication handlers (`src/routes/auth/auth.handlers.ts`)
- Environment configuration (`.env*` files)
- JWT-based authentication
- Role-based access control
- Database integration

## Development Guidelines

### 1. Code Style

- Follow TypeScript best practices
- Use proper type annotations
- Maintain consistent code formatting (prettier is configured)
- Follow the existing project structure

### 2. Security Considerations

- Never expose sensitive information (private keys, secrets)
- Always validate user input
- Follow OAuth/OIDC security best practices
- Use environment variables for configuration
- Maintain proper error handling and logging

### 3. Testing

- Write unit tests for new functionality
- Maintain existing test coverage
- Use the configured testing framework (Vitest)
- Follow the existing test patterns

### 4. Authentication Flow

- Understand the OAuth/OIDC flows implemented
- Maintain proper token validation
- Follow the established error handling patterns
- Keep security headers consistent

### 5. Database Operations

- Use the provided repository pattern
- Follow existing data access patterns
- Maintain proper error handling

### 6. Error Handling

- Use appropriate HTTP status codes
- Provide meaningful error messages
- Log errors appropriately
- Maintain consistent error response format

### 7. Documentation

- Document new endpoints and functionality
- Update README when adding significant features
- Maintain inline code documentation
- Follow existing documentation patterns

### 8. Environment Configuration

- Use appropriate environment variables
- Maintain `.env.example` with required variables
- Follow the existing environment structure
- Document new environment variables

### 9. Git Workflow

- Follow commit message conventions
- Use meaningful commit messages
- Maintain clean commit history
- Follow the existing branching strategy

### 10. Performance Considerations

- Optimize database queries
- Use appropriate caching strategies
- Follow established performance patterns
- Monitor and optimize critical paths

## Common Tasks

### Adding New Endpoints

1. Create new route handler
2. Implement proper validation
3. Add error handling
4. Write tests
5. Update documentation

### Modifying Authentication

1. Understand existing auth flow
2. Maintain security standards
3. Update tests
4. Document changes

### Database Changes

1. Use repository pattern
2. Add proper validation
3. Update tests
4. Consider migrations

## Best Practices

- Always validate input
- Use proper error handling
- Maintain test coverage
- Follow security guidelines
- Document changes
- Use type safety
- Follow established patterns

## Common Pitfalls to Avoid

- Exposing sensitive information
- Skipping input validation
- Ignoring error handling
- Breaking existing patterns
- Neglecting documentation
- Skipping tests
- Using hardcoded values

## Support

For questions or issues:

1. Check existing documentation
2. Review code examples
3. Follow established patterns
4. Consult with team members
