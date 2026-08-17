import React from 'react';

export interface SFSymbolProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  fill?: string;
}

//  SF Symbol: network / point.3.connected.trianglepath
export const SFSymbolNetwork: React.FC<SFSymbolProps> = ({ size = 13, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="8" cy="3.5" r="2" fill="currentColor" fillOpacity="0.15" />
    <circle cx="3.5" cy="12.5" r="2" fill="currentColor" fillOpacity="0.15" />
    <circle cx="12.5" cy="12.5" r="2" fill="currentColor" fillOpacity="0.15" />
    <path d="M6.5 5L4.5 10.5" />
    <path d="M9.5 5L11.5 10.5" />
    <path d="M5.5 12.5H10.5" />
  </svg>
);

//  SF Symbol: brain / brain.head.profile
export const SFSymbolBrain: React.FC<SFSymbolProps> = ({ size = 13, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M8 2.2C5.5 2.2 4.2 3.6 4.2 5.5c0 .6.2 1.2.5 1.7-.8.5-1.3 1.4-1.3 2.4 0 1.5 1.1 2.8 2.6 2.9.4 1 1.2 1.5 2 1.5" />
    <path d="M8 2.2c2.5 0 3.8 1.4 3.8 3.3 0 .6-.2 1.2-.5 1.7.8.5 1.3 1.4 1.3 2.4 0 1.5-1.1 2.8-2.6 2.9-.4 1-1.2 1.5-2 1.5" />
    <path d="M8 2.2v11.8" strokeDasharray="1.5 1.5" />
    <path d="M5.8 6.5C6.5 6.5 7 7 7 7.7" />
    <path d="M10.2 6.5C9.5 6.5 9 7 9 7.7" />
  </svg>
);

//  SF Symbol: play.fill
export const SFSymbolPlay: React.FC<SFSymbolProps> = ({ size = 11, className = '', style, color = 'currentColor', fill }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={fill || color} stroke={color} strokeWidth="0.8" strokeLinejoin="round" className={className} style={style}>
    <path d="M4.5 3.2C4.5 2.4 5.4 1.9 6.1 2.3l7.5 4.8c.6.4.6 1.4 0 1.8L6.1 13.7C5.4 14.1 4.5 13.6 4.5 12.8V3.2z" />
  </svg>
);

//  SF Symbol: pause.fill
export const SFSymbolPause: React.FC<SFSymbolProps> = ({ size = 11, className = '', style, color = 'currentColor', fill }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={fill || color} className={className} style={style}>
    <rect x="3.5" y="2.5" width="3.2" height="11" rx="1.6" />
    <rect x="9.3" y="2.5" width="3.2" height="11" rx="1.6" />
  </svg>
);

//  SF Symbol: stop.fill / square.fill
export const SFSymbolStop: React.FC<SFSymbolProps> = ({ size = 11, className = '', style, color = 'currentColor', fill }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={fill || color} className={className} style={style}>
    <rect x="3" y="3" width="10" height="10" rx="2.5" />
  </svg>
);

//  SF Symbol: arrow.up.forward.app.fill / rocket.fill
export const SFSymbolRocket: React.FC<SFSymbolProps> = ({ size = 13, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M10.5 2.5C9.5 2 7 3.5 5.5 5 4 6.5 2.5 9 2 10.5c0 0 1.5.5 2.5.5 1 0 2-.5 2.5-1l4-4c.5-.5 1-1.5 1-2.5 0-1-.5-1-.5-1z" fill="currentColor" fillOpacity="0.12" />
    <path d="M13.5 2.5l-4 4" />
    <path d="M9.5 6.5L6 10" />
    <path d="M2.5 13.5l2-1 1 2-3-1z" fill="currentColor" />
  </svg>
);

//  SF Symbol: sun.max.fill
export const SFSymbolSun: React.FC<SFSymbolProps> = ({ size = 10, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" className={className} style={style}>
    <circle cx="8" cy="8" r="3.2" fill="currentColor" />
    <line x1="8" y1="1.5" x2="8" y2="3.2" />
    <line x1="8" y1="12.8" x2="8" y2="14.5" />
    <line x1="1.5" y1="8" x2="3.2" y2="8" />
    <line x1="12.8" y1="8" x2="14.5" y2="8" />
    <line x1="3.4" y1="3.4" x2="4.6" y2="4.6" />
    <line x1="11.4" y1="11.4" x2="12.6" y2="12.6" />
    <line x1="3.4" y1="12.6" x2="4.6" y2="11.4" />
    <line x1="11.4" y1="4.6" x2="12.6" y2="3.4" />
  </svg>
);

//  SF Symbol: moon.stars.fill
export const SFSymbolMoon: React.FC<SFSymbolProps> = ({ size = 10, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} className={className} style={style}>
    <path d="M6.5 2.2C6.7 2.2 6.8 2.4 6.7 2.6 5.8 4.2 5.8 6.3 6.9 7.8c1.1 1.5 2.9 2.2 4.8 1.9.2 0 .4.2.3.4C11.3 12.2 9.1 13.8 6.5 13.8 3 13.8 1.2 10.6 1.2 7.2c0-2.8 1.9-4.8 5.3-5z" />
    <circle cx="12.5" cy="3.5" r="0.8" />
    <circle cx="14" cy="6" r="0.6" />
  </svg>
);

//  SF Symbol: folder.fill / folder.badge.gearshape
export const SFSymbolFolder: React.FC<SFSymbolProps> = ({ size = 13, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 4.2C2 3.5 2.6 3 3.3 3h3.1c.5 0 1 .3 1.3.7l.8 1.1c.3.4.8.7 1.3.7h3c.7 0 1.3.6 1.3 1.3v6c0 .7-.6 1.2-1.3 1.2H3.3C2.6 14 2 13.5 2 12.8V4.2z" fill="currentColor" fillOpacity="0.12" />
  </svg>
);

//  SF Symbol: cpu.fill / memorychip.fill
export const SFSymbolCpu: React.FC<SFSymbolProps> = ({ size = 13, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="4" y="4" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.15" />
    <path d="M6 1.5v2.5M10 1.5v2.5M6 12v2.5M10 12v2.5M1.5 6h2.5M1.5 10h2.5M12 6h2.5M12 10h2.5" />
  </svg>
);

//  SF Symbol: plus
export const SFSymbolPlus: React.FC<SFSymbolProps> = ({ size = 12, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" className={className} style={style}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

//  SF Symbol: checkmark
export const SFSymbolCheck: React.FC<SFSymbolProps> = ({ size = 12, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
  </svg>
);

//  SF Symbol: xmark
export const SFSymbolXmark: React.FC<SFSymbolProps> = ({ size = 12, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" className={className} style={style}>
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

//  SF Symbol: trash.fill
export const SFSymbolTrash: React.FC<SFSymbolProps> = ({ size = 12, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M3 4.5h10M6 2.5h4a1 1 0 0 1 1 1V4.5H5V3.5a1 1 0 0 1 1-1z" />
    <path d="M4.5 4.5v8.5a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5V4.5" fill="currentColor" fillOpacity="0.12" />
    <line x1="6.8" y1="7.5" x2="6.8" y2="11.5" />
    <line x1="9.2" y1="7.5" x2="9.2" y2="11.5" />
  </svg>
);

//  SF Symbol: square.and.arrow.down / download
export const SFSymbolDownload: React.FC<SFSymbolProps> = ({ size = 12, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M8 2.5v7.5M5 7.5l3 3 3-3" />
    <path d="M3 11.5v1.2c0 .8.6 1.3 1.3 1.3h7.4c.7 0 1.3-.5 1.3-1.3v-1.2" />
  </svg>
);

//  SF Symbol: square.and.arrow.up / upload
export const SFSymbolUpload: React.FC<SFSymbolProps> = ({ size = 12, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M8 9.5V2M5 4.5l3-3 3 3" />
    <path d="M3 8.5v4.2c0 .8.6 1.3 1.3 1.3h7.4c.7 0 1.3-.5 1.3-1.3V8.5" />
  </svg>
);

//  SF Symbol: magnifyingglass
export const SFSymbolSearch: React.FC<SFSymbolProps> = ({ size = 12, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="7" cy="7" r="4.2" />
    <line x1="10.2" y1="10.2" x2="14" y2="14" />
  </svg>
);

//  SF Symbol: chevron.down
export const SFSymbolChevronDown: React.FC<SFSymbolProps> = ({ size = 10, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2.5 4.5L6 8L9.5 4.5" />
  </svg>
);

//  SF Symbol: chevron.right
export const SFSymbolChevronRight: React.FC<SFSymbolProps> = ({ size = 10, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M4.5 2.5L8 6L4.5 9.5" />
  </svg>
);

//  Node Group SF Symbols:
// 1. Input: chart.bar.xaxis / waveform.path.ecg
export const SFSymbolChartBar: React.FC<SFSymbolProps> = ({ size = 14, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="2.5" y="8.5" width="2.5" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="6.8" y="4.5" width="2.5" height="9" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="11" y="2.5" width="2.5" height="11" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

// 2. FC1: slider.horizontal.3 / square.3.layers.3d
export const SFSymbolSliders: React.FC<SFSymbolProps> = ({ size = 14, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" className={className} style={style}>
    <line x1="2" y1="4.5" x2="14" y2="4.5" />
    <line x1="2" y1="11.5" x2="14" y2="11.5" />
    <circle cx="5.5" cy="4.5" r="1.8" fill={color} />
    <circle cx="10.5" cy="11.5" r="1.8" fill={color} />
  </svg>
);

// 3. Regularization: shield.checkerboard / lock.shield
export const SFSymbolShield: React.FC<SFSymbolProps> = ({ size = 14, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M8 2.2l4.5 1.6v4.5c0 3.2-2.3 5.4-4.5 6-2.2-.6-4.5-2.8-4.5-6V3.8L8 2.2z" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

// 4. Reward: bolt.fill / scalemass.fill
export const SFSymbolBolt: React.FC<SFSymbolProps> = ({ size = 14, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round" className={className} style={style}>
    <polygon points="8.5 1.5 2.5 9 7.5 9 6.5 14.5 13.5 6.5 8.5 6.5 8.5 1.5" />
  </svg>
);

// 5. Output: paperplane.fill / arrow.up.forward.app
export const SFSymbolPaperplane: React.FC<SFSymbolProps> = ({ size = 14, className = '', style, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M14.5 1.5L2 6.5l5 2.5 2.5 5 5-12.5z" fill="currentColor" fillOpacity="0.15" />
    <path d="M7 9l4.5-4.5" />
  </svg>
);
