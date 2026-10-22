import React from 'react';

export type MascotPhase = 'walk' | 'anticipate' | 'jump' | 'grab' | 'pulldown';

interface CartoonMascotProps {
  phase: MascotPhase;
  walkStep?: number; // 0, 1, 2, 3 for walk cycle
  scale?: number;
  className?: string;
}

/**
 * PixelArtHeroine - Personaggio Principale JESic Meet
 * 
 * Movimenti derivati direttamente dal video di riferimento:
 * - 'walk': Corsa energica con falcate alternate (heroine_run1 e heroine_run2),
 *   inclinazione atletica in avanti e lineette orizzontali di sprint.
 * - 'anticipate': Flessione atletica (crouch & squat) con ginocchia piegate e braccia cariche (heroine_anticipate).
 * - 'jump': Balzo esplosivo verso l'alto con braccia protese e mani aperte (heroine_jump) + lineette verticali.
 * - 'grab': Presa salda della sbarra con pugni stretti in alto (heroine_grab), la sbarra passa SOPRA le mani.
 * - 'pulldown': Trazione energica verso il basso (heroine_pull) mentre il sipario scende.
 */
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
      {phase === 'walk' && <HeroineWalkPose step={walkStep} />}
      {phase === 'anticipate' && <HeroineAnticipatePose />}
      {phase === 'jump' && <HeroineJumpPose />}
      {phase === 'grab' && <HeroineGrabPose />}
      {phase === 'pulldown' && <HeroinePullDownPose />}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 1. POSA CORSA ENERGICA (Run Pose dal video con falcata 1 & 2 e sprint)     */
/* -------------------------------------------------------------------------- */
const HeroineWalkPose: React.FC<{ step: number }> = ({ step }) => {
  const stepMod = step % 4;
  const isAirborne = stepMod === 1 || stepMod === 3;
  const isStepOne = stepMod === 0 || stepMod === 1;

  // Rimbalzo e dinamismo corsa
  const bobY = isAirborne ? -8 : 0;
  const forwardLean = 7;
  const scaleY = isAirborne ? 1.02 : 0.98;

  // Alterna i fotogrammi di corsa estratti dal video
  const currentSprite = isStepOne ? '/mascot/heroine_run1.png' : '/mascot/heroine_run2.png';

  return (
    <div className="relative flex flex-col items-center justify-end">
      {/* Lineette orizzontali di scatto e sprint (dietro alla schiena, pulite) */}
      <div className="absolute top-[55%] -left-7 pointer-events-none flex flex-col gap-1.5 opacity-80">
        <div
          className="h-0.5 bg-gradient-to-r from-transparent via-white/85 to-transparent rounded-full transition-all duration-75"
          style={{ width: isAirborne ? '30px' : '18px' }}
        />
        <div
          className="h-0.5 bg-gradient-to-r from-transparent via-[#f23e2e]/90 to-transparent rounded-full ml-2 transition-all duration-75"
          style={{ width: isAirborne ? '24px' : '14px' }}
        />
        <div
          className="h-0.5 bg-gradient-to-r from-transparent via-white/70 to-transparent rounded-full -ml-1 transition-all duration-75"
          style={{ width: isAirborne ? '26px' : '16px' }}
        />
      </div>

      {/* Sprite del personaggio con falcata atletica fluida */}
      <div
        className="transition-transform duration-75 will-change-transform"
        style={{
          transform: `translateY(${bobY}px) rotate(${forwardLean}deg) scale(1, ${scaleY})`,
          transformOrigin: 'bottom center',
        }}
      >
        <img
          src={currentSprite}
          alt="JESic Character Running"
          className="h-24 sm:h-28 w-auto object-contain select-none pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. POSA CARICAMENTO SALTO (Crouch / Anticipate Pose estratto dal video)    */
/* -------------------------------------------------------------------------- */
const HeroineAnticipatePose: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-end">
      <div
        className="transition-transform duration-150"
        style={{
          transform: 'translateY(2px)',
          transformOrigin: 'bottom center',
        }}
      >
        <img
          src="/mascot/heroine_anticipate.png"
          alt="JESic Character Anticipate"
          className="h-24 sm:h-28 w-auto object-contain select-none pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. POSA SALTO (Jump Pose dal video: protesa in alto a braccia aperte)      */
/* -------------------------------------------------------------------------- */
const HeroineJumpPose: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-end">
      {/* Lineette verticali di spinta del salto (sotto le scarpe verso il basso) */}
      <div className="absolute -bottom-5 flex gap-1.5 opacity-85 pointer-events-none animate-pulse">
        <div className="w-0.5 h-5 bg-gradient-to-t from-transparent via-[#f23e2e] to-white rounded-full" />
        <div className="w-0.5 h-8 bg-gradient-to-t from-transparent via-white to-[#f23e2e] rounded-full" />
        <div className="w-0.5 h-5 bg-gradient-to-t from-transparent via-[#f23e2e] to-white rounded-full" />
      </div>

      {/* Posa di salto acrobatico con mani alte pronte ad afferrare */}
      <div
        className="transition-transform duration-100"
        style={{
          transform: 'translateY(-2px)',
          transformOrigin: 'bottom center',
        }}
      >
        <img
          src="/mascot/heroine_jump.png"
          alt="JESic Character Jump"
          className="h-24 sm:h-28 w-auto object-contain select-none pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. POSA AGGRAPPATA ALLA SBARRA (Grab Pose dal video: pugni stretti in alto) */
/* -------------------------------------------------------------------------- */
const HeroineGrabPose: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-start">
      {/* Posa con pugni chiusi aggrappati alla sbarra */}
      <div
        className="animate-[wiggle_1.2s_ease-in-out_infinite]"
        style={{
          transformOrigin: 'top center',
        }}
      >
        <img
          src="/mascot/heroine_grab.png"
          alt="JESic Character Grab"
          className="h-24 sm:h-28 w-auto object-contain select-none pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. POSA TRAZIONE SIPARIO (Pull Down Pose: trazione potente dal video)      */
/* -------------------------------------------------------------------------- */
const HeroinePullDownPose: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-start">
      {/* Trazione con peso corporeo verso il basso */}
      <div
        className="transition-transform duration-150"
        style={{
          transformOrigin: 'top center',
        }}
      >
        <img
          src="/mascot/heroine_pull.png"
          alt="JESic Character Pull Down"
          className="h-24 sm:h-28 w-auto object-contain select-none pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};
