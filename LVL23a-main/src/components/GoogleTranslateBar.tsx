import React, { useState } from 'react';
import {
  Globe,
  Languages,
  Sparkles,
  Check,
  ChevronDown,
  ArrowRightLeft,
  Loader2
} from 'lucide-react';

interface GoogleTranslateBarProps {
  currentLanguage: 'en' | 'es' | string;
  onLanguageChange: (lang: 'en' | 'es' | string) => void;
  onTranslateActiveView?: (targetLang: string) => void;
  isTranslating?: boolean;
}

export const GoogleTranslateBar: React.FC<GoogleTranslateBarProps> = ({
  currentLanguage,
  onLanguageChange,
  onTranslateActiveView,
  isTranslating = false
}) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const supportedLanguages = [
    { code: 'en', label: 'English (US)', flag: '🇺🇸', legalCert: 'Original Master' },
    { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸', legalCert: 'Certified Legal' },
    { code: 'fr', label: 'Français (French)', flag: '🇫🇷', legalCert: 'Standard' },
    { code: 'pt', label: 'Português (Portuguese)', flag: '🇧🇷', legalCert: 'Standard' },
    { code: 'tl', label: 'Tagalog (Filipino)', flag: '🇵🇭', legalCert: 'Standard' },
    { code: 'vi', label: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳', legalCert: 'Standard' },
    { code: 'zh', label: '中文 (Mandarin)', flag: '🇨🇳', legalCert: 'Standard' },
    { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦', legalCert: 'Standard' }
  ];

  const activeLangObj = supportedLanguages.find(l => l.code === currentLanguage) || supportedLanguages[0];

  const handleSelectLanguage = (code: string) => {
    onLanguageChange(code);
    setIsOpenMenu(false);
    if (onTranslateActiveView) {
      onTranslateActiveView(code);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1 bg-[#090e18] border border-purple-500/30 hover:border-purple-500/60 rounded-xl p-1 shadow-[0_0_12px_rgba(168,85,247,0.15)] transition-all">
        
        {/* Quick Toggle Button between EN and ES */}
        <button
          onClick={() => handleSelectLanguage(currentLanguage === 'es' ? 'en' : 'es')}
          disabled={isTranslating}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            currentLanguage === 'es'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
          }`}
          title="Toggle instant Spanish / English translation"
        >
          {isTranslating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
          ) : (
            <Languages className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span>{currentLanguage === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</span>
          <ArrowRightLeft className="w-3 h-3 text-slate-500 ml-0.5" />
        </button>

        {/* Dropdown for other languages */}
        <button
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          className="px-1.5 py-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          title="Open Google Translate language switcher"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Language Selection Dropdown Menu */}
      {isOpenMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#090d16] border-2 border-purple-500/40 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 p-2 space-y-1 animate-fade-in backdrop-blur-md">
          <div className="px-2 py-1.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-purple-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              Google Translate Legal Suite
            </span>
            <span className="text-[9px] font-mono text-slate-500">Gemini 3.7</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors text-left ${
                  currentLanguage === lang.code
                    ? 'bg-purple-500/20 text-purple-200 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {currentLanguage === lang.code && (
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                )}
              </button>
            ))}
          </div>

          <div className="px-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Direct bilingual judicial mapping & client form localization.
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslateBar;
