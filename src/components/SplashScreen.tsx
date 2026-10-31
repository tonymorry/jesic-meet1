/**
 * JESic Meet - Splash Screen con Animazione Mascotte Ufficiale da 0
 *
 * Sequenza animata:
 * 1. Schermata dark pulita senza barre con bagliore radiale rosso brand JESic e logo centrale.
 * 2. La Mascotte originale JESic (in formato compatto) corre da sinistra fino a destra del logo
 *    (leggermente più a destra del logo).
 * 3. Si carica in squat (anticipate).
 * 4. Salta altissima fino alla cima della pagina (fine pagina).
 * 5. In cima afferra il bordo superiore (grab) e tira giù tutto con forza (pulldown).
 * 6. L'intera schermata si abbassa con fluidità come un sipario svelando il sito web sottostante.
 * 7. Tocco o click rapido per saltare istantaneamente in qualsiasi momento.
 */

import React, { useState, useEffect, useRef } from 'react';
import { CartoonMascot, MascotPhase } from './CartoonMascot';
import { isInstalledPwa } from '../utils/pwaHelper';

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Se l'app è installata (PWA su smartphone/desktop), non eseguire l'animazione
  const isPwa = isInstalledPwa();
  useEffect(() => {
    if (isPwa) {
      onFinish?.();
    }
  }, [isPwa, onFinish]);

  if (isPwa) {
    return null;
  }
  // Visibilità logo centrale e testi brand
  const [logoVisible, setLogoVisible] = useState(false);

  // Fasi della mascotte: 'walk' -> 'anticipate' -> 'jump' -> 'grab' -> 'pulldown'
  const [mascotPhase, setMascotPhase] = useState<MascotPhase>('walk');
  const [walkStep, setWalkStep] = useState(0);

  // Posizione orizzontale:
  // Inizia fuori schermo a sinistra (-15%)
  // Raggiunge la parte destra del logo (leggermente più a destra: ~115px dal centro)
  const [mascotX, setMascotX] = useState<string>('-15%');

  // Posizione verticale:
  // 'floor': sul binario a terra
  // 'anticipate': flessione a terra
  // 'top': salto in alto fino alla fine della pagina (cima dello schermo)
  // 'pulldown': trazione verso il basso in cima allo schermo
  const [verticalStage, setVerticalStage] = useState<'floor' | 'anticipate' | 'top' | 'pulldown'>('floor');

  // Movimento verso il basso della schermata quando la mascotte tira giù il sipario
  const [isLowering, setIsLowering] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const addTimer = (cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
    return t;
  };

  useEffect(() => {
    // 1. Spunta il logo centrale con pop e fade-in (100ms)
    addTimer(() => {
      setLogoVisible(true);
    }, 100);

    // 2. La mascotte parte correndo da sinistra verso la DESTRA DEL LOGO (120ms)
    addTimer(() => {
      setMascotX('clamp(calc(50% + 95px), calc(50% + 115px), calc(50% + 140px))');
    }, 120);

    // Ciclo di corsa (passi e falcate alternate ogni 95ms)
    const runInterval = setInterval(() => {
      setWalkStep((prev) => (prev + 1) % 4);
    }, 95);
    intervalsRef.current.push(runInterval);

    // 3. Arrivo a destra del logo: sosta e caricamento squat (anticipate) a 1250ms
    addTimer(() => {
      clearInterval(runInterval);
      setMascotPhase('anticipate');
      setVerticalStage('anticipate');
    }, 1250);

    // 4. Balzo altissimo verso l'alto fino alla fine della pagina (jump) a 1600ms
    addTimer(() => {
      setMascotPhase('jump');
      setVerticalStage('top');
    }, 1600);

    // 5. Presa salda in cima alla pagina (grab) a 2050ms
    addTimer(() => {
      setMascotPhase('grab');
    }, 2050);

    // 6. Trazione energica verso il basso (pulldown) che tira giù tutto il sipario a 2400ms
    addTimer(() => {
      setMascotPhase('pulldown');
      setVerticalStage('pulldown');
      setIsLowering(true);
    }, 2400);

    // 7. Completamento discesa del sipario e apertura del sito a 3250ms
    addTimer(() => {
      setIsDone(true);
      onFinish?.();
    }, 3250);

    return () => {
      timersRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, [onFinish]);

  // Click o tocco rapido per saltare istantaneamente l'animazione
  const handleFastSkip = () => {
    if (isLowering || isDone) return;
    timersRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);

    setMascotPhase('pulldown');
    setMascotX('clamp(calc(50% + 95px), calc(50% + 115px), calc(50% + 140px))');
    setVerticalStage('pulldown');
    setIsLowering(true);

    setTimeout(() => {
      setIsDone(true);
      onFinish?.();
    }, 500);
  };

  if (isDone) {
    return null;
  }

  // Calcolo della posizione verticale della mascotte compatta
  // A terra: bottom ~120px
  // In cima (fine pagina): bottom = calc(100vh - 82px), ponendo le mani della mascotte alla sommità esatta dello schermo
  // In trazione (pulldown): bottom = calc(100vh - 116px), tirando verso il basso
  const getMascotBottomStyle = () => {
    switch (verticalStage) {
      case 'anticipate':
        return '116px';
      case 'top':
        return 'calc(100vh - 82px)';
      case 'pulldown':
        return 'calc(100vh - 116px)';
      case 'floor':
      default:
        return '120px';
    }
  };

  return (
    <div
      onClick={handleFastSkip}
      aria-hidden="true"
      style={{
        transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between select-none overflow-hidden cursor-pointer transition-all duration-900 ${
        isLowering
          ? 'translate-y-full bg-[#141414]/90 backdrop-blur-xs shadow-[0_-30px_80px_rgba(0,0,0,0.95)]'
          : 'translate-y-0 bg-[#141414]'
      }`}
    >
      {/* Sfondo radiale scuro pulito con bagliore rosso brand JESic */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isLowering
            ? 'opacity-40 bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.10)_0%,rgba(18,18,18,0.70)_70%)]'
            : 'opacity-100 bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.20)_0%,rgba(18,18,18,0.96)_70%)]'
        }`}
      />

      {/* LOGO CENTRALE E BRANDING */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-4 pt-24 sm:pt-28 transition-all duration-700 ease-out ${
          logoVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-75 translate-y-6'
        } ${isLowering ? 'scale-95 opacity-50 translate-y-6' : ''}`}
      >
        {/* Box Logo con alone rosso brand */}
        <div className="relative mb-3 group">
          <div className="absolute inset-0 rounded-3xl bg-[#f23e2e]/25 blur-2xl scale-125 animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-neutral-900/90 border border-neutral-800/80 p-3 shadow-2xl shadow-red-600/30 flex items-center justify-center">
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
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-neutral-400 uppercase mt-1.5">
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

      {/* MASCOTTE ANIMATA: Corsa da sinistra -> sosta a destra del logo -> salto fino in cima -> pulldown */}
      <div
        className="absolute will-change-transform z-30 pointer-events-none"
        style={{
          left: mascotX,
          bottom: getMascotBottomStyle(),
          transform: 'translateX(-50%)',
          transition:
            mascotPhase === 'walk'
              ? 'left 1.15s cubic-bezier(0.2, 0.8, 0.4, 1), bottom 0.15s ease-out'
              : mascotPhase === 'anticipate'
              ? 'bottom 0.15s ease-out'
              : mascotPhase === 'jump'
              ? 'bottom 0.45s cubic-bezier(0.18, 0.89, 0.32, 1.25)'
              : mascotPhase === 'grab'
              ? 'bottom 0.15s ease-out'
              : mascotPhase === 'pulldown'
              ? 'bottom 0.25s cubic-bezier(0.2, 0.8, 0.4, 1)'
              : 'bottom 0.2s ease-out',
        }}
      >
        <CartoonMascot
          phase={mascotPhase}
          walkStep={walkStep}
          scale={1}
        />
      </div>

      {/* Binario / Pavimento su cui corre la mascotte */}
      <div className="absolute bottom-[118px] inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-700/60 to-transparent pointer-events-none" />

      {/* Suggerimento per tocco rapido */}
      <div
        className={`relative z-10 pb-6 text-[10px] text-neutral-500 font-medium tracking-wide transition-opacity duration-500 ${
          logoVisible && !isLowering ? 'opacity-60' : 'opacity-0'
        }`}
      >
        Tocca per continuare
      </div>
    </div>
  );
};
