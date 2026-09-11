import { GoogleGenAI } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
  maxDuration: 30,
};

function getApiKey(): string | null {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!rawKey) return null;
  const apiKey = rawKey.replace(/^["']|["']$/g, "").trim();
  return apiKey || null;
}

function cleanJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  }

  // Find first { and last }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return text;
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

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (pErr) {
        return res.status(400).json({ error: "Invalid JSON in request body" });
      }
    }

    const { image, cropHint, language = 'bn' } = body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required" });
    }

    const isEnglish = language === 'en';

    let base64Data = image;
    let mimeType = "image/jpeg";
    if (image.includes(",")) {
      const parts = image.split(",");
      base64Data = parts[1];
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
    }

    const prompt = isEnglish
      ? `You are a Chief Plant Pathologist and Senior Agronomist at BARI, BRRI, and DAE Bangladesh.
Analyze the image of the plant leaf, stem, fruit, cob, pod, or grain with extreme precision${cropHint ? ` (Possible crop: "${cropHint}")` : ""}.

CRITICAL: Return your response strictly in ENGLISH in valid JSON format.
{
  "isPlant": true,
  "cropName": "Name of crop in English (e.g. Tomato, Rice, Maize)",
  "cropScientific": "Scientific botanical name",
  "diseaseName": "Identified disease in English (if healthy write 'Healthy Plant')",
  "diseaseScientific": "Pathogen or physiological disorder scientific name",
  "severity": "Low / Moderate / Severe",
  "confidenceScore": 95,
  "symptomsObserved": "Observed symptoms detailing affected anatomy like leaf, blossom end, cob, etc.",
  "cause": "Underlying pathogen or nutrient deficiency causing the disease",
  "treatments": {
    "chemical": [
      {
        "name": "Chemical name and standard commercial brand",
        "dose": "Dosage (e.g. 2 g/L or 1 ml/L)",
        "instruction": "Application instructions"
      }
    ],
    "organic": [
      {
        "method": "Organic / Cultural method",
        "details": "Application steps"
      }
    ],
    "prevention": [
      "Preventative measures"
    ]
  },
  "expertNote": "Immediate agronomic action recommendation"
}`
      : `আপনি বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (BARI), ধান গবেষণা ইনস্টিটিউট (BRRI) ও কৃষি সম্প্রসারণ অধিদপ্তর (DAE)-এর একজন প্রধান উদ্ভিদ রোগতত্ত্ববিদ ও কৃষিবিদ।
এই ছবিটিতে উদ্ভিদের পাতা, মোচা, ফল, কাণ্ড, ডালপালা বা শস্যের অবস্থা নিখুঁতভাবে পর্যবেক্ষণ করুন${cropHint ? ` (সম্ভাব্য ফসল: "${cropHint}")` : ""}।

*** সর্বোচ্চ অগ্রাধিকার - উদ্ভিদের প্রজাতি ও আক্রান্ত অঙ্গ (Plant Anatomy: ফল/মোচা/শীষ/কন্দ বনাম পাতা বনাম কাণ্ড) শনাক্তকরণে চরম সতর্কতা ***
১. উদ্ভিদের কোন অংশ বা অঙ্গ ছবিতে দৃশ্যমান তা আগে স্পষ্টভাবে নিশ্চিত করুন:
   ক) ফল / মোচা / শুঁটি / শীষ ও দানা / কন্দ (Fruit / Cob / Pod / Panicle & Grain / Tuber):
      * টমেটো ফল:
        ১) ফলের নিচের অংশে (Blossom End বা বোঁটার বিপরীত প্রান্তে) দেবে যাওয়া চামড়ার মতো কালো বা গাঢ় বাদামি শুষ্ক ক্ষত বা পচন দেখা গেলে এটি নিশ্চিতভাবে "টমেটোর ব্লসম এন্ড রট / ফলের তলদেশ পচা রোগ" (Tomato Blossom End Rot - BER)। কারণ: উদ্ভিদে ক্যালসিয়ামের (Calcium) অভাব এবং মাটিতে আর্দ্রতার চরম তারতম্য। চিকিৎসা: চিলেটেড ক্যালসিয়াম (২ মিলি/লিটার) বা ক্যালসিয়াম ক্লোরাইড / ক্যালসিয়াম নাইট্রেট (৫ গ্রাম/লিটার) স্প্রে ও সুষম সেচ।
        ২) ফলের গায়ে গোল ছিদ্র ও পোকা: "টমেটোর ফল ছিদ্রকারী পোকা" (Helicoverpa armigera)।
        ৩) ফলের গায়ে দেবে যাওয়া পানিভেজা দাগ: "টমেটোর অ্যানথ্রাকনোজ ও ফল পচা"।
      * বেগুনের ফল:
        ১) ফোমপসিস ফল পচা রোগ (Phomopsis vexans): ফলের গায়ে দেবে যাওয়া কালচে বা বাদামি পচন ও সাদাটে ছত্রাক।
        ২) ডগা ও ফল ছিদ্রকারী পোকা (Leucinodes orbonalis): ফলের গায়ে ছোট ছিদ্র ও বিষ্ঠা।
      * মরিচের ফল/শুঁটি: অ্যানথ্রাকনোজ / ডাইব্যাক (Colletotrichum capsici), ফল ছিদ্রকারী পোকা।
      * পেঁপের ফল: অ্যানথ্রাকনোজ ফল পচা, রিং স্পট।
      * ভুট্টার মোচা ও দানা: মোচা ও দানা পচা (Fusarium/Gibberella), ফল ও মোচা ছিদ্রকারী পোকা (Fall Armyworm)।
      * ধানের শীষ ও দানা: শীষ ব্লাস্ট (Neck Blast), ভুয়া চিটা (False Smut), বাদামি দানা পচা।
      * আলুর কন্দ: দাঁদ রোগ (Common Scab), শুকনো পচা (Dry Rot), নরম পচা (Soft Rot)।
      * আমের ফল: অ্যানথ্রাকনোজ, মাছি পোকা (Fruit Fly)।
      * ফুলকপির হেড: বাদামি পচন (বোরন ঘাটতি), হেড রট।
      * কলার ফল: কলার বিটল পোকার দাগ, অ্যানথ্রাকনোজ।

   খ) পাতা (Leaf):
      * টমেটো পাতা: আগাম ধসা (Early Blight), নাবি ধসা (Late Blight), পাতা কোঁকড়ানো (Leaf Curl), ব্যাকটেরিয়াল স্পট।
      * বেগুন পাতা: পাতা ছোট হওয়া (Little Leaf), উইল্ট (ঢলে পড়া), এপিলাকনা বিটল।
      * মরিচ পাতা: পাতা কোঁকড়ানো (Leaf Curl), ডাইব্যাক।
      * ভুট্টা পাতা: টারসিকাম পাতা ঝলসানো (Turcicum Blight), মরিচা রোগ (Common Rust)।
      * পেঁপে পাতা: রিং স্পট ভাইরাস (PRSV), পাতা কোঁকড়ানো।
      * ধান পাতা: পাতা ব্লাস্ট (Blast), খোলপোড়া (Sheath Blight), বাদামি দাগ (Brown Spot), পাতা পোড়া (Bacterial Leaf Blight)।
      * আলু পাতা: নাবি ধসা (Late Blight), আগাম ধসা (Early Blight)।
      * কলা পাতা: সিগাটোকা (Sigatoka), পানামা রোগ।
      * ফুলকপি পাতা: ব্ল্যাক রট, ডাউনি মিলডিউ।
      * সরিষা পাতা: অল্টারনারিয়া ব্লাইট, সাদা মরিচা, জাবপোকা।

JSON ফরম্যাটে উত্তর দিন:
{
  "isPlant": true,
  "cropName": "ফসলের নাম",
  "cropScientific": "বৈজ্ঞানিক নাম",
  "diseaseName": "চিহ্নিত রোগ (সুস্থ হলে লিখুন 'সুস্থ উদ্ভিদ')",
  "diseaseScientific": "জীবাণু বা শারীরবৃত্তীয় সমস্যার বৈজ্ঞানিক নাম",
  "severity": "কম / মাঝারি / তীব্র",
  "confidenceScore": 95,
  "symptomsObserved": "লক্ষণসমূহ (আক্রান্ত অঙ্গ যেমন ফল বা পাতা স্পষ্টভাবে উল্লেখ করুন)",
  "cause": "রোগের কারণ",
  "treatments": {
    "chemical": [
      {
        "name": "ছত্রাকনাশক/কীটনাশক/পুষ্টির নাম",
        "dose": "মাত্রা",
        "instruction": "প্রয়োগের নিয়ম"
      }
    ],
    "organic": [
      {
        "method": "জৈব পদ্ধতি",
        "details": "নিয়মাবলী"
      }
    ],
    "prevention": [
      "প্রতিরোধের উপায়"
    ]
  },
  "expertNote": "জরুরি পরামর্শ"
}`;

    // 1. PRIMARY ENGINE: Gemini Multimodal Vision
    const apiKey = getApiKey();
    if (apiKey) {
      const visionModels = [
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];

      let lastError = "";

      // Attempt 1: Try official @google/genai SDK
      try {
        const ai = new GoogleGenAI({ apiKey });
        for (const model of visionModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: [
                {
                  role: "user",
                  parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt },
                  ],
                },
              ],
              config: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            });

            if (response && response.text) {
              const cleaned = cleanJsonString(response.text);
              const parsed = JSON.parse(cleaned);
              return res.status(200).json({
                success: true,
                diagnosis: parsed,
                model: `Gemini Vision (${model})`,
              });
            }
          } catch (mErr: any) {
            lastError = mErr?.message || String(mErr);
            console.warn(`Vercel SDK: Vision ${model} failed, trying next:`, lastError);
          }
        }
      } catch (sdkInitErr: any) {
        lastError = sdkInitErr?.message || String(sdkInitErr);
        console.warn("Vercel SDK initialization warning:", lastError);
      }

      // Attempt 2: Direct Google Gemini REST API (Serverless-optimized Native Fetch)
      // This bypasses any Node SDK bundler or runtime issues in Vercel
      for (const model of ["gemini-2.5-flash", "gemini-3.1-flash-lite"]) {
        try {
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const restPayload = {
            contents: [
              {
                parts: [
                  { inlineData: { mimeType, data: base64Data } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          };

          const restResp = await fetch(restUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(restPayload),
          });

          if (restResp.ok) {
            const data: any = await restResp.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = cleanJsonString(text);
              const parsed = JSON.parse(cleaned);
              return res.status(200).json({
                success: true,
                diagnosis: parsed,
                model: `Gemini REST (${model})`,
              });
            }
          } else {
            const errData: any = await restResp.json().catch(() => ({}));
            lastError = errData?.error?.message || `HTTP ${restResp.status} ${restResp.statusText}`;
            console.warn(`Vercel REST fallback: Model ${model} returned error:`, lastError);
          }
        } catch (restErr: any) {
          lastError = restErr?.message || String(restErr);
          console.warn(`Vercel REST fetch error for ${model}:`, lastError);
        }
      }

      return res.status(502).json({
        success: false,
        error: `AI ভিশন মডেল ছবি বিশ্লেষণ করতে পারেনি: ${lastError || "সার্ভার সাময়িক ব্যস্ত"}`,
        details: lastError,
      });
    }

    return res.status(500).json({
      success: false,
      error:
        "Vercel-এ GEMINI_API_KEY পাওয়া যায়নি। দয়া করে আপনার Vercel Dashboard -> Settings -> Environment Variables-এ 'GEMINI_API_KEY' যুক্ত করে প্রোজেক্টটি Redeploy করুন।",
      needApiKey: true,
    });
  } catch (error: any) {
    console.error("Vercel api/diagnose-crop error:", error);
    return res.status(500).json({ error: error.message || "Diagnosis failed" });
  }
}
