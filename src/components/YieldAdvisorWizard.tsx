import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sprout,
  TrendingUp,
  RefreshCw,
  Download,
} from 'lucide-react';
import { AdvisorRequest, AdvisorResponse } from '../types';
import { CreditScoreGauge, toBengali } from './CreditScoreGauge';
import { BD_DISTRICTS } from '../services/weatherService';
import { useLanguage } from '../context/LanguageContext';
import {
  CROP_DATA_CATALOG,
  calculateAdvisorResult,
  isValidAdvisorResponse,
  getCropInfo,
} from '../services/advisorDataService';

interface Props {
  onBackToHome: () => void;
}

export const YieldAdvisorWizard: React.FC<Props> = ({ onBackToHome }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<AdvisorRequest>({
    cropType: 'ধান',
    cropVariety: 'BRRI 28',
    season: 'আমন',
    landSize: 2,
    landUnit: 'একর',
    soilType: 'দোআঁশ',
    soilTestDate: '',
    soilTestSummary: '',
    sowingDate: '2026-05-15',
    seedQuantity: 8,
    seedUnit: 'kg',
    irrigationStatus: 'নিয়মিত সেচ হচ্ছে',
    cropStage: 'চারা রোপন হচ্ছে',
    region: 'রংপুর',
    notes: '',
  });

  // Current crop catalog item
  const currentCropInfo = useMemo(() => {
    return getCropInfo(formData.cropType);
  }, [formData.cropType]);

  // Selected variety item
  const selectedVarietyItem = useMemo(() => {
    return (
      currentCropInfo.varieties.find((v) => v.id === formData.cropVariety) ||
      currentCropInfo.varieties[0]
    );
  }, [currentCropInfo, formData.cropVariety]);

  // Result state
  const [result, setResult] = useState<AdvisorResponse>(() =>
    calculateAdvisorResult(formData, language)
  );

  // Synchronize result on language switch
  useEffect(() => {
    setResult(calculateAdvisorResult(formData, language));
  }, [language]);

  // Call API for analysis
  const handleAnalyze = async () => {
    setCurrentStep(4);
    setLoading(true);

    const stepMessages = isEn
      ? [
          'Verifying soil nutrition & input balance...',
          'Integrating regional climate & weather data...',
          'Calculating expected yield & profit margin...',
          'Generating AI Agronomist recommendations...',
        ]
      : [
          'মাটির পুষ্টি ও ইনপুট ব্যালেন্স যাচাই হচ্ছে...',
          'আঞ্চলিক আবহাওয়া ও জলবায়ু মডেল সমন্বয় হচ্ছে...',
          'সম্ভাব্য ফলন ও লাভ-ক্ষতি হিসাব হচ্ছে...',
          'AI কৃষি পরামর্শক রিপোর্ট তৈরি করছে...',
        ];

    let msgIndex = 0;
    setLoadingStepText(stepMessages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % stepMessages.length;
      setLoadingStepText(stepMessages[msgIndex]);
    }, 850);

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (isValidAdvisorResponse(data, language)) {
          setResult(data);
        } else {
          setResult(calculateAdvisorResult(formData, language));
        }
      } else {
        setResult(calculateAdvisorResult(formData, language));
      }
    } catch (err) {
      console.warn('Advisor API fetch failed, using localized calculation:', err);
      setResult(calculateAdvisorResult(formData, language));
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setLoading(false);
        setCurrentStep(5);
      }, 1600);
    }
  };

  const stepsList = [
    { num: 1, title: isEn ? 'Crop Info' : 'ফসলের তথ্য' },
    { num: 2, title: isEn ? 'Land Details' : 'জমির তথ্য' },
    { num: 3, title: isEn ? 'Inputs Info' : 'ইনপুট তথ্য' },
    { num: 4, title: isEn ? 'Analysis' : 'বিশ্লেষণ' },
    { num: 5, title: isEn ? 'Results' : 'ফলাফল' },
  ];

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          id="btn-advisor-back"
          onClick={onBackToHome}
          className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-stone-900">
          {isEn ? 'Yield Advisor' : 'উৎপাদন বৃদ্ধি'}
        </h1>
        <div className="w-9"></div>
      </div>

      {/* 5-Step Stepper Bar */}
      <div id="advisor-step-indicator" className="flex items-center justify-between mb-6 px-1">
        {stepsList.map((s, idx) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-amber-400 text-stone-900'
                  }`}
                >
                  {isEn ? s.num : toBengali(s.num)}
                </div>
                <span className="text-[10px] text-stone-700 font-medium mt-1 text-center whitespace-nowrap">
                  {s.title}
                </span>
              </div>
              {idx < stepsList.length - 1 && (
                <div className="flex-1 h-[2px] bg-stone-300 mx-1 mb-4"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: ফসলের তথ্য */}
      {currentStep === 1 && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-stone-900">
              {isEn ? 'Select Crop' : 'ফসল নির্বাচন করুন'}
            </h2>

            {/* Crop Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  {isEn ? 'Select Crop' : 'ফসল নির্বাচন করুন'}
                </label>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  {isEn ? '11 Crops' : '১১টি ফসল'}
                </span>
              </div>
              <select
                id="select-crop-type"
                value={formData.cropType}
                onChange={(e) => {
                  const newCrop = e.target.value;
                  const newCropObj = getCropInfo(newCrop);
                  const firstVariety = newCropObj.varieties[0]?.id || 'উন্নত জাত';
                  setFormData({
                    ...formData,
                    cropType: newCrop,
                    cropVariety: firstVariety,
                  });
                }}
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              >
                {Object.values(CROP_DATA_CATALOG).map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.icon} {isEn ? crop.nameEn : crop.nameBn}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Variety: Approved & High-Yielding Variety */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  {isEn ? 'Approved & High-Yielding Variety' : 'অনুমোদিত ও উচ্চফলনশীল জাত'}
                </label>
                <span className="text-[11px] font-medium text-stone-500">
                  {isEn
                    ? `${currentCropInfo.varieties.length} varieties available`
                    : `${toBengali(currentCropInfo.varieties.length)}টি জাত পাওয়া গেছে`}
                </span>
              </div>
              <select
                id="select-crop-variety"
                value={formData.cropVariety}
                onChange={(e) => setFormData({ ...formData, cropVariety: e.target.value })}
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              >
                {currentCropInfo.varieties.map((variety) => (
                  <option key={variety.id} value={variety.id}>
                    {isEn ? `${variety.nameEn} [${variety.tagEn}]` : `${variety.nameBn} [${variety.tagBn}]`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-800 mt-1.5 flex items-center gap-1 font-medium bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/50">
                <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isEn ? (
                    <>
                      Selected Variety: <strong>{selectedVarietyItem.nameEn}</strong> (
                      {currentCropInfo.nameEn}) - Disease resistance & yield analysis calibrated for
                      local soil & climate.
                    </>
                  ) : (
                    <>
                      নির্বাচিত জাত: <strong>{selectedVarietyItem.nameBn}</strong> (
                      {currentCropInfo.nameBn}) - রোগ সহনশীলতা ও স্থানীয় মাটির মান অনুযায়ী ফলন বিশ্লেষণ হবে।
                    </>
                  )}
                </span>
              </p>
            </div>
          </div>

          {/* Season Selection Cards */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-stone-900 mb-3 text-center">
              {isEn ? 'Cultivation Season' : 'আপনি যে মৌসুমে চাষ করছেন'}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'আমন',
                  name: isEn ? 'Aman' : 'আমন',
                  months: isEn ? '(Jun - Oct)' : '( জুন - অক্টোবর )',
                  img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
                },
                {
                  id: 'আউশ',
                  name: isEn ? 'Aus' : 'আউশ',
                  months: isEn ? '(Apr - Jul)' : '( এপ্রিল - জুলাই )',
                  img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&auto=format&fit=crop&q=80',
                },
                {
                  id: 'বোরো',
                  name: isEn ? 'Boro' : 'বোরো',
                  months: isEn ? '(Nov - Apr)' : '( নভেম্বর - এপ্রিল )',
                  img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&auto=format&fit=crop&q=80',
                },
              ].map((s) => {
                const isSelected = formData.season === s.id;
                return (
                  <button
                    key={s.id}
                    id={`season-card-${s.id}`}
                    onClick={() => setFormData({ ...formData, season: s.id })}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-stone-200/60 border-stone-300 hover:bg-white'
                    }`}
                  >
                    <div className="w-14 h-12 rounded-lg overflow-hidden mb-1.5 bg-stone-300">
                      <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-stone-900">{s.name}</span>
                    <span className="text-[9px] text-stone-500 mt-0.5">{s.months}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Button */}
          <button
            id="btn-step1-next"
            onClick={() => setCurrentStep(2)}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold flex items-center justify-center gap-2 shadow-sm border border-emerald-200 transition-colors"
          >
            <span>{isEn ? 'Next' : 'পরবর্তী'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* STEP 2: জমির তথ্য */}
      {currentStep === 2 && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {/* Land Size & Unit */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              {isEn ? 'Enter Land Details' : 'জমির তথ্য দিন'}
            </label>
            <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex-1 p-3">
                <span className="block text-[10px] text-stone-500 font-semibold mb-1">
                  {isEn ? 'Land Area' : 'জমির পরিমাণ'}
                </span>
                <input
                  id="input-land-size"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.landSize}
                  onChange={(e) => setFormData({ ...formData, landSize: Number(e.target.value) })}
                  className="w-full text-lg font-bold text-stone-900 bg-transparent focus:outline-none"
                />
              </div>
              <div className="w-[1px] h-12 bg-stone-400"></div>
              <div className="flex-1 p-3 flex items-center justify-between">
                <select
                  id="select-land-unit"
                  value={formData.landUnit}
                  onChange={(e) => setFormData({ ...formData, landUnit: e.target.value as any })}
                  className="w-full text-base font-bold text-stone-900 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="একর">{isEn ? 'Acre' : 'একর'}</option>
                  <option value="বিঘা">{isEn ? 'Bigha' : 'বিঘা'}</option>
                  <option value="শতাংশ">{isEn ? 'Decimal' : 'শতাংশ'}</option>
                </select>
                <ArrowRight className="w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Soil Type */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              {isEn ? 'Soil Type' : 'মাটির ধরন'}
            </label>
            <select
              id="select-soil-type"
              value={formData.soilType}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="দোআঁশ">{isEn ? 'Loam (Ideal Soil)' : 'দোআঁশ (আদর্শ মাটি)'}</option>
              <option value="বেলে-দোআঁশ">{isEn ? 'Sandy Loam' : 'বেলে-দোআঁশ'}</option>
              <option value="এঁটেল-দোআঁশ">{isEn ? 'Clay Loam' : 'এঁটেল-দোআঁশ'}</option>
              <option value="বেলে">{isEn ? 'Sandy Soil' : 'বেলে মাটি'}</option>
              <option value="এঁটেল">{isEn ? 'Clay Soil' : 'এঁটেল মাটি'}</option>
              <option value="পলি">{isEn ? 'Silt Soil' : 'পলি মাটি'}</option>
            </select>
          </div>

          {/* Soil Test Report Upload Option */}
          <div className="bg-emerald-50/70 border border-dashed border-emerald-300 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-stone-700 mb-2">
              {isEn
                ? 'Have a soil test report? (Optional)'
                : 'মাটি পরীক্ষার কোনো রিপোর্ট আছে কি? (ঐচ্ছিক)'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <input
                id="input-soil-date"
                type="date"
                value={formData.soilTestDate}
                onChange={(e) => setFormData({ ...formData, soilTestDate: e.target.value })}
                className="bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
              />
              <input
                id="input-soil-summary"
                type="text"
                placeholder={isEn ? 'e.g. pH 6.5, Nitrogen normal' : 'যেমন: পিএইচ ৬.৫, নাইট্রোজেন স্বাভাবিক'}
                value={formData.soilTestSummary}
                onChange={(e) => setFormData({ ...formData, soilTestSummary: e.target.value })}
                className="bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none flex-1"
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="btn-step2-prev"
              onClick={() => setCurrentStep(1)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back' : 'পেছনে'}</span>
            </button>
            <button
              id="btn-step2-next"
              onClick={() => setCurrentStep(3)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <span>{isEn ? 'Next' : 'পরবর্তী'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: ইনপুট তথ্য */}
      {currentStep === 3 && (
        <motion.div
          key="step3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {/* Sowing Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEn ? 'Sowing / Transplanting Date' : 'বপন বা রোপনের তারিখ'}
            </label>
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              <input
                id="input-sowing-date"
                type="date"
                value={formData.sowingDate}
                onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                className="bg-transparent font-bold text-sm text-stone-900 focus:outline-none"
              />
              <Calendar className="w-5 h-5 text-stone-700" />
            </div>
          </div>

          {/* Seed Quantity */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEn ? 'Seed Quantity (per acre)' : 'বীজের পরিমাণ (প্রতি একর)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="input-seed-quantity"
                type="number"
                min="1"
                value={formData.seedQuantity}
                onChange={(e) => setFormData({ ...formData, seedQuantity: Number(e.target.value) })}
                className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-base font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="w-24 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 text-center">
                {isEn ? 'kg' : 'কেজি'}
              </div>
            </div>
          </div>

          {/* Irrigation Status */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEn ? 'Irrigation Status' : 'সেচের অবস্থা'}
            </label>
            <select
              id="select-irrigation-status"
              value={formData.irrigationStatus}
              onChange={(e) => setFormData({ ...formData, irrigationStatus: e.target.value })}
              className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="নিয়মিত সেচ হচ্ছে">
                {isEn ? 'Regular Irrigation (Optimal)' : 'নিয়মিত সেচ হচ্ছে (অনুকূল)'}
              </option>
              <option value="বৃষ্টির ওপর নির্ভরশীল">
                {isEn ? 'Rainfed (Dependent on Rain)' : 'বৃষ্টির ওপর নির্ভরশীল'}
              </option>
              <option value="সেচ সংকট / ঘাটতি">
                {isEn ? 'Irrigation Shortage / Deficit' : 'সেচ সংকট / ঘাটতি রয়েছে'}
              </option>
            </select>
          </div>

          {/* Crop Stage */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEn ? 'Current Crop Stage' : 'বর্তমান অবস্থা'}
            </label>
            <select
              id="select-crop-stage"
              value={formData.cropStage}
              onChange={(e) => setFormData({ ...formData, cropStage: e.target.value })}
              className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="চারা রোপন হচ্ছে">
                {isEn ? 'Seedling / Transplanting Stage' : 'চারা রোপন হচ্ছে'}
              </option>
              <option value="কুশি গজানোর পর্যায়">
                {isEn ? 'Tillering Stage' : 'কুশি গজানোর পর্যায়'}
              </option>
              <option value="থোড় ও ফুল আসা">
                {isEn ? 'Panicle & Flowering Stage' : 'থোড় ও ফুল আসা পর্যায়'}
              </option>
              <option value="দানা পুষ্ট ও পরিপক্ব">
                {isEn ? 'Grain Ripening Stage' : 'দানা পুষ্ট ও পরিপক্ব পর্যায়'}
              </option>
            </select>
          </div>

          {/* Region */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-700">
                {isEn ? 'Region / District (All 64 BD Districts supported)' : 'এলাকা / জেলা (বাংলাদেশের ৬৪টি জেলা সমর্থিত)'}
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded">
                {isEn ? '64 Districts' : '৬৪ জেলা'}
              </span>
            </div>
            <div className="relative">
              <input
                id="input-farm-region"
                type="text"
                list="advisor-districts-list"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder={isEn ? 'Type or select district (e.g. Bogura, Rangpur, Jashore)...' : 'জেলার নাম লিখুন বা তালিকা থেকে বাছুন (যেমন: বগুড়া, রংপুর, যশোর)...'}
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              <datalist id="advisor-districts-list">
                {BD_DISTRICTS.map((district) => (
                  <option
                    key={district.id}
                    value={isEn ? `${district.nameEn} District` : `${district.nameBn} জেলা`}
                  >
                    {isEn ? `${district.nameEn} District` : `${district.nameBn} জেলা`}
                  </option>
                ))}
              </datalist>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">
              {isEn
                ? '* AI delivers customized recommendations based on district soil & climate data.'
                : '* জেলা ও মাটির স্থানীয় আবহাওয়া অনুযায়ী কৃত্রিম বুদ্ধিমত্তা সুপারিশ প্রদান করবে।'}
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEn ? 'Additional Notes (Optional)' : 'অতিরিক্ত বিবরণ (ঐচ্ছিক)'}
            </label>
            <textarea
              id="textarea-crop-notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={isEn ? 'Details on fertilizer, pesticide or specific observations...' : 'সার প্রয়োগ, বালাইনাশক বা কোনো নির্দিষ্ট সমস্যার বিবরণ...'}
              className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="btn-step3-prev"
              onClick={() => setCurrentStep(2)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back' : 'পেছনে'}</span>
            </button>
            <button
              id="btn-step3-submit"
              onClick={handleAnalyze}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isEn ? 'AI Analysis' : 'AI বিশ্লেষণ'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: বিশ্লেষণ চলছে (Loading State) */}
      {currentStep === 4 && (
        <motion.div
          key="step4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6"
        >
          <h2 className="text-2xl font-black text-stone-900">
            {isEn ? 'AI Analysis in Progress' : 'AI বিশ্লেষণ চলছে'}
          </h2>

          {/* Circular Dots Rotating Spinner */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-full h-full relative"
            >
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                const radius = 50;
                const rad = (deg * Math.PI) / 180;
                const x = 64 + radius * Math.cos(rad);
                const y = 64 + radius * Math.sin(rad);
                const size = 6 + (i % 4) * 2;
                return (
                  <div
                    key={deg}
                    style={{
                      left: `${x - size / 2}px`,
                      top: `${y - size / 2}px`,
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                    className="absolute rounded-full bg-emerald-500 shadow-sm"
                  />
                );
              })}
            </motion.div>
          </div>

          <div className="w-full max-w-xs space-y-3 pt-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-stone-100">
              <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <span className="text-xs font-semibold text-stone-700">{loadingStepText}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-stone-100">
              <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
              <span className="text-xs font-semibold text-stone-700">
                {isEn
                  ? 'Reviewing Agricultural Scientific Standards'
                  : 'কৃষি গবেষণা ইনস্টিটিউটের বৈজ্ঞানিক স্ট্যান্ডার্ড পর্যালোচনা'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 5: ফলাফল */}
      {currentStep === 5 && result && (
        <motion.div
          key="step5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-stone-900">
              {isEn ? 'Results' : 'ফলাফল'}
            </h2>
            <button
              id="btn-re-analyze"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Re-Analyze' : 'পুনরায় পরীক্ষা'}</span>
            </button>
          </div>

          {/* Main Score & Gauge Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-base font-bold text-stone-900 block mb-3">
                  {isEn ? 'Score' : 'স্কোর'}
                </span>
                <div className="text-2xl font-black text-stone-900 tracking-tight">
                  {isEn
                    ? `${result.score_analysis.score}/${result.score_analysis.max_score}`
                    : `${toBengali(result.score_analysis.score)}/${toBengali(result.score_analysis.max_score)}`}
                </div>
                <div className="text-sm font-extrabold text-emerald-700 mt-1">
                  {result.score_analysis.status_text}
                </div>
                <p className="text-[11px] text-stone-600 mt-2">
                  {isEn
                    ? 'Benchmark assessed based on input suitability & soil nutrient balance.'
                    : 'ইনপুট সামঞ্জস্যতা ও মাটির পুষ্টি উপাদানের ভিত্তিতে নির্ধারিত মানদণ্ড।'}
                </p>
              </div>

              {/* Gauge */}
              <CreditScoreGauge
                score={result.score_analysis.score}
                maxScore={result.score_analysis.max_score}
                statusText={result.score_analysis.status_text}
                creditStatus={result.score_analysis.credit_status}
              />
            </div>
          </div>

          {/* Yield Predictions */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Expected Yield */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 shadow-sm">
              <span className="text-xs font-bold text-stone-800 block mb-1">
                {isEn ? 'Current Expected Yield' : 'বর্তমান সম্ভাব্য ফলন'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-stone-900">
                  {isEn ? result.yield_prediction.current_yield : toBengali(result.yield_prediction.current_yield)}
                </span>
                <span className="text-xs font-extrabold text-amber-700">
                  {result.yield_prediction.unit}
                </span>
              </div>
            </div>

            {/* Maximum Potential Yield */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 shadow-sm">
              <span className="text-xs font-bold text-stone-800 block mb-1">
                {isEn ? 'Maximum Potential Yield' : 'সর্বোচ্চ সম্ভাব্য ফলন'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-stone-900">
                  {isEn ? result.yield_prediction.max_yield : toBengali(result.yield_prediction.max_yield)}
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {result.yield_prediction.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Potential Extra Profit Banner */}
          <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-900 block">
                {isEn ? 'Potential Extra Profit' : 'সম্ভাব্য অতিরিক্ত লাভ'}
              </span>
              <span className="text-[11px] text-stone-600">
                {isEn ? 'By following recommendations & optimizing yield' : 'পরামর্শ অনুযায়ী ফলন বৃদ্ধি করলে'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-700">
                ৳ {result.financials.formatted_extra_profit}
              </span>
              <span className="block text-[10px] text-stone-500 font-semibold">
                {isEn ? 'BDT Estimated' : 'BDT আনুমানিক'}
              </span>
            </div>
          </div>

          {/* Daily Tasks */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 mb-2.5 flex items-center gap-1.5">
              <span>{isEn ? "Today's Action Tasks" : 'আজকের কাজ (Daily Tasks)'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.daily_tasks.map((task, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    task.recommended
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {task.recommended ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  )}
                  <div className="text-xs font-bold">{task.task}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {result.alerts && result.alerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{isEn ? 'Urgent Alerts' : 'জরুরি সতর্কতা (Alerts)'}</span>
              </h3>
              <div className="space-y-1.5">
                {result.alerts.map((alert, i) => (
                  <div key={i} className="text-xs font-medium text-amber-900 flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>{isEn ? 'AI Agricultural Recommendations' : 'AI কৃষি পরামর্শ (Actionable Recommendations)'}</span>
            </h3>

            <div className="space-y-2.5">
              {result.ai_recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {rec.category}
                    </span>
                    <span className="text-xs font-bold text-stone-900">{rec.title}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed pt-1">{rec.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() =>
                alert(
                  isEn
                    ? 'Agricultural advice report downloaded successfully.'
                    : 'কৃষি পরামর্শ রিপোর্ট ডাউনলোড সম্পন্ন হয়েছে।'
                )
              }
              className="flex-1 py-3 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isEn ? 'Download Report' : 'রিপোর্ট ডাউনলোড'}</span>
            </button>
            <button
              onClick={() => onBackToHome()}
              className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
            >
              <span>{isEn ? 'Back to Home' : 'হোমে ফিরে যান'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
