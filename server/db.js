import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'urjamitra.db');
export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      village_name TEXT NOT NULL,
      district TEXT,
      state TEXT,
      facility_name TEXT NOT NULL,
      facility_type TEXT,
      appliances_json TEXT NOT NULL,
      has_generator INTEGER DEFAULT 0,
      generator_hours REAL DEFAULT 0,
      daily_kwh REAL DEFAULT 0,
      monthly_bill REAL DEFAULT 0,
      diesel_expense REAL DEFAULT 0,
      carbon_kg_monthly REAL DEFAULT 0,
      field_worker_name TEXT,
      status TEXT DEFAULT 'synced',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feasibility_studies (
      id TEXT PRIMARY KEY,
      village_name TEXT NOT NULL,
      enterprise_type TEXT NOT NULL,
      capital_cost REAL NOT NULL,
      subsidy_amount REAL DEFAULT 0,
      net_investment REAL NOT NULL,
      monthly_opex REAL NOT NULL,
      monthly_revenue REAL NOT NULL,
      net_profit REAL NOT NULL,
      break_even_months REAL NOT NULL,
      payback_years REAL NOT NULL,
      roi_percent REAL NOT NULL,
      solar_kwp REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      synced_at TEXT NOT NULL,
      audits_count INTEGER DEFAULT 0,
      feasibility_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'success'
    );
  `);

  // Seed with realistic demo rural audits if empty
  const count = db.prepare('SELECT count(*) as total FROM audits').get().total;
  if (count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertAudit = db.prepare(`
    INSERT INTO audits (
      id, village_name, district, state, facility_name, facility_type,
      appliances_json, has_generator, generator_hours, daily_kwh,
      monthly_bill, diesel_expense, carbon_kg_monthly, field_worker_name,
      status, notes, created_at, updated_at
    ) VALUES (
      @id, @village_name, @district, @state, @facility_name, @facility_type,
      @appliances_json, @has_generator, @generator_hours, @daily_kwh,
      @monthly_bill, @diesel_expense, @carbon_kg_monthly, @field_worker_name,
      @status, @notes, @created_at, @updated_at
    )
  `);

  const initialAudits = [
    {
      id: 'audit-seed-1',
      village_name: 'Rampur Gram Panchayat',
      district: 'Surguja',
      state: 'Chhattisgarh',
      facility_name: 'Community Hall & PDS Center',
      facility_type: 'Community Building',
      appliances_json: JSON.stringify([
        { id: '1', type: 'light', name: 'Lights / Tube lights', count: 6, watts: 40, efficientWatts: 9, hoursPerDay: 6 },
        { id: '2', type: 'fan', name: 'Ceiling Fans', count: 3, watts: 75, efficientWatts: 28, hoursPerDay: 8 },
        { id: '3', type: 'fridge', name: 'Refrigerator / Cooler', count: 1, watts: 160, efficientWatts: 85, hoursPerDay: 24 }
      ]),
      has_generator: 1,
      generator_hours: 3.5,
      daily_kwh: 7.08,
      monthly_bill: 1210,
      diesel_expense: 9660,
      carbon_kg_monthly: 425.2,
      field_worker_name: 'Sunita Marawi (Asha / Field Mitra)',
      status: 'synced',
      notes: 'Heavy diesel reliance during 4-hour daily evening load-shedding.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'audit-seed-2',
      village_name: 'Araku Valley Hamlet #4',
      district: 'Alluri Sitharama Raju',
      state: 'Andhra Pradesh',
      facility_name: 'Primary Health Sub-Centre',
      facility_type: 'Healthcare Sub-Centre',
      appliances_json: JSON.stringify([
        { id: '1', type: 'light', name: 'Lights / Tube lights', count: 8, watts: 40, efficientWatts: 9, hoursPerDay: 10 },
        { id: '2', type: 'fan', name: 'Ceiling Fans', count: 4, watts: 75, efficientWatts: 28, hoursPerDay: 12 },
        { id: '3', type: 'fridge', name: 'Vaccine Deep Freezer', count: 1, watts: 200, efficientWatts: 90, hoursPerDay: 24 }
      ]),
      has_generator: 1,
      generator_hours: 4.0,
      daily_kwh: 11.6,
      monthly_bill: 1980,
      diesel_expense: 11040,
      carbon_kg_monthly: 590.8,
      field_worker_name: 'K. Ramesh (Rural Energy Mitra)',
      status: 'synced',
      notes: 'Vaccine cold chain preservation is critical. Requires dedicated solar backup.',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'audit-seed-3',
      village_name: 'Bastar Tribal Cluster',
      district: 'Bastar',
      state: 'Chhattisgarh',
      facility_name: 'Maa Danteshwari SHG Millet Processing Unit',
      facility_type: 'Micro-Enterprise / Agro-processing',
      appliances_json: JSON.stringify([
        { id: '1', type: 'mill', name: 'Millet Huller Motor (3 HP)', count: 1, watts: 2200, efficientWatts: 1800, hoursPerDay: 5 },
        { id: '2', type: 'light', name: 'Lights / Tube lights', count: 4, watts: 40, efficientWatts: 9, hoursPerDay: 6 },
        { id: '3', type: 'fan', name: 'Ceiling Fans', count: 2, watts: 75, efficientWatts: 28, hoursPerDay: 6 }
      ]),
      has_generator: 0,
      generator_hours: 0,
      daily_kwh: 12.86,
      monthly_bill: 2190,
      diesel_expense: 0,
      carbon_kg_monthly: 316.3,
      field_worker_name: 'Pooja Netam (Enterprise Mobilizer)',
      status: 'synced',
      notes: 'Frequent low voltage trips huller motor. 3kW Rooftop Solar would eliminate downtime.',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 6).toISOString()
    }
  ];

  initialAudits.forEach(audit => insertAudit.run(audit));

  // Seed initial feasibility study
  const insertFeas = db.prepare(`
    INSERT INTO feasibility_studies (
      id, village_name, enterprise_type, capital_cost, subsidy_amount,
      net_investment, monthly_opex, monthly_revenue, net_profit,
      break_even_months, payback_years, roi_percent, solar_kwp, created_at
    ) VALUES (
      @id, @village_name, @enterprise_type, @capital_cost, @subsidy_amount,
      @net_investment, @monthly_opex, @monthly_revenue, @net_profit,
      @break_even_months, @payback_years, @roi_percent, @solar_kwp, @created_at
    )
  `);

  insertFeas.run({
    id: 'feas-seed-1',
    village_name: 'Araku Valley Hamlet #4',
    enterprise_type: 'Tribal Homestay & Eco-Tourism',
    capital_cost: 320000,
    subsidy_amount: 120000,
    net_investment: 200000,
    monthly_opex: 18000,
    monthly_revenue: 55000,
    net_profit: 37000,
    break_even_months: 5.4,
    payback_years: 0.45,
    roi_percent: 222,
    solar_kwp: 2.5,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  });
}
