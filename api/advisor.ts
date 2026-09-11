import { GoogleGenAI } from "@google/genai";

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function toBengaliNumeral(n: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (w) => bnDigits[Number(w)]);
}

function formatBengaliAmount(amount: number): string {
  const str = Math.round(amount).toString();
  if (str.length <= 3) return toBengaliNumeral(str);
  const lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return toBengaliNumeral(formattedOthers + "," + lastThree);
}

const CROP_BASE_STATS: Record<string, { nameBn: string; nameEn: string; baseYield: number; maxYield: number; pricePerTon: number }> = {
  "ধান": { nameBn: "ধান", nameEn: "Rice (Paddy)", baseYield: 4.2, maxYield: 5.4, pricePerTon: 32000 },
  "আলু": { nameBn: "আলু", nameEn: "Potato", baseYield: 18.0, maxYield: 24.5, pricePerTon: 18000 },
  "সরিষা": { nameBn: "সরিষা", nameEn: "Mustard", baseYield: 1.4, maxYield: 1.9, pricePerTon: 75000 },
  "ভুট্টা": { nameBn: "ভুট্টা", nameEn: "Maize (Corn)", baseYield: 7.5, maxYield: 9.8, pricePerTon: 22000 },
  "বেগুন": { nameBn: "বেগুন", nameEn: "Eggplant (Brinjal)", baseYield: 14.0, maxYield: 20.0, pricePerTon: 35000 },
  "টমেটো": { nameBn: "টমেটো", nameEn: "Tomato", baseYield: 22.0, maxYield: 32.0, pricePerTon: 30000 },
  "ফুলকপি": { nameBn: "ফুলকপি", nameEn: "Cauliflower", baseYield: 12.0, maxYield: 18.0, pricePerTon: 28000 },
  "পেঁপে": { nameBn: "পেঁপে", nameEn: "Papaya", baseYield: 25.0, maxYield: 38.0, pricePerTon: 25000 },
  "কলা": { nameBn: "কলা", nameEn: "Banana", baseYield: 20.0, maxYield: 30.0, pricePerTon: 26000 },
  "গম": { nameBn: "গম", nameEn: "Wheat", baseYield: 3.2, maxYield: 4.2, pricePerTon: 35000 },
  "পান": { nameBn: "পান", nameEn: "Betel Leaf", baseYield: 3.5, maxYield: 5.2, pricePerTon: 90000 },
};

function matchCrop(cropInput: string) {
  const input = String(cropInput || "ধান").toLowerCase();
  for (const [key, val] of Object.entries(CROP_BASE_STATS)) {
    if (input.includes(key.toLowerCase()) || input.includes(val.nameEn.toLowerCase())) {
      return { key, ...val };
    }
  }
  return { key: "ধান", ...CROP_BASE_STATS["ধান"] };
}

