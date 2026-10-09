import React, { useState } from 'react';
import { 
  Lightbulb, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, 
  Sun, Battery, Cpu, Leaf, Info, Zap, ShieldCheck, DollarSign
} from 'lucide-react';
import { translations } from '../translations';
import { generateRecommendations, calculateSolarSizing, calculateAuditSummary } from '../services/calculationEngine';
import { soundFx } from '../services/soundFx';

export default function ScreenRecommendations({
  language,
  currentAudit,
  onProceedToReport
}) {
  const t = translations[language] || translations.en;

  const appliances = currentAudit?.appliances || [];
  const hasGen = currentAudit?.has_generator ?? true;
  const genHours = currentAudit?.generator_hours ?? 3.5;

  const summary = calculateAuditSummary(appliances, hasGen, genHours);
  const initialRecs = generateRecommendations(summary, appliances);

  const [recommendations, setRecommendations] = useState(initialRecs);
  const [expandedReasonId, setExpandedReasonId] = useState(null);

  // Solar sizing calculations
  const solarSizing = calculateSolarSizing(
    summary.totalDailyKWh,
    summary.peakLoadWatts,
    hasGen,
    genHours
  );

  const toggleInclude = (id) => {
    soundFx.playDetected();
    setRecommendations(prev => prev.map(rec => {
      if (rec.id === id) {
        return { ...rec, includedInPlan: !rec.includedInPlan };
      }
      return rec;
    }));
  };

  const toggleReasoning = (id) => {
    setExpandedReasonId(prev => prev === id ? null : id);
  };

  const totalAnnualSavings = recommendations
    .filter(r => r.includedInPlan)
    .reduce((sum, r) => sum + r.annualSavings, 0);

  const totalImplementationCost = recommendations
    .filter(r => r.includedInPlan)
    .reduce((sum, r) => sum + r.implementationCost, 0);

  const totalCO2Reduced = recommendations
    .filter(r => r.includedInPlan)
    .reduce((sum, r) => sum + (r.co2ReductionKg || 0), 0);

  return (
    <div className="screen-content recommendations-screen">
      {/* Header Banner */}
      <div className="recommendations-hero-banner">
        <div className="rec-badge-tag">
          <Lightbulb size={16} />
          <span>Automated Opportunity Detector</span>
        </div>
        <h2 className="recommendations-heading">{t.recommendationsTitle}</h2>
        <p className="recommendations-subtext">
          {language === 'hi' ? 'फील्ड ऑडिट डेटा के आधार पर शीर्ष ऊर्जा बचत सुधार, पेबैक अवधि और सौर प्रणाली आकार का आकलन।' :
           language === 'te' ? 'ఫీల్డ్ ఆడిట్ డేటా ఆధారంగా విద్యుత్ ఆదా సిఫార్సులు మరియు సోలార్ సిస్టమ్ సైజింగ్.' :
           'Ranked by highest energy cost reduction, immediate payback periods, and diesel fuel elimination.'}
        </p>

        {/* Quick Summary Pill Bar */}
        <div className="rec-quick-summary-bar">
          <div className="quick-sum-item">
            <span className="sum-item-label">{t.estAnnualSavings}</span>
            <div className="sum-item-val savings-green">₹{totalAnnualSavings.toLocaleString('en-IN')}/yr</div>
          </div>
          <div className="quick-sum-item">
            <span className="sum-item-label">{t.co2Reduction}</span>
            <div className="sum-item-val">{totalCO2Reduced} kg CO₂/yr</div>
          </div>
          <div className="quick-sum-item">
            <span className="sum-item-label">Retrofit Capital</span>
            <div className="sum-item-val">₹{totalImplementationCost.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Priority Recommendations List */}
      <div className="recommendations-list">
        {recommendations.map((rec) => {
          const isExpanded = expandedReasonId === rec.id;
          return (
            <div key={rec.id} className={`recommendation-card ${rec.includedInPlan ? 'is-included' : 'is-excluded'}`}>
              <div className="rec-card-top-row">
                <div className="rec-priority-badge">
                  <span>Priority {rec.priority}</span>
                  <span className="rec-category-tag">{rec.category}</span>
                </div>
                <label className="checkbox-container" title="Include in official Village Action Plan">
                  <input 
                    type="checkbox" 
                    checked={rec.includedInPlan} 
                    onChange={() => toggleInclude(rec.id)}
                  />
                  <span className="checkmark-box"></span>
                  <span className="checkbox-text">{t.includeInReport}</span>
                </label>
              </div>

              <h3 className="rec-title">
                {language === 'hi' && rec.titleHi ? rec.titleHi :
                 language === 'te' && rec.titleTe ? rec.titleTe :
                 rec.title}
              </h3>

              {/* Baseline vs Proposed Specs */}
              <div className="rec-comparison-panel">
                <div className="spec-comparison-col">
                  <span className="comp-label">Current Baseline:</span>
                  <div className="comp-val baseline-val">{rec.currentBaseline}</div>
                </div>
                <div className="spec-comparison-arrow">➔</div>
                <div className="spec-comparison-col">
                  <span className="comp-label">Proposed Measure:</span>
                  <div className="comp-val proposed-val">{rec.proposedMeasure}</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="rec-metrics-grid">
                <div className="rec-metric-item">
                  <span className="rec-metric-label">{t.estAnnualSavings}</span>
                  <div className="rec-metric-val savings-val">₹{rec.annualSavings.toLocaleString('en-IN')}</div>
                </div>
                <div className="rec-metric-item">
                  <span className="rec-metric-label">{t.implementationCost}</span>
                  <div className="rec-metric-val">₹{rec.implementationCost.toLocaleString('en-IN')}</div>
                </div>
                <div className="rec-metric-item">
                  <span className="rec-metric-label">{t.paybackMonths}</span>
                  <div className="rec-metric-val payback-val">{rec.paybackMonths} mos</div>
                </div>
                <div className="rec-metric-item">
                  <span className="rec-metric-label">{t.co2Reduction}</span>
                  <div className="rec-metric-val">{rec.co2ReductionKg} kg/yr</div>
                </div>
              </div>

              {/* Transparent Deterministic Math Reasoning Accordion */}
              <div className="rec-reasoning-toggle">
                <button 
                  type="button" 
                  className="toggle-reason-btn"
                  onClick={() => toggleReasoning(rec.id)}
                >
                  <Info size={14} />
                  <span>{t.whyThisRec}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isExpanded && (
                  <div className="reasoning-expandable-box">
                    <p className="reasoning-text">{rec.reasoning}</p>
                    <div className="math-proof-tag">
                      Verified deterministic rule • Zero hallucinations • Bureau of Energy Efficiency (BEE) benchmarks
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decentralized Solar PV Sizing Card */}
      <div className="solar-sizing-card">
        <div className="solar-sizing-header">
          <div className="solar-icon-box">
            <Sun size={24} className="solar-icon" />
          </div>
          <div>
            <h3 className="solar-title">{t.solarSizingTitle}</h3>
            <p className="solar-sub">Optimal decentralized sizing to eliminate 100% of grid/diesel downtime</p>
          </div>
        </div>

        <div className="solar-specs-grid">
          <div className="solar-spec-box">
            <Sun size={18} className="spec-sub-icon gold" />
            <span className="solar-spec-label">{t.recommendedSolar}</span>
            <div className="solar-spec-val">{solarSizing.recommendedSolarKWp} kWp</div>
            <span className="solar-spec-sub">Monocrystalline PERC</span>
          </div>

          <div className="solar-spec-box">
            <Battery size={18} className="spec-sub-icon blue" />
            <span className="solar-spec-label">{t.batteryCapacity}</span>
            <div className="solar-spec-val">{solarSizing.recommendedBatteryKWh} kWh</div>
            <span className="solar-spec-sub">Lithium Iron (LFP) 48V</span>
          </div>

          <div className="solar-spec-box">
            <Cpu size={18} className="spec-sub-icon teal" />
            <span className="solar-spec-label">{t.inverterSize}</span>
            <div className="solar-spec-val">{solarSizing.recommendedInverterKVA} kVA</div>
            <span className="solar-spec-sub">Pure Sine Hybrid MPPT</span>
          </div>

          <div className="solar-spec-box">
            <Zap size={18} className="spec-sub-icon amber" />
            <span className="solar-spec-label">{t.dailySolarGen}</span>
            <div className="solar-spec-val">{solarSizing.estDailySolarGen} kWh</div>
            <span className="solar-spec-sub">Units generated / day</span>
          </div>
        </div>

        <div className="solar-cost-footer">
          <div className="cost-left">
            <span>Estimated Clean Infrastructure Cost:</span>
            <strong>₹{solarSizing.estimatedCost.toLocaleString('en-IN')}</strong>
            <small>(Eligible for PM Surya Ghar / PM-KUSUM 40-60% subsidy)</small>
          </div>
          <div className="clean-badge">
            <Leaf size={14} />
            <span>Zero Diesel Smoke</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="rec-footer-actions">
        <button 
          type="button" 
          className="proceed-report-btn"
          onClick={() => {
            soundFx.playSuccess();
            onProceedToReport();
          }}
        >
          <span>Generate Field Audit Report & Sync</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
