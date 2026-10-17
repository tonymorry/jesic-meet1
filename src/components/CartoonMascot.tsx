import React from 'react';

export type MascotPhase = 'walk' | 'anticipate' | 'jump' | 'grab' | 'pulldown';

interface CartoonMascotProps {
  phase: MascotPhase;
  walkStep?: number; // 0, 1, 2, 3 for walk cycle
  scale?: number;
  className?: string;
}

/**
 * CartoonMascot - "JESino"
 * Mascotte ufficiale cartonata in stile cartoon classico per JESic Meet:
 * - Corpo tondo ed espressivo con maglia/cappello rosso brand JESic (#f23e2e)
 * - Guanti bianchi da cartoon a 4 dita con le 3 iconiche cuciture
 * - Scarpe da ginnastica cartoon con suola bianca
 * - Occhi grandi e vispi con riflessi lucidi e pupille mobili in base alla posa
 * - Posa 'walk': camminata saltellante con braccia e gambe oscillanti
 * - Posa 'anticipate': caricamento salto con squash cartoon e sguardo verso l'alto
 * - Posa 'jump': balzo esplosivo verso il soffitto con stretch e braccia tese in alto
 * - Posa 'grab': aggrappato al bordo superiore dello schermo con le manone e sforzo comico
 * - Posa 'pulldown': trazione potente per buttare giù lo schermo con sorriso trionfante
 */
