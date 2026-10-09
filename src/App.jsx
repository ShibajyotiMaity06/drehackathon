import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ScreenHome from './components/ScreenHome';
import ScreenVoiceAudit from './components/ScreenVoiceAudit';
import ScreenFeasibility from './components/ScreenFeasibility';
import ScreenRecommendations from './components/ScreenRecommendations';
import ScreenReportSync from './components/ScreenReportSync';
import { storageService } from './services/storageService';
import { translations } from './translations';
import { soundFx } from './services/soundFx';
import { MapPin, Check } from 'lucide-react';
import './App.css';

const VILLAGE_OPTIONS = [
  { id: 'v-rampur', name: 'Rampur Gram Panchayat', district: 'Surguja', state: 'Chhattisgarh' },
  { id: 'v-araku', name: 'Araku Valley Hamlet #4', district: 'Alluri Sitharama Raju', state: 'Andhra Pradesh' },
  { id: 'v-bastar', name: 'Bastar Tribal Cluster', district: 'Bastar', state: 'Chhattisgarh' },
  { id: 'v-sundarbans', name: 'Sundarbans Delta Hamlet', district: 'South 24 Parganas', state: 'West Bengal' },
  { id: 'v-melghat', name: 'Melghat Tribal Belt', district: 'Amravati', state: 'Maharashtra' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('hi'); // Default to Hindi, field worker friendly
  const [deviceMode, setDeviceMode] = useState('phone'); // 'phone' or 'tablet'
  const [isAirplaneMode, setIsAirplaneMode] = useState(storageService.getAirplaneMode());
  const [activeVillage, setActiveVillage] = useState(VILLAGE_OPTIONS[0]);
  const [showVillageModal, setShowVillageModal] = useState(false);

  const [savedAudits, setSavedAudits] = useState(storageService.getAudits());

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
      { id: 'app-init-3', type: 'fridge', name: 'Refrigerator / Cooler', nameHi: 'रेफ्रिजरेटर / डीप फ्रीजर', count: 1, watts: 160, efficientWatts: 85, hoursPerDay: 24 }
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
    return saved;
  };

  const handleSaveFeasibility = (feasibilityRecord) => {
    storageService.saveFeasibilityStudy(feasibilityRecord);
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
    soundFx.playDetected();
  };

  const pendingSyncCount = savedAudits.filter(a => a.status === 'ready_to_sync').length;

  return (
    <div className={`app-root ${deviceMode === 'phone' ? 'phone-viewport-mode' : 'tablet-viewport-mode'}`}>
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

      {/* Change Village Modal */}
      {showVillageModal && (
        <div className="modal-backdrop">
          <div className="modal-card village-modal">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <MapPin size={20} className="modal-pin-icon" />
                <h3>Select Active Village / Cluster</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowVillageModal(false)}
              >
                ✕
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
    </div>
  );
}
