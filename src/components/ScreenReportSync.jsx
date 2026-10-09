import React, { useState, useEffect } from 'react';
import { 
  Download, Printer, RefreshCw, CheckCircle2, Cloud, Database, 
  WifiOff, ArrowUpRight, BarChart3, Users, Award, Shield, FileCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { translations } from '../translations';
import { storageService } from '../services/storageService';
import { calculateAuditSummary, calculateSolarSizing } from '../services/calculationEngine';
import { soundFx } from '../services/soundFx';

export default function ScreenReportSync({
  language,
  currentAudit,
  savedAudits,
  setSavedAudits,
  isAirplaneMode,
  toggleAirplaneMode,
  activeVillage
}) {
  const t = translations[language] || translations.en;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [clusterSummary, setClusterSummary] = useState(null);
  const [viewSupervisorPortal, setViewSupervisorPortal] = useState(false);

  // Calculate audit values
  const appliances = currentAudit?.appliances || [];
  const hasGen = currentAudit?.has_generator ?? true;
  const genHours = currentAudit?.generator_hours ?? 3.5;
  const summary = calculateAuditSummary(appliances, hasGen, genHours);
  const solarSizing = calculateSolarSizing(summary.totalDailyKWh, summary.peakLoadWatts, hasGen, genHours);

  // Load cluster summary on mount
  useEffect(() => {
    loadClusterSummary();
  }, [savedAudits]);

  const loadClusterSummary = async () => {
    const summaryData = await storageService.getSupervisorClusterSummary();
    setClusterSummary(summaryData);
  };

  // Sync handler
  const handleSyncNow = async () => {
    if (isAirplaneMode) {
      setSyncMessage('⚠️ Airplane mode is active! Disable airplane mode first to synchronize with the central SQLite database.');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Connecting to Central UrjaMitra SQLite Node.js Server...');
    soundFx.playMicStart();

    const result = await storageService.syncWithServer();
    setIsSyncing(false);

    if (result.success) {
      setSyncMessage(`✅ ${result.message}`);
      setSavedAudits(storageService.getAudits());
      loadClusterSummary();
    } else {
      setSyncMessage(`⚠️ ${result.error}`);
    }
  };

  // PDF Generation using jsPDF
  const handleDownloadPDF = () => {
    soundFx.playSuccess();
    const doc = new jsPDF();

    // Header styling
    doc.setFillColor(5, 150, 105); // emerald green
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('URJAMITRA (ऊर्जा मित्र)', 15, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Offline Rural Energy Audit & Enterprise Feasibility Report', 15, 23);

    // Metadata section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Facility: ${currentAudit?.facility_name || 'Village Community Hall'}`, 15, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`Village: ${activeVillage.name}, District: ${activeVillage.district}`, 15, 49);
    doc.text(`Audit Date: ${new Date().toLocaleDateString('en-IN')}`, 15, 56);
    doc.text(`Storage Mode: On-Device SQLite (Offline Audit)`, 15, 63);

    // Line divider
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 68, 195, 68);

    // Energy demand summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('1. Field Energy Consumption Baseline', 15, 78);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Total Daily Demand: ${summary.totalDailyKWh} kWh/day (${summary.totalMonthlyKWh} units/month)`, 15, 87);
    doc.text(`• Monthly Electricity Tariff Expense: INR ${summary.monthlyElectricityBill}`, 15, 94);
    if (hasGen) {
      doc.text(`• Diesel Generator Runtime: ${genHours} hrs/day (${summary.monthlyDieselLitres} L diesel/mo)`, 15, 101);
      doc.text(`• Monthly Diesel Expenditure: INR ${summary.monthlyDieselExpense}`, 15, 108);
      doc.text(`• Total Monthly Energy Cost: INR ${summary.totalMonthlyEnergyExpense}`, 15, 115);
    }

    // Appliance Inventory table
    let y = hasGen ? 128 : 108;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('2. Audited Appliance Inventory', 15, y);
    y += 8;

    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, 'F');
    doc.setFontSize(9);
    doc.text('Appliance', 18, y + 6);
    doc.text('Qty', 80, y + 6);
    doc.text('Watts', 105, y + 6);
    doc.text('Daily Hrs', 135, y + 6);
    doc.text('Daily kWh', 165, y + 6);
    y += 10;

    doc.setFont('helvetica', 'normal');
    appliances.forEach((app) => {
      doc.text(String(app.name || app.type), 18, y + 5);
      doc.text(String(app.count), 80, y + 5);
      doc.text(`${app.watts}W`, 105, y + 5);
      doc.text(`${app.hoursPerDay}h`, 135, y + 5);
      doc.text(`${app.dailyKWh || ((app.count * app.watts * app.hoursPerDay)/1000).toFixed(2)}`, 165, y + 5);
      y += 8;
    });

    // Solar PV Sizing
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('3. Decentralized Solar PV Recommendation', 15, y);
    y += 9;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Recommended Solar PV Array: ${solarSizing.recommendedSolarKWp} kWp Monocrystalline`, 15, y);
    y += 7;
    doc.text(`• LFP Battery Bank Storage: ${solarSizing.recommendedBatteryKWh} kWh (48V)`, 15, y);
    y += 7;
    doc.text(`• Hybrid Solar Inverter: ${solarSizing.recommendedInverterKVA} kVA Pure Sine Wave`, 15, y);
    y += 7;
    doc.text(`• Daily Solar Yield: ${solarSizing.estDailySolarGen} Units/day (100% DG replacement)`, 15, y);

    // Action Checklist for Panchayat
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('4. Village Panchayat Action Checklist', 15, y);
    y += 9;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('[X] Retrofit fluorescent tubes with 9W high-lumen LEDs (Instant ~65% lighting drop)', 15, y);
    y += 6;
    doc.text('[X] Replace induction ceiling fans with 28W 5-Star BLDC smart fans', 15, y);
    y += 6;
    doc.text('[X] Submit solar proposal under PM-KUSUM / PM Surya Ghar scheme for 40-60% subsidy', 15, y);
    y += 6;
    doc.text('[X] Inspect refrigerator and vaccine cooler gaskets every 30 days', 15, y);

    // Footer signature line
    y += 18;
    doc.line(15, y, 80, y);
    doc.line(130, y, 195, y);
    doc.text('Field Mitra Signature', 25, y + 6);
    doc.text('Sarpanch / Panchayat Head', 135, y + 6);

    // Save PDF file
    doc.save(`UrjaMitra_Audit_${(currentAudit?.facility_name || 'Report').replace(/\s+/g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    soundFx.playDetected();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedAudits, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `UrjaMitra_Audits_Export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="screen-content report-sync-screen">
      {/* Top Banner */}
      <div className="report-hero-banner">
        <div className="report-badge">
          <FileCheck size={16} />
          <span>Local Report Generator & Sync Engine</span>
        </div>
        <h2 className="report-heading">{t.reportTitle}</h2>
        <p className="report-subtext">
          {language === 'hi' ? 'फील्ड ऑडिट का आधिकारिक पीडीएफ प्रिंट करें और इंटरनेट मिलते ही सुपरवाइजर पोर्टल पर सिंक करें।' :
           language === 'te' ? 'ఆడిట్ రిపోర్ట్ డౌన్‌లోడ్ చేయండి మరియు సూపర్వైజర్ పోర్టల్‌కు సమర్పించండి.' :
           'Generate print-ready energy audits, export local PDFs, and synchronize with SQLite supervisor portal.'}
        </p>

        {/* Action Buttons for Report */}
        <div className="report-cta-row">
          <button 
            type="button" 
            className="pdf-download-btn"
            onClick={handleDownloadPDF}
          >
            <Download size={18} />
            <span>{t.downloadPdf}</span>
          </button>

          <button 
            type="button" 
            className="print-report-btn"
            onClick={handlePrint}
          >
            <Printer size={18} />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* Sync Manager Section */}
      <div className="sync-manager-card">
        <div className="sync-top-row">
          <div className="sync-title-group">
            <div className="sync-icon-box">
              <Database size={22} className="sync-db-icon" />
            </div>
            <div>
              <div className="sync-title">{t.syncStatus}</div>
              <div className="sync-sub">
                {isAirplaneMode 
                  ? '✈️ Airplane Mode active: Data held securely in local SQLite store'
                  : '🟢 Online Mode: Ready to synchronize with central cluster'
                }
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`sync-now-action-btn ${isSyncing ? 'is-syncing' : ''}`}
            onClick={handleSyncNow}
            disabled={isSyncing}
          >
            <RefreshCw size={16} className={isSyncing ? 'spin-fast' : ''} />
            <span>{isSyncing ? 'Syncing...' : t.syncNow}</span>
          </button>
        </div>

        {syncMessage && (
          <div className="sync-feedback-banner">{syncMessage}</div>
        )}

        <div className="sync-offline-note">
          <Shield size={14} />
          <span>{t.offlineStorageNote}</span>
        </div>
      </div>

      {/* Official Audit Report Printable Preview */}
      <div className="printable-report-card" id="printable-audit-section">
        <div className="report-official-header">
          <div className="govt-emblem-text">
            <span>RURAL ENERGY ACCESS & ENTERPRISE AUDIT</span>
            <small>Department of Renewable Energy & Tribal Livelihoods</small>
          </div>
          <div className="report-doc-id">
            Audit ID: {currentAudit?.id || 'UM-2026-09'}
          </div>
        </div>

        <div className="report-meta-grid">
          <div className="meta-item">
            <span className="meta-lbl">Facility Name:</span>
            <strong>{currentAudit?.facility_name || 'Village Community Hall'}</strong>
          </div>
          <div className="meta-item">
            <span className="meta-lbl">Village / Hamlet:</span>
            <strong>{activeVillage.name}</strong>
          </div>
          <div className="meta-item">
            <span className="meta-lbl">District & State:</span>
            <strong>{activeVillage.district}, {activeVillage.state}</strong>
          </div>
          <div className="meta-item">
            <span className="meta-lbl">Field Mitra:</span>
            <strong>Sunita Marawi (Rural Energy Mitra)</strong>
          </div>
        </div>

        {/* Executive Metrics Bar */}
        <div className="report-summary-bar">
          <div className="rep-sum-cell">
            <span>Daily Consumption</span>
            <strong>{summary.totalDailyKWh} kWh</strong>
          </div>
          <div className="rep-sum-cell">
            <span>Monthly Grid Cost</span>
            <strong>₹{summary.monthlyElectricityBill}</strong>
          </div>
          <div className="rep-sum-cell">
            <span>Monthly Diesel Cost</span>
            <strong>₹{summary.monthlyDieselExpense}</strong>
          </div>
          <div className="rep-sum-cell highlight-cell">
            <span>Recommended Solar</span>
            <strong>{solarSizing.recommendedSolarKWp} kWp PV</strong>
          </div>
        </div>

        {/* Table of Appliances */}
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Appliance</th>
                <th>Qty</th>
                <th>Watts</th>
                <th>Daily Run</th>
                <th>Daily Units</th>
                <th>Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {appliances.map((app) => (
                <tr key={app.id}>
                  <td><strong>{app.name}</strong></td>
                  <td>{app.count}</td>
                  <td>{app.watts} W</td>
                  <td>{app.hoursPerDay} hrs</td>
                  <td>{app.dailyKWh} kWh</td>
                  <td>₹{app.monthlyCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Checklist for Panchayat */}
        <div className="panchayat-checklist-box">
          <div className="checklist-heading">{t.actionChecklist}</div>
          <div className="checklist-items">
            <div className="checklist-row checked">
              <CheckCircle2 size={16} />
              <span>Replace incandescent/fluorescent tubes with 9W Bureau of Energy Efficiency (BEE) LEDs.</span>
            </div>
            <div className="checklist-row checked">
              <CheckCircle2 size={16} />
              <span>Upgrade standard 75W induction fans to 28W smart BLDC fans.</span>
            </div>
            <div className="checklist-row checked">
              <CheckCircle2 size={16} />
              <span>Apply for {solarSizing.recommendedSolarKWp} kWp Solar PV + {solarSizing.recommendedBatteryKWh} kWh LFP Battery under PM-KUSUM.</span>
            </div>
            <div className="checklist-row checked">
              <CheckCircle2 size={16} />
              <span>Perform monthly dust cleaning on solar panels & check vaccine refrigerator seals.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supervisor Review Portal Toggle */}
      <div className="supervisor-portal-card">
        <div className="portal-header-row">
          <div className="portal-title-group">
            <BarChart3 size={20} className="portal-chart-icon" />
            <div>
              <div className="portal-title">{t.supervisorView}</div>
              <div className="portal-sub">Aggregated cluster analysis across remote villages</div>
            </div>
          </div>

          <button
            type="button"
            className="toggle-portal-btn"
            onClick={() => setViewSupervisorPortal(!viewSupervisorPortal)}
          >
            {viewSupervisorPortal ? 'Hide Cluster View' : 'Open Cluster Analytics'}
          </button>
        </div>

        {viewSupervisorPortal && clusterSummary && (
          <div className="cluster-analytics-drawer">
            <div className="cluster-stats-grid">
              <div className="cl-stat-card">
                <span className="cl-stat-title">{t.totalAudits}</span>
                <div className="cl-stat-number">{clusterSummary.total_audits}</div>
                <span className="cl-stat-sub">Across {clusterSummary.distinct_villages || 3} tribal hamlets</span>
              </div>

              <div className="cl-stat-card">
                <span className="cl-stat-title">Cluster Daily Demand</span>
                <div className="cl-stat-number">
                  {Number(clusterSummary.total_daily_kwh).toFixed(1)} <small>kWh</small>
                </div>
                <span className="cl-stat-sub">Total village load</span>
              </div>

              <div className="cl-stat-card">
                <span className="cl-stat-title">Annual Diesel Burn</span>
                <div className="cl-stat-number red-num">
                  ₹{(clusterSummary.total_diesel_expense * 12).toLocaleString('en-IN')}
                </div>
                <span className="cl-stat-sub">Can be saved by solar</span>
              </div>

              <div className="cl-stat-card">
                <span className="cl-stat-title">Enterprises Mobilized</span>
                <div className="cl-stat-number green-num">
                  {clusterSummary.total_enterprises_evaluated || 1}
                </div>
                <span className="cl-stat-sub">Homestays, Mills, Cold Stores</span>
              </div>
            </div>

            <div className="export-cluster-actions">
              <button 
                type="button" 
                className="export-json-btn"
                onClick={handleExportJson}
              >
                <Download size={14} />
                <span>Export Cluster Audits (JSON)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