function calculateFallbackAdvisorData(data: any) {
  const isEnglish = data.language === "en";
  const cropData = matchCrop(data.cropType);
  const cropName = isEnglish ? cropData.nameEn : cropData.nameBn;
  const variety = data.cropVariety || (isEnglish ? "HYV Certified" : "উফশী জাত");
  const landSize = Number(data.landSize) || 2;
  const landUnit = data.landUnit || (isEnglish ? "Acre" : "একর");
  const soil = String(data.soilType || "");
  const irrigation = String(data.irrigationStatus || "");
  const seedQty = Number(data.seedQuantity) || 8;

  let score = 85;
  if (soil.includes("বেলে") || soil.toLowerCase().includes("sand")) score -= 8;
  if (irrigation.includes("সংকট") || irrigation.toLowerCase().includes("deficit")) score -= 12;
  if (seedQty < 6 || seedQty > 14) score -= 5;
  score = Math.max(52, Math.min(96, score));

  const yieldRatio = score / 100;
  const currentYield = Number((cropData.baseYield * (0.84 + yieldRatio * 0.16)).toFixed(1));
  const maxYield = Number(cropData.maxYield.toFixed(1));

  const landMultiplier = (landUnit === "বিঘা" || String(landUnit).toLowerCase() === "bigha") ? landSize * 0.33 : landSize;
  const yieldDiffTons = Math.max(0.4, (maxYield - currentYield) * landMultiplier);
  const potentialProfit = Math.round(yieldDiffTons * cropData.pricePerTon);

  const statusText = isEnglish
    ? (score >= 80 ? "Very Good" : score >= 65 ? "Satisfactory" : "Needs Improvement")
    : (score >= 80 ? "খুব ভালো" : score >= 65 ? "সন্তোষজনক" : "উন্নতি প্রয়োজন");

  const creditStatus = isEnglish
    ? (score >= 75 ? "Prime" : score >= 60 ? "Moderate" : "High Risk")
    : (score >= 75 ? "ভাল" : score >= 60 ? "মাঝারি" : "উচ্চ ঝুঁকি");

  const formattedProfit = isEnglish
    ? potentialProfit.toLocaleString("en-US")
    : formatBengaliAmount(potentialProfit);

  const yieldUnit = (landUnit === "বিঘা" || String(landUnit).toLowerCase() === "bigha")
    ? (isEnglish ? "Maund / Bigha" : "মণ/বিঘা")
    : (isEnglish ? "Ton / Acre" : "টন/একর");

  // Specialized crop advice
  let diseaseActionEn = `Apply recommended systemic fungicide (e.g. Tricyclazole or Azoxystrobin) in late afternoon to protect ${cropName} against foliar blast and leaf blight.`;
  let diseaseActionBn = `${cropName} এর ব্লাস্ট ও পাতাপোড়া রোগ প্রতিরোধে ট্রাইসাইক্লাজোল বা মেনকোজেব অনুমোদিত মাত্রায় বিকেল বেলা স্প্রে করুন।`;
  let alertEn = `Humid weather increases disease susceptibility for ${cropName}; inspect plants every 2 days.`;
  let alertBn = `বর্তমান আর্দ্র আবহাওয়ায় ${cropName}-এ রোগবালাইয়ের ঝুঁকি রয়েছে; নিয়মিত ক্ষেত পরিদর্শন করুন।`;

  if (cropData.key === "আলু") {
    diseaseActionEn = "Spray Mancozeb 75% WP or Ridomil Gold proactively before cloudy foggy days to safeguard potatoes from Late Blight.";
    diseaseActionBn = "কুয়াশাচ্ছন্ন আবহাওয়ায় আলুর নাবী ধসা (Late Blight) প্রতিরোধে ডাইথেন এম-৪৫ বা রিডোমিল গোল্ড আগাম স্প্রে করুন।";
    alertEn = "Dense fog and high humidity trigger late blight spores in potato fields.";
    alertBn = "টানা কুয়াশা ও শিশিরে আলুর নাবী ধসা মহামারি আকার নিতে পারে; আগাম ছত্রাকনাশক প্রয়োগ করুন।";
  } else if (cropData.key === "বেগুন") {
    diseaseActionEn = "Install sex pheromone traps for brinjal shoot and fruit borer; spray Carbendazim at plant collar for root rot.";
    diseaseActionBn = "বেগুনের ডগা ও ফল ছিদ্রকারী পোকা দমনে সেক্স ফেরোমোন ফাঁদ ব্যবহার করুন এবং গোড়া পচায় কার্বেনডাজিম স্প্রে করুন।";
    alertEn = "Warm humid conditions favor whitefly and shoot borer infestation in eggplant.";
    alertBn = "মেঘলা আবহাওয়ায় বেগুনে ডগা ছিদ্রকারী পোকা ও সাদা মাছি আক্রমণের ঝুঁকি রয়েছে।";
  } else if (cropData.key === "টমেটো") {
    diseaseActionEn = "Apply Ridomil Gold or Secure 600 WG against late blight; balance potassium nutrition for healthy firm tomatoes.";
    diseaseActionBn = "টমেটোর নাবী ধসা ও পাতা কোঁকড়ানো রোগ প্রতিরোধে রিডোমিল গোল্ড ও সুষম পটাশ সার ব্যবহার করুন।";
    alertEn = "Overly damp soil paired with cool nights stimulates fungal tomato blight.";
    alertBn = "ঘন কুয়াশা ও স্যাঁতসেঁতে মাটিতে টমেটোর পাতা ও ফলে ধসা রোগ ছড়াতে পারে।";
  } else if (cropData.key === "ভুট্টা") {
    diseaseActionEn = "Scout for Fall Armyworm egg masses and feeding holes; apply Spinosad or Emamectin Benzoate directly into whorls.";
    diseaseActionBn = "ভুট্টার ফল আর্মিওয়ার্ম পোকা দমনে স্পাইনোস্যাড বা এমাভেকটিন বেনজোয়েট পাতার খোলে স্প্রে করুন।";
    alertEn = "Fall Armyworm actively infests young maize leaves; scout early in the morning.";
    alertBn = "ভুট্টার পাতায় ফল আর্মিওয়ার্মের আক্রমণ লক্ষ্য করলে দ্রুত কার্যকর ব্যবস্থা নিন।";
  } else if (cropData.key === "সরিষা") {
    diseaseActionEn = "Spray Rovral 50 WP for Alternaria leaf blight; spray Malathion 57 EC in late afternoon to curb aphids during bloom.";
    diseaseActionBn = "সরিষার অল্টারনারিয়া ব্লাইট রোগ প্রতিরোধে রোভরাল স্প্রে করুন এবং ফুল আসার পর জাবপোকা দমনে ম্যালাথিয়ন দিন।";
    alertEn = "Foggy mornings facilitate rapid aphid colonization on mustard flowers.";
    alertBn = "কুয়াশাচ্ছন্ন আবহাওয়ায় সরিষা ক্ষেতে জাবপোকার প্রাদুর্ভাব হতে পারে।";
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
    ai_recommendations: isEnglish
      ? [
          {
            category: "Disease Control",
            title: "Fungicide & Pest Management",
            action: diseaseActionEn,
          },
          {
            category: "Fertilizer Application",
            title: "Balanced Nutrients & Top-Dressing",
            action: `For variety ${variety}, apply recommended DAP and Potash, and schedule Urea top-dressing in 2 splits during active tillering.`,
          },
          {
            category: "Irrigation Management",
            title: "Moisture Depth & Drainage",
            action: "Maintain 2-3 inches of optimal standing water or moisture; ensure prompt drainage after excess downpours.",
          },
        ]
      : [
          {
            category: "রোগ নিয়ন্ত্রণ",
            title: "ছত্রাক ও বালাই দমন",
            action: diseaseActionBn,
          },
          {
            category: "সার প্রয়োগ",
            title: "সুষম সার ও উপরি প্রয়োগ",
            action: `নির্বাচিত জাত ${variety}-এর জন্য অনুমোদিত মাত্রায় ডিএপি ও পটাশ দিন, এবং বৃদ্ধির ধাপে ইউরিয়া উপরি প্রয়োগ করুন।`,
          },
          {
            category: "সেচ ব্যবস্থাপনা",
            title: "পরিমিত পানি ও নিষ্কাশন",
            action: "জমিতে অতিরিক্ত পানি জমিয়ে না রেখে মাটির উপযুক্ত রস ও আর্দ্রতা বজায় রাখুন এবং বৃষ্টির পর পানি নিষ্কাশন করুন।",
          },
        ],
    daily_tasks: isEnglish
      ? [
          { task: "Soil Moisture Check & Irrigation", recommended: true },
          { task: "Pest & Disease Monitoring", recommended: true },
          { task: "Weeding & Field Aeration", recommended: true },
        ]
      : [
          { task: "মাটির আর্দ্রতা পরীক্ষা ও সেচ", recommended: true },
          { task: "রোগ ও পোকা পর্যবেক্ষণ", recommended: true },
          { task: "আগাছা দমন ও মাটি নিড়ানি", recommended: true },
        ],
    alerts: isEnglish
      ? [
          alertEn,
          "Check 3-day local weather forecast before planning field irrigation or agrochemical applications.",
        ]
      : [
          alertBn,
          "জমিতে রাসায়নিক স্প্রে বা সার প্রয়োগের পূর্বে স্থানীয় ৩ দিনের আবহাওয়ার পূর্বাভাস জেনে নিন।",
        ],
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout of ${ms}ms exceeded`)), ms)
    ),
  ]);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let data = req.body;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = {};
    }
  }
  data = data || {};
  const isEnglish = data.language === "en";

  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(200).json(calculateFallbackAdvisorData(data));
    }

    const prompt = isEnglish
      ? `You are an expert Agricultural AI Advisor tailored for Bangladeshi farmers.
Analyze farm parameters:
- Crop Type: ${data.cropType || "Rice (Paddy)"}
- Crop Variety: ${data.cropVariety || "BRRI 28"}
- Season: ${data.season || "Aman"}
- Land Size & Soil: ${data.landSize || 2} ${data.landUnit || "Acre"}, ${data.soilType || "Loam"}
- Sowing Date: ${data.sowingDate || "2026-05-15"}, Seed Quantity: ${data.seedQuantity || 8} kg
- Irrigation: ${data.irrigationStatus || "Regular Irrigation"}
- Crop Stage: ${data.cropStage || "Tillering Stage"}
- Region: ${data.region || "Rangpur, Kurigram"}
- Notes: ${data.notes || "Standard fertilizer applied"}

CRITICAL RULE:
The ENTIRE response MUST be strictly in English. Absolutely NO Bengali script anywhere.
Respond strictly in valid JSON matching this schema:
{
  "score_analysis": {
    "score": 85,
    "max_score": 100,
    "status_text": "Very Good",
    "credit_status": "Prime"
  },
  "yield_prediction": {
    "current_yield": 4.2,
    "max_yield": 5.4,
    "unit": "Ton / Acre"
  },
  "financials": {
    "potential_extra_profit_bdt": 120000,
    "formatted_extra_profit": "120,000"
  },
  "ai_recommendations": [
    {
      "category": "Disease Control",
      "title": "Fungicide Application",
      "action": "Spray Tricyclazole in late afternoon to protect against blast disease."
    },
    {
      "category": "Fertilizer Application",
      "title": "Top Dressing Urea",
      "action": "Apply second split of urea during tillering stage."
    },
    {
      "category": "Irrigation Management",
      "title": "Water Level Regulation",
      "action": "Maintain 2-3 inches of standing water without excess stagnancy."
    }
  ],
  "daily_tasks": [
    {"task": "Soil Moisture Check & Irrigation", "recommended": true},
    {"task": "Pest & Disease Monitoring", "recommended": true},
    {"task": "Weeding & Cleaning", "recommended": true}
  ],
  "alerts": [
    "High humidity forecast increases risk of fungal leaf blast.",
    "Inspect lower stem nodes for insect signs."
  ]
}`
      : `You are an expert Agricultural AI Advisor tailored for Bangladeshi farmers.
Analyze farm parameters:
- Crop: ${data.cropType || "ধান"}
- Variety: ${data.cropVariety || "ব্রি ধান ২৮"}
- Season: ${data.season || "আমন"}
- Land Size & Soil: ${data.landSize || 2} ${data.landUnit || "একর"}, ${data.soilType || "দোআঁশ"}
- Region: ${data.region || "রংপুর"}
- Notes: ${data.notes || ""}

CRITICAL RULE:
The ENTIRE response MUST be strictly in Bengali (বাংলা).
Respond strictly in valid JSON matching this schema:
{
  "score_analysis": {
    "score": 85,
    "max_score": 100,
    "status_text": "খুব ভালো",
    "credit_status": "ভাল"
  },
  "yield_prediction": {
    "current_yield": 4.2,
    "max_yield": 5.4,
    "unit": "টন/একর"
  },
  "financials": {
    "potential_extra_profit_bdt": 120000,
    "formatted_extra_profit": "১,২০,০০০"
  },
  "ai_recommendations": [
    {
      "category": "রোগ নিয়ন্ত্রণ",
      "title": "ছত্রাকনাশক প্রয়োগ",
      "action": "ধানের ব্লাস্ট রোগ প্রতিরোধে ট্রাইসাইক্লাজোল নির্ধারিত মাত্রায় বিকেল বেলা স্প্রে করুন।"
    },
    {
      "category": "সার প্রয়োগ",
      "title": "ইউরিয়া উপরি প্রয়োগ",
      "action": "কুশি গজানোর সময় ইউরিয়া ও পটাশ সার দ্বিতীয় কিস্তিতে দিন।"
    },
    {
      "category": "সেচ ব্যবস্থাপনা",
      "title": "পানি নিয়ন্ত্রণ",
      "action": "জমিতে অতিরিক্ত পানি না জমিয়ে ২-৩ ইঞ্চি পরিমিত পানি ধরে রাখুন।"
    }
  ],
  "daily_tasks": [
    {"task": "মাটির আর্দ্রতা পরীক্ষা ও সেচ", "recommended": true},
    {"task": "রোগ ও পোকা পর্যবেক্ষণ", "recommended": true},
    {"task": "আগাছা দমন ও মাটি নিড়ানি", "recommended": true}
  ],
  "alerts": [
    "বর্তমান আর্দ্র আবহাওয়ায় ধানে ব্লাস্ট রোগের ঝুঁকি রয়েছে।",
    "রাসায়নিক স্প্রে করার আগে স্থানীয় পূর্বাভাস জেনে নিন।"
  ]
}`;

    const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
    let parsedResult: any = null;

    for (const model of candidateModels) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          }),
          4200
        );

        const text = response?.text?.trim();
        if (text) {
          const cleanJson = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed?.score_analysis && parsed?.yield_prediction && parsed?.financials) {
            // Verify language consistency
            if (isEnglish) {
              const statusStr = String(parsed.score_analysis.status_text || "");
              if (!/[\u0980-\u09FF]/.test(statusStr)) {
                parsedResult = parsed;
                break;
              }
            } else {
              parsedResult = parsed;
              break;
            }
          }
        }
      } catch (genErr) {
        console.warn(`Vercel advisor: Model ${model} call failed:`, genErr);
      }
    }

    if (parsedResult) {
      return res.status(200).json(parsedResult);
    }

    return res.status(200).json(calculateFallbackAdvisorData(data));
  } catch (err) {
    console.error("Vercel advisor handler error:", err);
    return res.status(200).json(calculateFallbackAdvisorData(data));
  }
}
