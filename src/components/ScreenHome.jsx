import React from 'react';
import { Mic, TrendingUp, Sparkles, Database, CheckCircle2, Clock, ChevronRight, Zap, ShieldAlert, Award } from 'lucide-react';
import { translations } from '../translations';
import { soundFx } from '../services/soundFx';

export default function ScreenHome({
  language,
  onStartAudit,
  onCheckFeasibility,
  savedAudits,
  onSelectAudit,
  isAirplaneMode,
  activeVillage
}) {
  const t = translations[language] || translations.en;

  const unsyncedCount = savedAudits.filter(a => a.status === 'ready_to_sync').length;
  const syncedCount = savedAudits.filter(a => a.status === 'synced').length;

  return (
    <div className="screen-content home-screen">
      {/* Hero Welcome Banner */}
      <div className="hero-banner-card">
        <div className="hero-badge-tag">
          <Sparkles size={14} />
          <span>Offline-First Rural Clean Energy Assistant</span>
        </div>
        <h1 className="hero-heading">
          {language === 'hi' ? 'ग्रामीण ऊर्जा ऑडिट एवं उद्यम मोबिलाइज़र' :
           language === 'te' ? 'గ్రామీణ శక్తి ఆడిట్ మరియు వ్యాపార వేదిక' :
           language === 'bn' ? 'গ্রামীণ শক্তি অডিট ও জীবিকা উদ্যোগ প্ল্যাটফর্ম' :
           language === 'mr' ? 'ग्रामीण ऊर्जा ऑडिट आणि उपजीविका उद्योग' :
           'Voice-First Energy Audit & Livelihood Mobilizer'}
        </h1>
        <p className="hero-subtext">
          {language === 'hi' ? 'इंटरनेट, टाइपिंग या तकनीकी ज्ञान के बिना स्थानीय भाषा में बोलकर फील्ड ऑडिट करें और ग्रामीण उद्यमों को सशक्त बनाएं।' :
           language === 'te' ? 'ఇంటర్నెట్ మరియు టైపింగ్ అవసరం లేకుండా మీ స్వంత భాషలో మాట్లాడి ఎనర్జీ ఆడిట్ చేయండి.' :
           language === 'bn' ? 'ইন্টারনেট বা টাইপিং ছাড়াই নিজের ভাষায় কথা বলে শক্তি নিরীক্ষা ও গ্রামীণ ব্যবসা শুরু করুন।' :
           language === 'mr' ? 'इंटरनेट किंवा टायपिंगशिवाय स्थानिक भाषेत बोलून ऊर्जा ऑडिट करा.' :
           'Designed for field mitras inside remote villages to talk naturally in their mother tongue without typing or internet.'}
        </p>

        <div className="offline-feature-strip">
          <div className="offline-pill">
            <Database size={13} />
            <span>SQLite Offline Storage</span>
          </div>
          <div className="offline-pill">
            <Mic size={13} />
            <span>Local Indic Voice NLP</span>
          </div>
          <div className="offline-pill">
            <Zap size={13} />
            <span>Deterministic Math Engine</span>
          </div>
        </div>
      </div>

      {/* Two Prominent Core Action Cards */}
      <div className="action-cards-grid">
        {/* Action 1: Start Energy Audit */}
        <div 
          className="action-card action-card-audit"
          onClick={() => { soundFx.playMicStart(); onStartAudit(); }}
          role="button"
          tabIndex={0}
        >
          <div className="action-card-glow audit-glow"></div>
          <div className="action-card-header">
            <div className="action-icon-circle audit-icon-bg">
              <Mic size={28} className="action-main-icon" />
            </div>
            <span className="action-badge">Step 1 — Walk & Talk</span>
          </div>
          <h2 className="action-card-title">{t.startAudit}</h2>
          <p className="action-card-desc">{t.startAuditDesc}</p>
          
          <div className="action-card-chips">
            <span className="action-chip">6 Lights, 3 Fans, 1 Fridge</span>
            <span className="action-chip">Diesel GenSet Sizing</span>
            <span className="action-chip">Rooftop Solar PV</span>
          </div>

          <div className="action-card-footer">
            <span className="action-footer-text">Tap to start speaking</span>
            <div className="action-arrow-circle">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Action 2: Check Business Feasibility */}
        <div 
          className="action-card action-card-feasibility"
          onClick={() => { soundFx.playSuccess(); onCheckFeasibility(); }}
          role="button"
          tabIndex={0}
        >
          <div className="action-card-glow feasibility-glow"></div>
          <div className="action-card-header">
            <div className="action-icon-circle feasibility-icon-bg">
              <TrendingUp size={28} className="action-main-icon" />
            </div>
            <span className="action-badge">Step 2 — Feasibility</span>
          </div>
          <h2 className="action-card-title">{t.checkFeasibility}</h2>
          <p className="action-card-desc">{t.checkFeasibilityDesc}</p>

          <div className="action-card-chips">
            <span className="action-chip">Tribal Homestay</span>
            <span className="action-chip">Millet Mill</span>
            <span className="action-chip">Cold Storage</span>
          </div>

          <div className="action-card-footer">
            <span className="action-footer-text">Calculate ROI & Payback</span>
            <div className="action-arrow-circle">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Field Metrics Strip */}
      <div className="stats-row-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Saved Audits</span>
            <Database size={16} className="stat-icon-blue" />
          </div>
          <div className="stat-number">{savedAudits.length}</div>
          <div className="stat-sub">100% on device</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Ready to Sync</span>
            <Clock size={16} className="stat-icon-amber" />
          </div>
          <div className="stat-number">{unsyncedCount}</div>
          <div className="stat-sub">{isAirplaneMode ? 'Held offline' : 'Pending upload'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Synced to Cloud</span>
            <CheckCircle2 size={16} className="stat-icon-green" />
          </div>
          <div className="stat-number">{syncedCount}</div>
          <div className="stat-sub">Central SQLite ready</div>
        </div>
      </div>

      {/* Saved Audits Section */}
      <div className="saved-audits-section">
        <div className="section-header-row">
          <div>
            <h3 className="section-title">{t.savedAudits}</h3>
            <p className="section-desc">Audits stored on-device in {activeVillage.name}</p>
          </div>
          <span className="audits-count-badge">{savedAudits.length} Records</span>
        </div>

        <div className="audits-list-cards">
          {savedAudits.map((audit) => {
            const applianceCount = Array.isArray(audit.appliances) ? audit.appliances.length : 0;
            const isSynced = audit.status === 'synced';
            return (
              <div 
                key={audit.id} 
                className="audit-item-card"
                onClick={() => onSelectAudit(audit)}
                role="button"
                tabIndex={0}
              >
                <div className="audit-card-left">
                  <div className="audit-icon-box">
                    <Zap size={20} />
                  </div>
                  <div className="audit-details">
                    <div className="audit-facility-name">{audit.facility_name}</div>
                    <div className="audit-village-loc">
                      {audit.village_name} {audit.district ? `• ${audit.district}` : ''}
                    </div>
                    <div className="audit-specs-row">
                      <span className="spec-tag">{applianceCount} Appliances</span>
                      <span className="spec-tag">{audit.daily_kwh} kWh/day</span>
                      {audit.has_generator && (
                        <span className="spec-tag generator-tag">
                          DG Set ({audit.generator_hours}h)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="audit-card-right">
                  <div className="audit-bill-amt">₹{audit.monthly_bill + (audit.diesel_expense || 0)}/mo</div>
                  <span className={`sync-status-tag ${isSynced ? 'synced' : 'pending'}`}>
                    {isSynced ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>{t.synced}</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} />
                        <span>{t.readyToSync}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact & Innovation Note for Judges / Field Workers */}
      <div className="innovation-explainer-box">
        <div className="explainer-header">
          <Award size={18} className="explainer-icon" />
          <span className="explainer-title">Why UrjaMitra is not another chatbot:</span>
        </div>
        <p className="explainer-text">
          Traditional energy audits require expensive certified engineers and complex spreadsheets. UrjaMitra turns spoken vernacular observations into engineering-grade solar sizing and livelihood enterprise payback calculations — completely offline inside remote tribal hamlets.
        </p>
      </div>
    </div>
  );
}
