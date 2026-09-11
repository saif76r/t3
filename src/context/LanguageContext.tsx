import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

export interface TranslationsMap {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const TRANSLATIONS: TranslationsMap = {
  // Navigation
  nav_home: { bn: 'হোম', en: 'Home' },
  nav_hub: { bn: 'হাব', en: 'Hub' },
  nav_advisor: { bn: 'পরামর্শ', en: 'Advisor' },
  nav_alerts: { bn: 'বার্তা', en: 'Alerts' },
  nav_profile: { bn: 'প্রোফাইল', en: 'Profile' },

  // Header & Greetings
  welcome: { bn: 'স্বাগতম', en: 'Welcome' },
  farmer_friend: { bn: 'কৃষক বন্ধু', en: 'Farmer Friend' },
  today_advice_subtitle: { bn: 'আপনার জন্য আজকের পরামর্শ', en: "Today's Farm Advisory" },
  live_gps: { bn: 'লাইভ GPS', en: 'Live GPS' },
  live_gps_area: { bn: 'লাইভ GPS এলাকা', en: 'Live GPS Area' },
  change_location: { bn: 'অবস্থান পরিবর্তন', en: 'Change Location' },
  search_district: { bn: 'জেলা খুঁজুন...', en: 'Search district...' },
  current_location: { bn: 'বর্তমান অবস্থান ব্যবহার করুন', en: 'Use Current Location' },

  // Hub Screen Cards
  hub_title: { bn: 'কৃষি সেবা হাব', en: 'Agri Services Hub' },
  hub_subtitle: { bn: 'আপনার খামার ব্যবস্থাপনার সকল ডিজিটাল সেবা', en: 'All digital services for your farm management' },
  hub_chatbot: { bn: 'AI কৃষি বন্ধু (চ্যাটবট)', en: 'AI Agri Assistant (Chatbot)' },
  hub_chatbot_desc: { bn: 'কৃষি এআই বিশেষজ্ঞের সাথে সরাসরি কথা বলুন', en: 'Talk directly with Agriculture AI expert' },
  hub_disease: { bn: 'রোগ শনাক্তকরণ', en: 'Disease Diagnosis' },
  hub_disease_desc: { bn: 'ক্যামেরা স্ক্যানে ফসলের রোগ নির্ণয়', en: 'Diagnose crop diseases with camera scan' },
  hub_crop_info: { bn: 'ফসল তথ্যভাণ্ডার', en: 'Crop Directory' },
  hub_crop_info_desc: { bn: 'ধান, গম, ভুট্টা, আলু ইত্যাদির চাষাবাদ গাইড', en: 'Cultivation guide for rice, wheat, corn, potato, etc.' },
  hub_weather: { bn: 'আবহাওয়ার পূর্বাভাস', en: 'Weather Forecast' },
  hub_weather_desc: { bn: '৭ দিনের পূর্বাভাস ও কৃষি সতর্কতা', en: '7-day forecast & agricultural alerts' },
  hub_soil_test: { bn: 'মাটি ও পুষ্টি পরীক্ষা', en: 'Soil & Nutrient Test' },
  hub_soil_test_desc: { bn: 'নমুনা পরীক্ষা ও মাটির ধরন যাচাই', en: 'Sample testing & soil type verification' },
  hub_inputs: { bn: 'ইনপুট ও উপকরণ খতিয়ান', en: 'Inputs & Cost Ledger' },
  hub_inputs_desc: { bn: 'বীজ, সার ও বালাইনাশক খরচের নির্ভুল হিসাব', en: 'Accurate record of seeds, fertilizer & pesticide costs' },
  hub_yield_advisor: { bn: 'ফলন বৃদ্ধি ও পরামর্শক', en: 'Yield Advisor & Profit' },
  hub_yield_advisor_desc: { bn: 'AI ফলন পূর্বাভাস ও লাভজনক মডেল', en: 'AI yield forecasting & profitable farm model' },
  hub_market: { bn: 'বাজারদর ও পূর্বাভাস', en: 'Market Prices' },
  hub_market_desc: { bn: 'সারা দেশের পাইকারি ও খুচরা মূল্য', en: 'Wholesale and retail prices nationwide' },