export const CartoonMascot: React.FC<CartoonMascotProps> = ({
  phase,
  walkStep = 0,
  scale = 0.85,
  className = '',
}) => {
  return (
    <div
      className={`relative select-none pointer-events-none transition-transform duration-100 ${className}`}
      style={{ transform: `scale(${scale})` }}
    >
      {phase === 'walk' && <MascotWalkPose step={walkStep} />}
      {phase === 'anticipate' && <MascotAnticipatePose />}
      {phase === 'jump' && <MascotJumpPose />}
      {phase === 'grab' && <MascotGrabPose />}
      {phase === 'pulldown' && <MascotPullDownPose />}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 1. POSA CAMMINATA (Walk Pose con oscillazione braccia e gambe)             */
/* -------------------------------------------------------------------------- */
const MascotWalkPose: React.FC<{ step: number }> = ({ step }) => {
  const isLeftFoot = step % 2 === 0;
  const legOffsetLeft = isLeftFoot ? 6 : -6;
  const legOffsetRight = isLeftFoot ? -6 : 6;
  const armAngleLeft = isLeftFoot ? -22 : 22;
  const armAngleRight = isLeftFoot ? 22 : -22;
  const bodyBob = step % 2 === 0 ? 0 : -3;

  return (
    <svg
      viewBox="0 0 140 160"
      className="w-16 h-20 sm:w-20 sm:h-24 drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)] overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`translate(0, ${bodyBob})`}>
        {/* Ombra sul pavimento */}
        <ellipse cx="70" cy="154" rx="28" ry="6" fill="rgba(0,0,0,0.35)" />

        {/* Nuvole di polvere da cartone animato dietro al passo */}
        <g opacity="0.75" className="animate-pulse">
          <circle cx={isLeftFoot ? 40 : 96} cy="148" r="4" fill="#ffffff" opacity="0.4" />
          <circle cx={isLeftFoot ? 34 : 102} cy="145" r="3" fill="#ffffff" opacity="0.3" />
        </g>

        {/* Gamba Posteriore Sinistra */}
        <g transform={`translate(${legOffsetLeft}, 0)`}>
          <path
            d="M58 114 Q52 130 50 142"
            stroke="#111827"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Scarpetta Sinistra */}
          <g transform="translate(34, 134)">
            <ellipse cx="18" cy="12" rx="14" ry="8" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
            <path d="M6 12 Q14 16 28 14" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <ellipse cx="10" cy="12" rx="5" ry="6" fill="#ffffff" stroke="#111827" strokeWidth="2" />
          </g>
        </g>

        {/* Braccio Posteriore Sinistro */}
        <g transform={`rotate(${armAngleLeft} 52 86)`}>
          <path
            d="M52 86 Q36 94 30 106"
            stroke="#111827"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Guanto Bianco Sinistro */}
          <g transform="translate(18, 98)">
            <circle cx="10" cy="10" r="9" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
            <path d="M8 6 L8 12 M11 7 L11 13" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>

        {/* Corpo Tondo / Jersey Rosso JESic */}
        <circle
          cx="70"
          cy="92"
          r="26"
          fill="#f23e2e"
          stroke="#111827"
          strokeWidth="3.5"
        />
        {/* Dettaglio pancia / stemma centrale */}
        <circle cx="70" cy="94" r="16" fill="#ffffff" opacity="0.95" />
        {/* Iniziale J stilizzata brand */}
        <text
          x="70"
          y="99"
          textAnchor="middle"
          fontSize="14"
          fontWeight="900"
          fill="#f23e2e"
          fontFamily="system-ui, sans-serif"
        >
          J
        </text>

        {/* Gamba Anteriore Destra */}
        <g transform={`translate(${legOffsetRight}, 0)`}>
          <path
            d="M82 114 Q88 130 90 142"
            stroke="#111827"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Scarpetta Destra */}
          <g transform="translate(76, 134)">
            <ellipse cx="18" cy="12" rx="14" ry="8" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
            <path d="M6 12 Q14 16 28 14" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            <ellipse cx="26" cy="12" rx="5" ry="6" fill="#ffffff" stroke="#111827" strokeWidth="2" />
          </g>
        </g>

        {/* Testa Tonda della Mascotte */}
        <circle
          cx="70"
          cy="52"
          r="28"
          fill="#fed7aa"
          stroke="#111827"
          strokeWidth="3.5"
        />

        {/* Cappellino / Ciuffo Rosso con visierina */}
        <path
          d="M44 44 C46 22 94 22 96 44 Z"
          fill="#f23e2e"
          stroke="#111827"
          strokeWidth="3"
        />
        <ellipse cx="70" cy="22" rx="6" ry="6" fill="#f59e0b" stroke="#111827" strokeWidth="2" />
        <path
          d="M42 45 Q70 38 98 45"
          stroke="#111827"
          strokeWidth="3"
          fill="none"
        />

        {/* Guancette Rosse Chibi */}
        <circle cx="53" cy="62" r="5" fill="#f87171" opacity="0.75" />
        <circle cx="87" cy="62" r="5" fill="#f87171" opacity="0.75" />

        {/* Occhioni Grandi da Cartone Animato */}
        <g>
          {/* Occhio Sinistro */}
          <ellipse cx="60" cy="50" rx="7" ry="11" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
          <ellipse cx={isLeftFoot ? 62 : 60} cy="50" rx="4" ry="6" fill="#111827" />
          <circle cx={isLeftFoot ? 63 : 61} cy="48" r="2" fill="#ffffff" />

          {/* Occhio Destro */}
          <ellipse cx="80" cy="50" rx="7" ry="11" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
          <ellipse cx={isLeftFoot ? 82 : 80} cy="50" rx="4" ry="6" fill="#111827" />
          <circle cx={isLeftFoot ? 83 : 81} cy="48" r="2" fill="#ffffff" />
        </g>

        {/* Sorrisone Allegro con linguetta */}
        <path
          d="M59 64 Q70 75 81 64"
          stroke="#111827"
          strokeWidth="3"
          strokeLinecap="round"
          fill="#991b1b"
        />
        <path d="M64 68 Q70 73 76 68" fill="#f43f5e" />

        {/* Braccio Anteriore Destro che dondola allegramente */}
        <g transform={`rotate(${armAngleRight} 88 86)`}>
          <path
            d="M88 86 Q104 94 110 106"
            stroke="#111827"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Guanto Bianco Destro con saluto/passo */}
          <g transform="translate(100, 98)">
            <circle cx="10" cy="10" r="9" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
            <path d="M9 6 L9 12 M12 7 L12 13" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. POSA ANTICIPAZIONE / SQUAT (Prepara il salto, guarda in alto)           */
