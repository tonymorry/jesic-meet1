/**
 * JESic Meet - Splash Screen con Animazione Mascotte Cartonata
 * 
 * Sequenza animata completa:
 * 1. Spunta il logo JESic al centro (pop & glow elegante).
 * 2. La mascotte spunta in basso dal lato sinistro dello schermo.
 * 3. Corre energicamente lungo il pavimento fino in basso al lato destro del logo.
 * 4. Carica il salto guardando verso l'alto (anticipate).
 * 5. Balza in alto con salto acrobatico verso il soffitto (jump).
 * 6. Si aggrappa con entrambe le mani alla sbarra superiore (grab).
 * 7. Tira giù con tutto il peso: il sipario scende piano piano verso il basso
 *    (translate-y-full con ombra fisica), svelando la home del sito sottostante
 *    esattamente come se si stesse levando un coperchio!
 */

import React, { useState, useEffect, useRef } from 'react';
import { CartoonMascot, MascotPhase } from './CartoonMascot';

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, isReady = true }) => {
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

  // Caduta del sipario: tutta la schermata scende piano piano come un coperchio
  const [curtainThrownDown, setCurtainThrownDown] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const addTimer = (cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
    return t;
  };

  useEffect(() => {
    // 1. Spunta il logo JESic al centro (100ms)
    addTimer(() => {
      setLogoVisible(true);
    }, 100);

    // 2. La mascotte spunta fuori dallo schermo a sinistra (250ms)
    addTimer(() => {
      setMascotPhase('walk');
    }, 250);

    // 3. Inizia la corsa fluida da sinistra verso destra attraverso lo schermo (350ms)
    addTimer(() => {
      setHasArrivedAtRight(true);
    }, 350);

    // Ciclo del passo corsa veloce ed energico (ogni 80ms)
    const runInterval = setInterval(() => {
      setWalkStep((prev) => (prev + 1) % 4);
    }, 80);

    // 4. Arriva a destinazione dopo aver corso tutta la parte sinistra e carica il salto (2450ms)
    addTimer(() => {
      setMascotPhase('anticipate');
    }, 2450);

    // 5. Salto acrobatico dal pavimento verso la sbarra superiore (2900ms)
    addTimer(() => {
      setMascotPhase('jump');
      setIsJumpingToCeiling(true);
    }, 2900);

    // 6. Si aggrappa con entrambe le mani alla sbarra superiore (3350ms)
    addTimer(() => {
      setMascotPhase('grab');
      setTopBarSag(true);
    }, 3350);

    // 7. Tira giù con tutto il peso corporeo e il coperchio scende (3850ms)
    addTimer(() => {
      setMascotPhase('pulldown');
      setTimeout(() => {
        setCurtainThrownDown(true);
      }, 150);
    }, 3850);

    // 8. Il sipario ha finito di scendere scoprendo il sito (5100ms)
    addTimer(() => {
      setIsDone(true);
      onFinish?.();
    }, 5100);

    return () => {
      clearInterval(runInterval);
      timersRef.current.forEach(clearTimeout);
    };
  }, [onFinish]);

  // Click o tocco rapido per chi desidera saltare subito l'attesa
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
      }, 900);
    }, 100);
  };

  if (isDone) {
    return null;
  }

  return (
    <div
      onClick={handleFastSkip}
      aria-hidden="true"
      style={{
        transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-1000 ${
        curtainThrownDown
          ? 'translate-y-full bg-[#141414]/85 backdrop-blur-xs shadow-[0_-30px_70px_rgba(0,0,0,0.95)]'
          : 'translate-y-0 bg-[#141414]'
      }`}
    >
      {/* Sfondo radiale con bagliore rosso brand JESic */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          curtainThrownDown
            ? 'bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.12)_0%,rgba(18,18,18,0.70)_70%)]'
            : 'bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.18)_0%,rgba(18,18,18,0.96)_70%)]'
        }`}
      />

      {/* Sbarra/bordo superiore dello schermo su cui la mascotte si aggrappa (vada SOPRA le mani) */}
      <div className="absolute top-0 left-0 right-0 z-[70] pointer-events-none">
        <div
          className={`h-2.5 sm:h-3 bg-gradient-to-r from-neutral-900 via-[#f23e2e] to-neutral-900 border-b border-[#f23e2e]/50 shadow-[0_3px_12px_rgba(242,62,46,0.45)] transition-all duration-200 ${
            topBarSag ? 'translate-y-3 sm:translate-y-3.5 scale-y-110 rounded-b-xl shadow-[0_6px_18px_rgba(242,62,46,0.65)]' : 'translate-y-0'
          }`}
        />
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
      {/* PERSONAGGIO FEMMINILE PIXEL ART:                                     */}
      {/* 1. Spunta in basso a sinistra fuori dallo schermo e corre visibilmente*/}
      {/*    lungo tutta la parte sinistra fino a raggiungere il logo          */}
      {/* 2. Carica il salto (anticipate) guardando in alto                   */}
      {/* 3. Salta acrobaticamente alla sbarra in alto (jump)                  */}
      {/* 4. Si aggrappa con entrambe le mani (grab)                           */}
      {/* 5. Tira giù il sipario come un coperchio svelando il sito (pulldown) */}
      {/* -------------------------------------------------------------------- */}
      {mascotPhase !== 'hidden' && (
        <div
          style={{
            // Orizzontalmente: corre da completamente fuori schermo (-160px) attraverso la parte sinistra
            left: hasArrivedAtRight
              ? 'min(calc(50% + 140px), calc(100vw - 65px))'
              : '-160px',
            // Verticalmente: dal pavimento al soffitto, posizionata in modo che le mani coincidano con la sbarra
            bottom: isJumpingToCeiling
              ? topBarSag
                ? 'calc(100% - var(--mascot-h, 96px) - 13px)'
                : 'calc(100% - var(--mascot-h, 96px) - 1px)'
              : '20px',
            transform: 'translateX(-50%)',
            transition:
              mascotPhase === 'walk'
                ? 'left 2.1s cubic-bezier(0.2, 0.6, 0.35, 1)'
                : mascotPhase === 'jump'
                ? 'bottom 0.42s cubic-bezier(0.12, 0.85, 0.32, 1)'
                : 'bottom 0.15s ease-out',
          }}
          className="absolute z-50 pointer-events-none flex flex-col items-center [--mascot-h:96px] sm:[--mascot-h:112px]"
        >
          <CartoonMascot
            phase={mascotPhase}
            walkStep={walkStep}
            scale={1}
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