  // Home Quick Cards
  scan_leaf_card: { bn: 'ফসলের রোগ স্ক্যান করুন', en: 'Scan Crop Disease' },
  scan_leaf_desc: { bn: 'পাতার ছবি তুলে ২ সেকেন্ডে সঠিক রোগ ও ওষুধ জানুন', en: 'Snap a leaf photo to diagnose disease & remedy in 2s' },
  scan_now_btn: { bn: 'এখনই স্ক্যান করুন', en: 'Scan Now' },
  credit_score_title: { bn: 'কৃষি ক্রেডিট স্কোর', en: 'Agro-Credit Score' },
  credit_score_desc: { bn: 'সার ও উপকরণের নিয়মিত হিসাব রেখে ব্যাংকিং ঋণযোগ্যতা তৈরি করুন', en: 'Build banking loan eligibility by keeping regular farm input records' },
  view_credit_btn: { bn: 'হিসাব খতিয়ান দেখুন', en: 'View Farm Ledger' },
  daily_updates_title: { bn: 'আজকের কৃষি পরামর্শ ও করণীয়', en: "Today's Farm Action & Tips" },
  view_all_updates: { bn: 'সব দেখুন', en: 'View All' },
  weather_card_title: { bn: 'আজকের স্থানীয় আবহাওয়া', en: "Today's Local Weather" },
  apparent_temp: { bn: 'অনুভূত', en: 'Feels like' },
  humidity: { bn: 'আর্দ্রতা', en: 'Humidity' },
  wind_speed: { bn: 'বাতাস', en: 'Wind' },
  rain_prob: { bn: 'বৃষ্টির সম্ভাবনা', en: 'Rain Probability' },

  // Quick Tools Grid
  quick_tools_title: { bn: 'প্রয়োজনীয় সেবাসমূহ', en: 'Essential Services' },
  market_preview_title: { bn: 'আজকের পাইকারি বাজারদর', en: "Today's Wholesale Market" },
  view_market_btn: { bn: 'পুরো বাজার তালিকা দেখুন', en: 'View Full Market' },

  // Advisor Wizard
  advisor_heading: { bn: 'স্মার্ট ফলন পরামর্শক ও পূর্বাভাস', en: 'Smart Yield Advisor & Forecast' },
  advisor_subheading: { bn: 'আপনার জমির তথ্য দিন এবং বিজ্ঞানসম্মত চাষাবাদ পরামর্শ নিন', en: 'Enter your farm details to get scientific advisory' },
  select_crop: { bn: 'ফসল নির্বাচন করুন', en: 'Select Crop' },
  land_size: { bn: 'জমির পরিমাপ', en: 'Land Size' },
  soil_type: { bn: 'মাটির ধরন', en: 'Soil Type' },
  sowing_date: { bn: 'রোপণ / বপনের তারিখ', en: 'Sowing / Planting Date' },
  calculate_plan: { bn: 'পরামর্শ ও মুনাফার হিসাব দেখুন', en: 'Calculate Advisory & Profit' },
  projected_yield: { bn: 'সম্ভাব্য মোট উৎপাদন', en: 'Projected Total Yield' },
  projected_extra_profit: { bn: 'সম্ভাব্য বাড়তি মুনাফা', en: 'Estimated Extra Profit' },
  daily_schedule: { bn: 'পর্যায়ক্রমিক কাজের পরিকল্পনা', en: 'Step-by-Step Task Schedule' },
  fertilizer_guideline: { bn: 'সুষম সার প্রয়োগ মাত্রা', en: 'Balanced Fertilizer Dosage' },

