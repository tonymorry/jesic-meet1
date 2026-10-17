/**
 * JESic Meet - ActionModal "+" Intelligente basato sui Ruoli
 * 
 * Regola:
 * - Utente standard ('associate'): apre direttamente il form per creare un sondaggio di disponibilità (stile When2meet)
 * - Admin ('admin'): apre un menu modale con due scelte:
 *     A) "Crea Sondaggio Disponibilità" (When2meet style)
 *     B) "Crea Evento Associativo" (Invito ufficiale dell'associazione con data/orari fissati)
 */

import React from 'react';
import { User } from '../types';
import { CalendarRange, Sparkles, X, ShieldAlert, Award } from 'lucide-react';

interface CreateActionChoiceModalProps {
  currentUser: User;
  onClose: () => void;
  onSelectCreatePoll: () => void;
  onSelectCreateOfficialEvent: () => void;
}

export const CreateActionChoiceModal: React.FC<CreateActionChoiceModalProps> = ({
  currentUser,
  onClose,
  onSelectCreatePoll,
  onSelectCreateOfficialEvent,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#f23e2e] flex items-center justify-center font-black">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">Crea Nuovo</h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Pannello Amministratore JESic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Opzioni */}
        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {/* Opzione A: Crea Sondaggio Disponibilità */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectCreatePoll();
            }}
            className="group flex items-start gap-3.5 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-red-50/50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800 text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center group-hover:bg-[#f23e2e] group-hover:text-white transition-colors shrink-0 mt-0.5">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#f23e2e]">
                  Crea Sondaggio Disponibilità
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  Sondaggio Orario
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                Proponi date e fasce orarie. Gli associati indicano quando sono liberi per trovare l'orario perfetto.
              </p>
            </div>
          </button>

          {/* Opzione B: Crea Evento Associativo (Solo Admin) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectCreateOfficialEvent();
            }}
            className="group flex items-start gap-3.5 p-3.5 rounded-2xl border-2 border-red-500/40 bg-gradient-to-r from-red-50/60 to-white dark:from-red-950/40 dark:to-neutral-900 hover:border-[#f23e2e] text-left transition-all cursor-pointer shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-[#f23e2e] text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/30 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-neutral-900 dark:text-white group-hover:text-[#f23e2e]">
                  Crea Evento Associativo
                </h3>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#f23e2e] text-white">
                  Solo Admin
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-snug">
                Data e orari definitivi. Compare nella bacheca degli associati con "Partecipa" / "Non Partecipo" e sincronizzazione Google Calendar.
              </p>
            </div>
          </button>
        </div>

        <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500 pt-1">
          Accesso consentito a: {currentUser.name} ({currentUser.systemRole === 'admin' ? 'Amministratore' : 'Associato'})
        </p>

      </div>
    </div>
  );
};
