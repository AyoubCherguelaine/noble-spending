import { db } from './db';

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (key TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_ar TEXT NOT NULL, color TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, type TEXT NOT NULL DEFAULT 'owe', note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, merchant TEXT NOT NULL, category TEXT NOT NULL,
      method TEXT, account_id INTEGER, original_currency TEXT NOT NULL DEFAULT 'USD', original_amount REAL NOT NULL,
      converted_amount REAL NOT NULL, type TEXT DEFAULT 'spend', note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      salary_id TEXT
    );
    CREATE TABLE IF NOT EXISTS salaries (
      id TEXT PRIMARY KEY, company TEXT NOT NULL, role TEXT, gross REAL, net REAL NOT NULL,
      payday TEXT, type TEXT, date TEXT, currency TEXT DEFAULT 'USD', month INTEGER NOT NULL, year INTEGER NOT NULL,
      method TEXT DEFAULT 'Salary', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, terms TEXT, amount REAL NOT NULL,
      status TEXT DEFAULT 'Active', next_invoice TEXT, date TEXT, currency TEXT DEFAULT 'USD', month INTEGER NOT NULL, year INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, plan TEXT, cost REAL NOT NULL,
      next_billing TEXT, date TEXT, currency TEXT DEFAULT 'USD', month INTEGER NOT NULL, year INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, cost REAL NOT NULL, average REAL,
      date TEXT, currency TEXT DEFAULT 'USD', month INTEGER NOT NULL, year INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, person TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'owe',
      total REAL NOT NULL, remaining REAL NOT NULL, due TEXT, date TEXT, note TEXT, currency TEXT DEFAULT 'USD', status TEXT DEFAULT 'active', month INTEGER NOT NULL, year INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, category_key TEXT NOT NULL, budget_amount REAL NOT NULL,
      month INTEGER NOT NULL, year INTEGER NOT NULL, currency TEXT DEFAULT 'USD'
    );
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL DEFAULT 'spend', category TEXT NOT NULL,
      method TEXT, account_id INTEGER, merchant TEXT NOT NULL, original_currency TEXT DEFAULT 'USD',
      original_amount REAL NOT NULL, note TEXT, frequency TEXT NOT NULL DEFAULT 'monthly',
      start_date TEXT, end_date TEXT, next_occurrence TEXT, last_generated_at TEXT,
      active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transaction_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'spend',
      category TEXT NOT NULL, method TEXT, account_id INTEGER, merchant TEXT NOT NULL,
      original_currency TEXT DEFAULT 'USD', original_amount REAL NOT NULL, note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'card',
      details TEXT, icon TEXT, network TEXT, last4 TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'bank', currency TEXT NOT NULL DEFAULT 'USD',
      details TEXT, icon TEXT, balance REAL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, category TEXT,
      osm_id TEXT, osm_type TEXT, address TEXT, latitude REAL, longitude REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS external_cache (
      provider TEXT NOT NULL,
      cache_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      PRIMARY KEY (provider, cache_key)
    );
    CREATE TABLE IF NOT EXISTS purchase_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      merchant TEXT,
      purchase_date TEXT,
      amount REAL,
      currency TEXT,
      card_last4 TEXT,
      matched_method_id INTEGER,
      category TEXT,
      note TEXT,
      confidence REAL DEFAULT 0,
      raw_text TEXT,
      place_id TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source, external_id)
    );
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions(next_occurrence);
    CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(active);
    CREATE VIRTUAL TABLE IF NOT EXISTS transactions_fts USING fts5(merchant, category, method, note, content=transactions, content_rowid=id);
  `);

  try {
    const salariesInfo = db.pragma('table_info(salaries)') as any[];
    const idCol = salariesInfo.find((c: any) => c.name === 'id');
    if (idCol && idCol.type === 'integer') {
      const rows = db.prepare('SELECT * FROM salaries').all() as any[];
      db.exec(`
        CREATE TABLE salaries_new (
          id TEXT PRIMARY KEY, company TEXT NOT NULL, role TEXT, gross REAL, net REAL NOT NULL,
          payday TEXT, type TEXT, date TEXT, month INTEGER NOT NULL, year INTEGER NOT NULL
        );
      `);
      const uuidStmt = db.prepare('INSERT INTO salaries_new (id, company, role, gross, net, payday, type, date, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const row of rows) {
        uuidStmt.run(crypto.randomUUID(), row.company, row.role, row.gross, row.net, row.payday, row.type, row.date, row.month, row.year);
      }
      db.exec('DROP TABLE salaries; ALTER TABLE salaries_new RENAME TO salaries;');
    }
  } catch (e) {
    console.error('Salary UUID migration failed:', e);
  }

  try {
    const salaryInfo = db.pragma('table_info(salaries)') as any[];
    if (!salaryInfo.some((c: any) => c.name === 'method')) {
      db.exec("ALTER TABLE salaries ADD COLUMN method TEXT DEFAULT 'Salary';");
    }
  } catch (e) {
    console.error('Salary method migration failed:', e);
  }

  try {
    const txInfo = db.pragma('table_info(transactions)') as any[];
    const hasSalaryId = txInfo.some((c: any) => c.name === 'salary_id');
    if (!hasSalaryId) {
      db.exec('ALTER TABLE transactions ADD COLUMN salary_id TEXT;');
    }
  } catch (e) {
    console.error('Transaction salary_id migration failed:', e);
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_salary_id ON transactions(salary_id);');
  } catch (e) {
    console.error('Transaction salary_id index creation failed:', e);
  }

  try {
    const txInfo = db.pragma('table_info(transactions)') as any[];
    if (!txInfo.some((c: any) => c.name === 'account_id')) {
      db.exec('ALTER TABLE transactions ADD COLUMN account_id INTEGER;');
    }
  } catch (e) {
    console.error('Transaction account_id migration failed:', e);
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);');
  } catch (e) {
    console.error('Transaction account_id index creation failed:', e);
  }

  const addCurrencyIfMissing = (table: string) => {
  try {
    const pmInfo = db.pragma('table_info(payment_methods)') as any[];
    if (!pmInfo.some((c: any) => c.name === 'network')) {
      db.exec('ALTER TABLE payment_methods ADD COLUMN network TEXT;');
    }
    if (!pmInfo.some((c: any) => c.name === 'last4')) {
      db.exec('ALTER TABLE payment_methods ADD COLUMN last4 TEXT;');
    }
  } catch (e) {
    console.error('Payment methods network/last4 migration failed:', e);
  }

  try {
    const merchInfo = db.pragma('table_info(merchants)') as any[];
    if (!merchInfo.some((c: any) => c.name === 'osm_id')) {
      db.exec('ALTER TABLE merchants ADD COLUMN osm_id TEXT;');
    }
    if (!merchInfo.some((c: any) => c.name === 'osm_type')) {
      db.exec('ALTER TABLE merchants ADD COLUMN osm_type TEXT;');
    }
    if (!merchInfo.some((c: any) => c.name === 'address')) {
      db.exec('ALTER TABLE merchants ADD COLUMN address TEXT;');
    }
    if (!merchInfo.some((c: any) => c.name === 'latitude')) {
      db.exec('ALTER TABLE merchants ADD COLUMN latitude REAL;');
    }
    if (!merchInfo.some((c: any) => c.name === 'longitude')) {
      db.exec('ALTER TABLE merchants ADD COLUMN longitude REAL;');
    }
  } catch (e) {
    console.error('Merchants OSM/location migration failed:', e);
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_candidates_source_external ON purchase_candidates(source, external_id);');
  } catch (e) {
    console.error('Purchase candidates source/external index creation failed:', e);
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_candidates_status ON purchase_candidates(status);');
  } catch (e) {
    console.error('Purchase candidates status index creation failed:', e);
  }

  try {
      const info = db.pragma(`table_info(${table})`) as any[];
      if (!info.some((c: any) => c.name === 'currency')) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN currency TEXT DEFAULT 'USD';`);
      }
    } catch (e) {
      console.error(`Currency migration failed for ${table}:`, e);
    }
  };

  addCurrencyIfMissing('services');
  addCurrencyIfMissing('subscriptions');
  addCurrencyIfMissing('bills');
  addCurrencyIfMissing('debts');
  addCurrencyIfMissing('budgets');
  addCurrencyIfMissing('salaries');

  try {
    const debtInfo = db.pragma('table_info(debts)') as any[];
    if (!debtInfo.some((c: any) => c.name === 'date')) {
      db.exec('ALTER TABLE debts ADD COLUMN date TEXT;');
    }
  } catch (e) {
    console.error('Debt date migration failed:', e);
  }

  try {
    const debtInfo = db.pragma('table_info(debts)') as any[];
    if (!debtInfo.some((c: any) => c.name === 'status')) {
      db.exec('ALTER TABLE debts ADD COLUMN status TEXT DEFAULT \'active\';');
    }
  } catch (e) {
    console.error('Debt status migration failed:', e);
  }

  try {
    db.exec(`CREATE TRIGGER IF NOT EXISTS transactions_ai AFTER INSERT ON transactions BEGIN
      INSERT INTO transactions_fts(rowid, merchant, category, method, note) VALUES (new.id, new.merchant, new.category, new.method, new.note);
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS transactions_ad AFTER DELETE ON transactions BEGIN
      INSERT INTO transactions_fts(transactions_fts, rowid, merchant, category, method, note) VALUES ('delete', old.id, old.merchant, old.category, old.method, old.note);
    END;`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS transactions_au AFTER UPDATE ON transactions BEGIN
      INSERT INTO transactions_fts(transactions_fts, rowid, merchant, category, method, note) VALUES ('delete', old.id, old.merchant, old.category, old.method, old.note);
      INSERT INTO transactions_fts(rowid, merchant, category, method, note) VALUES (new.id, new.merchant, new.category, new.method, new.note);
    END;`);
  } catch (e) {
    console.error('FTS5 trigger creation failed:', e);
  }

  try {
    const ftsInfo = db.pragma('table_info(transactions_fts)') as any[];
    if (!ftsInfo.length) {
      db.exec('INSERT INTO transactions_fts(rowid, merchant, category, method, note) SELECT id, merchant, category, method, note FROM transactions;');
    }
  } catch (e) {
    console.error('FTS5 initial population failed:', e);
  }
}
