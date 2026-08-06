# Noble — Personal Finance Dashboard

A clean, terminal-inspired personal finance dashboard built with Next.js, SQLite, and Tailwind CSS. Track money across multiple accounts, currencies (USD, EUR, DA), and time periods.

## Features

### Multi-currency support
- Track accounts in different currencies (USD, EUR, DA — Algerian Dinar)
- Real-time currency conversion between accounts
- Display totals in your preferred currency via settings

### Overview screen
- **Money flow chart** — 6-month income vs. spending trend with hover details
- **Accounts history chart** — multi-line running balance chart per account with:
  - Clickable data points for detailed drill-down (income, outcome, balance per month)
  - Multi-select account filtering with color-coded badges
  - Live count of visible accounts (`7 / 11`)
- **Currency breakdown** — balances grouped by currency
- **Quick stats** — money in, money out, net, debts owed/owed to you

### Navigation
- **Overview** — money flow charts, account history, recent activity, upcoming bills/debts
- **Accounts** — all accounts grouped by currency, total balance
- **Income** — filter by salary, income sources, or transactions
- **Spending** — spending by category with visual bars, max spender highlighted
- **Debts** — track what you owe and who owes you
- **Transactions** — full transaction list with search

### Data management
- **Add transactions** — inline modal with merchant, amount, account, currency auto-detection
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

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch the dashboard.

## Project structure

```
app/
  page.tsx              — SSR entry point, initial data computation
  api/data/             — SQLite-backed API routes
    route.ts            — main data endpoint (accounts, transactions, totals, history)
    transactions/       — CRUD transactions
    accounts/           — account operations
components/
  DashboardClient.tsx   — client shell, screen navigation
  OverviewScreen.tsx    — charts, money flow, account history
  AccountHistoryChart   — interactive multi-line balance chart
  AccountsScreen.tsx    — account list by currency
  IncomeScreen.tsx      — income/spending breakdown
  SpendingScreen.tsx    — category spending bars
  DebtsScreen.tsx       — debt tracking
  TransactionsScreen.tsx — transaction list
  AddModal.tsx          — add transaction modal
  Sidebar.tsx           — navigation
  Header.tsx            — date navigation
lib/
  currency.ts           — formatting & conversion utilities
  schema.ts             — SQLite schema & types


# init user : 

```
curl -s -X POST http://localhost:3000/api/auth/setup -H "Content-Type: application/json" -d '{"username":"admin","password":"securepass"}' > /dev/null && curl -s -D - -o /dev/null http://localhost:3000/ 2>&1 | grep -i "location"
```