import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  RotateCcw,
  Mic,
  MicOff,
  User,
  AlertCircle,
  Loader2,
  History,
  Cloud,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  saveChatInquiryToFirestore,
  getRecentChatInquiries,
  FirebaseChatInquiry,
} from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  model?: string;
}

interface Props {
  onBack: () => void;
}

const WELCOME_BN =
  'আসসালামু আলাইকুম! আমি আপনার কৃষি বন্ধু AI। ফসলের রোগবালাই, সার-কীটনাশকের সঠিক মাত্রা, সেচ বা ফলন বৃদ্ধির বিষয়ে যেকোনো প্রশ্ন লিখে বা নিচে মাইক চিহ্নে চাপ দিয়ে মুখে বলে আমাকে জিজ্ঞেস করতে পারেন।';
const WELCOME_EN =
  'Assalamu Alaikum! I am your AI Agri Assistant. Feel free to ask any question regarding crop diseases, balanced fertilizers, pesticides, irrigation, or yield optimization by typing or tapping the microphone below.';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-welcome',
    sender: 'bot',
    text: WELCOME_BN,
    time: 'এইমাত্র',
  },
];

const SUGGESTED_QUESTIONS_BN = [
  '🌾 ধানের পাতা হলুদ হচ্ছে কেন ও প্রতিকার কী?',
  '🥔 আলুর নাবি ধসা রোগের দ্রুত চিকিৎসা কী?',
  '🧪 ১ বিঘা জমিতে ইউরিয়া ও পটাশের সঠিক মাত্রা',
  '🐛 ধানের মাজরা পোকা দমনে কোন ওষুধ দিব?',
  '🌧️ বৃষ্টির দিনে কোন স্প্রে বন্ধ রাখা উচিত?',
];

const SUGGESTED_QUESTIONS_EN = [
  '🌾 Why are rice leaves turning yellow and how to cure it?',
  '🥔 Quick remedy for potato late blight disease?',
  '🧪 Balanced dose of Urea & Potash for 1 bigha land',
  '🐛 Which pesticide controls rice stem borer pests?',
  '🌧️ Which sprays should be avoided on rainy days?',
];

const CHAT_STORAGE_KEY = 'krishi_chat_messages_history_v1';

const detectCropName = (text: string, lang: 'bn' | 'en'): string => {
  const lower = text.toLowerCase();
  if (lower.includes('ধান') || lower.includes('rice') || lower.includes('paddy')) return lang === 'en' ? 'Rice' : 'ধান';
  if (lower.includes('গম') || lower.includes('wheat')) return lang === 'en' ? 'Wheat' : 'গম';
  if (lower.includes('ভুট্টা') || lower.includes('maize') || lower.includes('corn')) return lang === 'en' ? 'Maize' : 'ভুট্টা';
  if (lower.includes('আলু') || lower.includes('potato')) return lang === 'en' ? 'Potato' : 'আলু';
  if (lower.includes('সরিষা') || lower.includes('mustard')) return lang === 'en' ? 'Mustard' : 'সরিষা';
  if (lower.includes('টমেটো') || lower.includes('tomato')) return lang === 'en' ? 'Tomato' : 'টমেটো';
  if (lower.includes('বেগুন') || lower.includes('eggplant') || lower.includes('brinjal')) return lang === 'en' ? 'Eggplant' : 'বেগুন';
  if (lower.includes('ফুলকপি') || lower.includes('cauliflower')) return lang === 'en' ? 'Cauliflower' : 'ফুলকপি';
  if (lower.includes('পেঁপে') || lower.includes('papaya')) return lang === 'en' ? 'Papaya' : 'পেঁপে';
  if (lower.includes('কলা') || lower.includes('banana')) return lang === 'en' ? 'Banana' : 'কলা';
  if (lower.includes('পান') || lower.includes('betel')) return lang === 'en' ? 'Betel' : 'পান';
  return lang === 'en' ? 'General Crop' : 'সাধারণ ফসল';
};

