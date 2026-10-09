import React from 'react';
import { Home, Mic, TrendingUp, Lightbulb, FileText } from 'lucide-react';
import { soundFx } from '../services/soundFx';

export default function Navigation({ activeTab, setActiveTab, pendingSyncCount, language }) {
  const tabs = [
    {
      id: 'home',
      labelEn: 'Home',
      labelHi: 'मुख्य',
      labelTe: 'హోమ్',
      labelBn: 'মূল',
      labelMr: 'मुख्य',
      icon: Home
    },
    {
      id: 'voiceAudit',
      labelEn: 'Voice Audit',
      labelHi: 'वाक ऑडिट',
      labelTe: 'ఆడిట్',
      labelBn: 'অডিট',
      labelMr: 'ऑडिट',
      icon: Mic,
      isPrimary: true
    },
    {
      id: 'feasibility',
      labelEn: 'Feasibility',
      labelHi: 'व्यवसाय',
      labelTe: 'వ్యాపారం',
      labelBn: 'সম্ভাব্যতা',
      labelMr: 'व्यवसाय',
      icon: TrendingUp
    },
    {
      id: 'recommendations',
      labelEn: 'Savings & Solar',
      labelHi: 'बचत व सोलर',
      labelTe: 'పొదుపు',
      labelBn: 'সঞ্চয়',
      labelMr: 'बचत',
      icon: Lightbulb
    },
    {
      id: 'reportSync',
      labelEn: 'Report & Sync',
      labelHi: 'रिपोर्ट व सिंक',
      labelTe: 'రిపోర్ట్',
      labelBn: 'রিপোর্ট',
      labelMr: 'अहवाल',
      icon: FileText,
      badge: pendingSyncCount > 0 ? pendingSyncCount : null
    }
  ];

  const handleSelectTab = (id) => {
    soundFx.playDetected();
    setActiveTab(id);
  };

  const getLabel = (tab) => {
    switch (language) {
      case 'hi': return tab.labelHi;
      case 'te': return tab.labelTe;
      case 'bn': return tab.labelBn;
      case 'mr': return tab.labelMr;
      default: return tab.labelEn;
    }
  };

  return (
    <nav className="bottom-nav-container" aria-label="Bottom Navigation">
      <div className="bottom-nav-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab-item ${isActive ? 'is-active' : ''} ${tab.isPrimary ? 'is-primary-tab' : ''}`}
              onClick={() => handleSelectTab(tab.id)}
              aria-selected={isActive}
            >
              <div className="nav-icon-wrapper">
                <Icon size={tab.isPrimary ? 24 : 20} className="nav-icon" />
                {tab.badge && (
                  <span className="nav-notification-badge">{tab.badge}</span>
                )}
              </div>
              <span className="nav-tab-label">{getLabel(tab)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
