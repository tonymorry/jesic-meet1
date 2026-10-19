/**
 * JESic Meet - Splash Screen con Animazione Mascotte Cartonata
 * 
 * Sequenza dinamica:
 * - Sfondo semi-trasparente con glassmorphism (backdrop-blur-md) per far intravedere il sito sottostante.
 * - Nessun setTimeout fisso di 2.5s: non appena il frontend ha verificato se c'è un currentUser
 *   nel localStorage o se il backend ha risposto (prop isReady), l'animazione conclude
 *   immediatamente tirando giù il sipario e svelando la schermata dell'app.
 */

import React, { useState, useEffect, useRef } from 'react';
import { CartoonMascot, MascotPhase } from './CartoonMascot';

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, isReady = false }) => {
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
  const isExitingRef = useRef<boolean>(false);

  const addTimer = (cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
    return t;
  };

  // 1. Ingresso logo e comparsa mascotte veloce
  useEffect(() => {
    // Spunta il logo JESic al centro (60ms)
    addTimer(() => {
      setLogoVisible(true);
    }, 60);

    // La mascotte spunta in basso dal lato sinistro (120ms)
    addTimer(() => {
      setMascotPhase('walk');
    }, 120);

    // Inizia la corsa fluida verso il logo (180ms)
    addTimer(() => {
      setHasArrivedAtRight(true);
    }, 180);

    // Ciclo del passo corsa veloce ed energico
    const runInterval = setInterval(() => {
      setWalkStep((prev) => (prev + 1) % 4);
    }, 85);

    return () => {
      clearInterval(runInterval);
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // 2. Conclusione animazione NON APPENA l'app è pronta (localStorage verificato o backend risposto)
  // Rimosso qualsiasi setTimeout fisso di 2.5s!
  useEffect(() => {
    if (!isReady || isExitingRef.current) return;
    isExitingRef.current = true;

    // Balza subito in alto, afferra la sbarra superiore e tira giù il sipario
    setMascotPhase('grab');
    setTopBarSag(true);
    setIsJumpingToCeiling(true);
    setHasArrivedAtRight(true);

    const tPull = setTimeout(() => {
      setMascotPhase('pulldown');
      setCurtainThrownDown(true);
    }, 160);

    const tDone = setTimeout(() => {
      setIsDone(true);
      onFinish?.();
    }, 550);

    return () => {
      clearTimeout(tPull);
      clearTimeout(tDone);
    };
  }, [isReady, onFinish]);

  // Click o tocco rapido per saltare istantaneamente
  const handleFastSkip = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    setMascotPhase('pulldown');
    setHasArrivedAtRight(true);
    setIsJumpingToCeiling(true);
    setTopBarSag(true);
    setCurtainThrownDown(true);

    setTimeout(() => {
      setIsDone(true);
      onFinish?.();
    }, 320);
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
      className={`fixed inset-0 z-[99999] bg-[#121212]/80 backdrop-blur-md flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-500 ${
        curtainThrownDown
          ? 'translate-y-full opacity-0 pointer-events-none shadow-[0_-25px_60px_rgba(242,62,46,0.6)]'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Sfondo radiale con bagliore rosso brand JESic semi-trasparente per far intravedere il sito */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.16)_0%,rgba(18,18,18,0.72)_72%)] pointer-events-none" />

      {/* Sbarra/bordo superiore dello schermo su cui la mascotte si aggrappa */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div
          className={`h-2.5 bg-gradient-to-r from-neutral-800 via-[#f23e2e] to-neutral-800 transition-all duration-200 shadow-[0_4px_15px_rgba(242,62,46,0.7)] ${
            topBarSag ? 'translate-y-3.5 scale-y-125 rounded-b-2xl' : 'translate-y-0'
          }`}
        />
        {topBarSag && (
          <div className="w-44 sm:w-60 h-3 mx-auto bg-[#f23e2e]/40 blur-xs rounded-full -mt-1 animate-pulse" />
        )}
      </div>

      {/* CONTENUTO CENTRALE: Logo Brand Ufficiale JESic Meet */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-4 transition-all duration-500 ease-out ${
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
          className={`h-0.5 bg-gradient-to-r from-transparent via-[#f23e2e] to-transparent rounded-full mt-3 transition-all duration-700 ${
            logoVisible ? 'w-24 opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MASCOTTE CARTONATA:                                                  */}
      {/* -------------------------------------------------------------------- */}
      {mascotPhase !== 'hidden' && (
        <div
          style={{
            left: hasArrivedAtRight
              ? 'min(calc(50% + 115px), calc(100vw - 44px))'
              : '-60px',
            bottom: isJumpingToCeiling
              ? 'calc(100% - 110px)'
              : '24px',
            transform: 'translateX(-50%)',
            transition:
              mascotPhase === 'walk'
                ? 'left 0.8s cubic-bezier(0.2, 0.85, 0.35, 1)'
                : mascotPhase === 'jump' || mascotPhase === 'grab'
                ? 'bottom 0.35s cubic-bezier(0.12, 0.85, 0.32, 1)'
                : 'none',
          }}
          className="absolute z-50 pointer-events-none flex flex-col items-center"
        >
          <CartoonMascot
            phase={mascotPhase}
            walkStep={walkStep}
            scale={0.8}
          />
        </div>
      )}

      {/* Suggerimento per tocco rapido */}
      <div
        className={`absolute bottom-3 text-[10px] text-neutral-400 font-medium tracking-wide transition-opacity duration-300 ${
          logoVisible && !curtainThrownDown ? 'opacity-70' : 'opacity-0'
        }`}
      >
        Tocca per continuare
      </div>
    </div>
  );
};