export const AIChatBotScreen: React.FC<Props> = ({ onBack }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CHAT_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Chat cache read notice:', err);
      }
    }
    return INITIAL_MESSAGES;
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [savedInquiries, setSavedInquiries] = useState<FirebaseChatInquiry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isListening]);

  // Persist conversations to localStorage whenever messages state updates
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (err) {
        console.warn('Local save notice:', err);
      }
    }
  }, [messages]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);
    setVoiceError(null);

    try {
      // Build conversation history
      const history = messages
        .filter((m) => m.id !== 'msg-welcome')
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          text: m.text,
        }));

      const savedDistrict = localStorage.getItem('krishi_farmer_district') || 'dhaka';
      const locationLabel =
        language === 'en'
          ? savedDistrict === 'dhaka'
            ? 'Dhaka, Bangladesh'
            : `${savedDistrict}, Bangladesh`
          : savedDistrict === 'dhaka'
          ? 'ঢাকা, বাংলাদেশ'
          : `${savedDistrict}, বাংলাদেশ`;

      let botReply = '';
      let usedModel = '';

      try {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 4500);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history,
            location: locationLabel,
            language,
          }),
          signal: abortController.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.reply) {
            botReply = data.reply;
            usedModel = data.model || 'krishi-ai';
          }
        }
      } catch (fetchErr) {
        console.warn('Backend /api/chat error or timeout, activating instant agricultural engine:', fetchErr);
      }

      // If backend was unreachable or returned empty
      if (!botReply) {
        botReply = getAgriculturalExpertReply(query, locationLabel, language);
        usedModel =
          language === 'en'
            ? 'Agri Expert Assistant (Offline/Backup)'
            : 'কৃষি বিশেষজ্ঞ সহকারী (অফলাইন/ব্যাকআপ)';
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        model: usedModel,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Save consultation into Cloud Firestore (/chat_inquiries)
      const farmerPhone = localStorage.getItem('krishi_farmer_phone') || 'guest';
      const farmerName =
        localStorage.getItem('krishi_farmer_name') ||
        (language === 'en' ? 'Farmer Friend' : 'কৃষক ভাই');
      saveChatInquiryToFirestore({
        farmerId: farmerPhone,
        farmerName,
        question: query,
        answer: botReply,
        detectedCrop: detectCropName(query, language),
        model: usedModel,
      }).catch((err) => console.warn('Firestore inquiry save notice:', err));
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackReply = getAgriculturalExpertReply(
        query,
        language === 'en' ? 'Bangladesh' : 'বাংলাদেশ',
        language
      );
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: fallbackReply,
        time: language === 'en' ? 'Just now' : 'এইমাত্র',
        model: language === 'en' ? 'Agri Expert (Backup)' : 'কৃষি বিশেষজ্ঞ (ব্যাকআপ)',
      };
      setMessages((prev) => [...prev, errorMessage]);

      const farmerPhone = localStorage.getItem('krishi_farmer_phone') || 'guest';
      const farmerName =
        localStorage.getItem('krishi_farmer_name') ||
        (language === 'en' ? 'Farmer Friend' : 'কৃষক ভাই');
      saveChatInquiryToFirestore({
        farmerId: farmerPhone,
        farmerName,
        question: query,
        answer: fallbackReply,
        detectedCrop: detectCropName(query, language),
        model: language === 'en' ? 'Agri Expert (Backup)' : 'কৃষি বিশেষজ্ঞ (ব্যাকআপ)',
      }).catch((err) => console.warn('Firestore fallback save notice:', err));
    } finally {
      setIsLoading(false);
    }
  };

  // Comprehensive Agricultural Expert Engine (runs 100% reliably even on Vercel without backend)
  const getAgriculturalExpertReply = (
    queryText: string,
    location: string,
    lang: 'bn' | 'en'
  ): string => {
    const lower = queryText.toLowerCase();

    if (lang === 'en') {
      if (
        lower.includes('maize') ||
        lower.includes('corn') ||
        lower.includes('ভুট্টা') ||
        lower.includes('stem rot') ||
        lower.includes('stalk rot') ||
        lower.includes('diplodia') ||
        lower.includes('fusarium')
      ) {
        return `🌽 Maize Stem Rot & Stalk Rot Management:

📌 Cause & Pathogens:
Primarily caused by Diplodia maydis and Fusarium moniliforme fungi. Favorable conditions include high soil moisture, waterlogging, or severe drought during grain filling.

🔍 Visible Symptoms:
1. Lower stem internodes and nodes turn straw-brown, soft, and water-soaked.
2. The internal pith deteriorates into shredded, hollow fibers.
3. Plants easily bend, lodge, or break at ground level in light winds.
4. Ears fail to fill properly, yielding shriveled kernels.

🛡️ Chemical Solutions:
• Spray Carbendazim 50% WP (2 g/liter) or Thiophanate-Methyl (2 g/liter), drenching the lower stem and base.
• Alternatively, apply Azoxystrobin + Difenoconazole (1 ml/liter).
• Repeat in 7-10 days if severe symptoms persist.

🌿 Cultural & Preventive Measures:
• Seed treatment: Treat seeds with Provax-200 WP or Trichoderma powder (3 g/kg seed) before sowing.
• Balanced nutrition: Avoid excess Urea (nitrogen); apply adequate MOP (Potash) to strengthen stalks.
• Drainage: Keep furrows and drainage channels clear so standing water drains quickly.`;
      }

      if (
        lower.includes('papaya') ||
        lower.includes('ring spot') ||
        lower.includes('mosaic') ||
        lower.includes('পেঁপে')
      ) {
        return `🍈 Papaya Ring Spot Virus (PRSV) & Stem Rot Control:

📌 Symptoms & Vector Transmission:
• Transmitted primarily by aphids and whiteflies. Young foliage shows yellowish-green mosaic mottling, distorted shape, and oily green water-soaked streaks on stems.
• Soil waterlogging during rains leads to Pythium fungal stem and foot rot.

🛡️ Management:
1. Spray Imidacloprid 20 SL (Admire / Tido) at 0.5 ml/L to control sucking insect vectors.
2. For foot and stem rot, drench soil and stem base with Copper Oxychloride 50% WP (Cupravit / Kuprofix) at 2 g/L.
3. Remove and burn severely diseased plants. Always grow papaya on raised beds.`;
      }

      if (
        lower.includes('blast') ||
        lower.includes('rice') ||
        lower.includes('paddy') ||
        lower.includes('ধান') ||
        lower.includes('ব্লাস্ট')
      ) {
        return `🌾 Rice Blast Disease Management (BRRI Guidelines):

📌 Immediate Actions:
1. Temporarily halt topdressing with Urea (nitrogen) fertilizer.
2. Apply an extra split of Potash (MOP) at 5 kg per bigha to build plant disease resistance.
3. Spray Tricyclazole 75% WP (Trooper / Difa) at 0.75-1.0 g per liter of clean water in late afternoon.
4. Alternatively, spray Azoxystrobin + Difenoconazole (Amistar Top) at 1 ml per liter.
5. Maintain 2-3 inches of standing water in the paddy field; do not let the soil dry and crack during infection.`;
      }

      if (
        lower.includes('potato') ||
        lower.includes('late blight') ||
        lower.includes('blight') ||
        lower.includes('আলু') ||
        lower.includes('ধসা')
      ) {
        return `🥔 Potato Late Blight (Phytophthora infestans) Control:

1. High humidity, cool nights, and cloudy/foggy days trigger rapid spore development. Suspend sprinkler irrigation immediately if signs appear.
2. Preventative spray: Mancozeb 75% WP (Dithane M-45) at 2 g/liter every 7-10 days.
3. Curative action upon seeing lesions: Dimethomorph + Mancozeb (Acrobat MZ) at 2 g/liter or Fenamidone + Mancozeb (Secure 600 WG) at 1.5 g/liter.
4. Ensure thorough spray coverage on both the upper and lower leaf surfaces during calm afternoon hours.`;
      }

      if (
        lower.includes('fertilizer') ||
        lower.includes('urea') ||
        lower.includes('potash') ||
        lower.includes('dap') ||
        lower.includes('tsp') ||
        lower.includes('সার')
      ) {
        return `🧪 Balanced Fertilizer Application Guidelines (Per 1 Bigha / 33 Decimals):

• High-Yielding Rice (HYV Aman / Boro):
  - Urea: 35-40 kg (divided into 3 equal splits)
  - TSP or DAP: 12-15 kg (apply during final land preparation)
  - MOP (Potash): 18-20 kg (2/3 during land preparation, 1/3 at panicle initiation)
  - Gypsum (Sulphur): 8-10 kg
  - Zinc Sulphate: 1.5 kg (or Chelated Zinc foliar spray)
• Urea Split Timing:
  - 1st split: 15-20 days after transplanting (DAT)
  - 2nd split: Active tillering stage (30-35 DAT)
  - 3rd split: 5-7 days before panicle initiation (PI stage)
• If using DAP instead of TSP, reduce the basal Urea rate by 20%.`;
      }

      if (
        lower.includes('pest') ||
        lower.includes('insect') ||
        lower.includes('borer') ||
        lower.includes('caterpillar') ||
        lower.includes('পোকা')
      ) {
        return `🐛 Integrated Pest Management (IPM) Solutions:

1. Perching Method: Place 8-10 bamboo T-perches or branches per bigha to attract predatory birds (Black Drongo, Myna) that feed on caterpillars and borers.
2. Light Traps: Install light traps at field borders overnight with a basin of soapy or kerosene-mixed water to trap nocturnal adult moths.
3. Biological & Chemical Sprays:
   - For Stem Borers / Leaf Folders: Spray Chlorantraniliprole 18.5% SC (Virtako / Coragen) at 0.4 ml/L or apply Cartap Hydrochloride 4G granules at 1.5 kg/bigha.
   - For sucking pests (BPH, Aphids): Spray Imidacloprid 20 SL at 0.5 ml/L in the late afternoon.`;
      }

      if (lower.includes('yellow') || lower.includes('leaf') || lower.includes('হলুদ')) {
        return `🌱 Crop Foliage Yellowing: Diagnosis & Corrective Actions:

1. Nitrogen (N) Deficiency: Older lower leaves turn uniformly pale-yellow first. Remedy: Topdress 5-7 kg Urea per bigha.
2. Sulphur (S) Deficiency: Younger upper leaves turn yellow first while lower leaves stay green. Remedy: Apply Gypsum at 3-5 kg per bigha.
3. Zinc (Zn) Deficiency: Rusty brown or bronze spots develop along leaf midribs. Remedy: Foliar spray Chelated Zinc (1 g/L) with clean water in the afternoon.
4. Waterlogging / Suffocation: Yellowing due to root asphyxiation. Cut drainage furrows immediately to aerate the soil profile.`;
      }

      if (lower.includes('irrigation') || lower.includes('water') || lower.includes('সেচ')) {
        return `💧 Smart Irrigation Management Guidelines:

1. Critical stages: Ensure consistent moisture during flowering and grain/fruit filling stages.
2. Alternate Wetting and Drying (AWD): For paddy cultivation, adopting AWD saves 25-30% of irrigation diesel/electricity with zero yield loss.
3. Rain anticipation: Check 24-48 hour rain forecasts before running pumps to prevent fuel waste and waterlogging.`;
      }

      return `👨‍🌾 Agri Assistant Recommendation (${location}):

Thank you for your inquiry. Based on agricultural practices and soil conditions in your area (${location}):
1. Apply balanced fertilizers according to soil type; avoid excessive nitrogen which predisposes crops to fungal attacks.
2. Before applying any pesticide or fungicide, inspect the package label for the correct dilution rate and wear safety gear.
3. Foliar sprays are most effective when applied during the calm, mild sunlight of the late afternoon.
4. For precise diagnosis, please provide the specific crop name and visual symptoms or use the camera Disease Scanner.`;
    }

    // Bengali Fallback Engine
    if (
      lower.includes('ভুট্টা') ||
      lower.includes('কান্ড পচা') ||
      lower.includes('কান্ডপচা') ||
      lower.includes('stem rot') ||
      lower.includes('stalk rot') ||
      lower.includes('diplodia') ||
      lower.includes('fusarium')
    ) {
      return `🌽 ভুট্টার কান্ড পচা ও গোড়া পচা রোগ (Stem Rot Disease of Maize):

📌 কারণ ও জীবাণু:
এটি ডিপ্লোডিয়া (*Diplodia maydis*) এবং ফিউজারিয়াম (*Fusarium moniliforme*) ছত্রাক দ্বারা ঘটে থাকে। অতিরিক্ত বৃষ্টিপাত, জলাবদ্ধতা বা মোচায় দানা আসার সময় খরা হলে এ রোগের আক্রমণ মারাত্মক আকার ধারণ করে।

🔍 প্রধান লক্ষণসমূহ:
১. কাণ্ডের নিচের দিকের গিঁট কালচে-বাদামি ও খড় বর্ণের হয়ে পচে যাওয়া।
২. কাণ্ডের ভেতরের মজ্জা (pith) নষ্ট হয়ে ফাঁপা ও ভঙ্গুর হয়ে যায়।
৩. সামান্য বাতাসেই গাছ গোড়া বা কাণ্ড থেকে ভেঙে মাটিতে লুটিয়ে পড়ে।
৪. মোচায় অপুষ্ট, কুঁচকানো দানা তৈরি হয়।

🛡️ অনুমোদিত রাসায়নিক দমন:
• কার্বেন্ডাজিম ৫০% ডব্লিউপি (যেমন: নোইন বা অটোস্টিন) অথবা থায়োফেনেট মিথাইল (রোকো) প্রতি লিটার পানিতে ২ গ্রাম হারে কাণ্ড ও গোড়ার মাটি ভিজিয়ে স্প্রে করুন।
• অথবা অ্যাজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (যেমন: এমিস্টার টপ ৩২৫ এসসি) প্রতি লিটার পানিতে ১ মিলি হারে স্প্রে করুন।
• আক্রমণ বেশি হলে ৫-৭ দিন পর পুনরায় স্প্রে করুন।

🌿 কৃষি ও জৈব ব্যবস্থাপনা:
• বীজ বপনের পূর্বে প্রতি কেজি বীজে ৩ গ্রাম প্রভ্যাক্স ২০০ ডব্লিউপি বা ট্রাইকোডার্মা দিয়ে শোধন করুন।
• অতিরিক্ত ইউরিয়া পরিহার করে পর্যাপ্ত পটাশ (MOP) সার দিন যা কাণ্ড শক্ত রাখে।
• জমি থেকে দ্রুত বৃষ্টির পানি নিষ্কাশনের ড্রেন চালু রাখুন।`;
    }

    if (
      lower.includes('পেঁপে') ||
      lower.includes('papaya') ||
      lower.includes('রিং স্পট') ||
      lower.includes('মোজাইক')
    ) {
      return `🍈 পেঁপের রিং স্পট ভাইরাস (PRSV) ও কাণ্ড পচা রোগ প্রতিকার:

📌 লক্ষণ ও বিস্তার:
• রিং স্পট ভাইরাস মূলত জাবপোকা (Aphids) ও সাদা মাছি দ্বারা দ্রুত ছড়ায়। কচি পাতায় হলুদ-সবুজ মোজাইক ছোপ, পাতা বিকৃত ও কাণ্ডে বা পাতার বোঁটায় গাঢ় সবুজ তৈলাক্ত বা জলছাপ দাগ পড়ে।
• বর্ষাকালে গোড়ায় পানি জমলে কাণ্ড ও গোড়া পচা ছত্রাক আক্রমণ করে।

🛡️ প্রতিকার ও স্প্রে পরামর্শ:
১. ভাইরাস বিস্তারকারী পোকা দমনে ইমিডাক্লোপ্রিড ২০ এসএল (এডমায়ার / টিডো) প্রতি লিটার পানিতে ০.৫ মিলি হারে স্প্রে করুন।
২. কাণ্ড ও গোড়া পচা রোগ দমনে কপার অক্সিক্লোরাইড ৫০% ডব্লিউপি (কুপ্রোফিক্স বা চ্যাম্পিয়ন) প্রতি লিটার পানিতে ২ গ্রাম হারে গাছের গোড়ার মাটিতে স্প্রে করুন।
৩. তীব্র আক্রান্ত গাছ দ্রুত তুলে পুড়িয়ে ফেলুন এবং সবসময় উঁচু বেডে পেঁপে চাষ করুন যাতে গোড়ায় পানি না জমে।`;
    }

    if (
      lower.includes('ব্লাস্ট') ||
      lower.includes('পাতাপোড়া') ||
      (lower.includes('ধান') && (lower.includes('রোগ') || lower.includes('চিকিৎসা')))
    ) {
      return `🌾 ধানের ব্লাস্ট বা পাতাপোড়া রোগের কার্যকর প্রতিকার:

১. জমিতে ইউরিয়া সারের উপরিপ্রয়োগ আপাতত বন্ধ রাখুন এবং বিঘাপ্রতি অতিরিক্ত ৫ কেজি এমওপি (পটাশ) সার প্রয়োগ করুন।
২. ট্রাইসাইক্লাজল ৭৫% ডব্লিউপি (যেমন: ট্রুপার বা দিফা) প্রতি লিটার পানিতে ১ গ্রাম হারে মিশিয়ে বিকেলে স্প্রে করুন।
৩. অথবা এ্যাজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (যেমন: এমিস্টার টপ) প্রতি লিটার পানিতে ১ মিলি হারে স্প্রে করতে পারেন।
৪. জমিতে সবসময় ২-৩ ইঞ্চি পানি ধরে রাখুন, জমি শুকিয়ে ফেটে যেতে দেবেন না।`;
    }

    if (
      lower.includes('আলু') ||
      lower.includes('ধসা') ||
      lower.includes('লেট ব্লাইট') ||
      lower.includes('ব্লাইট')
    ) {
      return `🥔 আলুর নাবি ধসা (Late Blight) রোগ নিয়ন্ত্রণ:

১. কুয়াশাচ্ছন্ন ও মেঘলা আবহাওয়ায় রোগ দ্রুত ছড়ায়। লক্ষণ দেখা দিলে সেচ দেওয়া বন্ধ রাখুন।
2. প্রতি লিটার পানিতে ২ গ্রাম ম্যানকোজেব (যেমন: ডাইথেন এম-৪৫) অথবা মেনকোজেব + ফেনামিডন (সিকিউর) মিশিয়ে ৭-১০ দিন পর পর স্প্রে করুন।
৩. তীব্র আক্রমণে ডাইমেথোমর্ফ (অ্যাক্রোবেট এমজেড) প্রতি লিটার পানিতে ২ গ্রাম হারে স্প্রে করুন।
৪. স্প্রে করার সময় পাতার ওপর ও নিচ উভয় পাশ ভালোভাবে ভিজিয়ে দিন।`;
    }

    if (
      lower.includes('সার') ||
      lower.includes('ইউরিয়া') ||
      lower.includes('পটাশ') ||
      lower.includes('টিএসপি') ||
      lower.includes('ড্যাপ')
    ) {
      return `🧪 সুষম সার ব্যবহারের নিয়মাবলী (বিঘা প্রতি ৩৩ শতক):

• আমন/বোরো ধানের জন্য: ইউরিয়া ৩৫-৪০ কেজি, টিএসপি/ডিএপি ১২-১৫ কেজি, এমওপি (পটাশ) ১৮-২০ কেজি, জিপসাম ৮-১০ কেজি এবং জিংক সালফেট ১.৫ কেজি।
• ইউরিয়া প্রয়োগের সঠিক কিস্তি:
  - ১ম কিস্তি: চারা রোপণের ১৫-২০ দিন পর।
  - ২য় কিস্তি: কুশি গজানোর সময় (রোপণের ৩০-৩৫ দিন পর)।
  - ৩য় কিস্তি: থোড় আসার ৫-৭ দিন পূর্বে।
• মনে রাখবেন: ডিএপি ব্যবহার করলে ইউরিয়া সারের পরিমাণ কিছুটা কমিয়ে দিতে হবে।`;
    }

    if (
      lower.includes('পোকা') ||
      lower.includes('মাজরা') ||
      lower.includes('লেদা') ||
      lower.includes('বিছা') ||
      lower.includes('ঘাসফড়িং')
    ) {
      return `🐛 ফসলের পোকা দমনের আধুনিক সমন্বিত বালাই ব্যবস্থাপনা (IPM):

১. পার্চিং পদ্ধতি: ক্ষেতে বিঘাপ্রতি ৮-১০টি বাঁশের কঞ্চি বা ডালপালা পুঁতে দিন যাতে ফিঙে, শালিক ইত্যাদি পাখি বসে পোকা খেয়ে ফেলতে পারে।
২. আলোক ফাঁদ: রাতে ক্ষেতের পাশে আলোর নিচে কেরোসিন মিশ্রিত পানির পাত্র রেখে মাজরা ও গান্ধী পোকা দমন করুন।
৩. আক্রমণ বেশি হলে দানাদার কীটনাশক কার্বোফুরান ৫জি (যেমন: ফুরাডান) বিঘাপ্রতি ১.৫ কেজি প্রয়োগ করুন অথবা ভিরতাকো (থায়ামেথোক্সাম + ক্লোরান্ট্রানিলিপ্রোল) প্রতি লিটার পানিতে ০.৫ গ্রাম হারে স্প্রে করুন।`;
    }

    if (lower.includes('হলুদ') || lower.includes('পাতা')) {
      return `🌱 পাতা হলুদ হওয়ার প্রধান কারণ ও প্রতিকার:

১. নাইট্রোজেনের ঘাটতি: পুরো পাতা বিশেষ করে নিচের পাতা সমভাবে হালকা হলুদ হলে বিঘাপ্রতি ৫-৭ কেজি ইউরিয়া উপরিপ্রয়োগ করুন।
২. সালফারের (গন্ধক) ঘাটতি: গাছের ওপরের কচি পাতা আগে হলুদ হলে জিপসাম সার প্রয়োগ করতে হবে।
৩. দস্তার (জিংক) ঘাটতি: পাতার শিরা বরাবর বাদামি মরিচার মতো দাগ হলে চিলেটেড জিংক (যেমন: লিবরেল জিংক) প্রতি লিটার পানিতে ১ গ্রাম হারে স্প্রে করুন।
৪. অতিরিক্ত পানি জমে থাকলে ড্রেন তৈরি করে পানি নিষ্কাশনের ব্যবস্থা করুন।`;
    }

    if (lower.includes('সেচ') || lower.includes('পানি')) {
      return `💧 ফসলে আধুনিক সেচ ব্যবস্থাপনা:

১. ধানের কুশি পর্যায় ও থোড় আসার সময় জমিতে পর্যাপ্ত আর্দ্রতা নিশ্চিত করুন।
২. পর্যায়ক্রমিক ভিজানো ও শুকানো (AWD) পদ্ধতি ব্যবহার করলে সেচের পানির ২৫-৩০% সাশ্রয় হয়।
৩. বৃষ্টির সম্ভাবনা থাকলে সেচ দেওয়া থেকে বিরত থাকুন এবং ড্রেনগুলো পরিষ্কার রাখুন যাতে পানি জমতে না পারে।`;
    }

    return `👨‍🌾 কৃষি বন্ধু পরামর্শ:

আপনার জিজ্ঞাসার জন্য ধন্যবাদ। আপনার এলাকা (${location})-এর আবহাওয়া ও মাটির অবস্থা বিবেচনা করে:
১. জমিতে সুষম সার ব্যবহার করুন এবং মাত্রাতিরিক্ত ইউরিয়া পরিহার করুন।
২. কোনো ছত্রাকনাশক বা কীটনাশক ব্যবহারের পূর্বে মোড়কের গায়ে নির্দেশিত মাত্রা সতর্কতার সাথে পড়ে নিন।
৩. বিকেলের মিষ্টি রোদে স্প্রে করা সবচেয়ে কার্যকর এবং পরিবেশবান্ধব।
৪. আরও নির্দিষ্ট পরামর্শের জন্য আপনার ফসলের নাম ও লক্ষণ বিস্তারিত লিখে বা মুখে বলে জানান।`;
  };

  // Start Real Web Speech API or MediaRecorder Fallback
  const toggleVoiceInput = async () => {
    setVoiceError(null);

    // If currently listening, stop
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = language === 'en' ? 'en-US' : 'bn-BD';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        let accumulatedTranscript = '';

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceError(null);
        };

        recognition.onresult = (event: any) => {
          let currentSessionText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedTranscript += (accumulatedTranscript ? ' ' : '') + transcript;
            } else {
              currentSessionText += transcript;
            }
          }
          const fullText = (
            accumulatedTranscript + (currentSessionText ? ' ' + currentSessionText : '')
          ).trim();
          if (fullText) {
            setInputText(fullText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceError(
              language === 'en'
                ? 'Microphone permission denied. Please allow mic in browser.'
                : 'মাইক্রোফোন ব্যবহারের অনুমতি নেই। ব্রাউজারে মাইক পারমিশন দিন।'
            );
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            // No speech detected, keep listening or stop gracefully
          } else if (event.error === 'network') {
            // Try recorder fallback if network recognition failed
            startMediaRecorderFallback();
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch (err: any) {
        console.warn('Web speech failed to start, falling back to MediaRecorder:', err);
        startMediaRecorderFallback();
        return;
      }
    } else {
      // Browser doesn't support Web Speech API directly; use MediaRecorder + Gemini
      startMediaRecorderFallback();
    }
  };

  // MediaRecorder Fallback with Gemini Audio Transcription
  const startMediaRecorderFallback = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceError(
          language === 'en'
            ? 'Voice recording is not supported on this browser. Please type your query.'
            : 'আপনার ব্রাউজারে ভয়েস রেকর্ড সমর্থন করে না। অনুগ্রহ করে টাইপ করুন।'
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsListening(false);

        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) {
          return;
        }

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const res = await fetch('/api/voice-transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType: 'audio/webm',
                language,
              }),
            });
            const data = await res.json();
            if (data && data.text) {
              setInputText((prev) => (prev ? prev + ' ' + data.text : data.text));
            } else {
              setVoiceError(
                language === 'en'
                  ? 'Voice was not clearly heard. Please speak again or type.'
                  : 'ভয়েস পরিষ্কার শোনা যায়নি। অনুগ্রহ করে আবার বলুন বা লিখুন।'
              );
            }
            setIsTranscribing(false);
          };
        } catch (tErr) {
          console.error('Transcription error:', tErr);
          setVoiceError(
            language === 'en'
              ? 'Error processing voice. Please type your query.'
              : 'ভয়েস প্রসেসিংয়ে সমস্যা হয়েছে। অনুগ্রহ করে লিখে জানান।'
          );
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setVoiceError(null);
    } catch (micErr: any) {
      console.error('Microphone access denied:', micErr);
      setVoiceError(
        language === 'en'
          ? 'Could not activate microphone. Please allow mic permission in browser.'
          : 'মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে ব্রাউজারে পারমিশন অনুমোদন করুন।'
      );
      setIsListening(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const farmerPhone = localStorage.getItem('krishi_farmer_phone') || undefined;
      const history = await getRecentChatInquiries(farmerPhone, 40);
      setSavedInquiries(history);
    } catch (err) {
      console.warn('Could not fetch chat inquiries:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLoadInquiry = (inquiry: FirebaseChatInquiry) => {
    const qMsg: Message = {
      id: `saved-q-${Date.now()}`,
      sender: 'user',
      text: inquiry.question,
      time: inquiry.clientTimestamp
        ? new Date(inquiry.clientTimestamp).toLocaleTimeString(
            language === 'en' ? 'en-US' : 'bn-BD',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          )
        : language === 'en'
        ? 'Saved'
        : 'সংরক্ষিত',
    };
    const aMsg: Message = {
      id: `saved-a-${Date.now() + 1}`,
      sender: 'bot',
      text: inquiry.answer,
      time: inquiry.clientTimestamp
        ? new Date(inquiry.clientTimestamp).toLocaleTimeString(
            language === 'en' ? 'en-US' : 'bn-BD',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          )
        : language === 'en'
        ? 'Saved'
        : 'সংরক্ষিত',
      model: inquiry.model || 'krishi-ai',
    };
    setMessages((prev) => [...prev, qMsg, aMsg]);
    setShowHistoryModal(false);
  };

  const handleConfirmReset = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: language === 'en' ? WELCOME_EN : WELCOME_BN,
        time: language === 'en' ? 'Just now' : 'এইমাত্র',
      },
    ]);
    setInputText('');
    setVoiceError(null);
    setShowClearConfirm(false);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (_) {}
  };

  const suggestedQuestions =
    language === 'en' ? SUGGESTED_QUESTIONS_EN : SUGGESTED_QUESTIONS_BN;

  return (
    <div
      id="ai-chatbot-screen"
      className="flex flex-col h-[780px] max-h-[85vh] -mx-4 -mt-3 bg-stone-50 dark:bg-stone-900 relative rounded-2xl overflow-hidden"
    >
      {/* Chat Header */}
      <div className="bg-emerald-600 dark:bg-emerald-700 text-white px-3 sm:px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            id="btn-chat-back"
            onClick={onBack}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
            title={language === 'en' ? 'Back' : 'ফিরে যান'}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          {/* Bot Avatar Picture from public/sec/bot.png */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 p-0.5 overflow-hidden border border-white/40 flex items-center justify-center">
              <img
                src="/sec/bot.png"
                alt="AI Bot"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            {/* Online Green Indicator Dot */}
            <div className="w-2.5 h-2.5 bg-emerald-300 border-2 border-emerald-600 rounded-full absolute -bottom-0.5 -right-0.5 animate-pulse"></div>
          </div>

          <div>
            <h1 className="text-xs sm:text-sm font-extrabold flex items-center gap-1 leading-tight">
              <span>{language === 'en' ? 'AI Agri Assistant' : 'কৃষি বন্ধু AI'}</span>
            </h1>
            <span className="text-[9px] sm:text-[10px] text-emerald-100 font-medium block">
              {language === 'en' ? '24/7 Digital Agronomist' : 'সার্বক্ষণিক ডিজিটাল কৃষিবিদ'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Cloud Auto-Saved indicator */}
          <div
            className="hidden sm:flex items-center gap-1 text-[10px] bg-emerald-700/60 px-2 py-1 rounded-full text-emerald-100 border border-emerald-500/30"
            title={
              language === 'en'
                ? 'All messages safely synced to Cloud database'
                : 'সব বার্তা ক্লাউড ডাটাবেজে ও ফোনে সংরক্ষিত রয়েছে'
            }
          >
            <Cloud className="w-3 h-3 text-emerald-300" />
            <span>{language === 'en' ? 'Saved' : 'সংরক্ষিত'}</span>
          </div>

          {/* History Button */}
          <button
            id="btn-chat-history"
            onClick={handleOpenHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors text-xs font-semibold cursor-pointer"
            title={language === 'en' ? 'View inquiry history' : 'পূর্ববর্তী আলাপের ইতিহাস দেখুন'}
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden xs:inline">
              {language === 'en' ? 'History' : 'ইতিহাস'}
            </span>
          </button>

          {/* New Chat Button */}
          <button
            id="btn-chat-reset"
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 text-emerald-100 transition-colors cursor-pointer"
            title={language === 'en' ? 'Start new chat' : 'নতুন আলাপ শুরু করুন'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/80 dark:bg-stone-900">
        {messages.map((msg) => {
          const displayText =
            msg.id === 'msg-welcome'
              ? language === 'en'
                ? WELCOME_EN
                : WELCOME_BN
              : msg.text;
          const displayTime =
            msg.time === 'এইমাত্র'
              ? language === 'en'
                ? 'Just now'
                : 'এইমাত্র'
              : msg.time;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bot Avatar in message list */}
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 overflow-hidden flex-shrink-0 p-0.5">
                  <img
                    src="/sec/bot.png"
                    alt="AI Bot"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div
                className={`max-w-[84%] rounded-2xl p-3.5 shadow-xs text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-bl-none'
                }`}
              >
                {/* Message text with bold & line break support */}
                <div className="whitespace-pre-line font-medium text-[13px] space-y-1">
                  {displayText}
                </div>

                {/* Message footer with timestamp */}
                <div
                  className={`text-[10px] mt-1.5 flex items-center justify-end ${
                    msg.sender === 'user'
                      ? 'text-emerald-200'
                      : 'text-stone-400 dark:text-stone-500'
                  }`}
                >
                  <span>{displayTime}</span>
                </div>
              </div>

              {/* User Icon avatar */}
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* AI Thinking Animation */}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 overflow-hidden flex-shrink-0 p-0.5">
              <img src="/sec/bot.png" alt="AI Bot" className="w-full h-full object-contain" />
            </div>
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl rounded-bl-none p-3 shadow-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
              <div
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></div>
              <span className="text-[11px] text-stone-600 dark:text-stone-300 ml-1 font-semibold">
                {language === 'en'
                  ? 'Agri Assistant is preparing your answer...'
                  : 'কৃষি বন্ধু উত্তর প্রস্তুত করছেন...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      {messages.length <= 2 && !isListening && (
        <div className="bg-white dark:bg-stone-850 px-3 py-2 border-t border-stone-200 dark:border-stone-800">
          <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1.5">
            {language === 'en'
              ? 'Frequently Asked Questions (tap to send):'
              : 'সচরাচর জিজ্ঞাসিত প্রশ্ন (ক্লিক করে সরাসরি পাঠান):'}
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.replace(/^[^\s]+\s/, ''))}
                className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Voice Listening Banner with Audio Waves */}
      {isListening && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border-t border-rose-200 dark:border-rose-900 px-4 py-2.5 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 bg-rose-600 rounded-full h-3 animate-pulse"></span>
              <span className="w-1 bg-rose-600 rounded-full h-5 animate-bounce"></span>
              <span className="w-1 bg-rose-600 rounded-full h-2 animate-pulse"></span>
              <span
                className="w-1 bg-rose-600 rounded-full h-4 animate-bounce"
                style={{ animationDelay: '0.15s' }}
              ></span>
            </div>
            <div>
              <span className="font-bold text-rose-900 dark:text-rose-100 block text-[12px]">
                {language === 'en'
                  ? 'Listening... Speak your question now'
                  : 'আপনার কথা শুনছি... বাংলায় প্রশ্ন করুন'}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                {language === 'en'
                  ? "Tap 'Done' or mic button when finished"
                  : "বলা শেষ হলে 'সম্পন্ন' বা মাইক বাটনে চাপ দিন"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoiceInput}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Done' : 'সম্পন্ন'}
            </button>
            <button
              onClick={() => {
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.stop();
                  } catch (_) {}
                }
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                  try {
                    mediaRecorderRef.current.stop();
                  } catch (_) {}
                }
                setIsListening(false);
              }}
              className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 hover:underline cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'বাতিল'}
            </button>
          </div>
        </div>
      )}

      {/* Voice Processing/Transcribing Indicator */}
      {isTranscribing && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-900 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
          <span className="font-semibold text-[11px]">
            {language === 'en'
              ? 'Converting voice to text...'
              : 'আপনার কথা টেক্সটে রূপান্তর হচ্ছে...'}
          </span>
        </div>
      )}

      {/* Voice Error Notification Banner */}
      {voiceError && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-900 px-3.5 py-1.5 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] font-medium">{voiceError}</span>
          </div>
          <button
            onClick={() => setVoiceError(null)}
            className="text-[10px] text-amber-900 dark:text-amber-100 font-bold ml-2 hover:underline cursor-pointer"
          >
            {language === 'en' ? 'OK' : 'ঠিক আছে'}
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="bg-white dark:bg-stone-850 p-3 border-t border-stone-200 dark:border-stone-800 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Microphone Button */}
          <button
            id="btn-voice-input"
            type="button"
            onClick={toggleVoiceInput}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 relative cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white shadow-lg ring-4 ring-rose-200 animate-pulse'
                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-stone-700'
            }`}
            title={
              isListening
                ? language === 'en'
                  ? 'Stop listening'
                  : 'কথা বলা বন্ধ করতে চাপুন'
                : language === 'en'
                ? 'Speak to ask question'
                : 'মুখে বলে বাংলায় প্রশ্ন করুন'
            }
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            )}
            {/* Pulsing ring when active */}
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
            )}
          </button>

          {/* Text Input */}
          <input
            id="input-chat-message"
            type="text"
            placeholder={
              isListening
                ? language === 'en'
                  ? 'Listening to voice...'
                  : 'আপনার কথা শোনা হচ্ছে...'
                : language === 'en'
                ? 'Type crop disease, fertilizer or farming question...'
                : 'আপনার ফসলের প্রশ্ন লিখুন বা মাইকে বলুন...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || isTranscribing}
            className={`flex-1 bg-stone-100 dark:bg-stone-800 border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
              isListening
                ? 'border-rose-300 bg-rose-50/50 dark:border-rose-800'
                : 'border-stone-200 dark:border-stone-700'
            }`}
          />

          {/* Send Button */}
          <button
            id="btn-chat-send"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
              inputText.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed'
            }`}
            title={language === 'en' ? 'Send message' : 'বার্তা পাঠান'}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 dark:border-stone-800 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {language === 'en' ? 'Start a new chat?' : 'নতুন চ্যাট শুরু করবেন?'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                {language === 'en'
                  ? 'Current chat screen will be cleared. All conversations are safely saved and can be viewed in History.'
                  : 'বর্তমান চ্যাট স্ক্রিন খালি করা হবে। আপনার পূর্ববর্তী সমস্ত প্রশ্নোত্তর ক্লাউড ডাটাবেজে সংরক্ষিত রয়েছে এবং যেকোনো সময় ইতিহাস থেকে দেখা যাবে।'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Start New Chat' : 'নতুন চ্যাট শুরু করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Consultations History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <History className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {language === 'en' ? 'Saved Chat Inquiries' : 'সংরক্ষিত আলাপের ইতিহাস'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50 dark:bg-stone-950">
              {loadingHistory ? (
                <div className="py-12 text-center text-stone-500 dark:text-stone-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs">
                    {language === 'en'
                      ? 'Loading saved history...'
                      : 'সংরক্ষিত ইতিহাস লোড হচ্ছে...'}
                  </p>
                </div>
              ) : savedInquiries.length === 0 ? (
                <div className="py-12 text-center text-stone-500 dark:text-stone-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-stone-400" />
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    {language === 'en'
                      ? 'No saved history found yet'
                      : 'কোনো সংরক্ষিত ইতিহাস পাওয়া যায়নি'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    {language === 'en'
                      ? 'Your conversations with AI Agri Assistant will be automatically archived here.'
                      : 'AI কৃষি বন্ধুর সাথে আপনি যা কথা বলবেন, তা স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত থাকবে।'}
                  </p>
                </div>
              ) : (
                savedInquiries.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-2xs hover:border-emerald-500 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800 pb-1.5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {item.detectedCrop ||
                          (language === 'en' ? 'General Advisory' : 'সাধারণ পরামর্শ')}
                      </span>
                      <span>
                        {item.clientTimestamp
                          ? new Date(item.clientTimestamp).toLocaleDateString(
                              language === 'en' ? 'en-US' : 'bn-BD',
                              {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )
                          : language === 'en'
                          ? 'Saved'
                          : 'সংরক্ষিত'}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-start gap-1.5">
                        <span className="text-emerald-600 flex-shrink-0">
                          {language === 'en' ? 'Question:' : 'প্রশ্ন:'}
                        </span>
                        <span>{item.question}</span>
                      </p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-850 rounded-lg p-2 text-[11px] text-stone-700 dark:text-stone-300 border border-stone-100 dark:border-stone-800 max-h-24 overflow-y-auto">
                      <span className="font-bold text-stone-800 dark:text-stone-200 block mb-0.5">
                        {language === 'en' ? 'Advisory:' : 'পরামর্শ:'}
                      </span>
                      <p className="whitespace-pre-line line-clamp-3">{item.answer}</p>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleLoadInquiry(item)}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{language === 'en' ? 'Load into Chat' : 'চ্যাটে লোড করুন'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-stone-100 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 px-4 py-2.5 flex items-center justify-end text-xs text-stone-600">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 font-semibold text-stone-800 dark:text-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'বন্ধ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

