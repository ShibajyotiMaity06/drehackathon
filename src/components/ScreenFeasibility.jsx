import React, { useState } from 'react';
import { 
  TrendingUp, CheckCircle, AlertTriangle, Mic, Volume2, 
  HelpCircle, Sparkles, DollarSign, Calendar, Zap, Save, ChevronDown
} from 'lucide-react';
import { translations } from '../translations';
import { ENTERPRISE_TEMPLATES, calculateFeasibility } from '../services/feasibilityEngine';
import { soundFx } from '../services/soundFx';
import { voiceAssistant } from '../services/voiceAssistant';

export default function ScreenFeasibility({
  language,
  onSaveFeasibility,
  activeVillage
}) {
  const t = translations[language] || translations.en;

  const [selectedTemplateKey, setSelectedTemplateKey] = useState('homestay');
  const currentTemplate = ENTERPRISE_TEMPLATES[selectedTemplateKey];

  // Financial input state initialized from template defaults
  const [capitalCost, setCapitalCost] = useState(currentTemplate.defaultCapitalCost);
  const [subsidyAmount, setSubsidyAmount] = useState(currentTemplate.defaultSubsidy);
  const [monthlyOpEx, setMonthlyOpEx] = useState(currentTemplate.defaultMonthlyOpEx);
  const [monthlyRevenue, setMonthlyRevenue] = useState(currentTemplate.defaultMonthlyRevenue);
  const [solarKWp, setSolarKWp] = useState(currentTemplate.solarKWp);

  // Voice input status
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [voiceInputFeedback, setVoiceInputFeedback] = useState('');

  // Switch template
  const handleSelectTemplate = (key) => {
    setSelectedTemplateKey(key);
    const tmpl = ENTERPRISE_TEMPLATES[key];
    setCapitalCost(tmpl.defaultCapitalCost);
    setSubsidyAmount(tmpl.defaultSubsidy);
    setMonthlyOpEx(tmpl.defaultMonthlyOpEx);
    setMonthlyRevenue(tmpl.defaultMonthlyRevenue);
    setSolarKWp(tmpl.solarKWp);
    soundFx.playDetected();
  };

  // Run financial calculations
  const results = calculateFeasibility({
    capitalCost,
    subsidyAmount,
    monthlyOpEx,
    monthlyRevenue,
    solarKWp
  });

  // Voice number parser for spoken financials
  const handleVoiceInput = () => {
    if (isVoiceInputActive) {
      voiceAssistant.stopListening();
      setIsVoiceInputActive(false);
      return;
    }

    setIsVoiceInputActive(true);
    setVoiceInputFeedback('Listening for costs or revenue (e.g. "Revenue 60 thousand")...');
    soundFx.playMicStart();

    voiceAssistant.onResultCallback = (text, isFinal) => {
      setVoiceInputFeedback(`Heard: "${text}"`);
      if (isFinal) {
        // Simple entity extraction for numbers in thousands / lakhs
        const lower = text.toLowerCase();
        let numberVal = null;

        // Check for lakh: "3 lakh" -> 300,000
        const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|लाख)/i);
        if (lakhMatch) {
          numberVal = parseFloat(lakhMatch[1]) * 100000;
        }

        // Check for thousand: "45 thousand" -> 45,000
        const thouMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:thousand|हजार|k)/i);
        if (thouMatch) {
          numberVal = parseFloat(thouMatch[1]) * 1000;
        }

        // Plain digits
        const plainDigitMatch = lower.match(/\b(\d{4,7})\b/);
        if (plainDigitMatch) {
          numberVal = parseInt(plainDigitMatch[1], 10);
        }

        if (numberVal) {
          soundFx.playSuccess();
          if (lower.includes('cost') || lower.includes('setup') || lower.includes('लागत') || lower.includes('पूंजी')) {
            setCapitalCost(numberVal);
            setVoiceInputFeedback(`Updated Setup Cost: ₹${numberVal.toLocaleString('en-IN')}`);
          } else if (lower.includes('revenue') || lower.includes('income') || lower.includes('कमाई') || lower.includes('आय')) {
            setMonthlyRevenue(numberVal);
            setVoiceInputFeedback(`Updated Monthly Revenue: ₹${numberVal.toLocaleString('en-IN')}`);
          } else if (lower.includes('expense') || lower.includes('opex') || lower.includes('खर्च')) {
            setMonthlyOpEx(numberVal);
            setVoiceInputFeedback(`Updated Monthly OpEx: ₹${numberVal.toLocaleString('en-IN')}`);
          } else {
            // Default to revenue
            setMonthlyRevenue(numberVal);
            setVoiceInputFeedback(`Set value to: ₹${numberVal.toLocaleString('en-IN')}`);
          }
        }
        setIsVoiceInputActive(false);
      }
    };

    voiceAssistant.startListening(language);
  };

  const handleSaveStudy = () => {
    const studyRecord = {
      village_name: activeVillage.name,
      enterprise_type: currentTemplate.name,
      capital_cost: capitalCost,
      subsidy_amount: subsidyAmount,
      net_investment: results.netInvestment,
      monthly_opex: monthlyOpEx,
      monthly_revenue: monthlyRevenue,
      net_profit: results.netMonthlyProfit,
      break_even_months: results.breakEvenMonths,
      payback_years: results.paybackYears,
      roi_percent: results.roiPercent,
      solar_kwp: solarKWp
    };
    onSaveFeasibility(studyRecord);
    soundFx.playSuccess();
  };

  const speakFeasibilitySummary = () => {
    soundFx.playDetected();
    const text = `The ${currentTemplate.name} yields a net monthly profit of ${results.netMonthlyProfit} rupees, breaking even in ${results.breakEvenMonths} months with an annual return of ${results.roiPercent} percent.`;
    voiceAssistant.speak(text, language);
  };

  return (
    <div className="screen-content feasibility-screen">
      {/* Header Banner */}
      <div className="feasibility-hero-banner">
        <div className="feasibility-badge">
          <TrendingUp size={16} />
          <span>Offline Enterprise Feasibility Calculator</span>
        </div>
        <h2 className="feasibility-heading">{t.feasibilityTitle}</h2>
        <p className="feasibility-subtext">
          {language === 'hi' ? 'आदिवासी होमस्टे, मिलेट मिल या सौर कोल्ड स्टोरेज की वित्तीय व्यवहार्यता और पेबैक अवधि की सटीक गणना करें।' :
           language === 'te' ? 'హోమ్‌స్టే, మిల్లెట్ మిల్లు లేదా సోలార్ కోల్డ్ స్టోరేజ్ వ్యాపార లాభాలను లెక్కించండి.' :
           'Determine financial viability, ROI, break-even period, and clean energy advantage for rural micro-enterprises.'}
        </p>
      </div>

      {/* Enterprise Selection Carousel / Grid */}
      <div className="enterprise-type-section">
        <label className="section-label-bold">{t.selectEnterprise}:</label>
        <div className="enterprise-pills-row">
          {Object.keys(ENTERPRISE_TEMPLATES).map((key) => {
            const tmpl = ENTERPRISE_TEMPLATES[key];
            const isSelected = selectedTemplateKey === key;
            return (
              <button
                key={key}
                type="button"
                className={`enterprise-pill-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectTemplate(key)}
              >
                <span className="pill-dot"></span>
                <span>{language === 'hi' ? tmpl.nameHi : tmpl.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Enterprise Overview Card */}
      <div className="enterprise-info-card">
        <div className="info-top">
          <div>
            <h3 className="enterprise-title-active">{currentTemplate.name}</h3>
            <span className="enterprise-cat-badge">{currentTemplate.category}</span>
          </div>
          <button 
            type="button" 
            className="speak-summary-btn"
            onClick={speakFeasibilitySummary}
            title="Listen to feasibility analysis"
          >
            <Volume2 size={16} />
            <span>Read Summary</span>
          </button>
        </div>
        <p className="enterprise-desc">{currentTemplate.description}</p>

        <div className="assumptions-box">
          <div className="assumptions-label">Field Assumptions & Sizing:</div>
          <ul className="assumptions-list">
            {currentTemplate.assumptions.map((asm, idx) => (
              <li key={idx}>{asm}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Spoken Voice Input Bar */}
      <div className="voice-financials-bar">
        <button 
          type="button"
          className={`voice-fin-btn ${isVoiceInputActive ? 'is-listening' : ''}`}
          onClick={handleVoiceInput}
        >
          <Mic size={18} />
          <span>{isVoiceInputActive ? 'Listening to numbers...' : 'Speak Cost or Income (Voice Input)'}</span>
        </button>
        {voiceInputFeedback && (
          <div className="voice-feedback-note">{voiceInputFeedback}</div>
        )}
      </div>

      {/* Financial Inputs Grid */}
      <div className="financial-inputs-container">
        {/* Setup Cost & Subsidy */}
        <div className="input-card">
          <label className="input-field-label">
            <span>{t.capitalCost}</span>
            <strong className="field-val-preview">₹{capitalCost.toLocaleString('en-IN')}</strong>
          </label>
          <input 
            type="range"
            min="50000"
            max="1500000"
            step="10000"
            value={capitalCost}
            onChange={(e) => setCapitalCost(Number(e.target.value))}
            className="field-slider"
          />
          <div className="slider-hints">
            <span>₹50,000</span>
            <span>₹15,00,000</span>
          </div>

          {/* Govt Subsidy */}
          <div className="sub-field-group">
            <label className="input-field-label">
              <span>{t.subsidyAmount} (PMEGP / Tribal Sub-Plan)</span>
              <strong className="subsidy-val">₹{subsidyAmount.toLocaleString('en-IN')}</strong>
            </label>
            <input 
              type="range"
              min="0"
              max={capitalCost * 0.5}
              step="5000"
              value={subsidyAmount}
              onChange={(e) => setSubsidyAmount(Number(e.target.value))}
              className="field-slider subsidy-slider"
            />
          </div>

          <div className="net-invest-banner">
            <span>{t.netInvestment}:</span>
            <strong>₹{results.netInvestment.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Operating Costs & Revenue */}
        <div className="input-card">
          {/* Monthly OpEx */}
          <label className="input-field-label">
            <span>{t.monthlyOpEx}</span>
            <strong className="field-val-preview">₹{monthlyOpEx.toLocaleString('en-IN')} / mo</strong>
          </label>
          <input 
            type="range"
            min="3000"
            max="100000"
            step="1000"
            value={monthlyOpEx}
            onChange={(e) => setMonthlyOpEx(Number(e.target.value))}
            className="field-slider"
          />
          <div className="slider-hints">
            <span>₹3,000</span>
            <span>₹1,00,000</span>
          </div>

          {/* Monthly Revenue */}
          <div className="sub-field-group">
            <label className="input-field-label">
              <span>{t.monthlyRevenue}</span>
              <strong className="revenue-val">₹{monthlyRevenue.toLocaleString('en-IN')} / mo</strong>
            </label>
            <input 
              type="range"
              min="5000"
              max="200000"
              step="2000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="field-slider revenue-slider"
            />
            <div className="slider-hints">
              <span>₹5,000</span>
              <span>₹2,00,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Feasibility Results Scorecard */}
      <div className="feasibility-results-card">
        <div className="results-header-row">
          <div className="scorecard-title">Viability Scorecard</div>
          <div className={`viability-badge ${results.isViable ? 'is-viable' : 'needs-review'}`}>
            {results.isViable ? (
              <>
                <CheckCircle size={14} />
                <span>Highly Viable Enterprise</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>Requires Grant / Restructuring</span>
              </>
            )}
          </div>
        </div>

        <div className="results-metrics-grid">
          <div className="metric-box">
            <span className="metric-title">{t.netMonthlyProfit}</span>
            <div className="metric-large-number profit-num">
              ₹{results.netMonthlyProfit.toLocaleString('en-IN')}
            </div>
            <span className="metric-sub">Margin: {results.profitMarginPercent}%</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">{t.breakEvenPeriod}</span>
            <div className="metric-large-number break-even-num">
              {results.breakEvenMonths} <small>months</small>
            </div>
            <span className="metric-sub">Full cost recovery</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">{t.paybackYears}</span>
            <div className="metric-large-number">
              {results.paybackYears} <small>years</small>
            </div>
            <span className="metric-sub">Capital recovery</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">{t.roiPercent}</span>
            <div className="metric-large-number roi-num">
              {results.roiPercent}%
            </div>
            <span className="metric-sub">Annual cash return</span>
          </div>
        </div>

        {/* Clean Energy Solar Advantage Callout */}
        <div className="solar-enterprise-advantage">
          <div className="adv-left">
            <Zap size={22} className="adv-icon" />
            <div>
              <div className="adv-title">{t.solarAdvantage}</div>
              <div className="adv-text">
                Powering this enterprise with {solarKWp} kWp Decentralized Solar PV eliminates diesel generator costs, boosting monthly profits by:
              </div>
            </div>
          </div>
          <div className="adv-val-pill">
            +₹{results.monthlyDieselSaved.toLocaleString('en-IN')} / month
          </div>
        </div>
      </div>

      {/* Save Feasibility Study Button */}
      <div className="feasibility-action-footer">
        <button 
          type="button" 
          className="save-feasibility-btn"
          onClick={handleSaveStudy}
        >
          <Save size={18} />
          <span>Save Feasibility Assessment Locally</span>
        </button>
      </div>
    </div>
  );
}
