# ALTONSHOTEL Management System (AHMS)

A complete Hotel Management System built with modern web technologies and Oracle Database.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), TypeScript, Tailwind CSS, React Router |
| Backend | Node.js, Netlify Functions, TypeScript |
| Database | Oracle Database XE (Dev), Oracle Cloud Always Free (Production) |
| Version Control | Git, GitHub |

## Project Structure

```
ALTONSHOTEL/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── context/       # React Context (Auth)
│   │   ├── services/      # API client layer
│   │   ├── types/         # TypeScript interfaces
│   │   ├── layouts/       # Page layouts
│   │   └── utils/         # Helper functions
│   └── ...
├── netlify/
│   └── functions/         # Backend API functions
│       └── _shared/       # Shared utilities (DB, middleware, types)
├── database/
│   ├── schema/            # CREATE TABLE scripts
│   ├── seeds/             # Sample data
│   ├── procedures/        # PL/SQL packages
│   └── triggers/          # Oracle triggers
└── netlify.toml           # Netlify configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Oracle Database XE (for local development)
- Git

### Frontend Setup

```bash
cd frontend
npm install
cp ../.env.example .env
npm run dev
```

The frontend runs on http://localhost:5173

### Backend Setup (Netlify Functions)

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start local dev server
netlify dev
```

### Database Setup

1. Connect to Oracle Database XE
2. Run `database/schema/001_create_tables.sql`
3. Run `database/seeds/001_seed_data.sql`
4. Run PL/SQL packages from `database/procedures/`
5. Run triggers from `database/triggers/`

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `ORACLE_HOST` | Oracle DB host (default: localhost) |
| `ORACLE_PORT` | Oracle DB port (default: 1521) |
| `ORACLE_SERVICE_NAME` | Oracle service name (default: XEPDB1) |
| `ORACLE_USER` | Database username |
| `ORACLE_PASSWORD` | Database password |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

## License

Proprietary - ALTONSHOTEL
