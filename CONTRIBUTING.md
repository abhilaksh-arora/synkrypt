# Contributing to Synkrypt

Thank you for your interest in contributing to Synkrypt! We welcome contributions from the community to help make Synkrypt the most secure and localized secrets manager.

## Monorepo Structure

Synkrypt is organized as a monorepo using [Bun workspaces](https://bun.sh/docs/install/workspaces):

- `cli/`: The Synkrypt CLI tool.
- `server/`: The Synkrypt backend node (Express/PostgreSQL).
- `web/`: The Synkrypt dashboard (React/Vite).

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abhilaksh/synkrypt.git
   cd synkrypt
   ```

2. **Install dependencies**:
   We use Bun for dependency management.
   ```bash
   bun install
   ```

3. **Development**:
   Start both the server and the dashboard in development mode from the root:
   ```bash
   bun dev
   ```

## Contribution Process

1. Fork the repo.
2. Create a new feature branch.
3. Commit your changes with descriptive messages.
4. Open a Pull Request!

## Security

If you find a security vulnerability, please do NOT open a public issue. Instead, contact the maintainers directly.
