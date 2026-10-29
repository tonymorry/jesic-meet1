/**
 * JESic Meet - CartoonMascot (Mascotte Ufficiale da 0 - Versione Compatta)
 *
 * Dimensionata in formato compatto ("molto più piccolino") per un aspetto carino, agile e dinamico:
 * - Colori ufficiali JESic: Rosso #f23e2e, Bianco #ffffff, Grafite #141414
 * - Cresta a fiamma JESic, visore cartoon espressivo, tuta sportiva con pettorina e scarpe da sprint
 *
 * Pose:
 * - 'walk': Corsa rapida con falcate e sprint.
 * - 'anticipate': Squat compatto di caricamento a terra a destra del logo.
 * - 'jump': Balzo altissimo verso l'alto fino alla fine della pagina.
 * - 'grab': Presa a mani alte in cima allo schermo.
 * - 'pulldown': Trazione energica verso il basso che tira giù tutto il sipario.
 */

import React from 'react';

export type MascotPhase = 'walk' | 'anticipate' | 'jump' | 'grab' | 'pulldown';

interface CartoonMascotProps {
  phase: MascotPhase;
  walkStep?: number;
  scale?: number;
  className?: string;
}

export const CartoonMascot: React.FC<CartoonMascotProps> = ({
  phase,
  walkStep = 0,
  scale = 1,
  className = '',
}) => {
  return (
    <div
      className={`relative select-none pointer-events-none flex flex-col items-center justify-end ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: phase === 'grab' || phase === 'pulldown' ? 'top center' : 'bottom center',
      }}
    >
      {phase === 'walk' && <MascotWalkSvg step={walkStep} />}
      {phase === 'anticipate' && <MascotAnticipateSvg />}
      {phase === 'jump' && <MascotJumpSvg />}
      {phase === 'grab' && <MascotGrabSvg />}
      {phase === 'pulldown' && <MascotPullDownSvg />}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 1. POSA CORSA ENERGICA (Run Cycle compatto e agile)                       */
/* -------------------------------------------------------------------------- */
const MascotWalkSvg: React.FC<{ step: number }> = ({ step }) => {
  const stepMod = step % 4;
  const isAirborne = stepMod === 1 || stepMod === 3;
  const bobY = isAirborne ? -6 : 0;
  const forwardLean = 10;
  const isAltLeg = stepMod >= 2;

  return (
    <div className="relative flex flex-col items-center justify-end">
      {/* Lineette di velocità dietro alla schiena */}
      <div className="absolute top-[38%] -left-7 pointer-events-none flex flex-col gap-1 opacity-85">
        <div
          className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent rounded-full transition-all duration-75"
          style={{ width: isAirborne ? '24px' : '12px' }}
        />
        <div
          className="h-0.5 bg-gradient-to-r from-transparent via-[#f23e2e] to-transparent rounded-full ml-1.5 transition-all duration-75"
          style={{ width: isAirborne ? '20px' : '10px' }}
        />
        <div
          className="h-0.5 bg-gradient-to-r from-transparent via-white/70 to-transparent rounded-full -ml-0.5 transition-all duration-75"
          style={{ width: isAirborne ? '16px' : '8px' }}
        />
      </div>

      {/* Particelle polvere di corsa sotto le zampe/scarpe */}
      <div className="absolute -bottom-0.5 -left-3 flex gap-1 opacity-75 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-ping" />
        <div className="w-1 h-1 rounded-full bg-[#f23e2e]" />
      </div>

      {/* Personaggio SVG compatto */}
      <div
        className="transition-transform duration-75 will-change-transform drop-shadow-[0_6px_12px_rgba(242,62,46,0.35)]"
        style={{
          transform: `translateY(${bobY}px) rotate(${forwardLean}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <svg
          viewBox="0 0 120 140"
          className="w-14 sm:w-16 h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="redGradSm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5240" />
              <stop offset="100%" stopColor="#f23e2e" />
            </linearGradient>
            <linearGradient id="bodyDarkSm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>
            <linearGradient id="visorGlowSm" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Cresta a fiamma JESic sulla testa */}
          <path
            d="M 58 12 C 55 2 64 0 68 8 C 72 2 82 5 75 18 C 70 24 64 22 58 12 Z"
            fill="url(#redGradSm)"
          />

          {/* Braccio posteriore in corsa */}
          <g transform={isAltLeg ? 'rotate(35 48 65)' : 'rotate(-40 48 65)'}>
            <rect x="42" y="60" width="10" height="26" rx="5" fill="#1f1f1f" />
            <circle cx="47" cy="88" r="7" fill="url(#redGradSm)" />
          </g>

          {/* Gamba posteriore in falcata */}
          <g transform={isAltLeg ? 'rotate(-35 52 95)' : 'rotate(30 52 95)'}>
            <rect x="47" y="92" width="11" height="28" rx="5" fill="#1f1f1f" />
            <path d="M 44 116 L 62 116 C 65 116 66 122 62 124 L 42 124 C 40 124 40 116 44 116 Z" fill="url(#redGradSm)" />
            <path d="M 41 123 L 64 123 L 63 126 L 41 126 Z" fill="#ffffff" />
          </g>

          {/* Busto compatto */}
          <rect x="44" y="55" width="34" height="42" rx="14" fill="url(#bodyDarkSm)" stroke="#2f2f2f" strokeWidth="1.5" />
          <path d="M 47 62 C 47 58 75 58 75 62 L 72 84 C 72 87 50 87 50 84 Z" fill="url(#redGradSm)" />
          <circle cx="61" cy="72" r="3.5" fill="#ffffff" />

          {/* Gamba anteriore in falcata */}
          <g transform={isAltLeg ? 'rotate(32 68 95)' : 'rotate(-38 68 95)'}>
            <rect x="63" y="92" width="11" height="28" rx="5" fill="#2d2d2d" />
            <path d="M 60 116 L 78 116 C 82 116 83 122 78 124 L 58 124 C 56 124 56 116 60 116 Z" fill="url(#redGradSm)" />
            <path d="M 57 123 L 80 123 L 79 126 L 57 126 Z" fill="#ffffff" />
          </g>

          {/* Testa arrotondata */}
          <circle cx="61" cy="38" r="24" fill="url(#bodyDarkSm)" stroke="#383838" strokeWidth="2" />
          <rect x="34" y="32" width="6" height="14" rx="3" fill="url(#redGradSm)" />
          <rect x="82" y="32" width="6" height="14" rx="3" fill="url(#redGradSm)" />

          {/* Visore e occhi vispi */}
          <rect x="42" y="27" width="38" height="20" rx="9" fill="url(#visorGlowSm)" stroke="#f23e2e" strokeWidth="2.5" />
          <ellipse cx="53" cy="37" rx="4.5" ry="6" fill="#141414" />
          <ellipse cx="69" cy="37" rx="4.5" ry="6" fill="#141414" />
          <circle cx="51.5" cy="35" r="1.8" fill="#ffffff" />
          <circle cx="67.5" cy="35" r="1.8" fill="#ffffff" />

          {/* Sorriso */}
          <path d="M 57 44 Q 61 47 65 44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Braccio anteriore */}
          <g transform={isAltLeg ? 'rotate(-42 72 65)' : 'rotate(35 72 65)'}>
            <rect x="68" y="60" width="10" height="26" rx="5" fill="#2d2d2d" />
            <circle cx="73" cy="88" r="7" fill="url(#redGradSm)" />
          </g>
        </svg>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. POSA CARICAMENTO SALTO (Anticipate a terra a destra del logo)           */
/* -------------------------------------------------------------------------- */
const MascotAnticipateSvg: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-end">
      <div className="absolute -bottom-1.5 w-12 h-2.5 bg-[#f23e2e]/40 blur-xs rounded-full animate-pulse" />

      <div
        className="transition-transform duration-150 will-change-transform drop-shadow-[0_8px_16px_rgba(242,62,46,0.5)]"
        style={{
          transform: 'translateY(4px) scale(1.06, 0.90)',
          transformOrigin: 'bottom center',
        }}
      >
        <svg viewBox="0 0 120 140" className="w-14 sm:w-16 h-auto overflow-visible">
          <defs>
            <linearGradient id="redGradAntSm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5240" />
              <stop offset="100%" stopColor="#f23e2e" />
            </linearGradient>
            <linearGradient id="bodyDarkAntSm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>
          </defs>

          <path d="M 58 14 C 53 4 62 2 67 10 C 72 3 80 6 74 19 Z" fill="url(#redGradAntSm)" />

          {/* Gambe piegate a molla */}
          <rect x="42" y="96" width="13" height="22" rx="6" fill="#1f1f1f" transform="rotate(-15 48 107)" />
          <rect x="65" y="96" width="13" height="22" rx="6" fill="#2d2d2d" transform="rotate(15 71 107)" />
          <path d="M 36 117 L 56 117 C 59 117 60 123 56 125 L 34 125 Z" fill="url(#redGradAntSm)" />
          <path d="M 64 117 L 84 117 C 87 117 88 123 84 125 L 62 125 Z" fill="url(#redGradAntSm)" />

          <rect x="43" y="62" width="34" height="38" rx="14" fill="url(#bodyDarkAntSm)" stroke="#2f2f2f" strokeWidth="1.5" />
          <path d="M 46 68 C 46 64 74 64 74 68 L 71 88 C 71 91 49 91 49 88 Z" fill="url(#redGradAntSm)" />
          <circle cx="60" cy="78" r="3.5" fill="#ffffff" />

          {/* Braccia cariche indietro */}
          <rect x="33" y="66" width="10" height="24" rx="5" fill="#1f1f1f" transform="rotate(25 38 78)" />
          <circle cx="34" cy="91" r="7" fill="url(#redGradAntSm)" />
          <rect x="77" y="66" width="10" height="24" rx="5" fill="#2d2d2d" transform="rotate(-25 82 78)" />
          <circle cx="86" cy="91" r="7" fill="url(#redGradAntSm)" />

          {/* Testa con sguardo verso l'alto */}
          <circle cx="60" cy="44" r="23" fill="url(#bodyDarkAntSm)" stroke="#383838" strokeWidth="2" />
          <rect x="34" y="38" width="5" height="12" rx="2.5" fill="url(#redGradAntSm)" />
          <rect x="81" y="38" width="5" height="12" rx="2.5" fill="url(#redGradAntSm)" />

          <rect x="42" y="33" width="36" height="19" rx="8" fill="#ffffff" stroke="#f23e2e" strokeWidth="2.5" />
          <ellipse cx="52" cy="40" rx="4" ry="5.5" fill="#141414" />
          <ellipse cx="68" cy="40" rx="4" ry="5.5" fill="#141414" />
          <circle cx="51" cy="38" r="1.8" fill="#ffffff" />
          <circle cx="67" cy="38" r="1.8" fill="#ffffff" />
          <line x1="56" y1="48" x2="64" y2="48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. POSA SALTO (Jump verso l'alto fino in cima alla pagina)                 */
/* -------------------------------------------------------------------------- */
const MascotJumpSvg: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-end">
      {/* Fiammata di propulsione verso il basso */}
      <div className="absolute -bottom-6 flex flex-col items-center pointer-events-none animate-pulse">
        <div className="w-2 h-10 bg-gradient-to-t from-transparent via-[#f23e2e] to-white rounded-full blur-[1px]" />
      </div>

      <div
        className="transition-transform duration-100 will-change-transform drop-shadow-[0_10px_20px_rgba(242,62,46,0.6)]"
        style={{
          transform: 'scale(1.02, 1.08)',
          transformOrigin: 'bottom center',
        }}
      >
        <svg viewBox="0 0 120 150" className="w-14 sm:w-16 h-auto overflow-visible">
          <defs>
            <linearGradient id="redGradJumpSm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5240" />
              <stop offset="100%" stopColor="#f23e2e" />
            </linearGradient>
            <linearGradient id="bodyDarkJumpSm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>
          </defs>

          {/* Braccia protese in alto */}
          <rect x="36" y="22" width="10" height="34" rx="5" fill="#1f1f1f" transform="rotate(-18 41 39)" />
          <circle cx="32" cy="18" r="8" fill="url(#redGradJumpSm)" />
          <rect x="28" y="10" width="3" height="8" rx="1.5" fill="#ffffff" />
          <rect x="33" y="9" width="3" height="9" rx="1.5" fill="#ffffff" />

          <rect x="74" y="22" width="10" height="34" rx="5" fill="#2d2d2d" transform="rotate(18 79 39)" />
          <circle cx="88" cy="18" r="8" fill="url(#redGradJumpSm)" />
          <rect x="85" y="9" width="3" height="9" rx="1.5" fill="#ffffff" />
          <rect x="90" y="10" width="3" height="8" rx="1.5" fill="#ffffff" />

          <path d="M 58 10 C 54 0 64 0 68 6 C 73 0 83 4 76 16 Z" fill="url(#redGradJumpSm)" />

          <rect x="46" y="98" width="11" height="30" rx="5" fill="#1f1f1f" />
          <path d="M 43 124 L 59 124 C 62 124 63 130 59 132 L 41 132 Z" fill="url(#redGradJumpSm)" />

          <rect x="63" y="98" width="11" height="30" rx="5" fill="#2d2d2d" />
          <path d="M 60 124 L 76 124 C 79 124 80 130 76 132 L 58 132 Z" fill="url(#redGradJumpSm)" />

          <rect x="44" y="60" width="32" height="42" rx="14" fill="url(#bodyDarkJumpSm)" stroke="#2f2f2f" strokeWidth="1.5" />
          <path d="M 47 66 C 47 62 73 62 73 66 L 70 88 C 70 91 50 91 50 88 Z" fill="url(#redGradJumpSm)" />
          <circle cx="60" cy="76" r="3.5" fill="#ffffff" />

          <circle cx="60" cy="44" r="23" fill="url(#bodyDarkJumpSm)" stroke="#383838" strokeWidth="2" />
          <rect x="34" y="38" width="5" height="12" rx="2.5" fill="url(#redGradJumpSm)" />
          <rect x="81" y="38" width="5" height="12" rx="2.5" fill="url(#redGradJumpSm)" />

          <rect x="42" y="33" width="36" height="19" rx="8" fill="#ffffff" stroke="#f23e2e" strokeWidth="2.5" />
          <ellipse cx="52" cy="40" rx="4.5" ry="6" fill="#141414" />
          <ellipse cx="68" cy="40" rx="4.5" ry="6" fill="#141414" />
          <circle cx="51.5" cy="38" r="2" fill="#ffffff" />
          <circle cx="67.5" cy="38" r="2" fill="#ffffff" />
          <path d="M 56 46 Q 60 50 64 46 Z" fill="#f23e2e" />
        </svg>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. POSA PRESA (Grab Pose in cima allo schermo)                             */
/* -------------------------------------------------------------------------- */
const MascotGrabSvg: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-start">
      <div
        className="animate-[wiggle_1s_ease-in-out_infinite] will-change-transform drop-shadow-[0_10px_20px_rgba(242,62,46,0.6)]"
        style={{
          transformOrigin: 'top center',
        }}
      >
        <svg viewBox="0 0 120 150" className="w-14 sm:w-16 h-auto overflow-visible">
          <defs>
            <linearGradient id="redGradGrabSm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5240" />
              <stop offset="100%" stopColor="#f23e2e" />
            </linearGradient>
            <linearGradient id="bodyDarkGrabSm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>
          </defs>

          {/* Pugni chiusi pronti a tirare */}
          <circle cx="34" cy="14" r="8" fill="url(#redGradGrabSm)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="86" cy="14" r="8" fill="url(#redGradGrabSm)" stroke="#ffffff" strokeWidth="1.5" />

          <rect x="36" y="16" width="10" height="34" rx="5" fill="#1f1f1f" transform="rotate(-12 41 33)" />
          <rect x="74" y="16" width="10" height="34" rx="5" fill="#2d2d2d" transform="rotate(12 79 33)" />

          <path d="M 58 14 C 54 4 64 4 68 10 C 73 4 83 8 76 20 Z" fill="url(#redGradGrabSm)" />

          <circle cx="60" cy="46" r="23" fill="url(#bodyDarkGrabSm)" stroke="#383838" strokeWidth="2" />
          <rect x="34" y="40" width="5" height="12" rx="2.5" fill="url(#redGradGrabSm)" />
          <rect x="81" y="40" width="5" height="12" rx="2.5" fill="url(#redGradGrabSm)" />

          <rect x="42" y="35" width="36" height="19" rx="8" fill="#ffffff" stroke="#f23e2e" strokeWidth="2.5" />
          <ellipse cx="52" cy="43" rx="4" ry="5" fill="#141414" />
          <ellipse cx="68" cy="43" rx="4" ry="5" fill="#141414" />
          <circle cx="51.5" cy="41" r="1.6" fill="#ffffff" />
          <circle cx="67.5" cy="41" r="1.6" fill="#ffffff" />
          <path d="M 56 49 Q 60 52 64 49" stroke="#141414" strokeWidth="2" strokeLinecap="round" fill="none" />

          <rect x="44" y="66" width="32" height="40" rx="14" fill="url(#bodyDarkGrabSm)" stroke="#2f2f2f" strokeWidth="1.5" />
          <path d="M 47 72 C 47 68 73 68 73 72 L 70 94 C 70 97 50 97 50 94 Z" fill="url(#redGradGrabSm)" />
          <circle cx="60" cy="82" r="3.5" fill="#ffffff" />

          <rect x="46" y="102" width="11" height="26" rx="5" fill="#1f1f1f" transform="rotate(-8 51 115)" />
          <path d="M 41 125 L 57 125 C 60 125 61 131 57 133 L 39 133 Z" fill="url(#redGradGrabSm)" />
          <rect x="63" y="102" width="11" height="26" rx="5" fill="#2d2d2d" transform="rotate(8 68 115)" />
          <path d="M 61 125 L 77 125 C 80 125 81 131 77 133 L 59 133 Z" fill="url(#redGradGrabSm)" />
        </svg>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. POSA TRAZIONE (Pull Down che tira giù tutto il sipario)                */
/* -------------------------------------------------------------------------- */
const MascotPullDownSvg: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-start">
      <div
        className="transition-transform duration-150 will-change-transform drop-shadow-[0_12px_24px_rgba(242,62,46,0.7)]"
        style={{
          transform: 'translateY(8px) scale(0.96, 1.05)',
          transformOrigin: 'top center',
        }}
      >
        <svg viewBox="0 0 120 150" className="w-14 sm:w-16 h-auto overflow-visible">
          <defs>
            <linearGradient id="redGradPullSm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5240" />
              <stop offset="100%" stopColor="#f23e2e" />
            </linearGradient>
            <linearGradient id="bodyDarkPullSm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>
          </defs>

          {/* Pugni che stringono con forza la sommità tirandola giù */}
          <circle cx="34" cy="18" r="9" fill="url(#redGradPullSm)" stroke="#ffffff" strokeWidth="2" />
          <circle cx="86" cy="18" r="9" fill="url(#redGradPullSm)" stroke="#ffffff" strokeWidth="2" />

          <path d="M 34 22 L 44 48 L 52 48 L 42 22 Z" fill="#1f1f1f" />
          <path d="M 86 22 L 76 48 L 68 48 L 78 22 Z" fill="#2d2d2d" />

          <path d="M 58 18 C 52 8 62 8 66 14 C 71 8 81 12 74 24 Z" fill="url(#redGradPullSm)" />

          <circle cx="60" cy="50" r="23" fill="url(#bodyDarkPullSm)" stroke="#383838" strokeWidth="2" />
          <rect x="34" y="44" width="5" height="12" rx="2.5" fill="url(#redGradPullSm)" />
          <rect x="81" y="44" width="5" height="12" rx="2.5" fill="url(#redGradPullSm)" />

          <rect x="42" y="39" width="36" height="19" rx="8" fill="#ffffff" stroke="#f23e2e" strokeWidth="2.5" />
          <ellipse cx="52" cy="47" rx="4" ry="4.5" fill="#141414" />
          <ellipse cx="68" cy="47" rx="4" ry="4.5" fill="#141414" />
          <circle cx="51.5" cy="45" r="1.5" fill="#ffffff" />
          <circle cx="67.5" cy="45" r="1.5" fill="#ffffff" />
          <path d="M 54 53 Q 60 57 66 53" stroke="#f23e2e" strokeWidth="3" strokeLinecap="round" fill="none" />

          <rect x="44" y="68" width="32" height="38" rx="14" fill="url(#bodyDarkPullSm)" stroke="#2f2f2f" strokeWidth="1.5" />
          <path d="M 47 74 C 47 70 73 70 73 74 L 70 94 C 70 97 50 97 50 94 Z" fill="url(#redGradPullSm)" />
          <circle cx="60" cy="84" r="3.5" fill="#ffffff" />

          <g>
            <rect x="44" y="100" width="12" height="22" rx="6" fill="#1f1f1f" transform="rotate(-20 50 111)" />
            <path d="M 38 118 L 54 118 C 57 118 58 124 54 126 L 36 126 Z" fill="url(#redGradPullSm)" />

            <rect x="64" y="100" width="12" height="22" rx="6" fill="#2d2d2d" transform="rotate(20 70 111)" />
            <path d="M 64 118 L 80 118 C 83 118 84 124 80 126 L 62 126 Z" fill="url(#redGradPullSm)" />
          </g>
        </svg>
      </div>
    </div>
  );
};
