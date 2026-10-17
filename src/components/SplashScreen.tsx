/**
 * JESic Meet - Splash Screen con Animazione Mascotte Cartonata
 * 
 * Sequenza animata:
 * 1. Spunta il logo JESic al centro (pop & glow elegante).
 * 2. La mascotte spunta in basso dal lato sinistro dello schermo.
 * 3. Corre lungo il pavimento fino in basso al lato destro del logo.
 * 4. Carica il salto guardando verso l'alto.
 * 5. Balza in alto, si aggrappa al bordo superiore dello schermo.
 * 6. Tira giù tutto il sipario verso il basso con dinamismo cartoon.
 */

import React, { useState, useEffect, useRef } from 'react';
import { CartoonMascot, MascotPhase } from './CartoonMascot';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Stato visibilità logo centrale
  const [logoVisible, setLogoVisible] = useState(false);

  // Fasi mascotte: 'hidden' -> 'walk' -> 'anticipate' -> 'jump' -> 'grab' -> 'pulldown'
  const [mascotPhase, setMascotPhase] = useState<'hidden' | MascotPhase>('hidden');
  const [walkStep, setWalkStep] = useState(0);

  // Movimento: spunta in basso a sinistra e corre fino in basso al lato destro del logo
  const [hasArrivedAtRight, setHasArrivedAtRight] = useState(false);

  // Salto dal pavimento al soffitto
  const [isJumpingToCeiling, setIsJumpingToCeiling] = useState(false);

  // Deformazione e trazione del bordo superiore
  const [topBarSag, setTopBarSag] = useState(false);

  // Caduta del sipario: tutta la schermata viene tirata/buttata giù
  const [curtainThrownDown, setCurtainThrownDown] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const addTimer = (cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
    return t;
  };

  useEffect(() => {
    // 1. Spunta il logo JESic al centro (80ms)
    addTimer(() => {
      setLogoVisible(true);
    }, 80);

    // 2. La mascotte spunta in basso dal lato sinistro (200ms)
    addTimer(() => {
      setMascotPhase('walk');
    }, 200);

    // 3. Inizia la corsa fluida verso in basso al lato destro del logo (260ms)
    addTimer(() => {
      setHasArrivedAtRight(true);
    }, 260);

    // Ciclo del passo corsa veloce ed energico (ogni 85ms)
    const runInterval = setInterval(() => {
      setWalkStep((prev) => (prev + 1) % 4);
    }, 85);

    // 4. Arriva in basso a destra del logo e carica il salto (1400ms)
    addTimer(() => {
      setMascotPhase('anticipate');
    }, 1400);

    // 5. Salto acrobatico dal basso verso il soffitto (1750ms)
    addTimer(() => {
      setMascotPhase('jump');
      setIsJumpingToCeiling(true);
    }, 1750);

    // 6. Si aggrappa con entrambe le mani al bordo superiore dello schermo (2200ms)
    addTimer(() => {
      setMascotPhase('grab');
      setTopBarSag(true);
    }, 2200);

    // 7. Tira giù con tutto il peso e BUTTA TUTTO IL SIPARIO GIÙ (2700ms)
    addTimer(() => {
      setMascotPhase('pulldown');
      setTimeout(() => {
        setCurtainThrownDown(true);
      }, 200);
    }, 2700);

    // 8. Conclusione animazione e svelamento dell'app (3500ms)
    addTimer(() => {
      setIsDone(true);
      onFinish?.();
    }, 3500);

    return () => {
      clearInterval(runInterval);
      timersRef.current.forEach(clearTimeout);
    };
  }, [onFinish]);

  // Click o tocco rapido per saltare o accelerare immediatamente l'azione
  const handleFastSkip = () => {
    if (curtainThrownDown) return;

    setMascotPhase('pulldown');
    setHasArrivedAtRight(true);
    setIsJumpingToCeiling(true);
    setTopBarSag(true);

    setTimeout(() => {
      setCurtainThrownDown(true);
      setTimeout(() => {
        setIsDone(true);
        onFinish?.();
      }, 600);
    }, 150);
  };

  if (isDone) {
    return null;
  }

  return (
    <div
      onClick={handleFastSkip}
      aria-hidden="true"
      style={{
        transitionTimingFunction: curtainThrownDown
          ? 'cubic-bezier(0.55, 0.055, 0.675, 0.19)'
          : 'cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      className={`fixed inset-0 z-[99999] bg-[#121212] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-transform duration-700 ${
        curtainThrownDown
          ? 'translate-y-full shadow-[0_-25px_60px_rgba(242,62,46,0.6)]'
          : 'translate-y-0'
      }`}
    >
      {/* Sfondo radiale con bagliore rosso brand JESic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.18)_0%,rgba(18,18,18,0.98)_70%)] pointer-events-none" />

      {/* Sbarra/bordo superiore dello schermo su cui la mascotte si aggrappa */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div
          className={`h-2.5 bg-gradient-to-r from-neutral-800 via-[#f23e2e] to-neutral-800 transition-all duration-250 shadow-[0_4px_15px_rgba(242,62,46,0.7)] ${
            topBarSag ? 'translate-y-3.5 scale-y-125 rounded-b-2xl' : 'translate-y-0'
          }`}
        />
        {topBarSag && (
          <div className="w-44 sm:w-60 h-3 mx-auto bg-[#f23e2e]/40 blur-xs rounded-full -mt-1 animate-pulse" />
        )}
      </div>

      {/* CONTENUTO CENTRALE: Logo Brand Ufficiale JESic Meet */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-4 transition-all duration-700 ease-out ${
          logoVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-75 translate-y-6'
        } ${curtainThrownDown ? 'scale-90 opacity-40 translate-y-12' : ''}`}
      >
        {/* Logo con alone rosso */}
        <div className="relative mb-3 group">
          <div className="absolute inset-0 rounded-3xl bg-[#f23e2e]/25 blur-2xl scale-125 animate-pulse" />
          <div className="relative w-22 h-22 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900/90 border border-neutral-800/80 p-3 shadow-2xl shadow-red-600/30 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="JESic Logo"
              className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(242,62,46,0.6)]"
            />
          </div>
        </div>

        {/* Titolo Brand */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
            JESic<span className="text-[#f23e2e] font-black ml-1">Meet</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-neutral-400 uppercase">
            Junior Enterprise Sicilia
          </p>
        </div>

        {/* Barretta d'accento brand */}
        <div
          className={`h-0.5 bg-gradient-to-r from-transparent via-[#f23e2e] to-transparent rounded-full mt-3 transition-all duration-1000 ${
            logoVisible ? 'w-24 opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MASCOTTE CARTONATA:                                                  */}
      {/* 1. Spunta in basso dal lato sinistro                                 */}
      {/* 2. Corre fino in basso al lato destro del logo                      */}
      {/* 3. Salta verso l'alto, si aggrappa e butta tutto giù                 */}
      {/* -------------------------------------------------------------------- */}
      {mascotPhase !== 'hidden' && (
        <div
          style={{
            // Orizzontalmente: parte fuori/in basso a sinistra (-60px) e corre fino in basso a destra del logo
            left: hasArrivedAtRight
              ? 'min(calc(50% + 115px), calc(100vw - 44px))'
              : '-60px',
            // Verticalmente: corre in basso lungo il pavimento (24px) poi balza in alto al soffitto
            bottom: isJumpingToCeiling
              ? 'calc(100% - 110px)' // Aggrappata al bordo superiore dello schermo
              : '24px',              // In basso lungo il pavimento
            transform: 'translateX(-50%)',
            transition:
              mascotPhase === 'walk'
                ? 'left 1.15s cubic-bezier(0.2, 0.85, 0.35, 1)'
                : mascotPhase === 'jump'
                ? 'bottom 0.45s cubic-bezier(0.12, 0.85, 0.32, 1)'
                : 'none',
          }}
          className="absolute z-50 pointer-events-none flex flex-col items-center"
        >
          {/* Mascotte Cartonata compatta */}
          <CartoonMascot
            phase={mascotPhase}
            walkStep={walkStep}
            scale={0.8}
          />
        </div>
      )}

      {/* Suggerimento per tocco rapido */}
      <div
        className={`absolute bottom-3 text-[10px] text-neutral-500 font-medium tracking-wide transition-opacity duration-500 ${
          logoVisible && !curtainThrownDown ? 'opacity-60' : 'opacity-0'
        }`}
      >
        Tocca per continuare
      </div>
    </div>
  );
};
