/**
 * JESic Meet - Card dei 3 Migliori Slot Orari (Algoritmo Matching)
 * Presenta con chiarezza visiva le 3 migliori opzioni.
 * L'organizzatore ha sempre la facoltà di confermare lo slot anche se un membro essenziale è assente.
 */

import React from 'react';
import { SlotAnalysis } from '../types';
import { Sparkles, Star, ArrowRight, AlertTriangle } from 'lucide-react';

interface BestSlotsCardProps {
  top3Slots: SlotAnalysis[];
  isCreator: boolean;
  onConfirmSlot: (slot: SlotAnalysis) => void;
}

export const BestSlotsCard: React.FC<BestSlotsCardProps> = ({
  top3Slots,
  isCreator,
  onConfirmSlot,
}) => {
  if (top3Slots.length === 0) {
    return null;
  }

  const formatDateHuman = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-white rounded-2xl p-4 shadow-xl border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
            <Sparkles className="w-4 h-4 fill-red-500/20" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Top 3 Slot Consigliati
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800">
                AI Match
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Priorità ai membri Essenziali (puoi confermare anche con assenze)
            </p>
          </div>
        </div>
      </div>

      {/* Lista 3 Slot */}
      <div className="mt-3 flex flex-col gap-2.5">
        {top3Slots.map((slot, index) => {
          const isBest = index === 0;
          const mandatoryRatio =
            slot.mandatoryTotal > 0
              ? (slot.mandatoryPresent / slot.mandatoryTotal) * 100
              : 100;
          const totalPresent = slot.mandatoryPresent + slot.optionalPresent;
          const totalPossible = slot.mandatoryTotal + slot.optionalTotal;
          const missingMandatoryCount = slot.mandatoryTotal - slot.mandatoryPresent;

          return (
            <div
              key={slot.slotKey}
              className={`rounded-xl p-3 transition-all border ${
                isBest
                  ? 'bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border-red-600/60 ring-1 ring-red-500/20'
                  : 'bg-neutral-800/50 border-neutral-700/60 hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isBest ? 'bg-red-600 text-white' : 'bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {formatDateHuman(slot.date)}
                      </span>
                      <span className="font-mono text-xs font-semibold text-red-400">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>

                    {/* Metriche Presenza */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                      {/* Badge Essenziali */}
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          slot.isAllMandatoryPresent
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                        {slot.mandatoryPresent}/{slot.mandatoryTotal} Essenziali ({Math.round(mandatoryRatio)}%)
                      </span>

                      <span className="text-neutral-500">·</span>

                      {/* Badge Opzionali */}
                      <span className="text-neutral-300">
                        {slot.optionalPresent}/{slot.optionalTotal} Opzionali
                      </span>

                      <span className="text-neutral-500">·</span>

                      {/* Totale */}
                      <span className="text-neutral-400 font-mono">
                        {totalPresent}/{totalPossible} Tot
                      </span>
                    </div>

                    {/* Avviso se qualche essenziale manca, ma l'organizzatore può confermare ugualmente */}
                    {!slot.isAllMandatoryPresent && missingMandatoryCount > 0 && (
                      <p className="text-[10px] text-amber-300/90 mt-1 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{missingMandatoryCount} essenziale assente. Puoi confermare comunque.</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Pulsante Conferma Orario per Creatore */}
                {isCreator && (
                  <button
                    type="button"
                    onClick={() => onConfirmSlot(slot)}
                    className={`shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isBest
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/40 active:scale-95'
                        : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200 active:scale-95'
                    }`}
                  >
                    <span>Scegli</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
