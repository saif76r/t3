import React, { useState } from 'react';
import { ArrowLeft, Layers, CheckCircle2, AlertCircle, FileText, TrendingUp, Upload } from 'lucide-react';
import { toBengali } from './CreditScoreGauge';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onBack: () => void;
  onOpenAdvisorWithSoil: (soilType: string) => void;
}

export const SoilTestScreen: React.FC<Props> = ({ onBack, onOpenAdvisorWithSoil }) => {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [selectedSoil, setSelectedSoil] = useState<string>('দোআঁশ');
  const [activeTab, setActiveTab] = useState<'field-test' | 'lab-report'>('field-test');

  const soilTypes = [
    {
      id: 'দোআঁশ',
      name: isEn ? 'Loamy Soil' : 'দোআঁশ মাটি (Loamy)',
      desc: isEn
        ? 'Forms a soft, cohesive ball when moist and does not crack easily. Ideal for all major crops.'
        : 'ভেজা অবস্থায় নরম বল তৈরি হয় এবং সহজে ভেঙে যায় না। সকল ফসলের জন্য আদর্শ।',
      ph: isEn ? '6.5 - 7.2' : '৬.৫ - ৭.২',
      organic: isEn ? '2.2%' : '২.২%',
      suitable: isEn ? 'Rice, Wheat, Potato, Mustard, Maize' : 'ধান, গম, আলু, সরিষা, ভুট্টা',
      status: isEn ? 'Optimal' : 'সর্বোত্তম',
      statusType: 'optimal',
    },
    {
      id: 'বেলে-দোআঁশ',
      name: isEn ? 'Sandy Loam Soil' : 'বেলে-দোআঁশ মাটি (Sandy Loam)',
      desc: isEn
        ? 'Feels slightly gritty in hands, offers fast drainage and excellent root aeration.'
        : 'হাতে নিলে কিছুটা খসখসে লাগে, দ্রুত পানি নিষ্কাশন হয়।',
      ph: isEn ? '6.0 - 6.8' : '৬.০ - ৬.৮',
      organic: isEn ? '1.5%' : '১.৫%',
      suitable: isEn ? 'Potato, Groundnut, Watermelon, Wheat' : 'আলু, চিনাবাদাম, তরমুজ, গম',
      status: isEn ? 'Good' : 'ভালো',
      statusType: 'good',
    },
    {
      id: 'এঁটেল-দোআঁশ',
      name: isEn ? 'Clay Loam Soil' : 'এঁটেল-দোআঁশ মাটি (Clay Loam)',
      desc: isEn
        ? 'Dense, cohesive texture with high moisture and nutrient retention capacity.'
        : 'আঠালো ভাব থাকে এবং পানি ধরে রাখার ক্ষমতা অনেক বেশি।',
      ph: isEn ? '6.8 - 7.5' : '৬.৮ - ৭.৫',
      organic: isEn ? '2.5%' : '২.৫%',
      suitable: isEn ? 'Aman & Boro Rice, Jute' : 'আমন ও বোরো ধান, পাট',
      status: isEn ? 'Good' : 'ভালো',
      statusType: 'good',
    },
    {
      id: 'বেলে',
      name: isEn ? 'Sandy Soil' : 'বেলে মাটি (Sandy)',
      desc: isEn
        ? 'Cannot form a ball when pressed in palm, crumbles completely loose.'
        : 'হাতে চাপলে কোনো বল তৈরি হয় না, সম্পূর্ণ ঝুরঝুরে হয়ে পড়ে যায়।',
      ph: isEn ? '5.5 - 6.2' : '৫.৫ - ৬.২',
      organic: isEn ? '0.8%' : '০.৮%',
      suitable: isEn ? 'Groundnut, Sweet Potato, Watermelon' : 'চিনাবাদাম, মিষ্টি আলু, তরমুজ',
      status: isEn ? 'Needs Improvement' : 'উন্নতি প্রয়োজন',
      statusType: 'warn',
    },
  ];

  return (
    <div id="soil-test-screen" className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-soil-test-back"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-stone-900">{isEn ? 'Soil Testing' : 'মাটি পরীক্ষা'}</h1>
        <div className="w-9"></div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-200/70 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('field-test')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'field-test'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          {isEn ? 'Field Test' : 'মাঠ পর্যায়ের পরীক্ষা'}
        </button>
        <button
          onClick={() => setActiveTab('lab-report')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'lab-report'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          {isEn ? 'Lab Test Report' : 'ল্যাব টেস্ট রিপোর্ট'}
        </button>
      </div>

      {activeTab === 'field-test' && (
        <div className="space-y-4">
          {/* Squeeze test illustration card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-stone-900">
              {isEn ? 'Field Soil Testing Technique' : 'নমুনা মাটি পরীক্ষা পদ্ধতি'}
            </h2>
            <div className="h-36 rounded-xl overflow-hidden bg-stone-200 relative">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80"
                alt="Soil in hand"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs text-white font-semibold">
                  {isEn
                    ? 'Squeeze damp soil firmly in palm to observe cohesion and ball formation'
                    : 'মাটি ভেজা অবস্থায় হাতের মুঠোয় চেপে বল তৈরি করার চেষ্টা করুন'}
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {isEn
                ? 'Collect soil samples from 4-5 spots in your plot at 6-9 inches depth, blend evenly, add a small amount of moisture, and form a ball to identify your soil texture class.'
                : 'আপনার জমির ৪-৫টি স্থান থেকে ৬-৯ ইঞ্চি গভীরতার মাটি সংগ্রহ করে মিশিয়ে নিন। সামান্য পানি দিয়ে গোল বল তৈরি করে মাটির প্রকার নিশ্চিত করুন।'}
            </p>
          </div>

          {/* Soil types list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-stone-900">
              {isEn ? 'Select & Match Your Soil Texture' : 'আপনার মাটির ধরনের সাথে মেলান'}
            </h3>
            {soilTypes.map((item) => {
              const isSelected = selectedSoil === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSoil(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-stone-900">{item.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.statusType === 'optimal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.statusType === 'good'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mb-2 leading-relaxed">{item.desc}</p>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                    <span>{isEn ? 'Suitable crops: ' : 'উপযুক্ত: '}{item.suitable}</span>
                    <span className="font-semibold text-stone-700">pH: {item.ph}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onOpenAdvisorWithSoil(selectedSoil)}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isEn ? 'Calculate Yield Growth with this Soil Profile' : 'এই মাটির তথ্য দিয়ে ফলন বৃদ্ধি হিসাব করুন'}</span>
          </button>
        </div>
      )}

      {activeTab === 'lab-report' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {isEn ? 'SRDI Soil Lab Analysis Sample' : 'SRDI ল্যাব রিপোর্ট স্যাম্পল'}
                </h3>
                <span className="text-[11px] text-stone-500">
                  {isEn ? 'Soil Resource Development Institute (SRDI)' : 'মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট'}
                </span>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                {isEn ? 'Verified' : 'যাচাইকৃত'}
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: isEn ? 'Soil pH Level' : 'মাটির pH মাত্রা',
                  value: isEn ? '6.8' : '৬.৮',
                  status: isEn ? 'Optimal' : 'আদর্শ মান',
                  color: 'text-emerald-700',
                },
                {
                  name: isEn ? 'Organic Matter' : 'জৈব পদার্থ (Organic Matter)',
                  value: isEn ? '2.1%' : '২.১%',
                  status: isEn ? 'Satisfactory' : 'সন্তোষজনক',
                  color: 'text-emerald-700',
                },
                {
                  name: isEn ? 'Nitrogen (N)' : 'নাইট্রোজেন (N)',
                  value: isEn ? '0.15%' : '০.১৫%',
                  status: isEn ? 'Moderate Deficit' : 'মাঝারি ঘাটতি',
                  color: 'text-amber-700',
                },
                {
                  name: isEn ? 'Phosphorus (P)' : 'ফসফরাস (P)',
                  value: isEn ? '18 ppm' : '১৮ ppm',
                  status: isEn ? 'Adequate' : 'পর্যাপ্ত',
                  color: 'text-emerald-700',
                },
                {
                  name: isEn ? 'Potassium (K)' : 'পটাশিয়াম (K)',
                  value: isEn ? '0.28 meq/100g' : '০.২৮ meq/100g',
                  status: isEn ? 'High' : 'উচ্চ',
                  color: 'text-emerald-700',
                },
                {
                  name: isEn ? 'Sulphur (S)' : 'সালফার (S)',
                  value: isEn ? '12 ppm' : '১২ ppm',
                  status: isEn ? 'Normal' : 'স্বাভাবিক',
                  color: 'text-emerald-700',
                },
                {
                  name: isEn ? 'Zinc (Zn)' : 'দস্তা (Zinc)',
                  value: isEn ? '1.2 ppm' : '১.২ ppm',
                  status: isEn ? 'Slight Deficit' : 'সামান্য ঘাটতি',
                  color: 'text-amber-700',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-stone-50 rounded-lg">
                  <span className="font-semibold text-stone-800">{item.name}</span>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">{item.value}</span>
                    <span className={`text-[10px] font-bold ${item.color}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-950 block mb-1">
                {isEn ? 'Laboratory Advisory & Recommendation:' : 'ল্যাব সুপারিশ:'}
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {isEn
                  ? 'To remedy slight Nitrogen and Zinc deficits, apply 20g Zinc Sulphate per decimal along with split Urea and 5-6 tons decomposed farmyard compost per acre.'
                  : 'নাইট্রোজেন ও দস্তার সামান্য ঘাটতি পূরণে ইউরিয়ার সাথে প্রতি শতকে ২০ গ্রাম জিংক সালফেট এবং পর্যাপ্ত পচা গোবর প্রয়োগ করুন।'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