  // Inputs Screen
  inputs_header: { bn: 'ইনপুট ও উপকরণ', en: 'Farm Inputs & Ledger' },
  inputs_sub: { bn: 'আসল সার, বীজ ও বালাইনাশক খরচ খতিয়ান', en: 'Real fertilizer, seed & pesticide expense ledger' },
  fresh_btn: { bn: 'ফ্রেশ করুন', en: 'Clear & Fresh' },
  add_input_btn: { bn: 'নতুন উপকরণ যোগ', en: 'Add New Input' },
  tab_calc: { bn: 'ক্যালকুলেটর', en: 'Calculator' },
  tab_history: { bn: 'সংরক্ষিত খতিয়ান', en: 'Saved Ledger' },
  total_selected_cost: { bn: 'মোট নির্বাচিত উপকরণের খরচ', en: 'Total Selected Input Cost' },
  save_calculation_btn: { bn: 'এই হিসাবটি খতিয়ানে সংরক্ষণ করুন', en: 'Save this Record to Ledger' },
  credit_score_boost: { bn: 'ভেরিফাইড হিসাব সংরক্ষণ করলে আপনার এগ্রো-ক্রেডিট স্কোর বৃদ্ধি পাবে', en: 'Saving verified records boosts your Agro-Credit Score for loans' },

  // Disease Scanner
  disease_header: { bn: 'AI রোগ স্ক্যানার', en: 'AI Disease Scanner' },
  disease_instruction: { bn: 'আক্রান্ত গাছের পাতা বা ফলের স্পষ্ট ছবি তুলুন অথবা গ্যালারি থেকে নির্বাচন করুন', en: 'Take a clear photo of the infected leaf or fruit, or choose from gallery' },
  take_photo: { bn: 'ক্যামেরা দিয়ে ছবি তুলুন', en: 'Take Photo with Camera' },
  choose_gallery: { bn: 'গ্যালারি থেকে ছবি নিন', en: 'Choose from Gallery' },
  analyzing_disease: { bn: 'AI দ্বারা ফসলের রোগ বিশ্লেষণ করা হচ্ছে...', en: 'Analyzing crop disease using Multimodal AI...' },
  detected_disease: { bn: 'শনাক্তকৃত রোগ / সমস্যা', en: 'Identified Crop Disease' },
  treatment_chemical: { bn: 'রাসায়নিক প্রতিকার ও ওষুধের মাত্রা', en: 'Chemical Treatment & Dosage' },
  treatment_organic: { bn: 'জৈব ও দেশীয় প্রতিকার', en: 'Organic & Cultural Treatment' },
  prevention_tips: { bn: 'ভবিষ্যত প্রতিরোধ ব্যবস্থা', en: 'Future Prevention Guidelines' },

  // Soil Test
  soil_header: { bn: 'মাটি ও পুষ্টি পরীক্ষা', en: 'Soil & Nutrient Testing' },
  soil_sub: { bn: 'মাটির উর্বরতা রক্ষা ও সঠিক সার ব্যবস্থাপনার বিজ্ঞানভিত্তিক সমাধান', en: 'Scientific guidance for soil fertility & fertilizer management' },

  // Weather Screen
  weather_header: { bn: 'আবহাওয়ার পূর্বাভাস', en: 'Weather Forecast' },
  weather_sub: { bn: 'লাইভ স্যাটেলাইট ও রাডার ডেটার ওপর ভিত্তি করে কৃষি আবহাওয়া', en: 'Live satellite and radar-based agricultural meteorology' },
  spray_alert_safe: { bn: 'আজ বালাইনাশক স্প্রে করার জন্য আবহাওয়া অনুকূল', en: 'Weather is favorable for pesticide spraying today' },
  spray_alert_rain: { bn: 'বৃষ্টির পূর্বাভাস রয়েছে, স্প্রে বা সেচ সাময়িক বন্ধ রাখুন', en: 'Rain expected: postpone spraying and heavy irrigation' },

  // Market Screen
  market_header: { bn: 'কৃষি বাজারদর', en: 'Agri Market Prices' },
  market_sub: { bn: 'দেশের বিভিন্ন পাইকারি ও খুচরা বাজারের সরাসরি দর ও প্রবণতা', en: 'Real-time wholesale and retail prices & price trends' },

  // Notifications
  notifications_header: { bn: 'জরুরি বার্তা ও নোটিফিকেশন', en: 'Alerts & Notifications' },
  no_notifications: { bn: 'কোনো নতুন নোটিফিকেশন নেই', en: 'No new notifications' },

