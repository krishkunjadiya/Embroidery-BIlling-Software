# Contributing

Thanks for your interest in improving Embroidery Billing Software.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

```bash
npm ci
```

3. Start development mode:

```bash
npm run dev
```

4. For desktop integration during development, run:

```bash
npm run electron-dev
```

## Quality Checks

Run these before opening a pull request:

```bash
npm run typecheck
npm run lint
npm run build
```

## Branching and Commits

- Create feature branches from `main`.
- Keep commits small and focused.
- Use clear commit messages (example: `feat: add export summary cards`).

## Pull Requests

- Fill out the pull request template.
- Include screenshots or short recordings for UI changes.
- Mention any breaking changes.
- Link related issues.

## Code Style

- Use TypeScript where possible.
- Keep components focused and reusable.
- Do not introduce unrelated refactors in the same PR.

## Reporting Bugs

Open a GitHub issue using the Bug Report template with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node, npm, Electron version)
