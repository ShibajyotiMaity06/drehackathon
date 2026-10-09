import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';

initDatabase();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  const auditCount = db.prepare('SELECT count(*) as count FROM audits').get().count;
  res.json({
    status: 'online',
    database: 'SQLite (better-sqlite3)',
    auditCount,
    timestamp: new Date().toISOString()
  });
});

// List all energy audits
app.get('/api/audits', (req, res) => {
  try {
    const audits = db.prepare('SELECT * FROM audits ORDER BY created_at DESC').all();
    const parsedAudits = audits.map(audit => ({
      ...audit,
      has_generator: Boolean(audit.has_generator),
      appliances: JSON.parse(audit.appliances_json || '[]')
    }));
    res.json(parsedAudits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update a single audit
app.post('/api/audits', (req, res) => {
  try {
    const audit = req.body;
    const stmt = db.prepare(`
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
      ON CONFLICT(id) DO UPDATE SET
        village_name = excluded.village_name,
        district = excluded.district,
        state = excluded.state,
        facility_name = excluded.facility_name,
        facility_type = excluded.facility_type,
        appliances_json = excluded.appliances_json,
        has_generator = excluded.has_generator,
        generator_hours = excluded.generator_hours,
        daily_kwh = excluded.daily_kwh,
        monthly_bill = excluded.monthly_bill,
        diesel_expense = excluded.diesel_expense,
        carbon_kg_monthly = excluded.carbon_kg_monthly,
        field_worker_name = excluded.field_worker_name,
        status = 'synced',
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `);

    stmt.run({
      id: audit.id,
      village_name: audit.village_name || 'Rampur Village',
      district: audit.district || '',
      state: audit.state || '',
      facility_name: audit.facility_name || 'Facility Audit',
      facility_type: audit.facility_type || 'General',
      appliances_json: typeof audit.appliances === 'string' ? audit.appliances : JSON.stringify(audit.appliances || []),
      has_generator: audit.has_generator ? 1 : 0,
      generator_hours: audit.generator_hours || 0,
      daily_kwh: audit.daily_kwh || 0,
      monthly_bill: audit.monthly_bill || 0,
      diesel_expense: audit.diesel_expense || 0,
      carbon_kg_monthly: audit.carbon_kg_monthly || 0,
      field_worker_name: audit.field_worker_name || 'Field Mitra',
      status: 'synced',
      notes: audit.notes || '',
      created_at: audit.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, id: audit.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch offline synchronization endpoint
app.post('/api/sync', (req, res) => {
  try {
    const { audits = [], feasibility = [], deviceId = 'field-device-1' } = req.body;

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
        'synced', @notes, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        village_name = excluded.village_name,
        district = excluded.district,
        state = excluded.state,
        facility_name = excluded.facility_name,
        facility_type = excluded.facility_type,
        appliances_json = excluded.appliances_json,
        has_generator = excluded.has_generator,
        generator_hours = excluded.generator_hours,
        daily_kwh = excluded.daily_kwh,
        monthly_bill = excluded.monthly_bill,
        diesel_expense = excluded.diesel_expense,
        carbon_kg_monthly = excluded.carbon_kg_monthly,
        field_worker_name = excluded.field_worker_name,
        status = 'synced',
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `);

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
      ON CONFLICT(id) DO UPDATE SET
        monthly_opex = excluded.monthly_opex,
        monthly_revenue = excluded.monthly_revenue,
        net_profit = excluded.net_profit,
        break_even_months = excluded.break_even_months,
        payback_years = excluded.payback_years
    `);

    // Execute in a single atomic transaction
    const syncTransaction = db.transaction((auditList, feasList) => {
      let auditCount = 0;
      let feasCount = 0;

      for (const a of auditList) {
        insertAudit.run({
          id: a.id,
          village_name: a.village_name || 'Rampur Village',
          district: a.district || 'District',
          state: a.state || 'State',
          facility_name: a.facility_name || 'Facility Audit',
          facility_type: a.facility_type || 'General',
          appliances_json: typeof a.appliances === 'string' ? a.appliances : JSON.stringify(a.appliances || []),
          has_generator: a.has_generator ? 1 : 0,
          generator_hours: a.generator_hours || 0,
          daily_kwh: a.daily_kwh || 0,
          monthly_bill: a.monthly_bill || 0,
          diesel_expense: a.diesel_expense || 0,
          carbon_kg_monthly: a.carbon_kg_monthly || 0,
          field_worker_name: a.field_worker_name || 'Field Mitra',
          notes: a.notes || '',
          created_at: a.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        auditCount++;
      }

      for (const f of feasList) {
        insertFeas.run({
          id: f.id,
          village_name: f.village_name || 'Rampur Village',
          enterprise_type: f.enterprise_type,
          capital_cost: f.capital_cost,
          subsidy_amount: f.subsidy_amount || 0,
          net_investment: f.net_investment,
          monthly_opex: f.monthly_opex,
          monthly_revenue: f.monthly_revenue,
          net_profit: f.net_profit,
          break_even_months: f.break_even_months,
          payback_years: f.payback_years,
          roi_percent: f.roi_percent,
          solar_kwp: f.solar_kwp || 0,
          created_at: f.created_at || new Date().toISOString()
        });
        feasCount++;
      }

      // Log sync
      db.prepare(`
        INSERT INTO sync_logs (device_id, synced_at, audits_count, feasibility_count, status)
        VALUES (?, ?, ?, ?, 'success')
      `).run(deviceId, new Date().toISOString(), auditCount, feasCount);

      return { auditCount, feasCount };
    });

    const result = syncTransaction(audits, feasibility);

    // Fetch refreshed audits to send back to client
    const allAudits = db.prepare('SELECT * FROM audits ORDER BY created_at DESC').all().map(a => ({
      ...a,
      has_generator: Boolean(a.has_generator),
      appliances: JSON.parse(a.appliances_json || '[]')
    }));

    res.json({
      success: true,
      message: `Synchronized ${result.auditCount} audits and ${result.feasCount} feasibility assessments.`,
      audits: allAudits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Feasibility records
app.get('/api/feasibility', (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM feasibility_studies ORDER BY created_at DESC').all();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/feasibility', (req, res) => {
  try {
    const f = req.body;
    db.prepare(`
      INSERT INTO feasibility_studies (
        id, village_name, enterprise_type, capital_cost, subsidy_amount,
        net_investment, monthly_opex, monthly_revenue, net_profit,
        break_even_months, payback_years, roi_percent, solar_kwp, created_at
      ) VALUES (
        @id, @village_name, @enterprise_type, @capital_cost, @subsidy_amount,
        @net_investment, @monthly_opex, @monthly_revenue, @net_profit,
        @break_even_months, @payback_years, @roi_percent, @solar_kwp, @created_at
      )
    `).run({
      id: f.id || `feas-${Date.now()}`,
      village_name: f.village_name || 'Rampur Village',
      enterprise_type: f.enterprise_type,
      capital_cost: f.capital_cost,
      subsidy_amount: f.subsidy_amount || 0,
      net_investment: f.net_investment,
      monthly_opex: f.monthly_opex,
      monthly_revenue: f.monthly_revenue,
      net_profit: f.net_profit,
      break_even_months: f.break_even_months,
      payback_years: f.payback_years,
      roi_percent: f.roi_percent,
      solar_kwp: f.solar_kwp || 0,
      created_at: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aggregated Supervisor Dashboard metrics
app.get('/api/supervisor/cluster-summary', (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_audits,
        COALESCE(SUM(daily_kwh), 0) as total_daily_kwh,
        COALESCE(SUM(monthly_bill), 0) as total_monthly_bill,
        COALESCE(SUM(diesel_expense), 0) as total_diesel_expense,
        COALESCE(SUM(carbon_kg_monthly), 0) as total_carbon_kg_monthly,
        COUNT(DISTINCT village_name) as distinct_villages
      FROM audits
    `).get();

    const feasibilityCount = db.prepare('SELECT COUNT(*) as count FROM feasibility_studies').get().count;
    const villageStats = db.prepare(`
      SELECT village_name, COUNT(*) as count, SUM(daily_kwh) as daily_kwh, SUM(diesel_expense) as diesel_expense
      FROM audits
      GROUP BY village_name
    `).all();

    res.json({
      ...summary,
      total_enterprises_evaluated: feasibilityCount,
      village_breakdown: villageStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`UrjaMitra SQLite API Server running on port ${PORT}`);
});
