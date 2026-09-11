import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Check,
  Sparkles,
  Phone,
  Layers,
} from 'lucide-react';
import { ScreenTab } from './BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageToggle } from './LanguageToggle';
import { AuthUserData } from './AuthScreens';

interface Props {
  onNavigate: (tab: ScreenTab) => void;
  onLogout?: () => void;
  user?: AuthUserData | null;
}

export const HubScreen: React.FC<Props> = ({ onNavigate, onLogout, user }) => {
  const { language, t } = useLanguage();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  // Tab state within Hub: 'services' | 'settings'
  const [hubTab, setHubTab] = useState<'services' | 'settings'>('services');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const hubItems = [
    {
      id: 'chatbot',
      title: language === 'en' ? 'AI Krishi Friend (Chat)' : 'AI কৃষি বন্ধু (চ্যাটবট)',
      desc: language === 'en' ? 'Chat directly with Agri AI Specialist' : 'কৃষি এআই বিশেষজ্ঞের সাথে সরাসরি কথা বলুন',
      tab: 'chatbot' as ScreenTab,
      imgSrc: '/sec/bot.png',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      id: 'disease',
      title: language === 'en' ? 'Disease Identification' : 'রোগ শনাক্ত করণ',
      desc: language === 'en' ? 'Diagnose crop diseases with camera scan' : 'ক্যামেরা স্ক্যানে ফসলের রোগ নির্ণয়',
      tab: 'disease' as ScreenTab,
      imgSrc: '/sec/disease.png',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      id: 'crop-info',
      title: language === 'en' ? 'Crop Library' : 'ফসল তথ্য',
      desc: language === 'en' ? 'Paddy, wheat, maize, potato encyclopaedia' : 'ধান, গম, ভুট্টা, আলু ইত্যাদির তথ্যভাণ্ডার',
      tab: 'crop-info' as ScreenTab,
      imgSrc: '/sec/crop.png',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      id: 'weather',
      title: language === 'en' ? 'Weather Forecast' : 'আবহাওয়া',
      desc: language === 'en' ? '7-day forecast & agricultural advisories' : '৭ দিনের পূর্বাভাস ও কৃষি সতর্কতা',
      tab: 'weather' as ScreenTab,
      imgSrc: '/sec/weather.png',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
    },
    {
      id: 'soil-test',
      title: language === 'en' ? 'Soil Health Testing' : 'মাটি পরীক্ষা',
      desc: language === 'en' ? 'Soil sampling & nutrient verification' : 'নমুনা পরীক্ষা ও মাটির ধরন যাচাই',
      tab: 'soil-test' as ScreenTab,
      imgSrc: '/sec/soil.png',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      id: 'inputs',
      title: language === 'en' ? 'Farm Inputs & Ledger' : 'ইনপুট ব্যবস্থাপনা',
      desc: language === 'en' ? 'Seed, fertilizer, pesticide expense log' : 'বীজ, সার, কীটনাশক স্টক ও হিসাব',
      tab: 'inputs' as ScreenTab,
      imgSrc: '/sec/inputs.png',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      id: 'advisor-wizard',
      title: language === 'en' ? 'Yield Maximizer' : 'উৎপাদন বৃদ্ধি',
      desc: language === 'en' ? 'AI yield projection & profitable plans' : 'AI ফলন পূর্বাভাস ও লাভজনক মডেল',
      tab: 'advisor-wizard' as ScreenTab,
      imgSrc: '/sec/yield.png',
      bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    },
    {
      id: 'market',
      title: language === 'en' ? 'Market Rates' : 'বাজারদর',
      desc: language === 'en' ? 'Nationwide wholesale and retail rates' : 'সারা দেশের পাইকারি ও খুচরা মূল্য',
      tab: 'market' as ScreenTab,
      imgSrc: '/sec/market.png',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      id: 'notifications',
      title: language === 'en' ? 'Alerts & Messages' : 'নোটিফিকেশন',
      desc: language === 'en' ? 'Emergency weather & crop alerts' : 'জরুরি আবহাওয়া ও কৃষি পরামর্শ বার্তা',
      tab: 'notifications' as ScreenTab,
      imgSrc: '/sec/img.png',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
    },
  ];

  return (
    <div id="hub-screen" className="space-y-4 pb-8 transition-colors">
      {/* Top Header with Segmented Navigation (Services vs Settings) */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {language === 'en' ? 'Hub' : 'হাব'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {hubTab === 'services'
              ? (language === 'en' ? 'All Agricultural Services' : 'সকল সেবা সমূহ')
              : (language === 'en' ? 'App Settings & Preferences' : 'সেটিংস ও পছন্দসমূহ')}
          </p>
        </div>

        {/* Segmented Switcher */}
        <div className="inline-flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-full border border-stone-200 dark:border-stone-700 shadow-2xs">
          <button
            type="button"
            id="hub-tab-services-btn"
            onClick={() => setHubTab('services')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              hubTab === 'services'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Services' : 'সেবা'}</span>
          </button>
          <button
            type="button"
            id="hub-tab-settings-btn"
            onClick={() => setHubTab('settings')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              hubTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Settings' : 'সেটিংস'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SERVICES GRID */}
      {hubTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {hubItems.map((item) => (
              <button
                key={item.id}
                id={`hub-card-${item.id}`}
                onClick={() => onNavigate(item.tab)}
                className="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] shadow-xs hover:shadow bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-700 border border-stone-100 dark:border-stone-600 p-1.5 flex items-center justify-center mb-3 shadow-xs overflow-hidden">
                  <img src={item.imgSrc} alt={item.title} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}

            {/* 10th Card: Direct Settings Shortcut */}
            <button
              id="hub-card-settings"
              onClick={() => setHubTab('settings')}
              className="p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] shadow-xs hover:shadow bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-850 border-stone-200 dark:border-stone-700 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 p-1.5 flex items-center justify-center mb-3 shadow-xs text-emerald-700 dark:text-emerald-400">
                <Settings className="w-8 h-8 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
                  {language === 'en' ? 'App Settings' : 'অ্যাপ সেটিংস'}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {language === 'en'
                    ? 'Language, Dark Mode, & Sign Out'
                    : 'ভাষা, ডার্ক/লাইট মোড ও সাইন আউট'}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: SETTINGS PANEL */}
      {hubTab === 'settings' && (
        <div id="hub-settings-panel" className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Back to Services Button */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setHubTab('services')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Back to Services' : 'সকল সেবায় ফিরে যান'}</span>
            </button>
          </div>

          {/* Setting 1: Language Switcher (Matching User Image) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {language === 'en' ? 'Language Selection' : 'ভাষা পরিবর্তন (Language)'}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {language === 'en'
                      ? 'Toggle between Bengali and English'
                      : 'বাংলা অথবা ইংরেজি ভাষা নির্বাচন করুন'}
                  </p>
                </div>
              </div>

              {/* Exact Language Toggle Pill from User's uploaded screenshot */}
              <div className="flex-shrink-0">
                <LanguageToggle size="md" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-700/60 text-[11px] text-stone-600 dark:text-stone-400">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {language === 'en' ? 'Active:' : 'বর্তমান ভাষা:'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-[10px]">
                {language === 'en' ? 'English (ইংরেজী)' : 'বাংলা (Bengali)'}
              </span>
            </div>
          </div>

          {/* Setting 2: Dark / Light Mode Toggle */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {language === 'en' ? 'Display Theme' : 'থিম মোড (ডার্ক / লাইট)'}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {isDark
                      ? (language === 'en' ? 'Dark mode enabled (Comfortable for eyes)' : 'ডার্ক মোড সক্রিয় (চোখের জন্য আরামদায়ক)')
                      : (language === 'en' ? 'Light mode enabled (Clear & bright)' : 'লাইট মোড সক্রিয় (উজ্জ্বল ও স্পষ্ট)')}
                  </p>
                </div>
              </div>

              {/* Theme Toggle Pill */}
              <div className="inline-flex items-center bg-stone-100 dark:bg-stone-700/80 p-1 rounded-full border border-stone-200 dark:border-stone-600 flex-shrink-0">
                <button
                  type="button"
                  id="btn-theme-light"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    !isDark
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100'
                  }`}
                  title={language === 'en' ? 'Switch to Light Mode' : 'লাইট মোড নির্বাচন করুন'}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Light' : 'লাইট'}</span>
                </button>

                <button
                  type="button"
                  id="btn-theme-dark"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-stone-900 text-amber-300 shadow-xs border border-stone-800'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title={language === 'en' ? 'Switch to Dark Mode' : 'ডার্ক মোড নির্বাচন করুন'}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Dark' : 'ডার্ক'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-700/60 text-[11px] text-stone-500 dark:text-stone-400">
              <span>
                {isDark 
                  ? (language === 'en' ? '🌙 Night mode protects your vision in low light' : '🌙 রাতের আঁধারে চোখ সুরক্ষিত রাখতে ডার্ক মোড উপযুক্ত')
                  : (language === 'en' ? '☀️ Daytime mode provides high contrast readability' : '☀️ দিনের আলোতে মাঠে কাজ করার সময় স্পষ্ট দৃশ্যমানতা')}
              </span>
            </div>
          </div>

          {/* Setting 3: Farmer Account Profile & Sign Out */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center overflow-hidden border-2 border-emerald-300 dark:border-emerald-600 shadow-xs">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user?.name || 'ক')[0]}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {user?.name || (language === 'en' ? 'Farmer Friend' : 'কৃষক বন্ধু')}
                    </h4>
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center" title="Verified">
                      <ShieldCheck className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{user?.phone || '০১৭XXXXXXXX'}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                      📍 {user?.district || (language === 'en' ? 'Bangladesh' : 'বাংলাদেশ')}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      {user?.farmSize ? `${user.farmSize} ${language === 'en' ? 'Dec' : 'শতক'}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out Action Button */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-700/60">
              <button
                type="button"
                id="btn-hub-signout"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'en' ? 'Sign Out from Account' : 'একাউন্ট থেকে সাইন আউট করুন'}</span>
              </button>
            </div>
          </div>

          {/* Setting 4: App Information & Emergency Hotline */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-700/60 text-center space-y-1">
            <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {language === 'en' ? 'Krishi Guide Bangladesh' : 'কৃষি গাইড বাংলাদেশ'}
            </p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">
              {language === 'en' 
                ? 'Version 2.4.0 • DAE & AI Powered Precision Farming' 
                : 'ভার্সন ২.৪.০ • কৃষি সম্প্রসারণ অধিদপ্তর ও এআই সমর্থিত'}
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
              📞 {language === 'en' ? 'Agri Call Center: 16123 (Free)' : 'কৃষি কল সেন্টার: ১৬১২৩ (টোল ফ্রি)'}
            </p>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/50">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {language === 'en' ? 'Confirm Sign Out' : 'সাইন আউট নিশ্চিতকরণ'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {language === 'en'
                  ? 'Are you sure you want to sign out from your Krishi Guide account? You can log back in anytime with your password.'
                  : 'আপনি কি নিশ্চিতভাবে আপনার একাউন্ট থেকে সাইন আউট করতে চান? পরবর্তীতে মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে যেকোনো সময় লগইন করতে পারবেন।'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>

              <button
                type="button"
                id="btn-confirm-signout"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                {language === 'en' ? 'Yes, Sign Out' : 'হ্যাঁ, সাইন আউট'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
