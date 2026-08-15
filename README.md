# Noble — Personal Finance Dashboard

A clean, terminal-inspired personal finance dashboard built with Next.js, SQLite, and Tailwind CSS. Track money across multiple accounts, currencies (USD, EUR, DA), and time periods.

## Features

### Authentication
- **First-run setup** — create your account on first visit (`/setup`)
- **JWT-based auth** — HTTP-only session cookies, 7-day expiry
- **Configurable credentials** — change username/password from Settings
- **Environment variables** — set `JWT_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD` in `.env`

### Multi-currency support
- Track accounts in different currencies (USD, EUR, DA — Algerian Dinar)
- Real-time currency conversion between accounts
- Display totals in your preferred currency via settings

### Overview screen
- **Money flow chart** — daily (1M) or monthly (3M/6M/1Y) income vs. spending trend with hover details
- **Accounts history chart** — multi-line running balance chart per account with:
  - Daily view in 1M period, monthly view otherwise
  - Clickable data points for detailed drill-down (income, outcome, balance per day/month)
  - Multi-select account filtering with color-coded badges
- **Currency breakdown** — balances grouped by currency
- **Smart KPIs** — Money In, Money Out, Net, Avg Income, Avg Spend, Top Category, Total Accounts, Biggest Tx, Debts

### Analytics
- **Trend analysis** — line chart with income, spend, net over time
- **Breakdown** — donut chart by category, account, or payment method
- **Volume comparison** — bar chart for income vs spend
- **Granularity** — day, week, month, quarter, year
- **Slice/dice** — filter by type (income/spend), category, account, method
- **Drill-down** — click chart points or pie segments to navigate to filtered views

### Navigation
- **Overview** — money flow charts, account history, KPIs, recent activity, upcoming bills/debts
- **Analytics** — advanced charts with drill-down and roll-up
- **Accounts** — all accounts grouped by currency, total balance
- **Income** — filter by salary, income sources, or transactions
- **Spending** — spending by category with visual bars, max spender highlighted
- **Debts** — track what you owe and who owes you
- **Transactions** — full transaction list with search
- **Budgets** — set and track spending budgets per category

### Data management
- **Add transactions** — inline modal with merchant, amount, account, currency auto-detection
- **Smart categories** — auto-suggest categories based on merchant name
- **Account transfers** — move money between accounts
- **Salaries** — configure salary sources (fixed amount or linked to a transaction)
- **Subscriptions, bills, debts** — recurring and one-off tracking
- **Budgets** — set and track spending budgets per category

### Technical
- SQLite backend via `better-sqlite3`
- Server-side data fetching with client hydration
- SSR-compatible initial data loading
- Pure CSS + Tailwind styling (no UI framework)
- Recharts for visualizations
- Next.js 16 with Proxy-based routing

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch the dashboard.

## First-run setup

On first visit, you'll be redirected to `/setup` to create your account:

```bash
curl -s -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"<your-username>","password":"<your-password>"}'
```

## Configuration

Copy `.env.example` to `.env` and adjust:

```env
JWT_SECRET=your-64-char-hex-secret-here
AUTH_USERNAME=
AUTH_PASSWORD=
```

- `JWT_SECRET` — 64-character hex string for signing JWTs. If omitted, a random secret is generated and stored in `.jwt-secret`.
- `AUTH_USERNAME` / `AUTH_PASSWORD` — optional credentials used to seed the first account. If omitted, create the account through `/setup`.
- On Netlify, set `AUTH_USERNAME` and `AUTH_PASSWORD` with Functions/Runtime scope. These credentials are read directly at runtime; `/setup` is disabled when both are configured.
- SQLite remains suitable for local development. Netlify functions use temporary storage unless `NOBLE_DATA_DIR` points to a persistent mounted storage location; use a managed database for persistent production data.

## Project structure

```
app/
  page.tsx              — SSR entry point, initial data computation
  api/
    data/route.ts       — main data endpoint (accounts, transactions, totals, history)
    analytics/route.ts  — analytics aggregations with filters
    auth/
      setup/route.ts    — first-run user creation
      login/route.ts    — JWT login
      logout/route.ts   — session logout
    transactions/       — CRUD transactions
    accounts/           — account operations
    ...
components/
  DashboardClient.tsx   — client shell, screen navigation
  OverviewScreen.tsx    — charts, money flow, account history, KPIs
  AnalyticsScreen.tsx   — advanced analytics with drill-down
  AccountHistoryChart   — interactive multi-line balance chart
  AddModal.tsx          — add transaction modal
  SettingsModal.tsx     — settings with credential change
  Sidebar.tsx           — navigation
  Header.tsx            — date navigation, logout
lib/
  auth.ts               — password hashing, JWT issue/verify
  jwt-secret.ts         — JWT secret management
  currency.ts           — formatting & conversion utilities
  schema.ts             — SQLite schema & migrations
proxy.ts                — Next.js proxy (auth middleware)
```

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: SQLite via `better-sqlite3`
- **Charts**: Recharts
- **Auth**: `jose` (JWT) + `crypto.scrypt` (password hashing)
- **Styling**: Tailwind CSS + inline styles
