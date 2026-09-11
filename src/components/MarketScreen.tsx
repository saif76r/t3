import React, { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react';
import { INITIAL_MARKET_PRICES } from '../data';
import { MarketPriceItem } from '../types';
import { toBengali } from './CreditScoreGauge';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'all', bn: 'সব', en: 'All' },
  { id: 'ধান', bn: 'ধান', en: 'Paddy' },
  { id: 'গম', bn: 'গম', en: 'Wheat' },
  { id: 'সবজি', bn: 'সবজি', en: 'Vegetables' },
  { id: 'ফল', bn: 'ফল', en: 'Fruits' },
  { id: 'মসলা', bn: 'মসলা', en: 'Spices' },
];

const LOCATIONS = [
  { id: 'ঢাকা', bn: 'ঢাকা', en: 'Dhaka' },
  { id: 'রংপুর', bn: 'রংপুর', en: 'Rangpur' },
  { id: 'বগুড়া', bn: 'বগুড়া', en: 'Bogura' },
  { id: 'রাজশাহী', bn: 'রাজশাহী', en: 'Rajshahi' },
  { id: 'দিনাজপুর', bn: 'দিনাজপুর', en: 'Dinajpur' },
  { id: 'চট্টগ্রাম', bn: 'চট্টগ্রাম', en: 'Chattogram' },
  { id: 'যশোর', bn: 'যশোর', en: 'Jashore' },
];

export const MarketScreen: React.FC<Props> = ({ onBack }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('ঢাকা');

  const filteredPrices = INITIAL_MARKET_PRICES.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const nameMatch = isEn && item.nameEn
      ? item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || item.name.toLowerCase().includes(searchQuery.toLowerCase())
      : item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && nameMatch;
  });

  const currentLocationObj = LOCATIONS.find((l) => l.id === selectedLocation) || LOCATIONS[0];
  const displayLocation = isEn ? currentLocationObj.en : currentLocationObj.bn;

  return (
    <div id="market-prices-screen" className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-market-back"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-stone-900">{isEn ? 'Market Rates' : 'বাজারদর'}</h1>
        <div className="w-9"></div>
      </div>

      {/* Search & Location Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            id="input-search-market"
            type="text"
            placeholder={isEn ? 'Search crop by name (e.g. Rice, Potato)...' : 'ফসলের নাম দিয়ে খুঁজুন (যেমন ধান, আলু)...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Location Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex gap-1.5">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedLocation === loc.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {isEn ? loc.en : loc.bn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {isEn ? cat.en : cat.bn}
          </button>
        ))}
      </div>

      {/* Prices List */}
      <div className="space-y-2.5">
        {filteredPrices.map((item) => {
          const displayName = isEn && item.nameEn ? item.nameEn : item.name;
          const displayUnit = isEn && item.unitEn ? item.unitEn : item.unit;
          const displayUpdated = isEn && item.updatedAtEn ? item.updatedAtEn : item.updatedAt;

          return (
            <div
              key={item.id}
              id={`market-item-${item.id}`}
              className="bg-white border border-stone-200 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:shadow transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                  <img src={item.image} alt={displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{displayName}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    <span>{displayLocation} {isEn ? 'Wholesale' : 'পাইকারি'}</span>
                    <span>•</span>
                    <span>{displayUpdated}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-stone-900">
                  ৳ {isEn ? item.price.toLocaleString('en-US') : toBengali(item.price)}
                </div>
                <div className="text-[10px] text-stone-500 font-semibold">{displayUnit}</div>
                <div className="mt-1 flex items-center justify-end gap-0.5">
                  {item.change === 'up' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      {isEn ? '+2.5%' : '+২.৫%'}
                    </span>
                  )}
                  {item.change === 'down' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      {isEn ? '-1.8%' : '-১.৮%'}
                    </span>
                  )}
                  {item.change === 'stable' && (
                    <span className="inline-flex items-center text-[10px] font-bold text-stone-500 bg-stone-100 px-1 rounded">
                      <Minus className="w-3 h-3 mr-0.5" />
                      {isEn ? 'Stable' : 'স্থিতিশীল'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

