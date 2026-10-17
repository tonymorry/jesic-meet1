/**
 * JESic Meet - Griglia di Disponibilità Stile When2meet
 * Drag / Swipe interattivo per la modalità individuale
 * e visualizzazione Heatmap di Gruppo con gradiente di rosso brand JESic (#f23e2e).
 * 
 * Selezione a click bloccata: in modalità gruppo lo slot viene fissato tramite CLICK/TAP,
 * garantendo che lo scroll non faccia perdere il giorno/orario selezionato.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { MeetingEvent, User, SlotAnalysis } from '../types';
import { generateAllEventSlots } from '../utils/matchingAlgorithm';
import { Star, Users, Check } from 'lucide-react';

interface AvailabilityGridProps {
  event: MeetingEvent;
  currentUser: User;
  mySelectedSlots: string[];
  onChangeMySlots: (slots: string[]) => void;
  allRankedSlots: SlotAnalysis[];
  isCreator: boolean;
  viewMode?: 'individual' | 'group';
  onChangeViewMode?: (mode: 'individual' | 'group') => void;
  activeSlotKey?: string | null;
  onSelectSlotKey?: (slotKey: string) => void;
}

export const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  event,
  currentUser,
  mySelectedSlots,
  onChangeMySlots,
  allRankedSlots,
  isCreator,
  viewMode = 'group',
  onChangeViewMode,
  activeSlotKey,
  onSelectSlotKey,
}) => {
  // Drag state per la selezione individuale
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'add' | 'remove'>('add');
  const currentSlotsRef = useRef<Set<string>>(new Set(mySelectedSlots));

  useEffect(() => {
    currentSlotsRef.current = new Set(mySelectedSlots);
  }, [mySelectedSlots]);

  const allSlots = generateAllEventSlots(event);
  const slotAnalysisMap = new Map<string, SlotAnalysis>(
    allRankedSlots.map((s) => [s.slotKey, s])
  );

  // Calcolo delle date uniche e degli orari unici per la tabella
  const uniqueDates = Array.from(new Set(allSlots.map((s) => s.date)));
  const uniqueTimes = Array.from(new Set(allSlots.map((s) => s.startTime))).sort();

  // Helper per formattare la data per l'intestazione
  const formatDateHeader = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const dayName = new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(d);
    return {
      dayName: dayName.toUpperCase().replace('.', ''),
      dayNum: day,
      monthName: new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(d),
    };
  };

  // Funzione per gestire inizio trascinamento (solo modalità individuale)
  const handlePointerDown = (slotKey: string) => {
    if (viewMode === 'group') {
      // In modalità gruppo la selezione avviene solo su click/tap esplicito
      return;
    }
    isDraggingRef.current = true;
    const isCurrentlySelected = currentSlotsRef.current.has(slotKey);
    const newMode = isCurrentlySelected ? 'remove' : 'add';
    dragModeRef.current = newMode;

    const newSet = new Set(currentSlotsRef.current);
    if (newMode === 'add') {
      newSet.add(slotKey);
    } else {
      newSet.delete(slotKey);
    }
    currentSlotsRef.current = newSet;
    onChangeMySlots(Array.from(newSet));
  };

  const handlePointerEnter = (slotKey: string) => {
    if (viewMode === 'group') {
      // Non modificare lo slot selezionato al passaggio del mouse o durante lo scroll!
      return;
    }
    if (!isDraggingRef.current) return;

    const newSet = new Set(currentSlotsRef.current);
    if (dragModeRef.current === 'add') {
      newSet.add(slotKey);
    } else {
      newSet.delete(slotKey);
    }
    currentSlotsRef.current = newSet;
    onChangeMySlots(Array.from(newSet));
  };

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerUp]);

  // Touch move handler per griglia mobile (calcola l'elemento sotto il dito SOLO in modalità individuale)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (viewMode !== 'individual' || !isDraggingRef.current) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (targetElement) {
      const slotKey = targetElement.getAttribute('data-slot-key');
      if (slotKey) {
        handlePointerEnter(slotKey);
      }
    }
  };

  // Calcolo colore della cella in modalità Gruppo (When2meet gradiente rosso JESic)
  const getCellColorClass = (slotKey: string) => {
    if (viewMode === 'individual') {
      const isSelected = mySelectedSlots.includes(slotKey);
      return isSelected
        ? 'bg-red-600 text-white font-medium border-red-700 shadow-inner'
        : 'bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-neutral-700';
    }

    // Modalità gruppo
    const analysis = slotAnalysisMap.get(slotKey);
    if (!analysis) return 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700';

    const totalExpected = analysis.mandatoryTotal + analysis.optionalTotal;
    const totalPresent = analysis.mandatoryPresent + analysis.optionalPresent;

    if (totalPresent === 0) {
      return 'bg-neutral-50/80 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/60 text-neutral-400 dark:text-neutral-500';
    }

    const ratio = totalExpected > 0 ? totalPresent / totalExpected : 0;
    const allMandatoryOk = analysis.isAllMandatoryPresent;

    // Se 100% degli essenziali sono liberi, evidenzia con gradiente rosso vivace
    if (allMandatoryOk && ratio >= 0.8) {
      return 'bg-red-600 text-white font-bold border-red-700 ring-1 ring-red-400/50';
    } else if (allMandatoryOk) {
      return 'bg-red-500 text-white font-medium border-red-600';
    } else if (ratio >= 0.6) {
      return 'bg-red-400 text-white border-red-500';
    } else if (ratio >= 0.3) {
      return 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200 border-red-300 dark:border-red-800';
    } else {
      return 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900';
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Selettore modalità di visualizzazione */}
      <div className="flex items-center justify-between bg-neutral-100/90 dark:bg-neutral-800/90 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => onChangeViewMode?.('group')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'group'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/50 dark:border-neutral-600'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>Disponibilità di Gruppo</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode?.('individual')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'individual'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/50 dark:border-neutral-600'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Check className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>La Mia Disponibilità ({mySelectedSlots.length})</span>
        </button>
      </div>

      {/* Indicazioni d'uso */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
        {viewMode === 'individual' ? (
          <p className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f23e2e] inline-block"></span>
            <span>Trascina con il dito o mouse per selezionare quando sei disponibile</span>
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <span>Intensità:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-900 inline-block" title="Pochi disponibili" />
              <span className="w-3 h-3 rounded bg-red-300 dark:bg-red-900/80 border border-red-400 dark:border-red-800 inline-block" />
              <span className="w-3 h-3 rounded bg-red-500 border border-red-600 inline-block" />
              <span className="w-3 h-3 rounded bg-red-600 border border-red-700 inline-block" title="Tutti disponibili" />
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">👉 Fai clic su uno slot per bloccarlo</span>
          </div>
        )}
      </div>

      {/* Tabella / Griglia When2meet che adatta automaticamente le dimensioni per non uscire dal bordo */}
      {(() => {
        const numDates = uniqueDates.length;
        const numTimes = uniqueTimes.length;

        // Larghezza colonna orari dinamica (da 46px per pochi giorni fino a 30px per 15 giorni)
        const timeColWidth = numDates <= 3 ? 46 : numDates <= 6 ? 42 : numDates <= 10 ? 36 : 30;

        // Gap tra colonne dinamico per garantire che rientri sempre perfettamente nei bordi
        const gridGapClass =
          numDates <= 4 ? 'gap-1.5' : numDates <= 7 ? 'gap-1' : numDates <= 11 ? 'gap-0.5' : 'gap-[2px]';

        // Altezza slot proporzionata al numero di fasce orarie e giorni
        const slotHeightClass =
          numTimes <= 6 ? 'h-8 sm:h-9' : numTimes <= 12 ? 'h-7 sm:h-8' : 'h-6 sm:h-7';

        // Stili testo header compatti quando ci sono molti giorni
        const headerPaddingClass =
          numDates <= 4 ? 'p-1.5' : numDates <= 7 ? 'p-1' : numDates <= 11 ? 'p-0.5' : 'p-[2px]';
        const dayNameTextClass =
          numDates <= 4 ? 'text-[10px]' : numDates <= 7 ? 'text-[9px]' : numDates <= 11 ? 'text-[8px]' : 'text-[7px]';
        const dayNumTextClass =
          numDates <= 4 ? 'text-sm font-black' : numDates <= 7 ? 'text-xs font-black' : numDates <= 11 ? 'text-[11px] font-black' : 'text-[10px] font-bold';
        const monthTextClass =
          numDates <= 4 ? 'text-[9px]' : numDates <= 7 ? 'text-[8px]' : numDates <= 11 ? 'text-[7px]' : 'hidden sm:block text-[6px]';

        // Stile etichetta ora
        const timeLabelClass =
          numDates <= 6
            ? 'text-[11px] font-mono font-semibold'
            : numDates <= 10
            ? 'text-[10px] font-mono font-semibold'
            : 'text-[9px] font-mono font-semibold tracking-tighter';

        // Dimensione testo numerico slot
        const slotTextClass =
          numDates <= 5 ? 'text-[11px]' : numDates <= 9 ? 'text-[10px]' : 'text-[9px]';

        return (
          <div
            className="touch-none-grid bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-1.5 sm:p-2.5 shadow-xs w-full select-none"
            onTouchMove={handleTouchMove}
          >
            <div className="w-full">
              {/* Header Giorni (spazio proporzionale per ogni giorno, rientra sempre nel bordo) */}
              <div
                className={`grid ${gridGapClass} mb-1 items-stretch`}
                style={{ gridTemplateColumns: `${timeColWidth}px repeat(${uniqueDates.length}, minmax(0, 1fr))` }}
              >
                {/* Cella angolo vuota */}
                <div className="flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                  ORA
                </div>
                {uniqueDates.map((dateStr) => {
                  const { dayName, dayNum, monthName } = formatDateHeader(dateStr);
                  return (
                    <div
                      key={dateStr}
                      className={`bg-neutral-50/90 dark:bg-neutral-800/80 rounded-xl ${headerPaddingClass} text-center border border-neutral-100 dark:border-neutral-700/60 overflow-hidden flex flex-col justify-center`}
                    >
                      <p className={`${dayNameTextClass} font-extrabold text-red-600 dark:text-red-400 uppercase tracking-tight truncate`}>
                        {dayName}
                      </p>
                      <p className={`${dayNumTextClass} text-neutral-900 dark:text-white leading-tight`}>
                        {dayNum}
                      </p>
                      <p className={`${monthTextClass} text-neutral-400 dark:text-neutral-400 uppercase font-semibold truncate`}>
                        {monthName}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Righe Orarie */}
              <div className="flex flex-col gap-1">
                {uniqueTimes.map((timeStr) => (
                  <div
                    key={timeStr}
                    className={`grid ${gridGapClass} items-center`}
                    style={{ gridTemplateColumns: `${timeColWidth}px repeat(${uniqueDates.length}, minmax(0, 1fr))` }}
                  >
                    {/* Etichetta Oraria */}
                    <div className={`${timeLabelClass} text-neutral-500 dark:text-neutral-400 text-center truncate`}>
                      {timeStr}
                    </div>

                    {/* Slot delle date (adattati dinamicamente in larghezza per non uscire mai dai bordi) */}
                    {uniqueDates.map((dateStr) => {
                      const slotKey = `${dateStr}T${timeStr}`;
                      const analysis = slotAnalysisMap.get(slotKey);
                      const isSelectedSlot = activeSlotKey === slotKey;
                      const totalPresent = analysis ? analysis.mandatoryPresent + analysis.optionalPresent : 0;
                      const isAllMandatory = analysis?.isAllMandatoryPresent;

                      return (
                        <button
                          type="button"
                          key={slotKey}
                          data-slot-key={slotKey}
                          onMouseDown={() => {
                            if (viewMode === 'individual') {
                              handlePointerDown(slotKey);
                            }
                          }}
                          onMouseEnter={() => {
                            if (viewMode === 'individual') {
                              handlePointerEnter(slotKey);
                            }
                          }}
                          onTouchStart={() => {
                            if (viewMode === 'individual') {
                              handlePointerDown(slotKey);
                            }
                          }}
                          onClick={() => {
                            if (viewMode === 'group') {
                              // Selezione e blocco slot esclusivamente su CLICK/TAP
                              onSelectSlotKey?.(slotKey);
                            }
                          }}
                          className={`${slotHeightClass} rounded-lg border flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${getCellColorClass(
                            slotKey
                          )} ${
                            isSelectedSlot && viewMode === 'group'
                              ? 'ring-2 ring-neutral-950 dark:ring-white ring-offset-1 dark:ring-offset-neutral-900 z-20 scale-[1.04] shadow-md font-extrabold'
                              : 'hover:brightness-95'
                          }`}
                          title={viewMode === 'group' ? `Clicca per visualizzare i dettagli di ${dateStr} ${timeStr}` : undefined}
                        >
                          {viewMode === 'individual' ? (
                            mySelectedSlots.includes(slotKey) ? (
                              <Check className={`${numDates <= 7 ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} stroke-[3px]`} />
                            ) : null
                          ) : (
                            totalPresent > 0 && (
                              <span className={`font-mono ${slotTextClass} font-bold flex items-center gap-0.5 truncate`}>
                                {totalPresent}
                                {isAllMandatory && analysis?.mandatoryTotal && analysis.mandatoryTotal > 0 ? (
                                  <Star className={`${numDates <= 7 ? 'w-2.5 h-2.5' : 'w-2 h-2'} fill-current text-amber-300 inline shrink-0`} />
                                ) : null}
                              </span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