  // Profile Screen
  profile_header: { bn: 'কৃষক প্রোফাইল', en: 'Farmer Profile' },
  farmer_details: { bn: 'ব্যক্তিগত তথ্য', en: 'Personal Details' },
  phone: { bn: 'মোবাইল নম্বর', en: 'Phone Number' },
  district: { bn: 'জেলা', en: 'District' },
  total_expenses_recorded: { bn: 'মোট সংরক্ষিত উপকরণের খরচ', en: 'Total Recorded Farm Expenses' },
  total_saved_records: { bn: 'সংরক্ষিত খতিয়ান সংখ্যা', en: 'Total Saved Records' },
  edit_profile_btn: { bn: 'প্রোফাইল সম্পাদনা করুন', en: 'Edit Profile' },
  logout_btn: { bn: 'লগআউট করুন', en: 'Log Out' },
  language_setting: { bn: 'ভাষা পরিবর্তন (Language)', en: 'Language Preference' },
  language_choice_desc: { bn: 'বাংলা অথবা ইংরেজি নির্বাচন করুন', en: 'Select Bangla or English' },
  bangla_lang: { bn: 'বাংলা (Bengali)', en: 'বাংলা (Bengali)' },
  english_lang: { bn: 'English (ইংরেজি)', en: 'English' },

