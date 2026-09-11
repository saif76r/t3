import React, { useState } from 'react';
import { ArrowLeft, CloudRain, Droplets, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { INITIAL_NOTIFICATIONS } from '../data';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onBack: () => void;
  onSelectAction: (type: string) => void;
}

export const NotificationsScreen: React.FC<Props> = ({ onBack, onSelectAction }) => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const { language } = useLanguage();

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudRain className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'task':
        return <Droplets className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'market':
        return <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div id="notifications-screen" className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-notif-back"
          onClick={onBack}
          title={language === 'en' ? 'Back' : 'ফিরে যান'}
          className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {language === 'en' ? 'Notifications' : 'নোটিফিকেশন'}
        </h1>
        <button
          onClick={markAllAsRead}
          className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
        >
          {language === 'en' ? 'Mark all as read' : 'পড়া হয়েছে'}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-800">
            <p className="text-sm font-medium">
              {language === 'en' ? 'No notifications at this time' : 'এই মুহূর্তে কোনো নোটিফিকেশন নেই'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onSelectAction(notif.type)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 shadow-xs ${
                notif.unread
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 ring-1 ring-emerald-200 dark:ring-emerald-800/40'
                  : 'bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-600'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-relaxed">
                  {language === 'en' ? (notif.textEn || notif.text) : notif.text}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                  <span>{language === 'en' ? 'Today' : 'আজ'}</span>
                  {notif.unread && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {language === 'en' ? 'New' : 'নতুন'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
