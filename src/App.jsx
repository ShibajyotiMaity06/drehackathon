import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ScreenHome from './components/ScreenHome';
import ScreenVoiceAudit from './components/ScreenVoiceAudit';
import ScreenFeasibility from './components/ScreenFeasibility';
import ScreenRecommendations from './components/ScreenRecommendations';
import ScreenReportSync from './components/ScreenReportSync';
import VideoModal from './components/VideoModal';
import { storageService } from './services/storageService';
import { translations } from './translations';
import { soundFx } from './services/soundFx';
import { MapPin, Check, Search, X, Bell, Moon, Sun } from 'lucide-react';
import './App.css';

const VILLAGE_OPTIONS = [
  { id: 'v-rampur', name: 'Rampur Gram Panchayat', district: 'Surguja', state: 'Chhattisgarh' },
  { id: 'v-araku', name: 'Araku Valley Hamlet #4', district: 'Alluri Sitharama Raju', state: 'Andhra Pradesh' },
  { id: 'v-bastar', name: 'Bastar Tribal Cluster', district: 'Bastar', state: 'Chhattisgarh' },
  { id: 'v-sundarbans', name: 'Sundarbans Delta Hamlet', district: 'South 24 Parganas', state: 'West Bengal' },
  { id: 'v-melghat', name: 'Melghat Tribal Belt', district: 'Amravati', state: 'Maharashtra' }
];

// Toast helper
const toasts = [];
function showToast(message, type = 'success') {
  const id = Date.now() + Math.random();
  toasts.push({ id, message, type });
  window.dispatchEvent(new CustomEvent('urjamitra-toast', { detail: { id, message, type } }));
  setTimeout(() => removeToast(id), 3500);
  return id;
}
function removeToast(id) {
  const idx = toasts.findIndex(t => t.id === id);
  if (idx >= 0) toasts.splice(idx, 1);
  window.dispatchEvent(new CustomEvent('urjamitra-toast-remove', { detail: id }));
}

