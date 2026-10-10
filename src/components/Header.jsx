import React from 'react';
import { Sun, Wifi, WifiOff, RefreshCw, Volume2, Smartphone, Monitor, Film } from 'lucide-react';
import { translations } from '../translations';
import { soundFx } from '../services/soundFx';

export default function Header({
  language,
  setLanguage,
  isAirplaneMode,
  toggleAirplaneMode,
  pendingSyncCount,
  onOpenSync,
  deviceMode,
  setDeviceMode,
  activeVillage,
  onChangeVillage,
  onOpenVideo
}) {
  const t = translations[language] || translations.en;

  const handleSpeakWelcome = () => {
    soundFx.playDetected();
    const greetings = {
      en: "Welcome to UrjaMitra. Offline voice assistant for rural energy audits and village enterprise feasibility.",
      hi: "ऊर्जा मित्र में आपका स्वागत है। ग्रामीण ऊर्जा ऑडिट एवं आदिवासी उद्यम व्यवहार्यता का ऑफ़लाइन वाक सहायक।",
      te: "ఊర్జా మిత్రకు స్వాగతం. గ్రామీణ విద్యుత్ ఆడిట్ మరియు వ్యాపార సహాయకుడు.",
      bn: "উর্জামিত্রে স্বাগতম। গ্রামীণ শক্তি নিরীক্ষা ও উদ্যোগ সহায়ক।",
      mr: "ऊर्जा मित्र मध्ये आपले स्वागत आहे. ग्रामीण ऊर्जा ऑडिट आणि व्यवसाय सहाय्यक."
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(greetings[language] || greetings.en);
      u.rate = 0.95;
      const langCodes = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', bn: 'bn-IN', mr: 'mr-IN' };
      u.lang = langCodes[language] || 'en-IN';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <header className="header-container">
      <div className="header-top-row">
        {/* Brand identity */}
        <div className="brand-badge">
          <div className="brand-icon-box">
            <Sun className="brand-sun-icon" />
            <div className="brand-dot-pulse"></div>
          </div>
          <div className="brand-text-group">
            <div className="brand-title-wrap">
              <span className="brand-name">UrjaMitra</span>
              <span className="brand-tag">ऊर्जा मित्र</span>
            </div>
            <span className="brand-subtitle">{t.appTagline}</span>
          </div>
        </div>

        {/* Quick Utilities: Audio + Device frame switch */}
        <div className="header-quick-tools">
          <button 
            type="button" 
            className="header-tool-btn" 
            title="Listen to audio instructions" 
            onClick={handleSpeakWelcome}
            aria-label="Audio guide"
          >
            <Volume2 size={17} />
          </button>

          <button 
            type="button" 
            className="header-tool-btn" 
            title={deviceMode === 'phone' ? 'Switch to Full Screen Tablet View' : 'Switch to Handheld Phone View'}
            onClick={() => setDeviceMode(deviceMode === 'phone' ? 'tablet' : 'phone')}
            aria-label="Toggle device frame"
          >
            {deviceMode === 'phone' ? <Monitor size={17} /> : <Smartphone size={17} />}
          </button>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="header-actions-bar">
        {/* Presentation Explainer Video Button */}
        <button 
          type="button" 
          className="video-pill-btn" 
          title="Watch Project Presentation Video" 
          onClick={onOpenVideo}
        >
          <Film size={15} />
          <span>Video Tour</span>
        </button>

        {/* Airplane Mode Toggle */}
        <button 
          type="button" 
          className={`airplane-toggle-btn ${isAirplaneMode ? 'is-airplane' : 'is-online'}`}
          onClick={toggleAirplaneMode}
          title={isAirplaneMode ? 'Offline Airplane Mode active (100% on-device SQLite storage)' : 'Online Mode active'}
        >
          {isAirplaneMode ? (
            <>
              <WifiOff size={14} />
              <span className="toggle-label">{t.airplaneMode}</span>
            </>
          ) : (
            <>
              <Wifi size={14} />
              <span className="toggle-label">{t.onlineMode}</span>
            </>
          )}
        </button>

        {/* Language Selector */}
        <div className="lang-select-wrapper">
          <select 
            className="lang-select-dropdown" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language selection"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>
        </div>
      </div>

      {/* Sub-header status bar */}
      <div className="header-sub-bar">
        <div className="village-badge" onClick={onChangeVillage} role="button" tabIndex={0}>
          <span className="village-label">{t.activeVillage}:</span>
          <span className="village-value">{activeVillage.name} ({activeVillage.district})</span>
          <span className="village-change-chip">{t.changeVillage}</span>
        </div>

        <div className="status-chips-wrap">
          <span className={`offline-status-pill ${isAirplaneMode ? 'airplane-pill' : 'ready-pill'}`}>
            <span className="status-dot"></span>
            {isAirplaneMode ? 'Airplane Mode (Offline SQLite)' : t.offlineBadge}
          </span>

          <button 
            type="button" 
            className={`sync-queue-badge ${pendingSyncCount > 0 ? 'has-pending' : ''}`}
            onClick={onOpenSync}
          >
            <RefreshCw size={12} className={pendingSyncCount > 0 ? 'spin-slow' : ''} />
            <span>{pendingSyncCount > 0 ? `${pendingSyncCount} ${t.readyToSync}` : t.synced}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
