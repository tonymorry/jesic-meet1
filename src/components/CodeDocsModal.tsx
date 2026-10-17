/**
 * JESic Meet - Modal Documentazione & Codice Tecnico
 * Mostra in modo chiaro ed esaustivo gli schemi Mongoose,
 * l'algoritmo di matching in Node.js, l'automazione cron e la guida Google Calendar OAuth2.
 */

import React, { useState } from 'react';
import { MONGOOSE_SCHEMAS_CODE } from '../models/schemas';
import { NODEJS_ALGORITHM_SNIPPET } from '../utils/matchingAlgorithm';
import { GOOGLE_CALENDAR_BACKEND_CODE } from '../utils/googleCalendar';
import { CRON_AUTOMATION_NODEJS_CODE } from '../utils/cronAutomation';
import { X, Copy, Check, FileCode, Cpu, Calendar, Bell } from 'lucide-react';

interface CodeDocsModalProps {
  onClose: () => void;
}

export const CodeDocsModal: React.FC<CodeDocsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'mongoose' | 'algorithm' | 'google' | 'cron'>('mongoose');
  const [copied, setCopied] = useState(false);

  const getCodeContent = () => {
    switch (activeTab) {
      case 'mongoose':
        return MONGOOSE_SCHEMAS_CODE.trim();
      case 'algorithm':
        return NODEJS_ALGORITHM_SNIPPET.trim();
      case 'google':
        return GOOGLE_CALENDAR_BACKEND_CODE.trim();
      case 'cron':
        return CRON_AUTOMATION_NODEJS_CODE.trim();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-neutral-900 text-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-800">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Architettura Backend JESic Meet
              </h2>
              <p className="text-[11px] text-neutral-400">
                Schemi MongoDB, Algoritmo Prioritario & Integrazioni Google
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selettore */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('mongoose')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'mongoose'
                ? 'bg-red-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>1. Schemi Mongoose</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('algorithm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'algorithm'
                ? 'bg-red-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2. Algoritmo Matching</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'google'
                ? 'bg-red-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3. Google Calendar & Meet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cron')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cron'
                ? 'bg-red-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>4. Cron Job 24h Reminder</span>
          </button>
        </div>

        {/* Spiegazione & Bottone Copia */}
        <div className="px-4 py-2 bg-neutral-800 flex items-center justify-between text-xs border-b border-neutral-700">
          <span className="text-neutral-400 text-[11px]">
            {activeTab === 'mongoose' && 'Modelli User, Event e Response completi di indici e validatori'}
            {activeTab === 'algorithm' && 'Algoritmo in Node.js con dominanza assoluta dei membri isMandatory'}
            {activeTab === 'google' && 'Setup Google Calendar API v3 con conferenze Meet e notifiche Nodemailer'}
            {activeTab === 'cron' && 'node-cron schedulato per rilevare chi non ha ancora votato 24h prima della scadenza'}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copia Codice</span>
              </>
            )}
          </button>
        </div>

        {/* Code Viewer */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-neutral-300 bg-neutral-950">
          <pre className="whitespace-pre-wrap leading-relaxed select-text">
            {getCodeContent()}
          </pre>
        </div>

      </div>
    </div>
  );
};
