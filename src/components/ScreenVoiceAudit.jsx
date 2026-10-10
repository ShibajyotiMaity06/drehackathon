import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, Plus, Trash2, ArrowRight, Save, 
  HelpCircle, RefreshCw, Zap, Fuel, AlertCircle, Check, 
  Sun, Wind, Snowflake, Droplets, Cog, Scissors, Tv
} from 'lucide-react';
import { translations } from '../translations';
import { voiceAssistant, APPLIANCE_CATALOG } from '../services/voiceAssistant';
import { calculateAuditSummary } from '../services/calculationEngine';
import { soundFx } from '../services/soundFx';

export default function ScreenVoiceAudit({
  language,
  currentAudit,
  setCurrentAudit,
  onProceedToRecommendations,
  onSaveAudit,
  activeVillage
}) {
  const t = translations[language] || translations.en;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastSpokenPhrase, setLastSpokenPhrase] = useState('');
  const [activePrompt, setActivePrompt] = useState(null);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);

  // Load audit state
  const [appliances, setAppliances] = useState(currentAudit?.appliances || [
    { id: 'app-default-1', type: 'light', name: 'Lights / Tube lights', count: 6, watts: 40, efficientWatts: 9, hoursPerDay: 6 },
    { id: 'app-default-2', type: 'fan', name: 'Ceiling Fans', count: 3, watts: 75, efficientWatts: 28, hoursPerDay: 8 },
    { id: 'app-default-3', type: 'fridge', name: 'Refrigerator / Cooler', count: 1, watts: 160, efficientWatts: 85, hoursPerDay: 24 }
  ]);
  const [hasGenerator, setHasGenerator] = useState(currentAudit?.has_generator ?? true);
  const [generatorHours, setGeneratorHours] = useState(currentAudit?.generator_hours ?? 3.5);
  const [facilityName, setFacilityName] = useState(currentAudit?.facility_name || 'Village Community Hall');

  // Modal for quick manual add
  const [showAddModal, setShowAddModal] = useState(false);

  // Set up voice assistant callbacks
  useEffect(() => {
    voiceAssistant.onStatusCallback = (listening) => {
      setIsListening(listening);
    };

    voiceAssistant.onResultCallback = (text, isFinal) => {
      setTranscript(text);
      if (isFinal) {
        processTranscript(text);
      }
    };

    voiceAssistant.onErrorCallback = (err) => {
      console.warn('Speech recognition status:', err);
    };

    return () => {
      voiceAssistant.stopListening();
    };
  }, []);

  // Update audit summary continuously
  const summary = calculateAuditSummary(appliances, hasGenerator, generatorHours);

  // Sync back to parent audit state
  useEffect(() => {
    if (setCurrentAudit) {
      setCurrentAudit({
        ...currentAudit,
        facility_name: facilityName,
        appliances,
        has_generator: hasGenerator,
        generator_hours: generatorHours,
        daily_kwh: summary.totalDailyKWh,
        monthly_bill: summary.monthlyElectricityBill,
        diesel_expense: summary.monthlyDieselExpense,
        carbon_kg_monthly: summary.totalMonthlyCO2
      });
    }
  }, [appliances, hasGenerator, generatorHours, facilityName]);

  const handleToggleMic = () => {
    if (isListening) {
      voiceAssistant.stopListening();
      if (transcript) {
        processTranscript(transcript);
      }
    } else {
      setTranscript('');
      voiceAssistant.startListening(language);
    }
  };

  const processTranscript = (spokenText) => {
    if (!spokenText) return;
    setLastSpokenPhrase(spokenText);
    soundFx.playDetected();

    const parsed = voiceAssistant.parseSpokenAudit(spokenText);
    if (!parsed) return;

    if (parsed.appliances.length > 0) {
      // Merge or update detected appliances
      setAppliances(prev => {
        const next = [...prev];
        parsed.appliances.forEach(newApp => {
          const existingIdx = next.findIndex(a => a.type === newApp.type);
          if (existingIdx >= 0) {
            next[existingIdx] = {
              ...next[existingIdx],
              count: newApp.count,
              hoursPerDay: newApp.hoursPerDay || next[existingIdx].hoursPerDay
            };
          } else {
            next.push(newApp);
          }
        });
        return next;
      });
    }

    if (parsed.hasGenerator) {
      setHasGenerator(true);
      if (parsed.generatorHours > 0) {
        setGeneratorHours(parsed.generatorHours);
      }
    }

    // Set follow-up question if any
    if (parsed.missingPrompts && parsed.missingPrompts.length > 0) {
      const prompt = parsed.missingPrompts[0];
      setActivePrompt(prompt);
      speakQuestion(prompt);
    } else {
      setActivePrompt(null);
    }
  };

  // Speak follow up question aloud
  const speakQuestion = (prompt) => {
    let qText = prompt.questionEn;
    if (language === 'hi') qText = prompt.questionHi;
    else if (language === 'te') qText = prompt.questionTe;
    else if (language === 'bn') qText = prompt.questionBn;
    else if (language === 'mr') qText = prompt.questionMr;

    setIsSpeakingQuestion(true);
    voiceAssistant.speak(qText, language);
    setTimeout(() => setIsSpeakingQuestion(false), 3000);
  };

  // Handle quick demo scenario chips
  const handleQuickDemoPhrase = (phrase) => {
    setTranscript(phrase);
    processTranscript(phrase);
  };

  // Update appliance count or hours
  const updateAppliance = (id, field, delta) => {
    setAppliances(prev => prev.map(app => {
      if (app.id === id) {
        const currentVal = Number(app[field]) || 0;
        const minVal = field === 'count' ? 1 : 0.5;
        const maxVal = field === 'count' ? 100 : 24;
        const newVal = Math.min(maxVal, Math.max(minVal, currentVal + delta));
        return { ...app, [field]: Number(newVal.toFixed(1)) };
      }
      return app;
    }));
  };

  const removeAppliance = (id) => {
    setAppliances(prev => prev.filter(app => app.id !== id));
  };

  const addApplianceFromCatalog = (catalogKey) => {
    const item = APPLIANCE_CATALOG[catalogKey];
    if (!item) return;

    const newApp = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: item.id,
      name: item.name,
      nameHi: item.nameHi,
      nameTe: item.nameTe,
      nameBn: item.nameBn,
      nameMr: item.nameMr,
      count: 1,
      watts: item.defaultWatts,
      efficientWatts: item.efficientWatts,
      hoursPerDay: item.defaultHours
    };

    setAppliances(prev => [...prev, newApp]);
    setShowAddModal(false);
    soundFx.playDetected();
  };

  const getApplianceIcon = (type) => {
    switch (type) {
      case 'light': return <Sun size={20} className="app-icon-gold" />;
      case 'fan': return <Wind size={20} className="app-icon-blue" />;
      case 'fridge': return <Snowflake size={20} className="app-icon-cyan" />;
      case 'pump': return <Droplets size={20} className="app-icon-teal" />;
      case 'mill': return <Cog size={20} className="app-icon-orange" />;
      case 'sewing': return <Scissors size={20} className="app-icon-pink" />;
      default: return <Zap size={20} className="app-icon-yellow" />;
    }
  };

  const getLocalizedName = (app) => {
    if (language === 'hi' && app.nameHi) return app.nameHi;
    if (language === 'te' && app.nameTe) return app.nameTe;
    if (language === 'bn' && app.nameBn) return app.nameBn;
    if (language === 'mr' && app.nameMr) return app.nameMr;
    return app.name;
  };

  return (
    <div className="screen-content voice-audit-screen">
      {/* Top Header Card */}
      <div className="audit-header-banner">
        <div className="facility-input-row">
          <input
            type="text"
            className="facility-name-input"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="Facility / Building Name"
            aria-label="Facility name"
          />
          <span className="village-tag">{activeVillage.name}</span>
        </div>
        <p className="voice-audit-tagline">
          {language === 'hi' ? 'माइक दबाएं और स्वाभाविक रूप से बोलें जैसे आप गाँव में बात करते हैं।' :
           language === 'te' ? 'మైక్ నొక్కి మీరు మాట్లాడే సాధారణ భాషలో మాట్లాడండి.' :
           'Tap microphone and speak field observations naturally in your local language.'}
        </p>
      </div>

      {/* Hero Microphone Interaction Zone */}
      <div className="mic-hero-container">
        <div className="mic-outer-halo">
          {isListening && (
            <>
              <div className="mic-pulse-wave wave-1"></div>
              <div className="mic-pulse-wave wave-2"></div>
              <div className="mic-pulse-wave wave-3"></div>
            </>
          )}

          <button
            type="button"
            className={`large-mic-button ${isListening ? 'is-active-mic' : ''}`}
            onClick={handleToggleMic}
            aria-label={isListening ? t.micTapToStop : t.micTapToStart}
          >
            {isListening ? (
              <MicOff size={44} className="mic-main-icon" />
            ) : (
              <Mic size={44} className="mic-main-icon" />
            )}
          </button>
        </div>

        <div className="mic-status-label">
          {isListening ? (
            <span className="listening-pulse-text">{t.micListening}</span>
          ) : (
            <span className="tap-to-speak-text">{t.micTapToStart}</span>
          )}
        </div>

        {/* Live spoken transcript box */}
        <div className="transcript-box">
          <div className="transcript-header">
            <span className="transcript-tag">
              {isListening ? '🔴 Spoken Live Feed' : '📝 Last Spoken Observation'}
            </span>
            {transcript && (
              <button 
                type="button" 
                className="clear-btn" 
                onClick={() => setTranscript('')}
              >
                Clear
              </button>
            )}
          </div>
          <div className="transcript-text">
            {transcript || lastSpokenPhrase || (
              <span className="transcript-placeholder">
                “This community centre has six lights, three fans, one refrigerator, and uses a diesel generator during power cuts...”
              </span>
            )}
          </div>
        </div>

        {/* Quick Demo Field Phrases */}
        <div className="quick-phrases-shelf">
          <div className="shelf-label">
            <span>{t.quickDemoPhrases} (Tap to simulate field voice):</span>
          </div>
          <div className="phrase-chips-scroll">
            <button 
              type="button"
              className="phrase-chip"
              onClick={() => handleQuickDemoPhrase(t.sampleCommunityCenter)}
            >
              🏛️ {t.sampleCommunityCenter}
            </button>
            <button 
              type="button"
              className="phrase-chip"
              onClick={() => handleQuickDemoPhrase(t.sampleHealthCenter)}
            >
              🏥 {t.sampleHealthCenter}
            </button>
            <button 
              type="button"
              className="phrase-chip"
              onClick={() => handleQuickDemoPhrase(t.sampleMilletUnit)}
            >
              🌾 {t.sampleMilletUnit}
            </button>
            <button 
              type="button"
              className="phrase-chip"
              onClick={() => handleQuickDemoPhrase(t.sampleHomestay)}
            >
              🏡 {t.sampleHomestay}
            </button>
          </div>
        </div>
      </div>

      {/* UrjaMitra Guided Follow-up Question Card */}
      {activePrompt && (
        <div className="voice-prompt-card">
          <div className="prompt-top-row">
            <div className="prompt-title-group">
              <AlertCircle size={18} className="prompt-alert-icon" />
              <span className="prompt-title">{t.missingDataPrompt}</span>
            </div>
            <button 
              type="button"
              className="prompt-audio-btn"
              onClick={() => speakQuestion(activePrompt)}
              title="Play question aloud"
            >
              <Volume2 size={16} className={isSpeakingQuestion ? 'spin-slow' : ''} />
              <span>Listen</span>
            </button>
          </div>
          <div className="prompt-question-text">
            {language === 'hi' ? activePrompt.questionHi :
             language === 'te' ? activePrompt.questionTe :
             language === 'bn' ? activePrompt.questionBn :
             language === 'mr' ? activePrompt.questionMr :
             activePrompt.questionEn}
          </div>
          {activePrompt.suggestedAnswers && (
            <div className="prompt-answers-grid">
              {activePrompt.suggestedAnswers.map((ans, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="prompt-ans-btn"
                  onClick={() => {
                    if (activePrompt.type === 'hours') {
                      setAppliances(prev => prev.map(a => a.type !== 'fridge' ? { ...a, hoursPerDay: ans.value } : a));
                    } else if (activePrompt.type === 'generator') {
                      setGeneratorHours(ans.value);
                    }
                    soundFx.playSuccess();
                    setActivePrompt(null);
                  }}
                >
                  <Check size={14} />
                  <span>{ans.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extracted Appliances & Power Loads List */}
      <div className="appliances-section">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">{t.detectedAppliances}</h3>
            <p className="section-desc">Extracted automatically from spoken field words</p>
          </div>
          <button 
            type="button" 
            className="add-appliance-btn" 
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>{t.addCustomAppliance}</span>
          </button>
        </div>

        <div className="appliances-cards-list">
          {appliances.map((app) => (
            <div key={app.id} className="appliance-item-card">
              <div className="app-main-info">
                <div className="app-icon-container">
                  {getApplianceIcon(app.type)}
                </div>
                <div className="app-text-meta">
                  <div className="app-title-name">{getLocalizedName(app)}</div>
                  <div className="app-power-spec">
                    <span className="watt-chip">{app.watts} W</span>
                    <span className="dot-divider">•</span>
                    <span className="daily-kwh-chip">{app.dailyKWh} kWh/day</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="delete-app-btn"
                  onClick={() => removeAppliance(app.id)}
                  title="Remove appliance"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Stepper controls */}
              <div className="app-steppers-row">
                {/* Quantity Stepper */}
                <div className="stepper-group">
                  <span className="stepper-label">{t.qty}</span>
                  <div className="stepper-controls">
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => updateAppliance(app.id, 'count', -1)}
                      disabled={app.count <= 1}
                    >
                      -
                    </button>
                    <span className="stepper-val">{app.count}</span>
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => updateAppliance(app.id, 'count', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Operating Hours Stepper */}
                <div className="stepper-group">
                  <span className="stepper-label">{t.hoursPerDay}</span>
                  <div className="stepper-controls">
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => updateAppliance(app.id, 'hoursPerDay', -1)}
                      disabled={app.hoursPerDay <= 1}
                    >
                      -
                    </button>
                    <span className="stepper-val">{app.hoursPerDay}h</span>
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={() => updateAppliance(app.id, 'hoursPerDay', 1)}
                      disabled={app.hoursPerDay >= 24}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diesel Generator Section */}
      <div className="generator-control-card">
        <div className="gen-top-row">
          <div className="gen-title-group">
            <Fuel size={20} className="gen-icon" />
            <div>
              <div className="gen-heading">{t.generatorBackup}</div>
              <div className="gen-sub">Load shedding diesel genset usage</div>
            </div>
          </div>
          <label className="switch-toggle" aria-label="Toggle diesel generator">
            <input 
              type="checkbox" 
              checked={hasGenerator} 
              onChange={(e) => setHasGenerator(e.target.checked)} 
            />
            <span className="slider-round"></span>
          </label>
        </div>

        {hasGenerator && (
          <div className="gen-details-panel">
            <div className="gen-slider-row">
              <span className="gen-slider-label">{t.generatorUsage}:</span>
              <span className="gen-slider-val">{generatorHours} {t.hoursPerDayShort}</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="12" 
              step="0.5" 
              value={generatorHours}
              onChange={(e) => setGeneratorHours(Number(e.target.value))}
              className="gen-range-slider"
              aria-label="Generator hours"
            />
            <div className="gen-cost-indicator">
              <span>Estimated diesel expense:</span>
              <strong className="gen-rupees">₹{summary.monthlyDieselExpense?.toLocaleString('en-IN')} / month</strong>
              <small>({summary.monthlyDieselLitres} L/mo • {summary.dieselConsumptionLPerHr} L/hr @ {summary.generatorLoadKW} kW load)</small>
            </div>
          </div>
        )}
      </div>

      {/* Energy Demand & Cost Dashboard Banner */}
      <div className="live-energy-summary-panel">
        <div className="summary-col">
          <span className="summary-label">{t.totalKWh}</span>
          <div className="summary-value-accent">{summary.totalDailyKWh} <small>kWh/day</small></div>
        </div>

        <div className="summary-col">
          <span className="summary-label">{t.monthlyBill}</span>
          <div className="summary-value">₹{summary.monthlyElectricityBill}</div>
        </div>

        {hasGenerator && (
          <div className="summary-col">
            <span className="summary-label">{t.dieselExpense}</span>
            <div className="summary-value diesel-val">₹{summary.monthlyDieselExpense}</div>
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div className="voice-audit-footer-actions">
        <button 
          type="button" 
          className="save-audit-local-btn"
          onClick={() => {
            onSaveAudit();
            soundFx.playSuccess();
          }}
        >
          <Save size={18} />
          <span>Save Audit Locally</span>
        </button>

        <button 
          type="button" 
          className="proceed-recs-btn"
          onClick={() => {
            soundFx.playSuccess();
            onProceedToRecommendations();
          }}
        >
          <span>{t.proceedToRecommendations}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Add Custom Appliance Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Select Appliance to Add</h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-catalog-grid">
              {Object.keys(APPLIANCE_CATALOG).map((key) => {
                const item = APPLIANCE_CATALOG[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className="catalog-item-btn"
                    onClick={() => addApplianceFromCatalog(key)}
                  >
                    <div className="cat-icon-wrap">
                      {getApplianceIcon(item.id)}
                    </div>
                    <div className="cat-text-wrap">
                      <div className="cat-title">{getLocalizedName(item)}</div>
                      <div className="cat-meta">{item.defaultWatts}W • ~{item.defaultHours}h/day</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
