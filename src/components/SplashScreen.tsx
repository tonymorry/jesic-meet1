/**
 * JESic Meet - Splash Screen con Animazione di Entrata Iniziale
 * 
 * Sequenza animata:
 * 1. Schermata scura con bagliore radiale rosso brand.
 * 2. Il logo ufficiale JESic Meet spunta con elegante animazione di apparizione (fade & scale).
 * 3. Dopo una breve presentazione del brand, l'intera schermata si abbassa con fluidità
 *    (translate-y-full con curva naturale), svelando la schermata dell'app sottostante.
 * 4. Cliccando o toccando lo schermo è possibile saltare immediatamente l'attesa.
 */

import React, { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Visibilità logo centrale e testi brand
  const [logoVisible, setLogoVisible] = useState(false);
  // Movimento verso il basso della schermata ("che poi si abbassa")
  const [isLowering, setIsLowering] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const addTimer = (cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
    return t;
  };

  useEffect(() => {
    // 1. Spunta il logo al centro con pop e fade-in (100ms)
    addTimer(() => {
      setLogoVisible(true);
    }, 100);

    // 2. Dopo la visualizzazione del brand, la schermata si abbassa verso il basso (1800ms)
    addTimer(() => {
      setIsLowering(true);
    }, 1800);

    // 3. Completata la discesa (durata ~900ms), rimuovi completamente lo splash (2700ms)
    addTimer(() => {
      setIsDone(true);
      onFinish?.();
    }, 2700);

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [onFinish]);

  // Click o tocco per abbassare subito la schermata
  const handleFastSkip = () => {
    if (isLowering || isDone) return;
    setIsLowering(true);
    setTimeout(() => {
      setIsDone(true);
      onFinish?.();
    }, 750);
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
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-900 ${
        isLowering
          ? 'translate-y-full bg-[#141414]/90 backdrop-blur-xs shadow-[0_-30px_80px_rgba(0,0,0,0.95)]'
          : 'translate-y-0 bg-[#141414]'
      }`}
    >
      {/* Sfondo radiale con bagliore rosso brand JESic */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isLowering
            ? 'opacity-40 bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.12)_0%,rgba(18,18,18,0.70)_70%)]'
            : 'opacity-100 bg-[radial-gradient(circle_at_center,rgba(242,62,46,0.18)_0%,rgba(18,18,18,0.96)_70%)]'
        }`}
      />

      {/* CONTENUTO CENTRALE: Logo Brand Ufficiale JESic Meet */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-4 transition-all duration-700 ease-out ${
          logoVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-75 translate-y-6'
        } ${isLowering ? 'scale-95 opacity-50 translate-y-6' : ''}`}
      >
        {/* Logo con alone rosso brand */}
        <div className="relative mb-3 group">
          <div className="absolute inset-0 rounded-3xl bg-[#f23e2e]/25 blur-2xl scale-125 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900/90 border border-neutral-800/80 p-3.5 shadow-2xl shadow-red-600/30 flex items-center justify-center">
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
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-neutral-400 uppercase mt-2">
            Junior Enterprise Sicilia
          </p>
        </div>

        {/* Barretta d'accento brand che si espande */}
        <div
          className={`h-0.5 bg-gradient-to-r from-transparent via-[#f23e2e] to-transparent rounded-full mt-3.5 transition-all duration-1000 ${
            logoVisible ? 'w-24 opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </div>

      {/* Suggerimento per tocco rapido */}
      <div
        className={`absolute bottom-5 text-[10px] text-neutral-500 font-medium tracking-wide transition-opacity duration-500 ${
          logoVisible && !isLowering ? 'opacity-60' : 'opacity-0'
        }`}
      >
        Tocca per continuare
      </div>
    </div>
  );
};
