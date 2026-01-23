# Items Flagged for Deletion

The following items from the original AGENTS.md are flagged as candidates for removal:

## Too Vague / Not Actionable
- ❌ "Follow TypeScript best practices" - Too vague, agent already knows TypeScript
- ❌ "Follow the existing project structure" - Too vague, structure is visible in codebase
- ❌ "Follow established patterns" - Too vague, appears multiple times
- ❌ "Check existing documentation" - Obvious, agent does this automatically
- ❌ "Review code examples" - Obvious, agent does this automatically

## Redundant (Already Covered Elsewhere)
- ❌ "Always validate input" - Covered in security.md and api-design.md
- ❌ "Use proper error handling" - Covered in error-handling.md
- ❌ "Maintain test coverage" - Covered in testing.md
- ❌ "Follow security guidelines" - Covered in security.md
- ❌ "Document changes" - Covered in api-design.md
- ❌ "Skipping input validation" - Redundant with security guidelines
- ❌ "Ignoring error handling" - Redundant with error-handling.md
- ❌ "Breaking existing patterns" - Too vague
- ❌ "Neglecting documentation" - Redundant with api-design.md
- ❌ "Skipping tests" - Redundant with testing.md

## Obvious / Agent Already Knows
- ❌ "Use proper type annotations" - Agent uses TypeScript correctly by default
- ❌ "Maintain consistent code formatting" - Prettier handles this automatically
- ❌ "Use type safety" - TypeScript provides this by default
- ❌ "Using hardcoded values" - Covered in environment.md

## Not Actionable for AI Agent
- ❌ "Consult with team members" - AI agent cannot do this

## Decision Required
Please review these items and indicate:
1. **DELETE** - Remove from documentation
2. **KEEP** - Keep but move to appropriate section
3. **REWRITE** - Keep concept but make more specific/actionable
