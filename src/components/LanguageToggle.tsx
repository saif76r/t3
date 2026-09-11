import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface Props {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const LanguageToggle: React.FC<Props> = ({ className = '', showLabel = false, size = 'sm' }) => {
  const { language, setLanguage } = useLanguage();

  const isMd = size === 'md';

  return (
    <div
      id="language-selector-control"
      className={`inline-flex items-center bg-stone-100/90 dark:bg-stone-800 hover:bg-stone-200/90 dark:hover:bg-stone-750 border border-stone-300/80 dark:border-stone-700 rounded-full ${
        isMd ? 'p-1' : 'p-0.5'
      } transition-all shadow-2xs ${className}`}
      title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
    >
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`${
          isMd ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
        } rounded-full font-bold transition-all cursor-pointer ${
          language === 'bn'
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
        }`}
      >
        বাং
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`${
          isMd ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
        } rounded-full font-bold transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
        }`}
      >
        EN
      </button>
      {showLabel && (
        <span className="text-[10px] text-stone-500 dark:text-stone-400 pr-1.5 flex items-center gap-1 font-medium">
          <Globe className="w-3 h-3 text-stone-400 dark:text-stone-500" />
          {language === 'bn' ? 'বাংলা' : 'English'}
        </span>
      )}
    </div>
  );
};

