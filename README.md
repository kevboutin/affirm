# affirm

A Node.js containerized service for RESTful APIs using hono for handling authentication and authorization for serverless and plain containerized workloads using zod for validations, and mongoose as an ORM for MongoDB.

## Prerequisites

-   Node.js (v18 or higher)
-   MongoDB (v6.0 or higher)
-   npm, pnpm or yarn

## Getting Started

To install and run the service, you can use NPM:

```
npm install
npm run dev
```

You can send requests to the API via:

```
open http://localhost:3000
```

## Configuration

Copy `.env.example` to `.env` and change the values to suit your environment.

```env
NODE_ENV=development
PORT=3000
DB_NAME=items
DB_URL=mongodb://127.0.0.1:27017/
LOG_LEVEL=info
CORS_ORIGIN=*
```

## Documentation

API documentation can be found at http://localhost:3000/reference with the raw OpenAPI specification at http://localhost:3000/doc. I would recommend using the reference URL to use the API.

## Testing

To run unit tests, use the following:

```
npm run test
```

## Project Structure

```
├── src/
│   ├── db/                # Data schemas
│   │   ├── models/        # Database models
│   │   └── repositories/  # Database models
│   ├── middleware/        # Middleware
│   ├── openapi/
│   │   ├── helpers/       # Documentation helpers
│   │   └── schemas/       # Schemas
│   ├── routes/            # API routes
│   │   ├── items/         # Item CRUD
│   │   ├── roles/         # Role CRUD
│   │   └── users/         # User CRUD
│   └── app.mjs            # App entry point
└── .env                   # Environment variables
```

## Available Scripts

-   `npm run dev` - Start the development server with hot-reload
-   `npm start` - Start the production server
-   `npm run lint` - Run the linter
-   `npm run test` - Run tests

## Features

### Core Technologies

-   **[Hono](https://hono.dev/)** - Lightweight, ultrafast web framework
-   **[MongoDB](https://www.mongodb.com/)** with **[Mongoose](https://mongoosejs.com/)** - NoSQL database with elegant ODM
-   **[Zod](https://zod.dev/)** - Schema validation

### API Features

-   RESTful API architecture
-   OpenAPI + Scalar documentation
-   Request validation and sanitization
-   Error handling middleware
-   Security response headers
-   GZip compression
-   JWT authentication (WIP)
-   Role-based access control (RBAC) (WIP)
-   Rate limiting (WIP)
-   CORS support

### Developer Experience

-   Hot reload development server
-   Prettier code formatting
-   Vitest testing setup
-   Environment variable management
-   Comprehensive logging system

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Style Guide

### Code Style

-   We use Prettier for code formatting
-   Max line length is 120 characters
-   Use 4 spaces for indentation
-   Use double quotes for strings
-   Always use semicolons
-   Use camelCase for variables and functions
-   Use PascalCase for classes
-   Use UPPER_SNAKE_CASE for constants

### Naming Conventions

-   **Files**: Use camelCase for filenames (e.g., `userController.mjs`)
-   **Folders**: Use kebab-case for folder names (e.g., `api-routes`)
-   **Classes**: Use PascalCase (e.g., `UserController`)
-   **Types**: Use PascalCase (e.g., `UserResponse`)
-   **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
-   **Variables**: Use camelCase (e.g., `userData`)
-   **Functions**: Use camelCase (e.g., `getUserById`)

### API Endpoints

-   Use plural nouns for resources (e.g., `/users`, `/items`)
-   Use kebab-case for multi-word resources (e.g., `/user-profiles`)
-   Use proper HTTP methods:
    -   GET: Retrieve resources
    -   POST: Create resources
    -   PUT: Update resources (full updates only)
    -   PATCH: Partially update resources
    -   DELETE: Remove resources

### Git Commit Messages

-   Use the present tense ("Add feature" not "Added feature")
-   Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
-   Limit the first line to 72 characters or less
-   Structure commits as follows:

    ```
    <type>(<scope>): <subject>

    <body>

    <footer>
    ```

-   Types:
    -   feat: New feature
    -   fix: Bug fix
    -   docs: Documentation changes
    -   style: Code style changes (formatting, etc)
    -   refactor: Code refactoring
    -   test: Adding or updating tests
    -   chore: Maintenance tasks

### Documentation

-   All public APIs must be documented
-   Use JSDoc for function and class documentation
-   Include examples in documentation when helpful
-   Keep documentation up to date with code changes

### Testing

-   Write unit tests for all new features
-   Follow AAA pattern (Arrange, Act, Assert)
-   Test files should mirror the file structure of the code
-   Name test files with `.test.mjs` suffix
-   Use meaningful test descriptions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
