import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, RotateCcw, Download, X, Film, CheckCircle2, Volume2, Sparkles, Monitor } from 'lucide-react';

const CHAPTERS = [
  { time: 0, label: 'Intro & Vision', screen: 'UrjaMitra Platform' },
  { time: 13, label: 'Screen 1: Village Dashboard', screen: 'Multi-Hamlet Mobility' },
  { time: 30, label: 'Screen 2: Voice Energy Audit', screen: 'Indic Speech & Genset Sizing' },
  { time: 51, label: 'Screen 3: Enterprise Feasibility', screen: 'Homestay & Millet Mill' },
  { time: 70, label: 'Screen 4: Solar Recommendations', screen: '2.5 kWp Solar PV & LFP Battery' },
  { time: 88, label: 'Screen 5: Report & Sync', screen: 'Bilingual PDF & SQLite Cloud' },
  { time: 105, label: 'Outro: Rural Impact', screen: 'Decentralized Clean Energy' }
];

export default function VideoModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const jumpToChapter = (time, idx) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    videoRef.current.play();
    setIsPlaying(true);
    setActiveChapterIndex(idx);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (t >= CHAPTERS[i].time) {
        setActiveChapterIndex(i);
        break;
      }
    }
  };

  return createPortal(
    <div className="modal-backdrop video-modal-backdrop" onClick={onClose}>
      <div className="modal-card video-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="video-modal-header">
          <div className="video-modal-title-group">
            <div className="video-badge-icon">
              <Film size={20} className="text-emerald" />
            </div>
            <div>
              <h2 className="video-modal-heading">UrjaMitra — Project & Screens Explainer Video</h2>
              <p className="video-modal-subheading">Comprehensive 1080p walkthrough explaining all project screens, algorithms & offline capabilities</p>
            </div>
          </div>
          <div className="video-modal-actions">
            <a 
              href="/urjamitra_project_explainer.webm" 
              download="UrjaMitra_Project_Explainer_Video.webm"
              className="video-download-btn"
              title="Download WebM video file"
            >
              <Download size={16} />
              <span>Download Video</span>
            </a>
            <button type="button" className="modal-close-btn" onClick={onClose} title="Close video">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="video-player-container">
          <video
            ref={videoRef}
            src="/urjamitra_project_explainer.webm"
            autoPlay
            controls
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="explainer-video-element"
          />
        </div>

        {/* Chapter Quick Selector */}
        <div className="video-chapters-section">
          <div className="chapters-label-row">
            <span className="chapters-title">Jump to Project Screen Chapter:</span>
            <span className="active-chapter-name">
              Current: <strong>{CHAPTERS[activeChapterIndex]?.label}</strong> ({CHAPTERS[activeChapterIndex]?.screen})
            </span>
          </div>

          <div className="video-chapters-chips">
            {CHAPTERS.map((ch, idx) => {
              const isActive = activeChapterIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`chapter-chip-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => jumpToChapter(ch.time, idx)}
                >
                  <span className="chapter-time">0:{ch.time.toString().padStart(2, '0')}</span>
                  <span className="chapter-name">{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Screen Summary Bar */}
        <div className="video-screens-legend">
          <div className="legend-item">
            <span className="legend-dot green"></span>
            <span>Screen 1: Multi-Hamlet Dashboard & SQLite</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot blue"></span>
            <span>Screen 2: Indic Voice Energy Audit & GenSet</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot amber"></span>
            <span>Screen 3: Livelihood Enterprise Feasibility</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot emerald"></span>
            <span>Screen 4: Decentralized Solar PV Sizing</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot purple"></span>
            <span>Screen 5: Bilingual Report & Offline Cloud Sync</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
