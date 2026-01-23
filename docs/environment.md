# Environment Configuration

## Environment Variables
- Use environment variables for all configuration
- Never hardcode configuration values
- Reference `.env.example` for required variables

## .env.example
- Maintain `.env.example` with all required variables
- Document new environment variables in `.env.example`
- Follow the existing environment variable structure

## Environment Files
- Development: `.env` (gitignored)
- Example: `.env.example` (committed)
- Use `dotenv` and `dotenv-expand` for loading