  // Auth Screen
  app_name: { bn: 'কৃষি গাইড', en: 'Krishi Guide' },
  app_tagline: { bn: 'বাংলাদেশের ১৬.৫ মিলিয়ন প্রান্তিক কৃষকের নির্ভরযোগ্য ডিজিটাল প্ল্যাটফর্ম', en: 'AI-Powered Digital Farming & Credit Platform' },
  splash_login_btn: { bn: 'লগইন করুন', en: 'Sign In' },
  splash_register_btn: { bn: 'নতুন অ্যাকাউন্ট খুলুন', en: 'Create New Account' },
  login_title: { bn: 'কৃষক অ্যাকাউন্টে লগইন', en: 'Sign In to Your Account' },
  register_title: { bn: 'নতুন কৃষক রেজিস্ট্রেশন', en: 'Register as a Farmer' },
  phone_label: { bn: 'মোবাইল নম্বর', en: 'Mobile Phone Number' },
  phone_placeholder: { bn: '১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)', en: 'Enter 11-digit phone number (e.g. 017xxxxxxxx)' },
  password_label: { bn: 'পাসওয়ার্ড', en: 'Password' },
  password_placeholder: { bn: 'পাসওয়ার্ড দিন', en: 'Enter password' },
  name_label: { bn: 'আপনার পূর্ণ নাম', en: 'Your Full Name' },
  name_placeholder: { bn: 'যেমন: মোঃ আব্দুল করিম', en: 'e.g. Md. Abdul Karim' },
  district_label: { bn: 'আপনার জেলা নির্বাচন করুন', en: 'Select Your District' },
  submit_login: { bn: 'লগইন সম্পন্ন করুন', en: 'Sign In' },
  submit_register: { bn: 'রেজিস্ট্রেশন করুন', en: 'Complete Registration' },
  already_have_account: { bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন', en: 'Already have an account? Sign In' },
  need_account: { bn: 'অ্যাকাউন্ট নেই? নতুন অ্যাকাউন্ট খুলুন', en: "Don't have an account? Register" },

  // AI Chatbot
  chatbot_header: { bn: 'AI কৃষি বন্ধু', en: 'AI Agri Friend' },
  chatbot_sub: { bn: 'কৃষি বিশেষজ্ঞ এআই সহকারীর সাথে সরাসরি পরামর্শ', en: 'Direct advisory with Agriculture AI specialist' },
  chatbot_placeholder: { bn: 'আপনার ফসলের সমস্যা বা প্রশ্ন লিখুন...', en: 'Type your farming question or crop issue...' },
  voice_listening: { bn: 'কথা বলুন, শোনা হচ্ছে...', en: 'Listening... please speak' },
  suggested_questions_title: { bn: 'প্রস্তাবিত কিছু প্রশ্ন:', en: 'Suggested Questions:' },

  // Crop Info & Detail
  crop_directory_title: { bn: 'ফসল তথ্যভাণ্ডার', en: 'Crop Knowledge Directory' },
  crop_search_placeholder: { bn: 'ফসল খুঁজুন (যেমন: ধান, গম, টমেটো)...', en: 'Search crop (e.g. Rice, Wheat, Tomato)...' },
  all_categories: { bn: 'সকল ফসল', en: 'All Crops' },
  cat_cereal: { bn: 'দানা ফসল', en: 'Cereal Grains' },
  cat_vegetable: { bn: 'সবজি', en: 'Vegetables' },
  cat_fruit_cash: { bn: 'ফল ও অর্থকরী', en: 'Fruit & Cash Crops' },
  cat_oil_spice: { bn: 'তৈলবীজ ও মসলা', en: 'Oilseeds & Spices' },
  scientific_name: { bn: 'বৈজ্ঞানিক নাম', en: 'Scientific Name' },
  suitable_season: { bn: 'উপযুক্ত মৌসুম ও বপনকাল', en: 'Suitable Season & Planting Window' },
  soil_requirement: { bn: 'মাটির ধরন ও জমি প্রস্তুতি', en: 'Soil Type & Land Preparation' },
  seed_rate: { bn: 'বীজের হার ও চারা রোপণ', en: 'Seed Rate & Planting Spacing' },
  fertilizer_guideline_title: { bn: 'সুষম সার প্রয়োগ গাইড', en: 'Balanced Fertilizer Guide' },
  irrigation_management: { bn: 'সেচ ও পানি ব্যবস্থাপনা', en: 'Irrigation & Water Management' },
  pests_diseases: { bn: 'প্রধান ক্ষতিকর পোকা ও রোগবালাই', en: 'Common Pests & Crop Diseases' },
  harvesting_guide: { bn: 'ফসল সংগ্রহ ও পরিপক্বতার লক্ষণ', en: 'Harvesting & Maturity Indicators' },
  preservation_guide: { bn: 'সংরক্ষণ ও গুদামজাতকরণ', en: 'Storage & Post-Harvest Preservation' },
  calculate_yield_for_crop: { bn: 'এই ফসলের ফলন হিসাব করুন', en: 'Calculate Yield for This Crop' },

  // Inputs
  calc_title: { bn: 'সার ও উপকরণের খরচ ক্যালকুলেটর', en: 'Input & Fertilizer Cost Calculator' },
  calc_desc: { bn: 'আপনার জমির আয়তন অনুযায়ী প্রয়োজনীয় সার ও উপকরণের নিখুঁত হিসাব ও বাজেট করুন', en: 'Accurately budget fertilizers and inputs based on your land size' },
  item_name_col: { bn: 'উপকরণের নাম', en: 'Input Item' },
  category_col: { bn: 'ক্যাটাগরি', en: 'Category' },
  standard_dose_col: { bn: 'প্রস্তাবিত মাত্রা (বিঘা প্রতি)', en: 'Standard Rate (per bigha)' },
  official_price_col: { bn: 'সরকারি / বাজারদর', en: 'Govt / Market Rate' },
  quantity_needed_col: { bn: 'আপনার জমিতে প্রয়োজন', en: 'Quantity Needed' },
  estimated_cost_col: { bn: 'আনুমানিক খরচ', en: 'Estimated Cost' },
  selected_summary: { bn: 'নির্বাচিত উপকরণের মোট সারসংক্ষেপ', en: 'Total Selected Summary' },
  total_items: { bn: 'আইটেম সংখ্যা', en: 'Items Count' },
  approx_cost: { bn: 'মোট আনুমানিক খরচ', en: 'Approx Total Cost' },
  save_ledger_btn: { bn: 'খতিয়ানে সংরক্ষণ করুন', en: 'Save to Farm Ledger' },
  saved_history_empty: { bn: 'এখনও কোনো খরচ বা উপকরণ খতিয়ানে সংরক্ষণ করা হয়নি', en: 'No farm expense records saved in ledger yet' },
  save_success_notice: { bn: 'সফলভাবে খতিয়ানে সংরক্ষিত হয়েছে!', en: 'Successfully saved to farm ledger!' },

  // Soil Test
  soil_test_step1: { bn: 'মাটির পিএইচ (pH) মান', en: 'Soil pH Value' },
  soil_test_step2: { bn: 'প্রধান পুষ্টি উপাদান পরীক্ষা', en: 'Primary Nutrient Analysis' },
  soil_ph_label: { bn: 'মাটির অম্লত্ব / ক্ষারত্ব (pH)', en: 'Soil Acidity / Alkalinity (pH)' },
  nitrogen_level: { bn: 'নাইট্রোজেন (N)', en: 'Nitrogen (N)' },
  phosphorus_level: { bn: 'ফসফরাস (P)', en: 'Phosphorus (P)' },
  potassium_level: { bn: 'পটাশিয়াম (K)', en: 'Potassium (K)' },
  organic_matter: { bn: 'জৈব পদার্থ (Organic Matter)', en: 'Organic Matter' },
  soil_type_label: { bn: 'মাটির বুনট বা গঠন', en: 'Soil Texture / Type' },
  test_result_title: { bn: 'মাটি পরীক্ষার ফলাফল ও সার সুপারিশ', en: 'Soil Test Result & Fertilizer Recommendations' },

  // Disease Scanner
  camera_guide_title: { bn: 'সঠিক ছবি তোলার নির্দেশিকা', en: 'Photo Capture Guidelines' },
  camera_guide_desc: { bn: 'আক্রান্ত পাতার স্পষ্ট ও ফোকাসযুক্ত ছবি তুললে এআই ৯৮% নির্ভুল ফলাফল দেয়', en: 'A clear, focused photo of infected foliage gives 98% diagnosis accuracy' },
  capture_btn: { bn: 'ছবি তুলুন', en: 'Capture Photo' },
  upload_gallery_btn: { bn: 'গ্যালারি থেকে আপলোড', en: 'Upload from Gallery' },
  confidence_score: { bn: 'AI নির্ভরতা স্কোর', en: 'AI Confidence Score' },
  severity_level: { bn: 'আক্রমণের তীব্রতা', en: 'Infestation Severity' },
  symptoms_label: { bn: 'দৃশ্যমান লক্ষণসমূহ', en: 'Observed Symptoms' },
  cause_label: { bn: 'রোগের কারণ ও বিস্তার', en: 'Disease Cause & Transmission' },
  expert_advice_title: { bn: 'বিশেষজ্ঞ কৃষি কর্মকর্তার পরামর্শ', en: 'Agri Specialist Advisory' },
  ask_assistant_about_disease: { bn: 'এই রোগ সম্পর্কে AI কৃষি বন্ধুকে জিজ্ঞাসা করুন', en: 'Ask AI Assistant about this Disease' },

  // Common UI
  close: { bn: 'বন্ধ করুন', en: 'Close' },
  back: { bn: 'ফিরে যান', en: 'Back' },
  save: { bn: 'সংরক্ষণ করুন', en: 'Save' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },
  loading: { bn: 'লোড হচ্ছে...', en: 'Loading...' },
  success: { bn: 'সফলভাবে সম্পন্ন হয়েছে', en: 'Successfully Completed' },
  taka: { bn: '৳', en: '৳' },
  per_kg: { bn: 'প্রতি কেজি', en: 'per kg' },
  per_maund: { bn: 'প্রতি মণ', en: 'per maund' },
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  formatNumber: (value: number | string) => string;
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('krishi_app_language');
      if (saved === 'en' || saved === 'bn') return saved;
    } catch (_) {}
    return 'bn'; // Default to Bengali
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('krishi_app_language', lang);
    } catch (_) {}
  };

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const item = TRANSLATIONS[key];
    if (!item) {
      return fallback || key;
    }
    return item[language] || item.bn || fallback || key;
  };

  // Convert numbers to Bengali digits if language === 'bn'
  const formatNumber = (value: number | string): string => {
    const str = String(value);
    if (language === 'en') return str;
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.replace(/[0-9]/g, (digit) => bnDigits[Number(digit)] || digit);
  };

  const formatCurrency = (amount: number): string => {
    if (language === 'en') {
      return `৳ ${amount.toLocaleString('en-US')}`;
    }
    return `৳ ${formatNumber(amount.toLocaleString('en-US'))}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatNumber,
        formatCurrency,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
