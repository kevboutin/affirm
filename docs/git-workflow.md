# Git Workflow

## Commit Messages
- Follow commit message conventions (commitlint is configured)
- Use conventional commit format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Use meaningful commit messages
- Limit first line to 72 characters

## Commit Hooks
- Pre-commit hook runs linting and test:lint
- Commit-msg hook validates commit message format
- Pre-push hook may run additional checks

## Branching
- Follow the existing branching strategy
- Maintain clean commit history
