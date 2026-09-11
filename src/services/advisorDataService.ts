import { AdvisorRequest, AdvisorResponse } from '../types';

export interface CropVarietyItem {
  id: string;
  nameBn: string;
  nameEn: string;
  tagBn: string;
  tagEn: string;
}

export interface CropCategoryInfo {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  baseYieldPerAcre: number;
  maxYieldPerAcre: number;
  pricePerTon: number;
  varieties: CropVarietyItem[];
}

export const CROP_DATA_CATALOG: Record<string, CropCategoryInfo> = {
  'ধান': {
    id: 'ধান',
    nameBn: 'ধান',
    nameEn: 'Rice (Paddy)',
    icon: '🌾',
    baseYieldPerAcre: 4.2,
    maxYieldPerAcre: 5.4,
    pricePerTon: 32000,
    varieties: [
      { id: 'BRRI 28', nameBn: 'ব্রি ধান ২৮ (জনপ্রিয় বোরো)', nameEn: 'BRRI Dhan 28 (Popular Boro)', tagBn: 'বোরো', tagEn: 'Boro' },
      { id: 'BRRI 29', nameBn: 'ব্রি ধান ২৯ (উচ্চফলনশীল বোরো)', nameEn: 'BRRI Dhan 29 (High Yield Boro)', tagBn: 'বোরো', tagEn: 'Boro' },
      { id: 'BRRI 89', nameBn: 'ব্রি ধান ৮৯ (সর্বোচ্চ ফলন)', nameEn: 'BRRI Dhan 89 (Maximum Yield)', tagBn: 'বোরো', tagEn: 'Boro' },
      { id: 'BRRI 58', nameBn: 'ব্রি ধান ৫৮', nameEn: 'BRRI Dhan 58', tagBn: 'বোরো', tagEn: 'Boro' },
      { id: 'BRRI 49', nameBn: 'ব্রি ধান ৪৯ (মেগা আমন)', nameEn: 'BRRI Dhan 49 (Mega Aman)', tagBn: 'আমন', tagEn: 'Aman' },
      { id: 'BRRI 50', nameBn: 'ব্রি ধান ৫০ (বাংলামতি সুগন্ধি)', nameEn: 'BRRI Dhan 50 (Banglamati Aromatic)', tagBn: 'সুগন্ধি', tagEn: 'Aromatic' },
      { id: 'BRRI 81', nameBn: 'ব্রি ধান ৮১ (রপ্তানিযোগ্য প্রিমিয়াম)', nameEn: 'BRRI Dhan 81 (Export Quality Premium)', tagBn: 'বোরো', tagEn: 'Boro' },
      { id: 'BINA 7', nameBn: 'বিনা ধান-৭ (আগাম আমন)', nameEn: 'BINA Dhan-7 (Early Aman)', tagBn: 'আমন', tagEn: 'Aman' },
      { id: 'BINA 11', nameBn: 'বিনা ধান-১১ (বন্যা সহনশীল)', nameEn: 'BINA Dhan-11 (Submergence Tolerant)', tagBn: 'আমন', tagEn: 'Aman' },
      { id: 'বাসমতী', nameBn: 'বাসমতী হাইব্রিড', nameEn: 'Basmati Hybrid Rice', tagBn: 'সুগন্ধি', tagEn: 'Aromatic' },
    ],
  },
  'আলু': {
    id: 'আলু',
    nameBn: 'আলু',
    nameEn: 'Potato',
    icon: '🥔',
    baseYieldPerAcre: 18.0,
    maxYieldPerAcre: 24.5,
    pricePerTon: 18000,
    varieties: [
      { id: 'ডায়মন্ড', nameBn: 'ডায়মন্ড (সেরা সাদা আলু)', nameEn: 'Diamant (Premium White Potato)', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yielding' },
      { id: 'কার্ডিনাল', nameBn: 'কার্ডিনাল (লাল চামড়া)', nameEn: 'Cardinal (Red Skin Potato)', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yielding' },
      { id: 'গ্রানোলা', nameBn: 'গ্রানোলা (রোগসহনশীল)', nameEn: 'Granola (Disease Resistant)', tagBn: 'জনপ্রিয়', tagEn: 'Popular' },
      { id: 'অ্যাস্টেরিক্স', nameBn: 'বারি আলু-৮ (অ্যাস্টেরিক্স - লাল আলু)', nameEn: 'BARI Alu-8 (Asterix Red Potato)', tagBn: 'রপ্তানিযোগ্য', tagEn: 'Export Quality' },
      { id: 'লেডি রোসেটা', nameBn: 'বারি আলু-২৫ (লেডি রোসেটা - চিপস জাত)', nameEn: 'BARI Alu-25 (Lady Rosetta Chips Variety)', tagBn: 'শিল্প জাত', tagEn: 'Processing' },
      { id: 'বারি টিপিএস', nameBn: 'বারি আলু-৭ (টিপিএস হাইব্রিড)', nameEn: 'BARI Alu-7 (TPS Hybrid Seed)', tagBn: 'কম বীজ খরচ', tagEn: 'Low Seed Cost' },
      { id: 'দেশী লাল পাকড়ি', nameBn: 'দেশী লাল পাকড়ি / শিল আলু', nameEn: 'Deshi Red Pakri / Sheel Potato', tagBn: 'স্থানীয়', tagEn: 'Indigenous' },
    ],
  },
  'সরিষা': {
    id: 'সরিষা',
    nameBn: 'সরিষা',
    nameEn: 'Mustard',
    icon: '🌿',
    baseYieldPerAcre: 1.4,
    maxYieldPerAcre: 1.9,
    pricePerTon: 75000,
    varieties: [
      { id: 'বারি সরিষা-১৪', nameBn: 'বারি সরিষা-১৪ (স্বল্পমেয়াদী ও জনপ্রিয়)', nameEn: 'BARI Sarisha-14 (Short Duration Popular)', tagBn: '৭৫-৮০ দিন', tagEn: '75-80 Days' },
      { id: 'বারি সরিষা-১৫', nameBn: 'বারি সরিষা-১৫ (হলুদ দানা ও তেল বেশি)', nameEn: 'BARI Sarisha-15 (Yellow Seed High Oil)', tagBn: 'তেল বেশি', tagEn: 'High Oil' },
      { id: 'বারি সরিষা-১৭', nameBn: 'বারি সরিষা-১৭ (উচ্চ ফলনশীল)', nameEn: 'BARI Sarisha-17 (High Yielding)', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'বারি সরিষা-১৮', nameBn: 'বারি সরিষা-১৮ (ক্যানোলা জাত)', nameEn: 'BARI Sarisha-18 (Canola Quality)', tagBn: 'স্বাস্থ্যকর', tagEn: 'Healthy Oil' },
      { id: 'বিনা সরিষা-৪', nameBn: 'বিনা সরিষা-৪', nameEn: 'BINA Sarisha-4', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'বিনা সরিষা-৯', nameBn: 'বিনা সরিষা-৯', nameEn: 'BINA Sarisha-9', tagBn: 'আগাম জাত', tagEn: 'Early' },
      { id: 'টোরি-৭', nameBn: 'টোরি-৭ (দেশী লাল সরিষা)', nameEn: 'Tori-7 (Traditional Red Mustard)', tagBn: 'স্বল্পমেয়াদী', tagEn: 'Short Duration' },
      { id: 'শ্বেত সরিষা', nameBn: 'শ্বেত সরিষা / রাই সরিষা', nameEn: 'Rai Mustard / White Mustard', tagBn: 'ঐতিহ্যবাহী', tagEn: 'Traditional' },
    ],
  },
  'ভুট্টা': {
    id: 'ভুট্টা',
    nameBn: 'ভুট্টা',
    nameEn: 'Maize (Corn)',
    icon: '🌽',
    baseYieldPerAcre: 7.5,
    maxYieldPerAcre: 9.8,
    pricePerTon: 22000,
    varieties: [
      { id: 'বারি হাইব্রিড ভুট্টা-৯', nameBn: 'বারি হাইব্রিড ভুট্টা-৯ (মেগা ফলন)', nameEn: 'BARI Hybrid Maize-9 (Mega Yield)', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'বারি হাইব্রিড ভুট্টা-১৬', nameBn: 'বারি হাইব্রিড ভুট্টা-১৬', nameEn: 'BARI Hybrid Maize-16', tagBn: 'রোগসহনশীল', tagEn: 'Disease Resistant' },
      { id: 'পাইওনিয়ার ৩৩৫৫', nameBn: 'পাইওনিয়ার ৩৩৫৫', nameEn: 'Pioneer 3355 Hybrid Maize', tagBn: 'মাল্টিন্যাশনাল', tagEn: 'Commercial' },
      { id: 'এনকে-৪০', nameBn: 'এনকে-৪০ (সিনজেনটা)', nameEn: 'Syngenta NK-40 Hybrid', tagBn: 'শক্ত কাণ্ড', tagEn: 'Strong Stalk' },
      { id: 'প্যাসিফিক ৯৮৪', nameBn: 'প্যাসিফিক ৯৮৪', nameEn: 'Pacific 984 Hybrid', tagBn: 'জনপ্রিয়', tagEn: 'Popular' },
      { id: 'কাবেরি ৫০', nameBn: 'কাবেরি ৫০', nameEn: 'Kaveri 50 Hybrid', tagBn: 'খরাসহনশীল', tagEn: 'Drought Tolerant' },
      { id: 'সুপার শাইন', nameBn: 'সুপার শাইন হাইব্রিড', nameEn: 'Super Shine Hybrid Maize', tagBn: 'উচ্চ পুষ্টি', tagEn: 'Nutritious' },
    ],
  },
  'বেগুন': {
    id: 'বেগুন',
    nameBn: 'বেগুন',
    nameEn: 'Eggplant (Brinjal)',
    icon: '🍆',
    baseYieldPerAcre: 14.0,
    maxYieldPerAcre: 20.0,
    pricePerTon: 35000,
    varieties: [
      { id: 'বারি বেগুন-১', nameBn: 'বারি বেগুন-১ (উত্তরা - লম্বা জাত)', nameEn: 'BARI Begun-1 (Uttara - Long Variety)', tagBn: 'শীতকালীন', tagEn: 'Winter' },
      { id: 'বারি বেগুন-৮', nameBn: 'বারি বেগুন-৮ (বিটি বেগুন-২ পোকারোধী)', nameEn: 'BARI Begun-8 (Bt Brinjal-2 Pest Resistant)', tagBn: 'কীটনাশকমুক্ত', tagEn: 'Pesticide-Free' },
      { id: 'বারি বেগুন-১২', nameBn: 'বারি বেগুন-১২ (কাজলা - চকচকে বেগুনি)', nameEn: 'BARI Begun-12 (Kajla - Glossy Purple)', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'ইসলামপুরী', nameBn: 'ইসলামপুরী / তাল বেগুন (গোল মাংসল)', nameEn: 'Islampuri / Tal Begun (Round Fleshy)', tagBn: 'ভাজির জন্য সেরা', tagEn: 'Best for Fry' },
      { id: 'সিংনাথ', nameBn: 'সিংনাথ বেগুন (লম্বা ও নরম)', nameEn: 'Singnath Begun (Long & Tender)', tagBn: 'জনপ্রিয়', tagEn: 'Popular' },
      { id: 'ব্ল্যাক ডায়মন্ড', nameBn: 'ব্ল্যাক ডায়মন্ড হাইব্রিড', nameEn: 'Black Diamond Hybrid Eggplant', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'বারি বেগুন-১০', nameBn: 'বারি বেগুন-১০ (নয়নতারা)', nameEn: 'BARI Begun-10 (Nayantara Round)', tagBn: 'গোলাকার', tagEn: 'Round' },
      { id: 'দেশী লম্বা বেগুন', nameBn: 'দেশী সবুজ/বেগুনি লম্বা বেগুন', nameEn: 'Local Long Green/Purple Brinjal', tagBn: 'স্থানীয়', tagEn: 'Indigenous' },
    ],
  },
  'টমেটো': {
    id: 'টমেটো',
    nameBn: 'টমেটো',
    nameEn: 'Tomato',
    icon: '🍅',
    baseYieldPerAcre: 22.0,
    maxYieldPerAcre: 32.0,
    pricePerTon: 30000,
    varieties: [
      { id: 'বারি টমেটো-২', nameBn: 'বারি টমেটো-২ (রতন - মাংসল ও মিষ্টি)', nameEn: 'BARI Tomato-2 (Ratan - Fleshy & Sweet)', tagBn: 'শীতকালীন', tagEn: 'Winter' },
      { id: 'বারি টমেটো-১৪', nameBn: 'বারি টমেটো-১৪ (সর্বাধিক ফলন)', nameEn: 'BARI Tomato-14 (Highest Yielding)', tagBn: 'শীতকালীন', tagEn: 'Winter' },
      { id: 'বারি হাইব্রিড টমেটো-৮', nameBn: 'বারি হাইব্রিড টমেটো-৮ (গ্রীষ্মকালীন)', nameEn: 'BARI Hybrid Tomato-8 (Summer Crop)', tagBn: 'গ্রীষ্মকাল', tagEn: 'Summer' },
      { id: 'মিন্টু সুপার', nameBn: 'মিন্টু সুপার হাইব্রিড', nameEn: 'Mintoo Super Hybrid Tomato', tagBn: 'মেগা ফলন', tagEn: 'Mega Yield' },
      { id: 'বিজলি হাইব্রিড', nameBn: 'বিজলি হাইব্রিড', nameEn: 'Bijli 11 Hybrid Tomato', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'টাইটান হাইব্রিড', nameBn: 'টাইটান হাইব্রিড (পাকা শক্ত ত্বক)', nameEn: 'Titan Hybrid (Firm Skin)', tagBn: 'পরিবহনবান্ধব', tagEn: 'Shelf Life' },
      { id: 'বারি টমেটো-১৫', nameBn: 'বারি টমেটো-১৫ (ভাইরাস সহনশীল)', nameEn: 'BARI Tomato-15 (Virus Tolerant)', tagBn: 'রোগসহনশীল', tagEn: 'Disease Resistant' },
      { id: 'দেশী চেরি টমেটো', nameBn: 'দেশী চেরি ও মানিক টমেটো', nameEn: 'Deshi Cherry & Manik Tomato', tagBn: 'সালাদ', tagEn: 'Salad' },
    ],
  },
  'ফুলকপি': {
    id: 'ফুলকপি',
    nameBn: 'ফুলকপি',
    nameEn: 'Cauliflower',
    icon: '🥦',
    baseYieldPerAcre: 12.0,
    maxYieldPerAcre: 18.0,
    pricePerTon: 28000,
    varieties: [
      { id: 'বারি ফুলকপি-১', nameBn: 'বারি ফুলকপি-১ (রূপা - ধবধবে সাদা)', nameEn: 'BARI Cauliflower-1 (Rupa - Snow White)', tagBn: 'শীতকালীন', tagEn: 'Winter' },
      { id: 'হোয়াইট মার্বেল', nameBn: 'হোয়াইট মার্বেল হাইব্রিড', nameEn: 'White Marble Hybrid (Dense Curd)', tagBn: 'আঁটসাঁট ফুল', tagEn: 'Compact Curd' },
      { id: 'স্নো হোয়াইট', nameBn: 'স্নো হোয়াইট হাইব্রিড', nameEn: 'Snow White Hybrid Cauliflower', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'সামার স্টার', nameBn: 'সামার স্টার (গ্রীষ্মকালীন আগাম)', nameEn: 'Summer Star (Early Summer Off-Season)', tagBn: 'অফ-সিজন', tagEn: 'Off-Season' },
      { id: 'পূষা দীপালী', nameBn: 'পূষা দীপালী (আগাম জাত)', nameEn: 'Pusa Deepali (Early Season)', tagBn: 'অক্টোবর-নভেম্বর', tagEn: 'Oct-Nov' },
      { id: 'কারেন্ট হাইব্রিড', nameBn: 'কারেন্ট হাইব্রিড', nameEn: 'Current Hybrid (Fast Growing)', tagBn: 'দ্রুত বর্ধনশীল', tagEn: 'Fast Growth' },
      { id: 'স্থানীয় দেশী ফুলকপি', nameBn: 'স্থানীয় উন্নত জাত', nameEn: 'Local Improved Cauliflower', tagBn: 'দেশী', tagEn: 'Indigenous' },
    ],
  },
  'পেঁপে': {
    id: 'পেঁপে',
    nameBn: 'পেঁপে',
    nameEn: 'Papaya',
    icon: '🍈',
    baseYieldPerAcre: 25.0,
    maxYieldPerAcre: 38.0,
    pricePerTon: 25000,
    varieties: [
      { id: 'রেড লেডি', nameBn: 'রেড লেডি হাইব্রিড (৭৮৬ - সেরা ফলন)', nameEn: 'Red Lady 786 Hybrid (Top Yield & Sweet)', tagBn: 'উচ্চমূল্য ও মিষ্টি', tagEn: 'High Value' },
      { id: 'বারি পেঁপে-১', nameBn: 'বারি পেঁপে-১ (গাঢ় কমলা শাঁস)', nameEn: 'BARI Papaya-1 (Deep Orange Pulp)', tagBn: 'মিষ্টি ও সুস্বাদু', tagEn: 'Sweet & Tasty' },
      { id: 'শাহী পেঁপে', nameBn: 'শাহী পেঁপে (উচ্চ ফলনশীল)', nameEn: 'Shahi Papaya (High Yielding)', tagBn: 'সবজি ও পাকা ফল', tagEn: 'Vegetable & Fruit' },
      { id: 'রাঁচি পেঁপে', nameBn: 'রাঁচি জাতের পেঁপে', nameEn: 'Ranchi Papaya Variety', tagBn: 'সহনশীল', tagEn: 'Hardy' },
      { id: 'হানি ডিউ', nameBn: 'হানি ডিউ', nameEn: 'Honey Dew Papaya', tagBn: 'অতিমিষ্টি', tagEn: 'Extra Sweet' },
      { id: 'দেশী উন্নত পেঁপে', nameBn: 'স্থানীয় দেশী পেঁপে জাত', nameEn: 'Local Improved Papaya', tagBn: 'সহজ পরিচর্যা', tagEn: 'Easy Care' },
    ],
  },
  'কলা': {
    id: 'কলা',
    nameBn: 'কলা',
    nameEn: 'Banana',
    icon: '🍌',
    baseYieldPerAcre: 20.0,
    maxYieldPerAcre: 30.0,
    pricePerTon: 26000,
    varieties: [
      { id: 'অমৃতসাগর', nameBn: 'অমৃতসাগর কলা (সুস্বাদু ও প্রিমিয়াম)', nameEn: 'Amritsagar Banana (Delicious & Premium)', tagBn: 'উচ্চ বাজারমূল্য', tagEn: 'High Value' },
      { id: 'সবরি কলা', nameBn: 'সবরি কলা (অনুপম স্বাদ ও মিষ্টি)', nameEn: 'Sabri Banana (Sweet & Fragrant)', tagBn: 'জনপ্রিয়', tagEn: 'Popular' },
      { id: 'মেহেরসাগর', nameBn: 'মেহেরসাগর কলা (উচ্চ ফলন)', nameEn: 'Mehersagar Banana (High Yield)', tagBn: 'বড় কাঁদি', tagEn: 'Large Bunch' },
      { id: 'চাম্পা কলা', nameBn: 'চাম্পা বা চিনিচাম্পা (রোগসহনশীল)', nameEn: 'Champa / Chini Champa (Drought Hardy)', tagBn: 'সহজ চাষ', tagEn: 'Low Care' },
      { id: 'বারি কলা-১', nameBn: 'বারি কলা-১', nameEn: 'BARI Kola-1', tagBn: 'বিএআরআই উদ্ভাবিত', tagEn: 'BARI Developed' },
      { id: 'আনাজি কলা', nameBn: 'আনাজি বা কাঁচকলা (সবজি জাত)', nameEn: 'Anaji / Green Plantain (Cooking Variety)', tagBn: 'সবজি', tagEn: 'Vegetable' },
    ],
  },
  'গম': {
    id: 'গম',
    nameBn: 'গম',
    nameEn: 'Wheat',
    icon: '🌾',
    baseYieldPerAcre: 3.2,
    maxYieldPerAcre: 4.2,
    pricePerTon: 35000,
    varieties: [
      { id: 'বারি গম-৩৩', nameBn: 'বারি গম-৩৩ (ব্লাস্ট প্রতিরোধী ও জিঙ্ক)', nameEn: 'BARI Gom-33 (Blast Resistant & Zinc)', tagBn: 'মেগা জাত', tagEn: 'Mega Variety' },
      { id: 'বারি গম-২৫', nameBn: 'বারি গম-২৫ (লবণাক্ততা সহনশীল)', nameEn: 'BARI Gom-25 (Salinity Tolerant)', tagBn: 'উপকূলীয়', tagEn: 'Coastal' },
      { id: 'বারি গম-২৮', nameBn: 'বারি গম-২৮ (দেরিতে বপন উপযোগী)', nameEn: 'BARI Gom-28 (Late Sowing Heat Tolerant)', tagBn: 'তাপ সহনশীল', tagEn: 'Heat Tolerant' },
      { id: 'ডব্লিউএমআরআই গম-৩', nameBn: 'ডব্লিউএমআরআই গম-৩', nameEn: 'WMRI Gom-3 (High Yielding)', tagBn: 'উচ্চফলনশীল', tagEn: 'High Yield' },
      { id: 'কাঞ্চন গম', nameBn: 'কাঞ্চন গম (ক্লাসিক জনপ্রিয়)', nameEn: 'Kanchan Wheat (Classic Popular)', tagBn: 'সুপরিচিত', tagEn: 'Popular' },
      { id: 'শতাব্দী', nameBn: 'শতাব্দী গম', nameEn: 'Shatabdi Wheat', tagBn: 'উচ্চ পুষ্টি', tagEn: 'High Nutrition' },
    ],
  },
  'পান': {
    id: 'পান',
    nameBn: 'পান',
    nameEn: 'Betel Leaf',
    icon: '🍃',
    baseYieldPerAcre: 3.5,
    maxYieldPerAcre: 5.2,
    pricePerTon: 90000,
    varieties: [
      { id: 'মিষ্টি পান', nameBn: 'মিষ্টি পান (সবচেয়ে সুস্বাদু ও দামি)', nameEn: 'Misti Paan (Sweet & High Value)', tagBn: 'উচ্চমূল্য', tagEn: 'High Value' },
      { id: 'সাঁচি পান', nameBn: 'সাঁচি পান (গাঢ় সবুজ ও ঝাল-মিষ্টি)', nameEn: 'Sanchi Paan (Dark Green & Crisp)', tagBn: 'দীর্ঘস্থায়ী', tagEn: 'Long Shelf Life' },
      { id: 'বাংলা পান', nameBn: 'বাংলা পান (উচ্চফলনশীল ও বড় পাতা)', nameEn: 'Bangla Paan (Large Leaf High Yield)', tagBn: 'জনপ্রিয়', tagEn: 'Popular' },
      { id: 'গয়াসুর পান', nameBn: 'গয়াসুর পান', nameEn: 'Gayasur Paan', tagBn: 'সুপরিচিত', tagEn: 'Traditional' },
      { id: 'উজালা পান', nameBn: 'উজালা উন্নত জাত', nameEn: 'Ujala Improved Betel Leaf', tagBn: 'উন্নত বরোজ', tagEn: 'Modern Shed' },
    ],
  },
};

export function toBengaliNumber(n: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, (w) => bnDigits[Number(w)]);
}

export function formatBnCurrency(amount: number): string {
  const str = Math.round(amount).toString();
  if (str.length <= 3) return toBengaliNumber(str);
  const lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return toBengaliNumber(formattedOthers + ',' + lastThree);
}

export function getCropInfo(cropKeyOrName: string): CropCategoryInfo {
  if (CROP_DATA_CATALOG[cropKeyOrName]) return CROP_DATA_CATALOG[cropKeyOrName];
  const lower = cropKeyOrName.toLowerCase();
  for (const info of Object.values(CROP_DATA_CATALOG)) {
    if (info.nameBn === cropKeyOrName || info.nameEn.toLowerCase().includes(lower) || info.id.toLowerCase().includes(lower)) {
      return info;
    }
  }
  return CROP_DATA_CATALOG['ধান'];
}

export function calculateAdvisorResult(data: AdvisorRequest, language: 'bn' | 'en'): AdvisorResponse {
  const isEn = language === 'en';
  const cropInfo = getCropInfo(data.cropType);
  const cropName = isEn ? cropInfo.nameEn : cropInfo.nameBn;

  // Selected variety object
  const varietyObj = cropInfo.varieties.find((v) => v.id === data.cropVariety) || cropInfo.varieties[0];
  const varietyName = isEn ? varietyObj.nameEn : varietyObj.nameBn;

  const landSize = Number(data.landSize) || 2;
  const landUnit = data.landUnit || (isEn ? 'Acre' : 'একর');
  const soil = data.soilType || '';
  const irrigation = data.irrigationStatus || '';
  const seedQty = Number(data.seedQuantity) || 8;

  let score = 85;
  if (soil.includes('বেলে') || soil.toLowerCase().includes('sand')) score -= 8;
  if (irrigation.includes('সংকট') || irrigation.toLowerCase().includes('deficit') || irrigation.toLowerCase().includes('shortage')) score -= 12;
  if (seedQty < 6 || seedQty > 14) score -= 5;
  score = Math.max(52, Math.min(96, score));

  const yieldRatio = score / 100;
  const currentYield = Number((cropInfo.baseYieldPerAcre * (0.84 + yieldRatio * 0.16)).toFixed(1));
  const maxYield = Number(cropInfo.maxYieldPerAcre.toFixed(1));

  const landMultiplier = (landUnit === 'বিঘা' || String(landUnit).toLowerCase() === 'bigha') ? landSize * 0.33 : landSize;
  const yieldDiffTons = Math.max(0.4, (maxYield - currentYield) * landMultiplier);
  const potentialProfit = Math.round(yieldDiffTons * cropInfo.pricePerTon);

  const statusText = isEn
    ? (score >= 80 ? 'Very Good' : score >= 65 ? 'Satisfactory' : 'Needs Improvement')
    : (score >= 80 ? 'খুব ভালো' : score >= 65 ? 'সন্তোষজনক' : 'উন্নতি প্রয়োজন');

  const creditStatus = isEn
    ? (score >= 75 ? 'Prime' : score >= 60 ? 'Moderate' : 'High Risk')
    : (score >= 75 ? 'ভাল' : score >= 60 ? 'মাঝারি' : 'উচ্চ ঝুঁকি');

  const formattedProfit = isEn
    ? potentialProfit.toLocaleString('en-US')
    : formatBnCurrency(potentialProfit);

  const yieldUnit = (landUnit === 'বিঘা' || String(landUnit).toLowerCase() === 'bigha')
    ? (isEn ? 'Maund / Bigha' : 'মণ/বিঘা')
    : (isEn ? 'Ton / Acre' : 'টন/একর');

  // Crop-specific recommendations & alerts
  let diseaseActionEn = `Apply recommended fungicide (e.g. Tricyclazole 75% WP or Azoxystrobin) in late afternoon to protect ${cropName} from blast and leaf spot.`;
  let diseaseActionBn = `${cropName} এর ব্লাস্ট ও পাতাপোড়া রোগ প্রতিরোধে ট্রাইসাইক্লাজোল বা মেনকোজেব অনুমোদিত মাত্রায় বিকেল বেলা স্প্রে করুন।`;
  let alertEn = `Current high humidity and intermittent rain increase disease risks for ${cropName}; inspect plants every 2 days.`;
  let alertBn = `বর্তমান আর্দ্র আবহাওয়ায় ${cropName}-এ ছত্রাক ও পোকার ঝুঁকি বেড়েছে; প্রতি দুই দিন পর পর ক্ষেত পরিদর্শন করুন।`;

  if (cropInfo.id === 'আলু') {
    diseaseActionEn = 'To prevent Late Blight in potato under foggy conditions, spray Mancozeb 75% WP (Dithane M-45) or Ridomil Gold proactively.';
    diseaseActionBn = 'কুয়াশাচ্ছন্ন আবহাওয়ায় আলুর নাবী ধসা (Late Blight) প্রতিরোধে ডাইথেন এম-৪৫ বা রিডোমিল গোল্ড অনুমোদিত মাত্রায় আগাম স্প্রে করুন।';
    alertEn = 'Dense fog and prolonged moisture trigger late blight outbreaks in potato; ensure strict field sanitation.';
    alertBn = 'টানা কুয়াশা ও আর্দ্রতায় আলুর নাবী ধসার মহামারি ঝুঁকি থাকে; সময়মতো প্রতিরোধমূলক স্প্রে নিন।';
  } else if (cropInfo.id === 'বেগুন') {
    diseaseActionEn = 'Deploy sex pheromone traps to combat shoot and fruit borer in eggplant; spray Carbendazim or Trichoderma for collar rot.';
    diseaseActionBn = 'বেগুনের ডগা ও ফল ছিদ্রকারী পোকা দমনে সেক্স ফেরোমোন ফাঁদ ব্যবহার করুন এবং গোড়া পচায় কার্বেনডাজিম স্প্রে করুন।';
    alertEn = 'Cloudy warm weather accelerates whiteflies and fruit borers in brinjal; monitor shoots regularly.';
    alertBn = 'মেঘলা আবহাওয়ায় বেগুনে সাদা মাছি ও ডগা ছিদ্রকারী পোকার আক্রমণ হতে পারে; দ্রুত খেয়াল রাখুন।';
  } else if (cropInfo.id === 'টমেটো') {
    diseaseActionEn = 'Spray Ridomil Gold or Secure 600 WG to prevent early and late blight; maintain optimal potassium to enhance fruit firmness.';
    diseaseActionBn = 'টমেটোর নাবী ধসা ও পাতা কোঁকড়ানো রোগ প্রতিরোধে রিডোমিল গোল্ড ও সুষম পটাশ সার ব্যবহার করুন।';
    alertEn = 'High soil moisture combined with cool nights increases fungal blight incidence on tomato foliage.';
    alertBn = 'ঘন কুয়াশা ও আর্দ্রতায় টমেটোতে নাবী ধসা দ্রুত ছড়াতে পারে; আগাম ছত্রাকনাশক প্রস্তুত রাখুন।';
  } else if (cropInfo.id === 'ভুট্টা') {
    diseaseActionEn = 'Inspect whorls for Fall Armyworm; apply Spinosad or Emamectin Benzoate if egg masses or fresh feeding holes are observed.';
    diseaseActionBn = 'ভুট্টার ফল আর্মিওয়ার্ম পোকা দমনে স্পাইনোস্যাড বা এমাভেকটিন বেনজোয়েট পাতার খোলে স্প্রে করুন।';
    alertEn = 'Fall Armyworm larvae cause severe defoliation in early maize stages; scout vegetative leaves daily.';
    alertBn = 'ভুট্টার প্রাথমিক বৃদ্ধিতে ফল আর্মিওয়ার্ম পাতা ঝাঁঝরা করতে পারে; সকালে নিয়মিত পর্যবেক্ষণ করুন।';
  } else if (cropInfo.id === 'সরিষা') {
    diseaseActionEn = 'Spray Rovral 50 WP for Alternaria leaf blight; apply Malathion 57 EC in the afternoon to control aphids during flowering.';
    diseaseActionBn = 'সরিষার অল্টারনারিয়া ব্লাইট রোগ প্রতিরোধে রোভরাল স্প্রে করুন এবং ফুল আসার পর জাবপোকা দমনে ম্যালাথিয়ন দিন।';
    alertEn = 'Humid foggy mornings favor aphid infestation on mustard inflorescences.';
    alertBn = 'কুয়াশাচ্ছন্ন আবহাওয়ায় সরিষা ক্ষেতে জাবপোকা ও ব্লাইটের প্রাদুর্ভাব হতে পারে।';
  } else if (cropInfo.id === 'ফুলকপি') {
    diseaseActionEn = 'Apply Rovral or Cupravit for Alternaria blight and black rot; ensure well-drained raised beds.';
    diseaseActionBn = 'ফুলকপির অল্টারনারিয়া ব্লাইট ও কালো পচা রোগ প্রতিরোধে রোভরাল বা কুপ্রাভিট নির্ধারিত মাত্রায় স্প্রে করুন।';
    alertEn = 'Heavy downpours on cauliflower beds trigger root suffocation and damping-off.';
    alertBn = 'ফুলকপির জমিতে অতিরিক্ত পানি জমে থাকলে শিকড় পচা রোগ দেখা দিতে পারে; নালা পরিষ্কার রাখুন।';
  } else if (cropInfo.id === 'পেঁপে') {
    diseaseActionEn = 'Manage aphid vectors to prevent papaya ringspot virus; ensure deep drainage ditches so zero stagnant water remains.';
    diseaseActionBn = 'পেঁপের রিং স্পট ভাইরাস দমনে জাবপোকা নিয়ন্ত্রণ করুন এবং গাছের গোড়ায় যেন এক ফোঁটাও পানি না জমে তা নিশ্চিত করুন।';
    alertEn = 'Waterlogging destroys papaya taproots within 24 hours; keep boundary canals free-flowing.';
    alertBn = 'পেঁপে গাছে অতিরিক্ত জলাবদ্ধতা গোড়া ও শিকড় পচা রোগ সৃষ্টি করে; নিষ্কাশন ব্যবস্থা নিশ্চিত করুন।';
  } else if (cropInfo.id === 'কলা') {
    diseaseActionEn = 'Prune and burn leaves showing Sigatoka streaks; spray Propiconazole (Tilt 250 EC) at 1 ml/L every 15-20 days.';
    diseaseActionBn = 'কলার সিগাটোগা পাতা পোড়া ও পানামা রোগ প্রতিরোধে আক্রান্ত পাতা কেটে ধ্বংস করুন এবং টিল্ট ২৫০ ইসি স্প্রে করুন।';
    alertEn = 'Strong seasonal winds require propping banana pseudostems with bamboo supports.';
    alertBn = 'ঝড়ো হাওয়া ও অতিবৃষ্টিতে কলা গাছে বাঁশের ঠেস দিন এবং সিগাটোগা দাগ প্রতিরোধে স্প্রে করুন।';
  } else if (cropInfo.id === 'পান') {
    diseaseActionEn = 'Drench betel vine roots with Bordeaux mixture or Ridomil to cure foot rot and stem rot diseases.';
    diseaseActionBn = 'পানের বরোজে গোড়া পচা ও ডাঁটা পচা রোগ প্রতিরোধে বোর্দো মিশ্রণ বা রিডোমিল দিয়ে গোড়া ভিজিয়ে দিন।';
    alertEn = 'High humidity inside enclosed betel vine conservatories accelerates fungal rot.';
    alertBn = 'বরোজে অতিরিক্ত আর্দ্রতা ও স্যাঁতসেঁতে পরিবেশে পাতা পচা ছত্রাক দ্রুত ছড়ায়।';
  }

  return {
    score_analysis: {
      score,
      max_score: 100,
      status_text: statusText,
      credit_status: creditStatus,
    },
    yield_prediction: {
      current_yield: currentYield,
      max_yield: maxYield,
      unit: yieldUnit,
    },
    financials: {
      potential_extra_profit_bdt: potentialProfit,
      formatted_extra_profit: formattedProfit,
    },
    ai_recommendations: isEn
      ? [
          {
            category: 'Disease Control',
            title: 'Fungicide & Pest Management',
            action: diseaseActionEn,
          },
          {
            category: 'Fertilizer Application',
            title: 'Balanced Nutrients & Top-Dressing',
            action: `For selected variety ${varietyName}, apply balanced DAP and Muriate of Potash (MOP), with timely Urea top-dressing split during critical growth stages.`,
          },
          {
            category: 'Irrigation Management',
            title: 'Moisture Depth & Drainage',
            action: 'Maintain 2-3 inches of optimal standing water or soil moisture; ensure prompt drainage after excess rainfall.',
          },
        ]
      : [
          {
            category: 'রোগ নিয়ন্ত্রণ',
            title: 'ছত্রাক ও বালাই দমন',
            action: diseaseActionBn,
          },
          {
            category: 'সার প্রয়োগ',
            title: 'সুষম সার ও উপরি প্রয়োগ',
            action: `নির্বাচিত জাত ${varietyName}-এর জন্য অনুমোদিত মাত্রায় ডিএপি ও পটাশ দিন, এবং বৃদ্ধির ধাপে ইউরিয়া উপরি প্রয়োগ করুন।`,
          },
          {
            category: 'সেচ ব্যবস্থাপনা',
            title: 'পরিমিত পানি ও নিষ্কাশন',
            action: 'জমিতে অতিরিক্ত পানি জমিয়ে না রেখে মাটির উপযুক্ত রস ও আর্দ্রতা বজায় রাখুন এবং বৃষ্টির পর পানি নিষ্কাশন করুন।',
          },
        ],
    daily_tasks: isEn
      ? [
          { task: 'Soil Moisture Check & Irrigation', recommended: true },
          { task: 'Pest & Disease Monitoring', recommended: true },
          { task: 'Weeding & Field Cleaning', recommended: true },
        ]
      : [
          { task: 'মাটির আর্দ্রতা পরীক্ষা ও সেচ', recommended: true },
          { task: 'রোগ ও পোকা পর্যবেক্ষণ', recommended: true },
          { task: 'আগাছা দমন ও মাটি নিড়ানি', recommended: true },
        ],
    alerts: isEn
      ? [
          alertEn,
          'Review 3-day local weather forecast before planning heavy chemical sprays or field irrigation.',
        ]
      : [
          alertBn,
          'জমিতে রাসায়নিক স্প্রে বা সার প্রয়োগের পূর্বে স্থানীয় ৩ দিনের আবহাওয়ার পূর্বাভাস জেনে নিন।',
        ],
  };
}

export function isValidAdvisorResponse(obj: any, language: 'bn' | 'en'): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.score_analysis || typeof obj.score_analysis.score !== 'number') return false;
  if (!obj.yield_prediction || typeof obj.yield_prediction.current_yield !== 'number') return false;
  if (!obj.financials || !Array.isArray(obj.ai_recommendations) || obj.ai_recommendations.length === 0) return false;
  if (!Array.isArray(obj.daily_tasks) || obj.daily_tasks.length === 0) return false;

  // Strict language script check: if user asked for English, verify status_text does NOT contain Bengali characters
  if (language === 'en') {
    const status = String(obj.score_analysis.status_text || '');
    const hasBangla = /[\u0980-\u09FF]/.test(status);
    if (hasBangla) return false;
  }
  return true;
}