/* -------------------------------------------------------------------------- */
const MascotAnticipatePose: React.FC = () => {
  return (
    <svg
      viewBox="0 0 140 160"
      className="w-16 h-20 sm:w-20 sm:h-24 drop-shadow-[0_8px_16px_rgba(242,62,46,0.4)] overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ombra allargata e schiacciata sul pavimento */}
      <ellipse cx="70" cy="154" rx="36" ry="7" fill="rgba(0,0,0,0.5)" />

      {/* Fumetto comico / linee di energia */}
      <g className="animate-pulse">
        <path d="M26 130 L18 136 M114 130 L122 136" stroke="#f23e2e" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 140 L16 144 M112 140 L124 144" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Gambe piegate in squat profondo */}
      <path d="M48 126 Q42 138 38 146" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
      <path d="M92 126 Q98 138 102 146" stroke="#111827" strokeWidth="8" strokeLinecap="round" />

      {/* Scarpette ancorate a terra */}
      <g transform="translate(24, 138)">
        <ellipse cx="18" cy="10" rx="15" ry="8" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
        <ellipse cx="8" cy="10" rx="5" ry="6" fill="#ffffff" stroke="#111827" strokeWidth="2" />
      </g>
      <g transform="translate(84, 138)">
        <ellipse cx="18" cy="10" rx="15" ry="8" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
        <ellipse cx="28" cy="10" rx="5" ry="6" fill="#ffffff" stroke="#111827" strokeWidth="2" />
      </g>

      {/* Braccia tirate indietro per darsi la spinta */}
      <path d="M46 104 Q28 108 20 120" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <circle cx="16" cy="122" r="9" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />

      <path d="M94 104 Q112 108 120 120" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <circle cx="124" cy="122" r="9" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />

      {/* Corpo Schiacciato (Squash classico cartoon) */}
      <ellipse cx="70" cy="106" rx="31" ry="21" fill="#f23e2e" stroke="#111827" strokeWidth="3.5" />
      <ellipse cx="70" cy="108" rx="19" ry="12" fill="#ffffff" opacity="0.95" />
      <text
        x="70"
        y="112"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill="#f23e2e"
        fontFamily="system-ui, sans-serif"
      >
        J
      </text>

      {/* Testa leggermente abbassata e inclinata verso l'alto */}
      <ellipse cx="70" cy="74" rx="30" ry="24" fill="#fed7aa" stroke="#111827" strokeWidth="3.5" />

      {/* Cappellino rosso piegato indietro */}
      <path d="M42 66 C44 48 96 48 98 66 Z" fill="#f23e2e" stroke="#111827" strokeWidth="3" />
      <ellipse cx="70" cy="48" rx="6" ry="6" fill="#f59e0b" stroke="#111827" strokeWidth="2" />

      {/* Guancette caricate */}
      <circle cx="50" cy="80" r="5" fill="#f87171" opacity="0.8" />
      <circle cx="90" cy="80" r="5" fill="#f87171" opacity="0.8" />

      {/* Occhi grandi puntati DRITTO IN ALTO al soffitto dello schermo! */}
      <g>
        <ellipse cx="58" cy="68" rx="8" ry="11" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
        <ellipse cx="58" cy="62" rx="4.5" ry="5.5" fill="#111827" />
        <circle cx="59" cy="60" r="2" fill="#ffffff" />

        <ellipse cx="82" cy="68" rx="8" ry="11" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
        <ellipse cx="82" cy="62" rx="4.5" ry="5.5" fill="#111827" />
        <circle cx="83" cy="60" r="2" fill="#ffffff" />

        {/* Sopracciglia determinate inclinate */}
        <path d="M50 56 L64 58" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <path d="M90 56 L76 58" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Bocca a grinta determinata */}
      <ellipse cx="70" cy="84" rx="5" ry="6" fill="#111827" />
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. POSA SALTO / ROCKET (Stretch verso l'alto con braccia tese al soffitto)  */
/* -------------------------------------------------------------------------- */
const MascotJumpPose: React.FC = () => {
  return (
    <svg
      viewBox="0 0 140 180"
      className="w-16 h-22 sm:w-20 sm:h-28 drop-shadow-[0_10px_20px_rgba(242,62,46,0.6)] overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Scia di vento e propulsione cartoon verso il basso */}
      <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
        <path d="M70 170 L70 155" />
        <path d="M52 165 L52 152" />
        <path d="M88 165 L88 152" />
      </g>

      {/* Gambette rannicchiate nel salto */}
      <path d="M54 115 Q48 128 44 136" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <path d="M86 115 Q92 128 96 136" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <g transform="translate(32, 130)">
        <ellipse cx="14" cy="10" rx="12" ry="7" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
      </g>
      <g transform="translate(82, 130)">
        <ellipse cx="14" cy="10" rx="12" ry="7" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
      </g>

      {/* Corpo Allungato (Stretch verticale cartoon) */}
      <ellipse cx="70" cy="98" rx="23" ry="32" fill="#f23e2e" stroke="#111827" strokeWidth="3.5" />
      <ellipse cx="70" cy="98" rx="14" ry="20" fill="#ffffff" opacity="0.95" />
      <text
        x="70"
        y="103"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="#f23e2e"
        fontFamily="system-ui, sans-serif"
      >
        J
      </text>

      {/* Testa tonda tirata in alto */}
      <circle cx="70" cy="56" r="26" fill="#fed7aa" stroke="#111827" strokeWidth="3.5" />
      <path d="M46 48 C48 28 92 28 94 48 Z" fill="#f23e2e" stroke="#111827" strokeWidth="3" />
      <ellipse cx="70" cy="28" rx="6" ry="6" fill="#f59e0b" stroke="#111827" strokeWidth="2" />

      {/* Guance entusiaste */}
      <circle cx="53" cy="64" r="5" fill="#f87171" opacity="0.8" />
      <circle cx="87" cy="64" r="5" fill="#f87171" opacity="0.8" />

      {/* Occhi spalancati con eccitazione puntati dritti al soffitto */}
      <ellipse cx="60" cy="52" rx="7" ry="11" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
      <ellipse cx="60" cy="47" rx="4.5" ry="6" fill="#111827" />
      <circle cx="61" cy="45" r="2" fill="#ffffff" />

      <ellipse cx="80" cy="52" rx="7" ry="11" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
      <ellipse cx="80" cy="47" rx="4.5" ry="6" fill="#111827" />
      <circle cx="81" cy="45" r="2" fill="#ffffff" />

      {/* Bocca aperta entusiasta: "WAAAH!" */}
      <path d="M60 66 Q70 80 80 66 Z" fill="#991b1b" stroke="#111827" strokeWidth="2.5" />

      {/* Braccia TESE DRITTE VERSO L'ALTO PRONTE AD AGGRAPPARSI */}
      <path d="M50 78 Q36 44 32 16" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <g transform="translate(18, 2)">
        <path
          d="M14 16 C8 16 6 10 10 4 C14 -2 20 2 22 8 C24 14 20 16 14 16 Z"
          fill="#ffffff"
          stroke="#111827"
          strokeWidth="2.5"
        />
        <circle cx="10" cy="8" r="3" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
        <circle cx="16" cy="4" r="3" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
        <circle cx="22" cy="7" r="3" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
      </g>

      <path d="M90 78 Q104 44 108 16" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <g transform="translate(94, 2)">
        <path
          d="M14 16 C8 16 6 10 10 4 C14 -2 20 2 22 8 C24 14 20 16 14 16 Z"
          fill="#ffffff"
          stroke="#111827"
          strokeWidth="2.5"
        />
        <circle cx="8" cy="7" r="3" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
        <circle cx="14" cy="4" r="3" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
        <circle cx="20" cy="8" r="3" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. POSA AGGRAPPO AL BORDO SUPERIORE (Dangling & sforzo cartoon)            */
/* -------------------------------------------------------------------------- */
const MascotGrabPose: React.FC = () => {
  return (
    <svg
      viewBox="0 0 160 170"
      className="w-18 h-20 sm:w-22 sm:h-24 drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* I DUE GUANTONI BIANCHI CHE AGGRAPPANO LA SBARRA SUPERIORE */}
      <g transform="translate(24, 0)">
        <rect x="6" y="2" width="28" height="12" rx="6" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
        <path d="M14 2 L14 10 M21 2 L21 10 M28 2 L28 10" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="10" width="24" height="6" rx="3" fill="#ffffff" stroke="#111827" strokeWidth="2" />
      </g>

      <g transform="translate(100, 0)">
        <rect x="6" y="2" width="28" height="12" rx="6" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
        <path d="M14 2 L14 10 M21 2 L21 10 M28 2 L28 10" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="10" width="24" height="6" rx="3" fill="#ffffff" stroke="#111827" strokeWidth="2" />
      </g>

      {/* Braccia TESE in trazione */}
      <path d="M42 16 Q52 46 60 62" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <path d="M118 16 Q108 46 100 62" stroke="#111827" strokeWidth="7" strokeLinecap="round" />

      {/* Gocciolina di sudore cartoon per lo sforzo comico */}
      <g className="animate-bounce">
        <path d="M114 42 C118 36 122 42 120 46 C118 49 114 48 114 42 Z" fill="#38bdf8" stroke="#111827" strokeWidth="1.5" />
      </g>

      {/* Corpo Mascotte che penzola */}
      <circle cx="80" cy="98" r="25" fill="#f23e2e" stroke="#111827" strokeWidth="3.5" />
      <circle cx="80" cy="100" r="15" fill="#ffffff" opacity="0.95" />
      <text
        x="80"
        y="105"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill="#f23e2e"
        fontFamily="system-ui, sans-serif"
      >
        J
      </text>

      {/* Gambette che dondolano */}
      <path d="M68 120 Q62 136 58 144" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <path d="M92 120 Q96 136 102 144" stroke="#111827" strokeWidth="6" strokeLinecap="round" />

      <g transform="translate(44, 136)">
        <ellipse cx="14" cy="9" rx="12" ry="7" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
        <ellipse cx="6" cy="9" rx="4" ry="5" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
      </g>
      <g transform="translate(94, 136)">
        <ellipse cx="14" cy="9" rx="12" ry="7" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
        <ellipse cx="22" cy="9" rx="4" ry="5" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
      </g>

      {/* Testa tonda */}
      <circle cx="80" cy="58" r="26" fill="#fed7aa" stroke="#111827" strokeWidth="3.5" />
      <path d="M56 50 C58 30 102 30 104 50 Z" fill="#f23e2e" stroke="#111827" strokeWidth="3" />
      <ellipse cx="80" cy="30" rx="6" ry="6" fill="#f59e0b" stroke="#111827" strokeWidth="2" />

      {/* Guance rosse gonfie dallo sforzo */}
      <circle cx="62" cy="68" r="6" fill="#f87171" opacity="0.85" />
      <circle cx="98" cy="68" r="6" fill="#f87171" opacity="0.85" />

      {/* Occhi determinati */}
      <ellipse cx="70" cy="56" rx="7" ry="9" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
      <ellipse cx="70" cy="58" rx="4.5" ry="5.5" fill="#111827" />
      <circle cx="71" cy="56" r="2" fill="#ffffff" />

      <ellipse cx="90" cy="56" rx="7" ry="9" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
      <ellipse cx="90" cy="58" rx="4.5" ry="5.5" fill="#111827" />
      <circle cx="91" cy="56" r="2" fill="#ffffff" />

      {/* Denti stretti in un grintoso sorrisetto */}
      <path d="M68 70 Q80 76 92 70" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="74" y="68" width="12" height="4" rx="2" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. POSA TRAZIONE / BUTTA TUTTO GIÙ (Tira con tutto il peso e ride!)       */
/* -------------------------------------------------------------------------- */
const MascotPullDownPose: React.FC = () => {
  return (
    <svg
      viewBox="0 0 160 170"
      className="w-18 h-20 sm:w-22 sm:h-24 drop-shadow-[0_12px_24px_rgba(242,62,46,0.7)] overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mani aggrappate saldamente al bordo con piega della tendina */}
      <g transform="translate(26, 2)">
        <rect x="4" y="2" width="28" height="12" rx="6" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
        <path d="M12 2 L12 10 M18 2 L18 10 M24 2 L24 10" stroke="#111827" strokeWidth="1.5" />
      </g>
      <g transform="translate(98, 2)">
        <rect x="4" y="2" width="28" height="12" rx="6" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
        <path d="M12 2 L12 10 M18 2 L18 10 M24 2 L24 10" stroke="#111827" strokeWidth="1.5" />
      </g>

      {/* Braccia flesse e potenti che tirano giù il sipario */}
      <path d="M44 14 Q32 38 52 56" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
      <path d="M116 14 Q128 38 108 56" stroke="#111827" strokeWidth="8" strokeLinecap="round" />

      {/* Linee di impatto e forza cartoon */}
      <g stroke="#f23e2e" strokeWidth="3" strokeLinecap="round">
        <path d="M18 36 L6 44" />
        <path d="M142 36 L154 44" />
        <path d="M16 54 L4 58" />
        <path d="M144 54 L156 58" />
      </g>

      {/* Corpo che trascina tutto verso il basso */}
      <circle cx="80" cy="88" r="26" fill="#f23e2e" stroke="#111827" strokeWidth="3.5" />
      <circle cx="80" cy="90" r="16" fill="#ffffff" opacity="0.95" />
      <text
        x="80"
        y="95"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="#f23e2e"
        fontFamily="system-ui, sans-serif"
      >
        J
      </text>

      {/* Gambe felici piegate verso l'alto mentre scivola giù */}
      <path d="M66 108 Q52 118 46 112" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <path d="M94 108 Q108 118 114 112" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <g transform="translate(34, 104)">
        <ellipse cx="12" cy="8" rx="11" ry="7" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
      </g>
      <g transform="translate(104, 104)">
        <ellipse cx="12" cy="8" rx="11" ry="7" fill="#f23e2e" stroke="#111827" strokeWidth="2.5" />
      </g>

      {/* Faccione con risata trionfante da cartone animato: "ANDIAMO!" */}
      <circle cx="80" cy="52" r="26" fill="#fed7aa" stroke="#111827" strokeWidth="3.5" />
      <path d="M56 44 C58 24 102 24 104 44 Z" fill="#f23e2e" stroke="#111827" strokeWidth="3" />
      <ellipse cx="80" cy="24" rx="6" ry="6" fill="#f59e0b" stroke="#111827" strokeWidth="2" />

      {/* Occhi a mezzaluna felici da cartone animato */}
      <path d="M64 48 Q70 42 76 48" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M84 48 Q90 42 96 48" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* Grandissima bocca spalancata a risata: "WHEEEE!" */}
      <path
        d="M66 56 Q80 76 94 56 Z"
        fill="#991b1b"
        stroke="#111827"
        strokeWidth="3"
      />
      <ellipse cx="80" cy="65" rx="7" ry="4" fill="#f43f5e" />

      {/* Guancette rosee radiose */}
      <circle cx="60" cy="58" r="6" fill="#f87171" opacity="0.85" />
      <circle cx="100" cy="58" r="6" fill="#f87171" opacity="0.85" />
    </svg>
  );
};
