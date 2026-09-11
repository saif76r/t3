export interface DailyUpdateItem {
  id: string;
  category: 'weather' | 'crop' | 'market' | 'pest' | 'notice';
  categoryLabel: string;
  categoryColor: string; // Tailwind color class for badge
  title: string;
  summary: string;
  fullDetails: string[];
  actionSteps: string[];
  publishedTime: string;
  image: string;
  relatedAction?: {
    label: string;
    tabTarget?: 'weather' | 'market' | 'advisor' | 'disease';
    cropId?: string;
  };
}

// Helper to convert English digits to Bengali digits
export function toBengaliNumeral(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bnDigits[Number(w)]);
}

// Helper for formatted today's Date (Bengali or English)
export function getTodayBengaliDate(lang: 'bn' | 'en' = 'bn'): { fullDateBn: string; banglaMonth: string; season: string } {
  const now = new Date();
  
  if (lang === 'en') {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const fullDateBn = now.toLocaleDateString('en-US', options);

    const month = now.getMonth();
    let banglaMonth = 'Bhadra';
    let season = 'Autumn';

    if (month === 0) { banglaMonth = 'Poush-Magh'; season = 'Winter'; }
    else if (month === 1) { banglaMonth = 'Magh-Falgun'; season = 'Winter/Spring'; }
    else if (month === 2) { banglaMonth = 'Falgun-Chaitra'; season = 'Spring'; }
    else if (month === 3) { banglaMonth = 'Chaitra-Baishakh'; season = 'Summer'; }
    else if (month === 4) { banglaMonth = 'Baishakh-Jaishtha'; season = 'Summer'; }
    else if (month === 5) { banglaMonth = 'Jaishtha-Ashar'; season = 'Monsoon'; }
    else if (month === 6) { banglaMonth = 'Ashar-Shraban'; season = 'Monsoon'; }
    else if (month === 7) { banglaMonth = 'Shraban-Bhadra'; season = 'Monsoon/Autumn'; }
    else if (month === 8) { banglaMonth = 'Bhadra-Ashwin'; season = 'Autumn'; }
    else if (month === 9) { banglaMonth = 'Ashwin-Kartik'; season = 'Late Autumn'; }
    else if (month === 10) { banglaMonth = 'Kartik-Agrahayan'; season = 'Late Autumn'; }
    else if (month === 11) { banglaMonth = 'Agrahayan-Poush'; season = 'Winter'; }

    return { fullDateBn, banglaMonth, season };
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const fullDateBn = now.toLocaleDateString('bn-BD', options);

  // Approximate Bengali Month & Season based on Gregorian Month
  const month = now.getMonth(); // 0 = Jan, 8 = Sept
  let banglaMonth = 'ভাদ্র';
  let season = 'শরৎকাল';

  if (month === 0) { banglaMonth = 'পৌষ-মাঘ'; season = 'শীতকাল'; }
  else if (month === 1) { banglaMonth = 'মাঘ-ফাল্গুন'; season = 'শীত/বসন্তকাল'; }
  else if (month === 2) { banglaMonth = 'ফাল্গুন-চৈত্র'; season = 'বসন্তকাল'; }
  else if (month === 3) { banglaMonth = 'চৈত্র-বৈশাখ'; season = 'গ্রীষ্মকাল'; }
  else if (month === 4) { banglaMonth = 'বৈশাখ-জ্যৈষ্ঠ'; season = 'গ্রীষ্মকাল'; }
  else if (month === 5) { banglaMonth = 'জ্যৈষ্ঠ-আষাঢ়'; season = 'বর্ষাকাল'; }
  else if (month === 6) { banglaMonth = 'আষাঢ়-শ্রাবণ'; season = 'বর্ষাকাল'; }
  else if (month === 7) { banglaMonth = 'শ্রাবণ-ভাদ্র'; season = 'বর্ষা/শরৎকাল'; }
  else if (month === 8) { banglaMonth = 'ভাদ্র-আশ্বিন'; season = 'শরৎকাল'; }
  else if (month === 9) { banglaMonth = 'আশ্বিন-কার্তিক'; season = 'হেমন্তকাল'; }
  else if (month === 10) { banglaMonth = 'কার্তিক-অগ্রহায়ণ'; season = 'হেমন্তকাল'; }
  else if (month === 11) { banglaMonth = 'অগ্রহায়ণ-পৌষ'; season = 'শীতকাল'; }

  return { fullDateBn, banglaMonth, season };
}

// Generate real contextual daily updates based on district, live weather condition, and language
export function getRealDailyUpdates(
  districtName: string = 'ঢাকা',
  weatherCondition?: string,
  temp?: number,
  lang: 'bn' | 'en' = 'bn'
): DailyUpdateItem[] {
  const isRainy = weatherCondition && (weatherCondition.includes('বৃষ্টি') || weatherCondition.toLowerCase().includes('rain') || weatherCondition.includes('মেঘ') || weatherCondition.toLowerCase().includes('cloud'));
  
  if (lang === 'en') {
    const tempStr = temp ? `${Math.round(temp)}°C` : '32°C';
    return [
      {
        id: 'daily-weather-alert',
        category: 'weather',
        categoryLabel: "Today's Weather & Irrigation",
        categoryColor: isRainy ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-amber-100 text-amber-800 border-amber-200',
        title: isRainy 
          ? `Rain Forecast in ${districtName}: Suspend Heavy Field Irrigation`
          : `Current Temperature (${tempStr}) & Weather: Soil Moisture Preservation Advisory`,
        summary: isRainy
          ? 'Cloudy skies and rain expected today. Ensure field bunds have cleared drainage furrows to prevent waterlogging.'
          : 'Avoid foliar spraying during intense midday sunshine. Perform fertilization and spraying in the late afternoon.',
        fullDetails: [
          `Special agricultural weather bulletin for farmland across ${districtName} and nearby zones.`,
          isRainy
            ? 'Foliar spraying or urea applied immediately before or during rain will wash away and cause fertilizer waste.'
            : 'Adequate soil moisture is critical for tillering and seedling growth. Provide light furrow irrigation if needed.',
          'High relative humidity creates favorable conditions for fungal blast and blight infections.'
        ],
        actionSteps: [
          isRainy ? 'Clear field drainage outlets to remove excess standing water.' : 'Apply light irrigation to crop roots in the late afternoon.',
          'Avoid applying fertilizers or insecticides while it is actively raining.',
          'Check the dedicated Weather screen for 7-day forecasts and hourly alerts.'
        ],
        publishedTime: 'Today 7:15 AM',
        image: isRainy
          ? 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=300&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&auto=format&fit=crop&q=80',
        relatedAction: {
          label: 'View Live Weather',
          tabTarget: 'weather'
        }
      },
      {
        id: 'daily-rice-advisory',
        category: 'crop',
        categoryLabel: 'Seasonal Crop Care',
        categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        title: 'Aman Rice Tillering & Panicle Stage: Final Split of Urea and Potash',
        summary: 'If 30-35 days have passed since transplanting, apply the second split of Urea and 5 kg MOP per bigha.',
        fullDetails: [
          'Most fields are currently in active tillering and early panicle initiation stage.',
          'Maintaining optimal soil moisture is vital. Keep 2-3 inches of standing water without letting soil crack from drought.',
          'Potash (MOP) fertilizer strengthens plant stems and builds resilience against pests and lodging.'
        ],
        actionSteps: [
          'Weed fields thoroughly before applying topdress fertilizers.',
          'Broadcast fertilizer evenly when there is shallow water in the field.',
          'If symptoms of zinc or sulphur deficiency appear, spray chelated zinc per guidelines.'
        ],
        publishedTime: 'Today 8:00 AM',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
        relatedAction: {
          label: 'Full Rice Guide',
          cropId: 'rice'
        }
      },
      {
        id: 'daily-market-update',
        category: 'market',
        categoryLabel: "Today's Market Bulletin",
        categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        title: 'Wholesale Mandi Prices: Green Chili, Potato & Coarse Paddy Remain Active',
        summary: 'In major markets, green chili is steady at 120-130 BDT/kg while BRRI-28 and BRRI-29 wholesale prices show stable demand.',
        fullDetails: [
          'Latest wholesale prices gathered from the Department of Agricultural Marketing (DAM) and regional trade hubs.',
          'Despite seasonal weather fluctuations, potato cold-storage releases and onion supplies remain balanced.',
          'Direct marketing at farmer collection centers helps capture higher profit margins without intermediaries.'
        ],
        actionSteps: [
          'Clean, dry, and grade harvested crops to earn 5-10% higher market prices.',
          'Stay updated on daily wholesale rate shifts across districts.',
          'Visit the Market screen to inspect commodity prices in your region.'
        ],
        publishedTime: 'Today 9:30 AM',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
        relatedAction: {
          label: 'Check Market Rates',
          tabTarget: 'market'
        }
      },
      {
        id: 'daily-pest-alert',
        category: 'pest',
        categoryLabel: 'Pest & Disease Warning',
        categoryColor: 'bg-rose-100 text-rose-800 border-rose-200',
        title: 'Brown Planthopper (BPH) & Leaf Folder Infestation Alert',
        summary: 'Warm, humid weather promotes BPH egg laying at the base of rice plants. Inspect root collars and practice bird perching.',
        fullDetails: [
          'Advisory issued by the Entomology Division of the Department of Agricultural Extension (DAE).',
          'Brown Planthoppers multiply rapidly and suck plant sap, leading to sudden circular wilting known as "hopper burn".',
          'Create open alleyways (bili) every 8-10 rows to allow sunlight and aeration down to the plant base.'
        ],
        actionSteps: [
          'Erect 8-10 bamboo perches per bigha for insect-eating birds.',
          'Upon observing threshold infestation, apply recommended Pymetrozine or Dinotefuran directed at plant bases.',
          'Scan affected leaf symptoms with our AI Camera for instant diagnosis.'
        ],
        publishedTime: 'Today 10:15 AM',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80',
        relatedAction: {
          label: 'Scan Leaf with AI',
          tabTarget: 'disease'
        }
      }
    ];
  }

  const tempStr = temp ? `${toBengaliNumeral(Math.round(temp))}°C` : '৩২°C';

  return [
    {
      id: 'daily-weather-alert',
      category: 'weather',
      categoryLabel: 'আজকের আবহাওয়া ও সেচ',
      categoryColor: isRainy ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-amber-100 text-amber-800 border-amber-200',
      title: isRainy 
        ? `${districtName} অঞ্চলে বৃষ্টির পূর্বাভাস: জমিতে অতিরিক্ত সেচ বন্ধ রাখুন`
        : `আজকের তাপমাত্রা (${tempStr}) ও আবহাওয়া: ফসলে আর্দ্রতা ধরে রাখার পরামর্শ`,
      summary: isRainy
        ? 'আজ আকাশ মেঘলা এবং বৃষ্টির সম্ভাবনা রয়েছে। জমির আইল কেটে জমে থাকা অতিরিক্ত পানি বের করার নিষ্কাশন নালা প্রস্তুত রাখুন।'
        : 'বর্তমান তাপমাত্রা ও রোদের প্রখরতায় দুপুরের তীব্র রোদে কীটনাশক স্প্রে করবেন না। বিকেল বেলা স্প্রে ও সেচ প্রদান করুন।',
      fullDetails: [
        `আজ ${districtName} ও পার্শ্ববর্তী এলাকার কৃষিজমির জন্য বিশেষ আবহাওয়া বুলেটিন।`,
        isRainy
          ? 'বৃষ্টির সময় বা বৃষ্টির পরপরই ইউরিয়া বা তরল কীটনাশক স্প্রে করলে তা ধুয়ে নষ্ট হয়ে যেতে পারে।'
          : 'মাটিতে পরিমিত আর্দ্রতা না থাকলে ধানের কুশি ও সবজির বৃদ্ধি ব্যাহত হতে পারে। প্রয়োজন অনুযায়ী হালকা সেচ দিন।',
        'বাতাসের আর্দ্রতা বেশি থাকায় পাতা ঝলসানো বা ছত্রাক সংক্রমণের অনুকূল পরিবেশ তৈরি হতে পারে।'
      ],
      actionSteps: [
        isRainy ? 'জমির অতিরিক্ত পানি নিষ্কাশনের ড্রেন পরিষ্কার করুন।' : 'বিকেলে গাছের গোড়ায় পরিমিত সেচ দিন।',
        'বৃষ্টি চলাকালীন কোনো ধরনের সার বা বালাইনাশক স্প্রে করবেন না।',
        'সেচ বা আবহাওয়ার আরও পূর্বাভাস জানতে আবহাওয়া স্ক্রিন চেক করুন।'
      ],
      publishedTime: 'আজ সকাল ৭:১৫ মি.',
      image: isRainy
        ? 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&auto=format&fit=crop&q=80',
      relatedAction: {
        label: 'লাইভ আবহাওয়া দেখুন',
        tabTarget: 'weather'
      }
    },
    {
      id: 'daily-rice-advisory',
      category: 'crop',
      categoryLabel: 'চলতি মৌসুম পরিচর্যা',
      categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'আমন ধানের কুশি ও থোড় পর্যায়: ইউরিয়া ও পটাশের শেষ কিস্তি প্রয়োগের সময়',
      summary: 'ধান রোপণের ৩০-৩৫ দিন পার হলে দ্বিতীয় কিস্তির ইউরিয়া ও বিঘাপ্রতি ৫ কেজি এমওপি সার উপরিপ্রয়োগ সম্পন্ন করুন।',
      fullDetails: [
        'বর্তমানে বেশিরভাগ জমিতে রোপা আমন ধান দ্রুত বর্ধনশীল কুশি ও কাইচথোড় পর্যায়ে রয়েছে।',
        'এই সময়ে জমিতে পরিমিত আর্দ্রতা বজায় রাখা অত্যন্ত জরুরি। জমিতে ২-৩ ইঞ্চি পানি ধরে রাখুন, তবে জমি অতিরিক্ত শুকিয়ে ফেটে যেতে দেবেন না।',
        'গাছের কাণ্ড শক্ত করতে এবং রোগ প্রতিরোধ ক্ষমতা বাড়াতে পটাশ (MOP) সার খুবই কার্যকর ভূমিকা রাখে।'
      ],
      actionSteps: [
        'ইউরিয়া সার প্রয়োগের পূর্বে জমির আগাছা ভালোভাবে পরিষ্কার করে নিন।',
        'জমিতে হালকা পানি থাকা অবস্থায় ছাই বা মাটির সাথে মিশিয়ে সার সমানভাবে ছিটান।',
        'জমিতে গন্ধক বা জিংকের ঘাটতি থাকলে অনুমোদিত মাত্রায় জিংক স্প্রে করুন।'
      ],
      publishedTime: 'আজ সকাল ৮:০০ টা',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
      relatedAction: {
        label: 'ধানের পূর্ণাঙ্গ গাইড',
        cropId: 'rice'
      }
    },
    {
      id: 'daily-market-update',
      category: 'market',
      categoryLabel: 'আজকের বাজারদর বুলেটিন',
      categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      title: 'আজকের পাইকারি আড়ত দর: কাঁচামরিচ, আলু ও মোটা ধানের চাহিদা স্থিতিশীল',
      summary: 'আজ কারওয়ান বাজার ও স্থানীয় হাটগুলোতে কাঁচামরিচ কেজিপ্রতি ১২০-১৩০ টাকা এবং ব্রি-২৮ ও ব্রি-২৯ চালের পাইকারি দর ঊর্ধ্বমুখী।',
      fullDetails: [
        'আজকের কৃষি বিপণন অধিদপ্তর ও পাইকারি আড়ত থেকে সংগৃহীত সর্বশেষ বাজার দর।',
        'বর্ষা ও আবহাওয়ার কারণে সবজির সরবরাহে কিছুটা ওঠানামা থাকলেও আলুর কোল্ড স্টোরেজ দর ও স্থানীয় বাজারে পেঁয়াজের দর স্থিতিশীল রয়েছে।',
        'মধ্যস্বত্বভোগী এড়াতে সরাসরি স্থানীয় কৃষক হাটে বা ডিজিটাল প্ল্যাটফর্মে বিক্রির সুযোগ নিন।'
      ],
      actionSteps: [
        'ফসল তোলার পর শুকিয়ে গ্রেডিং করে বিক্রি করলে ৫-১০% বেশি দাম পাওয়া যায়।',
        'বাজারের ওঠানামা সম্পর্কে প্রতিদিন আপডেট তথ্য রাখুন।',
        'আপনার জেলার সুনির্দিষ্ট পণ্যের বাজারদর দেখতে বাজারদর স্ক্রিনে যান।'
      ],
      publishedTime: 'আজ সকাল ৯:৩০ মি.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
      relatedAction: {
        label: 'সকল বাজারদর দেখুন',
        tabTarget: 'market'
      }
    },
    {
      id: 'daily-pest-alert',
      category: 'pest',
      categoryLabel: 'বালাই ও রোগ সতর্কতা',
      categoryColor: 'bg-rose-100 text-rose-800 border-rose-200',
      title: 'বাদামি গাছফড়িং (কারেন্ট পোকা) ও পাতা মোড়ানো পোকার প্রাদুর্ভাবের বিরুদ্ধে সতর্কতা',
      summary: 'আর্দ্র আবহাওয়ায় ধানের গোড়ায় বাদামি গাছফড়িং ডিম পাড়তে পারে। ক্ষেতের মাঝে ডালপালা পুঁতে পার্চিং করুন ও গোড়া পরীক্ষা করুন।',
      fullDetails: [
        'কৃষি সম্প্রসারণ অধিদপ্তরের (DAE) কীটতত্ত্ব উইং থেকে প্রকাশিত আজকের বিশেষ সতর্কবার্তা।',
        'বাদামি গাছফড়িং বা কারেন্ট পোকা দ্রুত বংশবৃদ্ধি করে গাছের রস চুষে নেয় এবং একরাতেই গাছ পুড়িয়ে মেরে ফেলতে পারে (হপার বার্ন)।',
        'গাছের গোড়ায় আলো-বাতাস চলাচলের জন্য প্রতি ৮-১০ লাইন পর পর একটি করে ফাঁকা লাইন (বিলি কাটা) তৈরি করে দিন।'
      ],
      actionSteps: [
        'ক্ষেতে বিঘাপ্রতি ৮-১০টি বাঁশের কঞ্চি বা গাছের ডাল পুঁতে পাখি বসার ব্যবস্থা (পার্চিং) করুন।',
        'আক্রমণ দেখা দিলে পাইমেট্রোজিন বা ডিনেটেফুরান গ্রুপের কীটনাশক অনুমোদিত মাত্রায় গাছের গোড়ায় স্প্রে করুন।',
        'কোনো লক্ষণ দেখা দিলে আমাদের এআই ক্যামেরা দিয়ে পাতার ছবি স্ক্যান করে নিশ্চিত হন।'
      ],
      publishedTime: 'আজ সকাল ১০:১৫ মি.',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80',
      relatedAction: {
        label: 'রোগ স্ক্যান করুন',
        tabTarget: 'disease'
      }
    }
  ];
}
