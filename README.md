# Embroidery Billing Software

A desktop-first billing application for embroidery businesses, built with Next.js and Electron.

This project helps generate invoices, manage customers, track payment status, export PDF bills, and view billing reports from a single interface.

## Tech Stack

- Next.js 15 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Radix UI
- Electron (desktop shell)
- LocalStorage-based persistence
- React PDF for invoice rendering

## Key Features

- Bill creation with dynamic itemized calculations
- Real-time bill preview
- Customer management
- Payment status tracking (`pending`, `partial`, `paid`)
- PDF invoice generation and export
- Billing reports and filters
- Profile and invoice settings management

## Project Structure

```text
src/
	app/                 # Next.js routes and pages
	components/          # Reusable React components
	services/            # Client-side storage and domain services
	types/               # Shared TypeScript types and schemas
	lib/                 # Utility and billing calculation logic
electron/              # Electron main/preload process files
docs/                  # Product and architecture documentation
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later

## Getting Started

1. Install dependencies:

```bash
npm ci
```

2. Run web development mode:

```bash
npm run dev
```

3. Run Electron + Next.js development mode:

```bash
npm run electron-dev
```

## Available Scripts

- `npm run dev`: Start Next.js dev server on port 9002
- `npm run build`: Build Next.js app
- `npm run start`: Start Next.js production server
- `npm run lint`: Run Next.js lint checks
- `npm run typecheck`: Run TypeScript checks without emit
- `npm run electron-dev`: Run Next.js and Electron together for desktop development
- `npm run electron-start`: Start Electron app
- `npm run electron-build`: Build distributable desktop app with Electron Builder

## Data and Storage

Current implementation stores business data in browser/Electron localStorage:

- Bills
- Customers
- Profile details
- Invoice settings

If you plan to deploy for multiple users or shared access, migrate persistence to a database-backed service.

## AI Integration

Genkit is configured at `src/ai/genkit.ts` with Google AI plugin support.

If your usage requires credentials, configure environment variables locally (for example in a `.env.local` file) and never commit secrets.

## Quality Gate

Before opening a pull request, run:

```bash
npm run typecheck
npm run lint
```

The same checks run in GitHub Actions CI.

Note: `npm run build` currently fails with static export because the app includes
a dynamic route at `src/app/bills/[billId]`. If you want full static export,
you will need to refactor dynamic routing or implement static params generation.

## Contributing

Open an issue or pull request with a clear summary, scope, and validation details.

## Security

Report security concerns privately through GitHub Security Advisories.

## License

This repository is licensed under the MIT License. See `LICENSE`.