// Search data built from saved audits + feasibility + translations
function buildSearchData(savedAudits, feasibilityStudies, language) {
  const t = translations[language] || translations.en;
  const items = [];
  savedAudits.forEach(a => {
    items.push({ id: `audit-${a.id}`, label: a.facility_name, sub: `${a.village_name} • ${a.district}`, tag: a.status === 'synced' ? 'Synced' : 'Offline', icon: 'file', type: 'audit' });
    const notes = a.notes || '';
    if (notes) items.push({ id: `note-${a.id}`, label: 'Audit notes', sub: notes, tag: 'Details', icon: 'file', type: 'audit' });
  });
  feasibilityStudies.forEach(s => {
    items.push({ id: `feas-${s.id}`, label: s.enterprise_type, sub: `${s.net_profit.toLocaleString('en-IN')} ₹/mo • ${s.payback_years.toFixed(1)} yr payback`, tag: 'Feasibility', icon: 'trending', type: 'feasibility' });
  });
  const quickActions = [
    { id: 'quick-audit', label: 'Start Voice Energy Audit', sub: 'Tap & speak appliance loads', tag: 'Audit', icon: 'mic', type: 'action' },
    { id: 'quick-feas', label: 'Enterprise Feasibility', sub: 'Check business viability', tag: 'Calculator', icon: 'trending', type: 'action' },
    { id: 'quick-sync', label: 'Sync Offline Audits', sub: 'Upload pending records', tag: 'Sync', icon: 'cloud', type: 'action' },
    { id: 'quick-video', label: 'Project Video Walkthrough', sub: 'Watch explainer video', tag: 'Video', icon: 'film', type: 'action' },
    { id: 'quick-village', label: 'Change Active Village', sub: 'Switch hamlet cluster', tag: 'Location', icon: 'map', type: 'action' },
    { id: 'quick-timer', label: 'Power-Cut Timer', sub: 'Track grid outages', tag: 'Tool', icon: 'clock', type: 'action' }
  ];
  items.push(...quickActions);
  return items;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('hi');
  const [deviceMode, setDeviceMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth >= 900) ? 'tablet' : 'phone');
  const [isAirplaneMode, setIsAirplaneMode] = useState(storageService.getAirplaneMode());
  const [activeVillage, setActiveVillage] = useState(VILLAGE_OPTIONS[0]);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('urjamitra_theme') || 'dark');
  useEffect(() => {
    localStorage.setItem('urjamitra_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Toast listener
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const onToast = (e) => setToasts(prev => [...prev, e.detail]);
    const onRemove = (e) => setToasts(prev => prev.filter(t => t.id !== e.detail));
    window.addEventListener('urjamitra-toast', onToast);
    window.addEventListener('urjamitra-toast-remove', onRemove);
    return () => {
      window.removeEventListener('urjamitra-toast', onToast);
      window.removeEventListener('urjamitra-toast-remove', onRemove);
    };
  }, []);
  // Also push legacy store toasts (soundFx) — keep sound only
  const playSuccess = useCallback(() => soundFx.playSuccess(), []);

  const [savedAudits, setSavedAudits] = useState(storageService.getAudits());
  const [feasibilityStudies, setFeasibilityStudies] = useState(() => storageService.getFeasibilityStudies());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocus, setSearchFocus] = useState(0);

  // Keyboard search shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
      if (searchOpen) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSearchFocus(p => Math.min(p + 1, Math.max(0, allSearchItems.length - 1))); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSearchFocus(p => Math.max(0, p - 1)); }
        if (e.key === 'Enter' && allSearchItems[searchFocus]) {
          handleSearchSelect(allSearchItems[searchFocus]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, searchFocus, searchQuery]);

  // Live search data
  const allSearchItems = useMemo(() => buildSearchData(savedAudits, feasibilityStudies, language), [savedAudits, feasibilityStudies, language]);
  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return allSearchItems;
    const q = searchQuery.toLowerCase();
    return allSearchItems.filter(i =>
      i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
    );
  }, [searchQuery, allSearchItems]);

  const handleSearchSelect = (item) => {
    setSearchOpen(false);
    setSearchQuery('');
    soundFx.playDetected();
    if (item.type === 'audit') {
      const audit = savedAudits.find(a => a.id === item.id.replace('audit-', ''));
      if (audit) { setCurrentAudit(audit); setActiveTab('voiceAudit'); showToast('Opening saved audit — ' + item.label, 'info'); }
    } else if (item.type === 'feasibility') {
      setActiveTab('feasibility');
      showToast('Feasibility explorer', 'info');
    } else if (item.type === 'action') {
      switch (item.id) {
        case 'quick-audit': setActiveTab('voiceAudit'); break;
        case 'quick-feas': setActiveTab('feasibility'); break;
        case 'quick-sync': setActiveTab('reportSync'); break;
        case 'quick-video': setShowVideoModal(true); break;
        case 'quick-village': setShowVillageModal(true); break;
        default: break;
      }
    }
  };

  // Current active working audit
  const [currentAudit, setCurrentAudit] = useState({
    id: `audit-${Date.now()}`,
    facility_name: 'Rampur Community Hall & PDS Center',
    village_name: VILLAGE_OPTIONS[0].name,
    district: VILLAGE_OPTIONS[0].district,
    state: VILLAGE_OPTIONS[0].state,
    appliances: [
      { id: 'app-init-1', type: 'light', name: 'Lights / Tube lights', nameHi: 'लाइटें / ट्यूबलाइट', count: 6, watts: 40, efficientWatts: 9, hoursPerDay: 6 },
      { id: 'app-init-2', type: 'fan', name: 'Ceiling Fans', nameHi: 'छत के पंखे', count: 3, watts: 75, efficientWatts: 28, hoursPerDay: 8 },
      { id: 'app-init-3', type: 'fridge', name: 'Refrigerator / Cooler', nameHi: 'रეफ्रिજेरेटर / डीप फ्रীজर', count: 1, watts: 160, efficientWatts: 85, hoursPerDay: 24 }
    ],
    has_generator: true,
    generator_hours: 3.5,
    daily_kwh: 7.08,
    monthly_bill: 1168,
    diesel_expense: 9660,
    carbon_kg_monthly: 425.2,
    status: 'ready_to_sync'
  });

  const toggleAirplaneMode = () => {
    const nextState = !isAirplaneMode;
    setIsAirplaneMode(nextState);
    storageService.setAirplaneMode(nextState);
    showToast(nextState ? 'Airplane mode ON — all data stored on-device' : 'Airplane mode OFF — sync enabled', nextState ? 'info' : 'success');
    soundFx.playDetected();
  };

  const handleSaveAudit = () => {
    const saved = storageService.saveAudit({
      ...currentAudit,
      village_name: activeVillage.name,
      district: activeVillage.district,
      state: activeVillage.state
    });
    setSavedAudits(storageService.getAudits());
    showToast('Audit saved locally (' + (saved.status === 'ready_to_sync' ? 'offline' : 'synced') + ')', 'success');
    return saved;
  };

  const handleSaveFeasibility = (feasibilityRecord) => {
    storageService.saveFeasibilityStudy(feasibilityRecord);
    setFeasibilityStudies(storageService.getFeasibilityStudies());
    showToast('Feasibility study saved locally', 'success');
  };

  const handleSelectSavedAudit = (audit) => {
    setCurrentAudit(audit);
    setActiveTab('voiceAudit');
    soundFx.playDetected();
  };

  const handleSelectVillage = (village) => {
    setActiveVillage(village);
    setCurrentAudit(prev => ({
      ...prev,
      village_name: village.name,
      district: village.district,
      state: village.state
    }));
    setShowVillageModal(false);
    showToast('Switched to ' + village.name, 'success');
    soundFx.playDetected();
  };

  const pendingSyncCount = savedAudits.filter(a => a.status === 'ready_to_sync').length;
  const totalAudits = savedAudits.length;
  const syncedCount = savedAudits.filter(a => a.status === 'synced').length;

  return (
    <div className={`app-root ${theme === 'light' ? 'light-mode' : ''} ${deviceMode === 'phone' ? 'phone-viewport-mode' : 'tablet-viewport-mode'}`}>
      <div className="device-chassis">
        {deviceMode === 'phone' && (
          <div className="phone-notch-bar">
            <div className="speaker-earpiece"></div>
            <div className="camera-lens"></div>
          </div>
        )}

        <div className="app-viewport">
          <Header
            language={language}
            setLanguage={setLanguage}
            isAirplaneMode={isAirplaneMode}
            toggleAirplaneMode={toggleAirplaneMode}
            pendingSyncCount={pendingSyncCount}
            onOpenSync={() => setActiveTab('reportSync')}
            deviceMode={deviceMode}
            setDeviceMode={setDeviceMode}
            activeVillage={activeVillage}
            onChangeVillage={() => setShowVillageModal(true)}
            onOpenVideo={() => setShowVideoModal(true)}
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <main className="main-scroll-container">
            {activeTab === 'home' && (
              <ScreenHome
                language={language}
                onStartAudit={() => setActiveTab('voiceAudit')}
                onCheckFeasibility={() => setActiveTab('feasibility')}
                savedAudits={savedAudits}
                onSelectAudit={handleSelectSavedAudit}
                isAirplaneMode={isAirplaneMode}
                activeVillage={activeVillage}
                totalAudits={totalAudits}
                syncedCount={syncedCount}
              />
            )}

            {activeTab === 'voiceAudit' && (
              <ScreenVoiceAudit
                language={language}
                currentAudit={currentAudit}
                setCurrentAudit={setCurrentAudit}
                onProceedToRecommendations={() => setActiveTab('recommendations')}
                onSaveAudit={handleSaveAudit}
                activeVillage={activeVillage}
              />
            )}

            {activeTab === 'feasibility' && (
              <ScreenFeasibility
                language={language}
                onSaveFeasibility={handleSaveFeasibility}
                activeVillage={activeVillage}
              />
            )}

            {activeTab === 'recommendations' && (
              <ScreenRecommendations
                language={language}
                currentAudit={currentAudit}
                onProceedToReport={() => setActiveTab('reportSync')}
              />
            )}

            {activeTab === 'reportSync' && (
              <ScreenReportSync
                language={language}
                currentAudit={currentAudit}
                savedAudits={savedAudits}
                setSavedAudits={setSavedAudits}
                isAirplaneMode={isAirplaneMode}
                toggleAirplaneMode={toggleAirplaneMode}
                activeVillage={activeVillage}
                feasibilityStudies={feasibilityStudies}
              />
            )}
          </main>

          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingSyncCount={pendingSyncCount}
            language={language}
          />
        </div>
      </div>

      {/* Global search */}
      {searchOpen && (
        <div className="global-search-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
          <div className="global-search-card" onClick={(e) => e.stopPropagation()}>
            <div className="global-search-input-row">
              <Search size={18} className="text-emerald" />
              <input
                type="text"
                autoFocus
                placeholder="Search audits, enterprises, or type a command..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchFocus(0); }}
              />
              <button className="modal-close-btn" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                <X size={16} />
              </button>
              <span style={{ fontSize: '0.65rem', color: '#64748b', background: '#0f172a', padding: '2px 6px', borderRadius: 6, border: '1px solid #334155' }}>ESC</span>
            </div>
            <div className="global-search-results">
              {filteredSearch.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 0.85 }}>No results found — try searching "community", "feasibility", or "sync".</div>
              ) : (
                filteredSearch.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`search-result-item${searchFocus === idx ? ' shimmer' : ''}`}
                    style={{ background: searchFocus === idx ? 'rgba(16,185,129,0.12)' : undefined, borderRadius: 10, transition: 'background 0.12s' }}
                    onClick={() => handleSearchSelect(item)}
                  >
                    <div className="search-result-icon" style={{ background: item.type === 'action' ? 'rgba(56,189,248,0.16)' : item.type === 'feasibility' ? 'rgba(245,158,11,0.14)' : 'rgba(16,185,129,0.14)', color: item.type === 'action' ? '#38bdf8' : item.type === 'feasibility' ? '#fbbf24' : '#34d399' }}>
                      {item.icon === 'file' && <Check size={16} />}
                      {item.icon === 'mic' && <Search size={16} />}
                      {item.icon === 'trending' && <Search size={16} />}
                      {item.icon === 'cloud' && <Search size={16} />}
                      {item.icon === 'film' && <Search size={16} />}
                      {item.icon === 'map' && <Search size={16} />}
                      {item.icon === 'clock' && <Search size={16} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 0.86, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                      <div style={{ fontSize: 0.74, color: '#94a3b8' }}>{item.sub}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 0.62, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.06 }}>{item.tag}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: 10, background: '#080d18', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 0.68, color: '#64748b' }}>↓/↑ to navigate • Enter to open</span>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="app-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`app-toast ${t.type}`} role="alert">
            {t.type === 'success' && <Check size={14} />}
            {t.type === 'error' && <X size={14} />}
            {t.type === 'info' && <Bell size={14} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Change Village Modal */}
      {showVillageModal && (
        <div className="modal-backdrop">
          <div className="modal-card village-modal">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <MapPin size={20} className="modal-pin-icon" />
                <h3>Select Active Village / Cluster</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowVillageModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="village-options-list">
              {VILLAGE_OPTIONS.map((v) => {
                const isSelected = activeVillage.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`village-choice-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectVillage(v)}
                  >
                    <div>
                      <div className="v-choice-name">{v.name}</div>
                      <div className="v-choice-sub">{v.district}, {v.state}</div>
                    </div>
                    {isSelected && <Check size={18} className="v-check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Project Screens Explainer Video Modal */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </div>
  );
}
