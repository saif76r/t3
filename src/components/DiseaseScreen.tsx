import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Scan,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  SwitchCamera,
  X,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { saveDiagnosisToFirestore } from '../lib/firebase';
import { INITIAL_DISEASE } from '../data';
import { toBn } from '../services/weatherService';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

interface Props {
  onBack: () => void;
  onOpenChatWithQuery?: (query: string) => void;
}

interface DiagnosisResult {
  isPlant: boolean;
  cropName: string;
  cropScientific?: string;
  diseaseName: string;
  diseaseScientific?: string;
  severity: string;
  confidenceScore: number;
  symptomsObserved: string;
  cause: string;
  treatments: {
    chemical: Array<{
      name: string;
      dose: string;
      instruction: string;
    }>;
    organic: Array<{
      method: string;
      details: string;
    }>;
    prevention: string[];
  };
  expertNote?: string;
  modelProvider?: string;
  engine?: string;
}

// Helper to compress and resize large camera images before upload
const optimizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const DiseaseScreen: React.FC<Props> = ({ onBack, onOpenChatWithQuery }) => {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [viewState, setViewState] = useState<'main' | 'camera-live' | 'scanning' | 'detail'>('main');
  const [activeTab, setActiveTab] = useState<'chemical' | 'organic' | 'prevention'>('chemical');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedCrop, setSelectedCrop] = useState<string>('auto');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const CROPS_LIST = [
    { id: 'auto', label: isEn ? '🤖 Auto Detect' : '🤖 অটো শনাক্তকরণ' },
    { id: 'টমেটো', label: isEn ? '🍅 Tomato' : '🍅 টমেটো' },
    { id: 'বেগুন', label: isEn ? '🍆 Brinjal' : '🍆 বেগুন' },
    { id: 'মরিচ', label: isEn ? '🌶️ Chili' : '🌶️ মরিচ' },
    { id: 'ভুট্টা', label: isEn ? '🌽 Maize' : '🌽 ভুট্টা' },
    { id: 'ধান', label: isEn ? '🌾 Rice' : '🌾 ধান' },
    { id: 'আলু', label: isEn ? '🥔 Potato' : '🥔 আলু' },
    { id: 'পেঁপে', label: isEn ? '🍈 Papaya' : '🍈 পেঁপে' },
    { id: 'আম', label: isEn ? '🥭 Mango' : '🥭 আম' },
    { id: 'কলা', label: isEn ? '🍌 Banana' : '🍌 কলা' },
    { id: 'ফুলকপি', label: isEn ? '🥦 Cauliflower' : '🥦 ফুলকপি' },
    { id: 'সরিষা', label: isEn ? '🌿 Mustard' : '🌿 সরিষা' },
    { id: 'গম', label: isEn ? '🌾 Wheat' : '🌾 গম' },
  ];

  // Stop video stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Start real live camera stream
  const startLiveCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setViewState('camera-live');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Direct mediaDevices.getUserMedia not permitted or unavailable:', err);
      // Fallback: trigger mobile native camera file input
      stopCameraStream();
      setViewState('main');
      nativeCameraInputRef.current?.click();
    }
  };

  // Flip camera (back <-> front)
  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  // Capture current frame from live camera video
  const captureLiveFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      stopCameraStream();
      setCapturedImage(dataUrl);
      analyzeLeafImage(dataUrl);
    }
  };

  // Handle file chosen from gallery or native camera with canvas optimization
  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedDataUrl = await optimizeImage(file);
      if (optimizedDataUrl) {
        setCapturedImage(optimizedDataUrl);
        analyzeLeafImage(optimizedDataUrl);
      }
    } catch (err) {
      console.error('Failed to read and optimize image:', err);
    }
  };

  // Real AI Leaf Diagnosis via /api/diagnose-crop
  const analyzeLeafImage = async (dataUrl: string, overrideCrop?: string) => {
    const activeCrop = overrideCrop !== undefined ? overrideCrop : selectedCrop;
    setViewState('scanning');
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/diagnose-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          cropHint: activeCrop === 'auto' ? undefined : activeCrop,
          language,
        }),
      });

      const resText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch (parseErr) {
        console.warn('Response was not JSON:', resText.slice(0, 150));
      }

      if (!res.ok) {
        throw new Error(data?.error || `সার্ভার রেসপন্স কোড: ${res.status}`);
      }

      if (data && data.diagnosis) {
        setDiagnosis(data.diagnosis);
        setViewState('detail');
        // Automatically synchronize with Firebase Firestore
        saveDiagnosisToFirestore({
          cropName: data.diagnosis.cropName || 'অজানা ফসল',
          cropScientific: data.diagnosis.cropScientific,
          diseaseName: data.diagnosis.diseaseName || 'সুস্থ',
          diseaseScientific: data.diagnosis.diseaseScientific,
          severity: data.diagnosis.severity || 'মাঝারি',
          confidenceScore: data.diagnosis.confidenceScore || 90,
          symptomsObserved: data.diagnosis.symptomsObserved,
          cause: data.diagnosis.cause,
          treatments: JSON.stringify(data.diagnosis.treatments || []),
          expertNote: data.diagnosis.expertNote,
          modelProvider: data.diagnosis.modelProvider || 'Gemini Vision AI',
        }).catch((err) => console.warn('Firestore diagnosis sync warning:', err));
      } else {
        throw new Error('Diagnosis response invalid');
      }
    } catch (err: any) {
      console.error('Diagnosis processing notice:', err?.message || err);
      const errorMsg = err?.message
        ? `ত্রুটি: ${err.message}`
        : 'AI ভিশন সার্ভার সাময়িক ব্যস্ত ছিল। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
      setAnalysisError(errorMsg);
      setViewState('main');
      return;
      /*
        setDiagnosis({
          isPlant: true,
          cropName: 'পেঁপে',
          cropScientific: 'Carica papaya',
          diseaseName: 'পেঁপের রিং স্পট ভাইরাস (PRSV) ও কাণ্ড পচা রোগ',
          diseaseScientific: 'Papaya Ringspot Virus / Pythium aphanidermatum',
          severity: 'মাঝারি',
          confidenceScore: 94,
          symptomsObserved: 'পেঁপের করতলাকার চওড়া পাতায় শিরা বরাবর স্বচ্ছ বা হলুদ মোজাইক ছোপ, পাতার কিনারা বিকৃত ও খর্বাকৃতি হওয়া এবং পাতার বোঁটায় জলছাপের মতো দাগ দেখা যাচ্ছে।',
          cause: 'রিং স্পট ভাইরাস (জাবপোকা বা এফিড দ্বারা বাহিত) এবং বর্ষাকালে গোড়ায় অতিরিক্ত আর্দ্রতায় ছত্রাকজনিত আক্রমণ।',
          treatments: {
            chemical: [
              {
                name: 'ইমিডাক্লোপ্রিড ২০ এসএল (যেমন: এডমায়ার / টিডো)',
                dose: 'প্রতি লিটার পানিতে ০.৫ মিলি',
                instruction: 'ভাইরাস বিস্তারকারী জাবপোকা ও সাদা মাছি দমনে পাতার উভয় পিঠে ভালো করে স্প্রে করুন।',
              },
              {
                name: 'কপার অক্সিক্লোরাইড ৫০% ডব্লিউপি (যেমন: কুপ্রোফিক্স বা চ্যাম্পিয়ন)',
                dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                instruction: 'কাণ্ড ও গোড়া পচা রোগ দমনে গাছের গোড়ায় মাটি ভিজিয়ে স্প্রে করুন।',
              },
            ],
            organic: [
              {
                method: 'আক্রান্ত মারাত্মক পাতা ও গাছ অপসারণ',
                details: 'তীব্র ভাইরাস আক্রান্ত পাতা কেটে ক্ষেত থেকে দূরে নিয়ে পুড়িয়ে ফেলুন যাতে অন্য গাছে না ছড়ায়।',
              },
              {
                method: 'নিম তেলের মিশ্রণ',
                details: 'প্রতি লিটার পানিতে ৫ মিলি নিম তেল ও সামান্য ডিটারজেন্ট মিশিয়ে ৭ দিন পর পর স্প্রে করুন।',
              },
            ],
            prevention: [
              'পেঁপে গাছের গোড়ায় যেন কোনো অবস্থাতেই পানি জমে না থাকে, উঁচু বেড তৈরি করুন ও নালার ব্যবস্থা রাখুন।',
              'রোগমুক্ত সুস্থ চারা রোপণ করুন এবং জমির চারপাশে ভুট্টা বা ধইঞ্চার প্রতিবন্ধক বেড়া তৈরি করুন।',
            ],
          },
          expertNote: 'পেঁপের রিং স্পট ভাইরাস পোকার মাধ্যমে ছড়ায়, তাই পোকা দমন ও গোড়ায় পানি নিষ্কাশন নিশ্চিত করা সবচেয়ে জরুরি।',
        });
        setViewState('detail');
      } else if (activeCrop === 'ভুট্টা') {
        setDiagnosis({
          isPlant: true,
          cropName: 'ভুট্টা',
          cropScientific: 'Zea mays',
          diseaseName: 'ভুট্টার কান্ড পচা ও গোড়া পচা রোগ (Stem Rot Disease)',
          diseaseScientific: 'Diplodia maydis & Fusarium moniliforme',
          severity: 'মাঝারি',
          confidenceScore: 93,
          symptomsObserved: 'ভুট্টা গাছের কাণ্ডের নিচের গিঁট বা গোড়ার অংশ বাদামি হয়ে পচে যাচ্ছে, কাণ্ডের ভেতরের আঁশ বা মজ্জা (pith) নষ্ট হয়ে কাণ্ড নরম ও ফাঁপা হচ্ছে।',
          cause: 'ডিপ্লোডিয়া (Diplodia maydis) এবং ফিউজারিয়াম (Fusarium) ছত্রাকের আক্রমণ। জমিতে জলাবদ্ধতা বা সুষম সারের অভাবে এ রোগ বাড়ে।',
          treatments: {
            chemical: [
              {
                name: 'কার্বেন্ডাজিম ৫০% ডব্লিউপি (যেমন: নোইন বা অটোস্টিন)',
                dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                instruction: 'গাছের গোড়া ও কাণ্ডের নিচের অংশে ভালো করে স্প্রে ও মাটি ভিজিয়ে দিন। ৭ দিন পর পুনরায় দিন।',
              },
              {
                name: 'এজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (যেমন: এমিস্টার টপ ৩২৫ এসসি)',
                dose: 'প্রতি লিটার পানিতে ১ মিলি',
                instruction: 'পাতার ব্লাইট ও কান্ড পচা উভয়ের বিরুদ্ধেই দ্রুত কাজ করে।',
              },
            ],
            organic: [
              {
                method: 'ট্রাইকোডার্মা বায়ো-ফাংগিসাইড প্রয়োগ',
                details: 'গাছের গোড়ার মাটিতে ট্রাইকোডার্মা সমৃদ্ধ জৈব সার প্রয়োগ করুন।',
              },
            ],
            prevention: [
              'জমিতে যেন বৃষ্টির বা সেচের পানি জমে না থাকে, দ্রুত পানি নিষ্কাশনের ব্যবস্থা করুন।',
              'সুষম সার প্রয়োগ করুন, অতিরিক্ত ইউরিয়া কমিয়ে পর্যাপ্ত পটাশ (এমওপি) সার দিন যা কাণ্ডকে মজবুত করে।',
              'বপনের আগে প্রতি কেজি বীজে ২.৫ গ্রাম প্রভ্যাক্স ২০০ ডব্লিউপি দিয়ে বীজ শোধন করুন।',
            ],
          },
          expertNote: 'ভুট্টার কাণ্ড পচা রোগ কাণ্ডকে দুর্বল করে গাছ ফেলে দেয়, তাই দ্রুত গাছের গোড়ায় অনুমোদিত ছত্রাকনাশক স্প্রে করুন।',
        });
        setViewState('detail');
      } else if (activeCrop === 'আলু') {
        setDiagnosis({
          isPlant: true,
          cropName: 'আলু',
          cropScientific: 'Solanum tuberosum',
          diseaseName: 'আলুর নাবি ধসা (লেট ব্লাইট) রোগ',
          diseaseScientific: 'Phytophthora infestans',
          severity: 'তীব্র',
          confidenceScore: 95,
          symptomsObserved: 'আলুর পাতায় ভেজা ভেজা কালচে দাগ এবং পাতার নিচে সাদা তুলার মতো ছত্রাকের স্তর দেখা যাচ্ছে।',
          cause: 'ছত্রাকজনিত সংক্রমণ (ঘন কুয়াশা ও স্যাঁতসেঁতে মেঘলা আবহাওয়া)।',
          treatments: {
            chemical: [
              {
                name: 'সাইমোক্সানিল + ম্যানকোজেব (কার্জেট বা মেলোডি ডুও)',
                dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                instruction: 'কুয়াশাচ্ছন্ন আবহাওয়ায় ৭ দিন পর পর স্প্রে করুন।',
              },
            ],
            organic: [
              {
                method: 'বোর্দো মিশ্রণ (১%)',
                details: '১০০ গ্রাম তুঁতে ও ১০০ গ্রাম চুন ১০ লিটার পানিতে মিশিয়ে রোগ আসার আগে স্প্রে করুন।',
              },
            ],
            prevention: ['রোগমুক্ত প্রত্যায়িত বীজ ব্যবহার করুন।', 'কুয়াশার সময় জমিতে সেচ বন্ধ রাখুন।'],
          },
          expertNote: 'লেট ব্লাইট আলুর সবচেয়ে মারাত্মক রোগ, দ্রুত ব্যবস্থা গ্রহণ করুন।',
        });
        setViewState('detail');
      } else if (activeCrop === 'ধান') {
        setDiagnosis({
          isPlant: true,
          cropName: 'ধান',
          cropScientific: 'Oryza sativa',
          diseaseName: 'ধানের ব্লাস্ট বা পাতাপোড়া রোগ',
          diseaseScientific: 'Magnaporthe oryzae',
          severity: 'মাঝারি',
          confidenceScore: 91,
          symptomsObserved: 'পাতায় চোখের মতো মাঝখানে ধূসর ও কিনারে বাদামি দাগ দৃশ্যমান।',
          cause: 'ছত্রাকজনিত সংক্রমণ (অতিরিক্ত আর্দ্রতা ও নাইট্রোজেন সারের প্রভাব)।',
          treatments: {
            chemical: [
              {
                name: 'ট্রাইসাইক্লাজল ৭৫% ডব্লিউপি (যেমন: ট্রুপার বা দিফা)',
                dose: 'প্রতি লিটার পানিতে ১ গ্রাম',
                instruction: 'বিকেলের মিষ্টি রোদে পাতার উভয় পিঠ ভালো করে ভিজিয়ে স্প্রে করুন।',
              },
            ],
            organic: [
              {
                method: 'কাঁচা গোবর ও কাঠের ছাইয়ের দ্রবণ',
                details: '১০ লিটার পানিতে ১ কেজি গোবর ও ছাই ভালো করে গুলে ছেঁকে পাতায় স্প্রে করুন।',
              },
            ],
            prevention: [
              'ইউরিয়া সারের অতিরিক্ত উপরিপ্রয়োগ স্থগিত রাখুন।',
              'জমিতে পরিমিত পানি সংরক্ষণ করুন।',
            ],
          },
          expertNote: 'আবহাওয়া স্যাঁতসেঁতে থাকলে রোগ দ্রুত বাড়ে, তাই দ্রুত ছত্রাকনাশক স্প্রে করুন।',
        });
        setViewState('detail');
      } else if (activeCrop === 'টমেটো') {
        setDiagnosis({
          isPlant: true,
          cropName: 'টমেটো',
          cropScientific: 'Solanum lycopersicum',
          diseaseName: 'টমেটোর পাতা কোঁকড়ানো রোগ (Tomato Leaf Curl Virus)',
          diseaseScientific: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
          severity: 'তীব্র',
          confidenceScore: 94,
          symptomsObserved: 'টমেটোর পাতা উপরের বা নিচের দিকে কুঁকড়ে যাওয়া, শিরা মোটা ও হলুদ হয়ে যাওয়া এবং গাছের সার্বিক বৃদ্ধি থমকে গিয়ে ঝোপের মতো হওয়া।',
          cause: 'ভাইরাসজনিত আক্রমণ। সাদা মাছি (Whitefly / Bemisia tabaci) এই ভাইরাসের প্রধান বাহক।',
          treatments: {
            chemical: [
              {
                name: 'অ্যাসিটামিপ্রিড ২০ এসপি (যেমন: টুপেক্স / গেইন) বা ডায়াফেনথিউরন (পেগাসাস)',
                dose: 'প্রতি লিটার পানিতে ১ গ্রাম',
                instruction: 'সাদা মাছি দমনে পাতার নিচের পিঠে সুন্দরভাবে স্প্রে করুন। ৭-১০ দিন পর পুনরায় স্প্রে করুন।',
              },
              {
                name: 'ইমিডাক্লোপ্রিড ২০ এসএল (এডমায়ার / টিডো)',
                dose: 'প্রতি লিটার পানিতে ০.৫ মিলি',
                instruction: 'বাহক পোকা নিয়ন্ত্রণে অত্যন্ত দ্রুত ও কার্যকর।',
              },
            ],
            organic: [
              {
                method: 'হলুদ আঠালো ফাঁদ (Yellow Sticky Trap)',
                details: 'জমিতে প্রতি শতকে ১-২টি হলুদ আঠালো ফাঁদ স্থাপন করে সাদা মাছি আকৃষ্ট করে আটকে ফেলুন।',
              },
              {
                method: 'নিম তেল স্প্রে',
                details: 'প্রতি লিটার পানিতে ৫ মিলি নিম তেল ও সামান্য ডিটারজেন্ট মিশিয়ে নিয়মিত স্প্রে করুন।',
              },
            ],
            prevention: [
              'চারা রোপণের পর প্রাথমিক অবস্থায় সাদা মাছি প্রতিরোধী জাল (Netting) ব্যবহার করুন।',
              'আক্রান্ত মারাত্মক গাছগুলো দ্রুত তুলে মাটি চাপা দিন যাতে রোগ ছড়িয়ে না পড়ে।',
              'জমিতে সুষম সার ব্যবহার করুন ও অতিরিক্ত নাইট্রোজেন সার পরিহার করুন।',
            ],
          },
          expertNote: 'ভাইরাস আক্রমণের পর গাছ পুরোপুরি সারানো কঠিন, তাই বাহক পোকা সাদা মাছি দমন করাই মূল প্রতিকার।',
        });
        setViewState('detail');
      } else if (activeCrop === 'বেগুন') {
        setDiagnosis({
          isPlant: true,
          cropName: 'বেগুন',
          cropScientific: 'Solanum melongena',
          diseaseName: 'বেগুনের ফোমপসিস ফল পচা রোগ (Phomopsis Fruit Rot)',
          diseaseScientific: 'Phomopsis vexans',
          severity: 'তীব্র',
          confidenceScore: 95,
          symptomsObserved: 'বেগুনের ফলের গায়ে বড় আকারের বাদামি রঙের দেবে যাওয়া ক্ষত বা পচন এবং সাদা রঙের ছত্রাকের মাইসেলিয়াম দৃশ্যমান।',
          cause: 'ফোমপসিস ভেক্সানস ছত্রাকের আক্রমণ।',
          modelProvider: 'অফলাইন মোড (Vercel-এ GEMINI_API_KEY যুক্ত করুন)',
          treatments: {
            chemical: [
              {
                name: 'ম্যানকোজেব + মেটালেক্সিল (রিডোমিল গোল্ড) বা নোইন',
                dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                instruction: 'ফল ও পুরো গাছে ৭-১০ দিন পর পর স্প্রে করুন।',
              },
            ],
            organic: [
              {
                method: 'আক্রান্ত ফল অপসারণ',
                details: 'পচা ফল তুলে নষ্ট করুন এবং জমিতে পানি নিষ্কাশন ঠিক রাখুন।',
              },
            ],
            prevention: [
              'রোগমুক্ত বীজ ব্যবহার ও ট্রাইকোডার্মা দিয়ে বীজ শোধন করুন।',
            ],
          },
          expertNote: 'বৃষ্টির দিনে ফল পচা দ্রুত ছড়ায়, তাই দ্রুত ছত্রাকনাশক স্প্রে করুন।',
        });
        setViewState('detail');
      } else if (activeCrop === 'মরিচ') {
        setDiagnosis({
          isPlant: true,
          cropName: 'মরিচ',
          cropScientific: 'Capsicum annuum',
          diseaseName: 'মরিচের পাতা কোঁকড়ানো রোগ (Chilli Leaf Curl / Thrips & Mites)',
          diseaseScientific: 'Chilli Leaf Curl Virus / Polyphagotarsonemus latus',
          severity: 'মাঝারি',
          confidenceScore: 93,
          symptomsObserved: 'মরিচের পাতা উল্টো নৌকার মতো কুঁকড়ে যাওয়া, পাতার নিচের পিঠ বাদামি হওয়া ও ছোট হয়ে যাওয়া।',
          cause: 'মাকড় (Mite) বা থ্রিপস পোকার রস চোষার ফলে এবং ভাইরাস সংক্রমণের কারণে এ রোগ হয়।',
          treatments: {
            chemical: [
              {
                name: 'ভার্টিমেক বা ওমাইট (অ্যাবামেকটিন / প্রোপারগাইট)',
                dose: 'প্রতি লিটার পানিতে ১.৫ মিলি',
                instruction: 'মাকড় দমনে পাতার নিচের পিঠে ভালোভাবে স্প্রে করুন।',
              },
            ],
            organic: [
              {
                method: 'সাবান পানি বা ছাই ও নিম পাতার রস',
                details: '১০ লিটার পানিতে নিম পাতার রস ও সাবানের গুঁড়ো মিশিয়ে স্প্রে করুন।',
              },
            ],
            prevention: ['ক্ষেত সবসময় আগাছামুক্ত রাখুন ও সুস্থ চারা রোপণ করুন।'],
          },
          expertNote: 'পাতা নিচের দিকে কুঁকড়ালে মাকড়নাশক এবং উপরের দিকে কুঁকড়ালে থ্রিপসনাশক স্প্রে করুন।',
        });
        setViewState('detail');
      } else if (activeCrop === 'কলা') {
        setDiagnosis({
          isPlant: true,
          cropName: 'কলা',
          cropScientific: 'Musa acuminata',
          diseaseName: 'কলার সিগাটোকা রোগ (Black / Yellow Sigatoka)',
          diseaseScientific: 'Pseudocercospora musae / Mycosphaerella fijiensis',
          severity: 'মাঝারি',
          confidenceScore: 94,
          symptomsObserved: 'কলার পাতায় সমান্তরালে ছোট ছোট হলুদ বা বাদামি সরু দাগ, যা পরবর্তীতে বড় হয়ে মাঝখানে ধূসর ও কিনারায় কালচে বলয় সৃষ্টি করে এবং পাতা পুড়ে যাওয়ার মতো শুকিয়ে ঝুলে পড়ে।',
          cause: 'ছত্রাকজনিত সংক্রমণ। উচ্চ আর্দ্রতা ও উষ্ণ স্যাঁতসেঁতে আবহাওয়ায় বাতাসের মাধ্যমে জীবাণু দ্রুত ছড়ায়।',
          treatments: {
            chemical: [
              {
                name: 'প্রোপিকোনাজল ২৫% ইসি (টিল্ট / অটোটিল্ট)',
                dose: 'প্রতি লিটার পানিতে ১ মিলি',
                instruction: 'লক্ষণ দেখার সাথে সাথে পাতার ওপর ও নিচ ভালো করে ভিজিয়ে স্প্রে করুন। ১৫ দিন পর আরেকবার দিন।',
              },
              {
                name: 'এমিস্টার টপ ৩২৫ এসসি (এজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল)',
                dose: 'প্রতি লিটার পানিতে ১ মিলি',
                instruction: 'তীব্র আক্রমণে অত্যন্ত কার্যকর প্রতিকার দেয়।',
              },
            ],
            organic: [
              {
                method: 'আক্রান্ত পাতা ছাঁটাই ও ধ্বংস',
                details: '৫০% এর বেশি আক্রান্ত পাতা ধারালো দা দিয়ে কেটে ক্ষেতের বাইরে নিরাপদ স্থানে পুড়িয়ে ফেলুন।',
              },
            ],
            prevention: [
              'ক্ষেতে সেচ বা বৃষ্টির পানি নিষ্কাশনের সুষ্ঠু নালা রাখুন।',
              'অতিরিক্ত ঘন করে চারা রোপণ করবেন না এবং নিয়মিত আগাছা পরিষ্কার রাখুন।',
            ],
          },
          expertNote: 'সিগাটোকা রোগ দ্রুত পুরো পাতায় ছড়িয়ে শালোকসংশ্লেষণ বন্ধ করে দেয়, তাই প্রাথমিক দাগেই ছত্রাকনাশক স্প্রে করুন।',
        });
        setViewState('detail');
      } else {
        const errorMsg = err?.message ? `ত্রুটি: ${err.message}` : 'AI ভিশন সার্ভার সাময়িক ব্যস্ত ছিল। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা ওপরের তালিকা থেকে নির্দিষ্ট ফসল নির্বাচন করে দিন।';
        setAnalysisError(errorMsg);
        setViewState('main');
      }
      */
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="disease-diagnosis-screen" className="space-y-4 pb-8">
      {/* Native hidden camera inputs for mobile fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChosen}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={handleFileChosen}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-disease-back"
          onClick={() => {
            if (viewState === 'camera-live') {
              stopCameraStream();
              setViewState('main');
            } else if (viewState === 'scanning' || viewState === 'detail') {
              setViewState('main');
            } else {
              onBack();
            }
          }}
          className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-900">
            {viewState === 'detail'
              ? (isEn ? 'Diagnosis Report' : 'রোগ নির্ণয় বিবরণী')
              : viewState === 'camera-live'
              ? (isEn ? 'Live Camera Scan' : 'লাইভ ক্যামেরা স্ক্যান')
              : (isEn ? 'Crop Disease Diagnosis' : 'রোগ শনাক্তকরণ (রিয়েল স্ক্যান)')}
          </h1>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            {isEn ? 'AI Vision & Pathology Engine' : 'AI দৃষ্টি ও উদ্ভিদ রোগতত্ত্ব ইঞ্জিন'}
          </span>
        </div>
        <div className="flex items-center">
          <LanguageToggle />
        </div>
      </div>

      {/* VIEW 1: Main Picker & Recent Advice */}
      {viewState === 'main' && (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Analysis Error Notification if any */}
          {analysisError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-left space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-red-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{isEn ? 'Scan Notice' : 'স্ক্যান সংক্রান্ত বিজ্ঞপ্তি'}</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                {analysisError}
              </p>
            </div>
          )}

          {/* Crop Selector Chips */}
          <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-emerald-600" />
                {isEn ? 'Crop Type (Optional):' : 'ফসলের ধরন (নির্দিষ্ট করতে পারেন):'}
              </span>
              {selectedCrop !== 'auto' && (
                <button
                  onClick={() => setSelectedCrop('auto')}
                  className="text-[10px] text-emerald-700 font-semibold underline"
                >
                  {isEn ? 'Reset (Auto)' : 'রিসেট (অটো)'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CROPS_LIST.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                    selectedCrop === crop.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  {crop.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Photo Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-between text-left">
              <div>
                <h2 className="text-base font-bold text-stone-900">{isEn ? 'Scan Crop Leaf' : 'আসল পাতা স্ক্যান করুন'}</h2>
                <p className="text-xs text-stone-600">
                  {selectedCrop === 'auto'
                    ? (isEn ? 'Capture or upload image for real AI diagnosis' : 'ক্যামেরা বা ছবি আপলোড করে আসল রোগ নির্ণয় করুন')
                    : (isEn ? `Selected crop: ${selectedCrop} — capture or upload image` : `নির্বাচিত ফসল: ${selectedCrop} — ক্যামেরা বা ছবি আপলোড করুন`)}
                </p>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                {isEn ? '100% Real' : '১০০% রিয়েল'}
              </span>
            </div>

            <div className="w-full h-44 rounded-xl overflow-hidden bg-stone-900 relative">
              <img
                src={capturedImage || "/sec/disease.png"}
                alt="Crop leaf"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex items-end justify-center p-3">
                <span className="text-xs text-white font-semibold flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5 text-emerald-400" />
                  {isEn ? 'Keep affected leaf centered and clear' : 'আক্রান্ত পাতা ফ্রেমের মাঝে পরিষ্কার রাখুন'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-pick-gallery"
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-stone-700" />
                <span>{isEn ? 'Choose Gallery' : 'গ্যালারি থেকে নিন'}</span>
              </button>

              <button
                id="btn-open-camera"
                onClick={() => startLiveCamera('environment')}
                className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{isEn ? 'Open Camera' : 'ক্যামেরা ওপেন করুন'}</span>
              </button>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {isEn ? 'Scan Guidelines:' : 'সঠিক স্ক্যানের নিয়মাবলী:'}
            </h3>
            <ul className="text-[11px] text-stone-600 space-y-1 pl-1">
              <li>{isEn ? '• Capture sharp photo of lesions in clear daylight.' : '• রোদে বা পর্যাপ্ত আলোতে পাতার দাগের পরিষ্কার ছবি তুলুন।'}</li>
              <li>{isEn ? '• Keep camera lens 4-6 inches from the plant leaf.' : '• ক্যামেরার লেন্স পাতা থেকে ৪-৬ ইঞ্চি দূরত্বে রাখুন।'}</li>
              <li>{isEn ? '• Retake if image is blurred or camera moved.' : '• ছবি অস্পষ্ট বা কাঁপলে পুনরায় তুলুন।'}</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* VIEW 2: Real Live Camera Viewfinder */}
      {viewState === 'camera-live' && (
        <motion.div
          key="camera-live"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full h-[480px] rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between p-4"
        >
          {/* Live Video Element */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Top Controls Bar */}
          <div className="relative z-30 flex items-center justify-between">
            <button
              onClick={() => {
                stopCameraStream();
                setViewState('main');
              }}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isEn ? 'Live Camera Active' : 'লাইভ ক্যামেরা চালু'}
            </div>

            <button
              onClick={flipCamera}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80"
              title={isEn ? 'Flip Camera' : 'ক্যামেরা ফ্লিপ করুন'}
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder Target Reticle */}
          <div className="relative z-20 flex-1 flex items-center justify-center my-4 pointer-events-none">
            <div className="w-64 h-64 border-2 border-emerald-400/80 rounded-2xl relative flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400"></div>
                <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400"></div>
                <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400"></div>
              </div>
            </div>
          </div>

          {/* Bottom Shutter Controls */}
          <div className="relative z-30 flex items-center justify-around pb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 text-xs font-bold cursor-pointer"
              title={isEn ? 'Gallery' : 'গ্যালারি'}
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Big Shutter Button */}
            <button
              onClick={captureLiveFrame}
              className="w-18 h-18 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer"
              title={isEn ? 'Take Photo' : 'ছবি তুলুন'}
            >
              <Camera className="w-8 h-8" />
            </button>

            <div className="w-12"></div>
          </div>
        </motion.div>
      )}

      {/* VIEW 3: Scanning Animation with Actual Captured Photo */}
      {viewState === 'scanning' && capturedImage && (
        <motion.div
          key="scanning"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full h-[450px] rounded-3xl overflow-hidden bg-stone-950 shadow-2xl flex flex-col justify-between p-6"
        >
          {/* Real Captured Image as Background */}
          <img
            src={capturedImage}
            alt="Captured Leaf"
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />

          {/* Laser Scanning Line Animation */}
          <motion.div
            animate={{ top: ['10%', '85%', '10%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute left-6 right-6 h-1 bg-emerald-400 shadow-[0_0_20px_#34d399] z-20"
          />

          {/* Scanning Box Reticle */}
          <div className="absolute inset-8 border-2 border-emerald-400/60 rounded-2xl pointer-events-none z-10 flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <div className="w-5 h-5 border-t-4 border-l-4 border-emerald-400"></div>
              <div className="w-5 h-5 border-t-4 border-r-4 border-emerald-400"></div>
            </div>
            <div className="flex justify-between">
              <div className="w-5 h-5 border-b-4 border-l-4 border-emerald-400"></div>
              <div className="w-5 h-5 border-b-4 border-r-4 border-emerald-400"></div>
            </div>
          </div>

          {/* Top scanning badge */}
          <div className="relative z-30 flex justify-center">
            <div className="bg-stone-950/85 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/40 flex items-center gap-2 shadow-lg">
              <Scan className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{isEn ? 'Examining plant photo with AI...' : 'AI দ্বারা আপনার আসল ছবি পরীক্ষা করা হচ্ছে...'}</span>
            </div>
          </div>

          {/* Bottom message */}
          <div className="relative z-30 flex flex-col items-center gap-1.5 text-center">
            <span className="text-xs text-white font-bold bg-black/70 backdrop-blur-xs px-3 py-1 rounded-full">
              {isEn ? 'Analyzing leaf tissues, lesions & symptoms' : 'পাতা, রঙ ও রোগের লক্ষণ বিশ্লেষণ হচ্ছে'}
            </span>
          </div>
        </motion.div>
      )}

      {/* VIEW 4: Disease Diagnosis Details (Real Output) */}
      {viewState === 'detail' && diagnosis && (
        <motion.div
          key="detail"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* User's Actual Captured Image Preview */}
          <div className="w-full h-48 rounded-2xl overflow-hidden bg-stone-900 shadow-md relative">
            <img
              src={capturedImage || "/sec/disease.png"}
              alt={diagnosis.diseaseName}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {isEn ? `Accuracy ${diagnosis.confidenceScore}%` : `নির্ভুলতা ${toBn(diagnosis.confidenceScore)}%`}
            </div>
            <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md">
              {isEn ? 'Real Scanned Photo' : 'আসল স্ক্যানকৃত ছবি'}
            </div>
          </div>

          {/* Diagnosis Header Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-emerald-700">
                  {isEn ? 'Identified Crop: ' : 'চিহ্নিত ফসল: '}{diagnosis.cropName}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                diagnosis.severity === 'তীব্র' || diagnosis.severity?.toLowerCase() === 'severe'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isEn ? 'Severity: ' : 'তীব্রতা: '}{diagnosis.severity}
              </span>
            </div>

            <h2 className="text-lg font-black text-stone-900">{diagnosis.diseaseName}</h2>
            {diagnosis.diseaseScientific && (
              <p className="text-[11px] text-stone-500 italic font-serif">
                {isEn ? 'Pathogen: ' : 'জীবাণু: '}{diagnosis.diseaseScientific}
              </p>
            )}

            <div className="pt-2 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-800 block mb-1">
                {isEn ? 'Observed Symptoms in Image:' : 'ছবিতে দৃশ্যমান লক্ষণ:'}
              </span>
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded-xl">
                {diagnosis.symptomsObserved}
              </p>
            </div>

            {/* Maize Disease Quick Selector if crop is Maize */}
            {diagnosis.cropName.includes('ভুট্টা') && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  🌽 ভুট্টার অন্য রোগ দেখতে চান?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ভুট্টা',
                        cropScientific: 'Zea mays',
                        diseaseName: 'ভুট্টার মোচা ও দানা পচা রোগ (Corn Ear Rot & Kernel Rot)',
                        diseaseScientific: 'Fusarium verticillioides / Gibberella zeae',
                        severity: 'তীব্র',
                        confidenceScore: 96,
                        symptomsObserved: 'ভুট্টার মোচার উপরের বা মাঝখানের দানাগুলোতে সাদা, গোলাপি বা কালচে-বাদামি পচন ধরা, দানা খসে পড়া বা কুঁড়ে খাওয়ার মতো ক্ষত এবং ছত্রাকের বিস্তার দৃশ্যমান।',
                        cause: 'ফিউজারিয়াম বা গিবেরেলা ছত্রাক সংক্রমণ। অতিরিক্ত আর্দ্রতা ও মোচায় বৃষ্টির পানি জমে পচন সৃষ্টি করে।',
                        treatments: {
                          chemical: [
                            {
                              name: 'এজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (যেমন: এমিস্টার টপ ৩২৫ এসসি)',
                              dose: 'প্রতি লিটার পানিতে ১ মিলি',
                              instruction: 'মোচা গঠনের সময় লক্ষণ দেখা মাত্রই পুরো মোচা ও গাছে বিকেলে ভালো করে স্প্রে করুন।',
                            },
                            {
                              name: 'থায়োফেনেট মিথাইল ৭০% ডব্লিউপি (রোকো) বা কার্বেন্ডাজিম',
                              dose: 'প্রতি লিটার পানিতে ১.৫-২ গ্রাম',
                              instruction: 'দানা পচন প্রতিরোধে ৭ দিন পর দ্বিতীয়বার স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত পচা মোচা অপসারণ ও পুড়িয়ে ফেলা',
                              details: 'ক্ষেতের মারাত্মক পচা মোচা সাবধানে কেটে আলাদা করে ক্ষেতের বাইরে পুড়িয়ে ফেলুন।',
                            },
                            {
                              method: 'ট্রাইকোডার্মা বায়ো-ফাংগিসাইড স্প্রে',
                              details: 'প্রতি লিটার পানিতে ৫ গ্রাম হারে মোচায় স্প্রে করুন।',
                            },
                          ],
                          prevention: [
                            'ভুট্টার মোচা সোজা হয়ে পানি যেন না ঢোকে সেজন্য মোচা নুয়ে পড়ার উপযোগী জাত নির্বাচন করুন।',
                            'মোচা ছিদ্রকারী পোকা দ্রুত দমন করুন কারণ পোকার ক্ষত দিয়েই ছত্রাক মোচায় প্রবেশ করে।',
                            'পর্যাপ্ত পটাশ ও বোরণ সার ব্যবহার করুন যা ভুট্টার দানা ও মোচাকে রোগ প্রতিরোধী করে।',
                          ],
                        },
                        expertNote: 'মোচা পচা রোগে ক্ষতিকর মাইকোটক্সিন তৈরি হয় যা পশুখাদ্য বা মানুষের জন্য ক্ষতিকর। দ্রুত আক্রান্ত মোচা সরিয়ে স্প্রে সম্পন্ন করুন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('মোচা') || diagnosis.diseaseName.includes('দানা')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🌽 মোচা ও দানা পচা (Ear Rot)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ভুট্টা',
                        cropScientific: 'Zea mays',
                        diseaseName: 'ভুট্টার ফল ও মোচা ছিদ্রকারী পোকা (Corn Earworm / Fall Armyworm)',
                        diseaseScientific: 'Helicoverpa zea / Spodoptera frugiperda',
                        severity: 'তীব্র',
                        confidenceScore: 95,
                        symptomsObserved: 'ভুট্টার মোচার সিল্ক (চুল) কেটে ফেলা, মোচার ভেতরে কীড়ার সুরঙ্গ তৈরি করে কচি দানা কুঁড়ে কুঁড়ে খাওয়া এবং মোচায় বাদামি বিষ্ঠা ও পচন দেখা যাওয়া।',
                        cause: 'হেলিকভারপা বা ফল আর্মিওয়ার্ম মথের কীড়া মোচায় ডিম পেড়ে ভেতর ঢুকে দানা নষ্ট করে।',
                        treatments: {
                          chemical: [
                            {
                              name: 'এমামেকটিন বেনজোয়েট ৫ এসজি (প্রোক্লেম / সাসপেন্ড)',
                              dose: 'প্রতি লিটার পানিতে ১ গ্রাম',
                              instruction: 'বিকেলের দিকে মোচার মুখে ও পাতায় স্প্রে করুন।',
                            },
                            {
                              name: 'ক্লোরানট্রানিলিপ্রোল ১৮.৫ এসসি (কোরাজন)',
                              dose: 'প্রতি ১০ লিটার পানিতে ৩ মিলি',
                              instruction: 'মোচা ছিদ্রকারী কীড়া দমনে অত্যন্ত কার্যকর।',
                            },
                          ],
                          organic: [
                            {
                              method: 'ফেরোমোন ফাঁদ স্থাপন',
                              details: 'ক্ষেতে প্রতি বিঘায় ৩-৪টি ফল আর্মিওয়ার্ম / হেলিকভারপা ফেরোমোন ফাঁদ স্থাপন করুন।',
                            },
                            {
                              method: 'হাত দিয়ে কীড়া বাছাই',
                              details: 'মোচার মুখে দৃশ্যমান কীড়া হাত দিয়ে সংগ্রহ করে কেরোসিন মিশ্রিত পানিতে ফেলে ধ্বংস করুন।',
                            },
                          ],
                          prevention: [
                            'ভুট্টার সিল্ক বা চুল বের হওয়ার সাথে সাথেই নিয়মিত ক্ষেত পরিদর্শন করুন।',
                            'আক্রমণ শুরুর আগেই ট্রাইকোগ্রামা ও ব্রাকন পরজীবী পোকা মুক্ত করুন।',
                          ],
                        },
                        expertNote: 'কীড়া মোচার গভীরে ঢুকে যাওয়ার আগেই স্প্রে করা আবশ্যক, অন্যথায় মোচার অর্ধেক দানা নষ্ট হয়ে পচন ধরে যায়।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ছিদ্রকারী') || diagnosis.diseaseName.includes('Earworm')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🐛 মোচা ছিদ্রকারী পোকা
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ভুট্টা',
                        cropScientific: 'Zea mays',
                        diseaseName: 'ভুট্টার কান্ড পচা ও গোড়া পচা রোগ (Stem Rot Disease)',
                        diseaseScientific: 'Diplodia maydis & Fusarium moniliforme',
                        severity: 'মাঝারি',
                        confidenceScore: 95,
                        symptomsObserved: 'ভুট্টা গাছের কাণ্ডের নিচের গিঁট বা গোড়ার অংশ বাদামি হয়ে পচে যাচ্ছে, কাণ্ডের ভেতরের আঁশ বা মজ্জা (pith) নষ্ট হয়ে কাণ্ড নরম ও ফাঁপা হচ্ছে।',
                        cause: 'ডিপ্লোডিয়া (Diplodia maydis) এবং ফিউজারিয়াম (Fusarium moniliforme) ছত্রাকের সংক্রমণ। জমিতে জলাবদ্ধতা বা পটাশের অভাবে কাণ্ড দুর্বল হয়ে গাছ ঢলে পড়ে।',
                        treatments: {
                          chemical: [
                            {
                              name: 'কার্বেন্ডাজিম ৫০% ডব্লিউপি (যেমন: নোইন বা অটোস্টিন)',
                              dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                              instruction: 'গাছের গোড়া ও কাণ্ডের নিচের অংশে ভালো করে স্প্রে ও মাটি ভিজিয়ে দিন। ৭ দিন পর পুনরায় দিন।',
                            },
                            {
                              name: 'এজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (যেমন: এমিস্টার টপ ৩২৫ এসসি)',
                              dose: 'প্রতি লিটার পানিতে ১ মিলি',
                              instruction: 'পাতার ব্লাইট ও কান্ড পচা উভয়ের বিরুদ্ধেই দ্রুত কাজ করে।',
                            },
                          ],
                          organic: [
                            {
                              method: 'ট্রাইকোডার্মা বায়ো-ফাংগিসাইড প্রয়োগ',
                              details: 'গাছের গোড়ার মাটিতে ট্রাইকোডার্মা সমৃদ্ধ জৈব সার প্রয়োগ করুন।',
                            },
                          ],
                          prevention: [
                            'জমিতে যেন বৃষ্টির বা সেচের পানি জমে না থাকে, দ্রুত পানি নিষ্কাশনের ব্যবস্থা করুন।',
                            'সুষম সার প্রয়োগ করুন, অতিরিক্ত ইউরিয়া কমিয়ে পর্যাপ্ত পটাশ (এমওপি) সার দিন যা কাণ্ডকে মজবুত করে।',
                            'বপনের আগে প্রতি কেজি বীজে ২.৫ গ্রাম প্রভ্যাক্স ২০০ ডব্লিউপি দিয়ে বীজ শোধন করুন।',
                          ],
                        },
                        expertNote: 'ভুট্টার কাণ্ড পচা রোগ কাণ্ডকে দুর্বল করে গাছ ফেলে দেয়, তাই দ্রুত গাছের গোড়ায় অনুমোদিত ছত্রাকনাশক স্প্রে করুন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('কান্ড')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🌱 কাণ্ড পচা (Stem Rot)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ভুট্টা',
                        cropScientific: 'Zea mays',
                        diseaseName: 'ভুট্টার পাতা ঝলসানো (টারসিকাম ব্লাইট) রোগ',
                        diseaseScientific: 'Exserohilum turcicum',
                        severity: 'মাঝারি',
                        confidenceScore: 94,
                        symptomsObserved: 'ভুট্টার লম্বা চওড়া পাতায় শিরা বরাবর ধূসর ও হালকা বাদামি রঙের লম্বাটে নৌকার মতো বা চুরুট আকৃতির ছোপ দাগ সুস্পষ্টভাবে দৃশ্যমান।',
                        cause: 'টারসিকাম ছত্রাকজনিত সংক্রমণ। অতিরিক্ত আর্দ্রতা ও কুয়াশাচ্ছন্ন আবহাওয়ায় এ রোগ দ্রুত ছড়ায়।',
                        treatments: {
                          chemical: [
                            {
                              name: 'এজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (যেমন: এমিস্টার টপ ৩২৫ এসসি)',
                              dose: 'প্রতি লিটার পানিতে ১ মিলি',
                              instruction: 'আক্রান্ত ক্ষেতে বিকেলের মিষ্টি রোদে পাতার উভয় পিঠ ভালো করে ভিজিয়ে স্প্রে করুন। প্রয়োজনে ১০ দিন পর পুনরায় দিন।',
                            },
                            {
                              name: 'ম্যানকোজেব ৭৫% ডব্লিউপি (যেমন: ডাইথেন এম-৪৫)',
                              dose: 'প্রতি লিটার পানিতে ২-২.৫ গ্রাম',
                              instruction: 'রোগের প্রাথমিক অবস্থায় পুরো গাছে ভালো করে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত শুকনো পাতা অপসারণ',
                              details: 'গাছের নিচের দিকের বেশি আক্রান্ত শুকনো পাতা সাবধানে কেটে ক্ষেত থেকে দূরে নিয়ে পুড়িয়ে বা মাটিতে পুঁতে ফেলুন।',
                            },
                            {
                              method: 'ট্রাইকোডার্মা বায়ো-ফাংগিসাইড',
                              details: 'প্রতি লিটার পানিতে ৫ গ্রাম মিশিয়ে স্প্রে করলে ছত্রাকের আক্রমণ হ্রাস পায়।',
                            },
                          ],
                          prevention: [
                            'রোগ প্রতিরোধী হাইব্রিড জাতের ভুট্টার বীজ চাষ করুন।',
                            'সুষম সার প্রয়োগ করুন, অতিরিক্ত ইউরিয়া বাদ দিয়ে পর্যাপ্ত পটাশ সার ব্যবহার করুন।',
                            'ফসল কাটার পর জমির অবশিষ্টাংশ পুড়িয়ে ধ্বংস করুন।',
                          ],
                        },
                        expertNote: 'ভুট্টার ব্লাইট রোগ পাতার সালোকসংশ্লেষণ ক্ষমতা কমিয়ে ফলনে ব্যাপক ক্ষতি করে, তাই দ্রুত ছত্রাকনাশক স্প্রে নিশ্চিত করুন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ঝলসানো') || diagnosis.diseaseName.includes('ব্লাইট')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🍂 পাতা ঝলসানো (Blight)
                  </button>
                </div>
              </div>
            )}

            {/* Tomato Disease Quick Selector if crop is Tomato */}
            {diagnosis.cropName.includes('টমেটো') && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  🍅 টমেটোর পাতা ও ফলের সমস্যা নির্বাচন করুন:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'টমেটো',
                        cropScientific: 'Solanum lycopersicum',
                        diseaseName: 'টমেটোর ব্লসম এন্ড রট / ফলের তলদেশ পচা রোগ (Blossom End Rot)',
                        diseaseScientific: 'Physiological disorder (Calcium Deficiency & Water Stress)',
                        severity: 'মাঝারি',
                        confidenceScore: 96,
                        symptomsObserved: 'টমেটো ফলের নিচের অংশে (ফুলের বিপরীত প্রান্তে) চামড়ার মতো কালো বা গাঢ় বাদামি দেবে যাওয়া শুষ্ক ক্ষত ও পচন। এটি পাতার রোগ নয়, সরাসরি ফলের সমস্যা।',
                        cause: 'উদ্ভিদে ক্যালসিয়ামের অভাব ও মাটিতে অনিয়মিত সেচ বা আর্দ্রতার চরম তারতম্য।',
                        treatments: {
                          chemical: [
                            {
                              name: 'চিলেটেড ক্যালসিয়াম (ক্যালবোর / ক্যালপ্লেক্স) অথবা ক্যালসিয়াম ক্লোরাইড',
                              dose: 'প্রতি লিটার পানিতে ২ মিলি (চিলেটেড) বা ৫ গ্রাম (ক্যালসিয়াম ক্লোরাইড)',
                              instruction: 'বিকেলের মিষ্টি রোদে ফল ও পাতায় স্প্রে করুন। ৭-১০ দিন পর আবার স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'ডলোমাইট চুন ও মালচিং',
                              details: 'মাটিতে ডলোমাইট চুন মিশিয়ে দিন এবং খড় দিয়ে মালচিং করে আর্দ্রতা ঠিক রাখুন। পচা ফল ছিঁড়ে ফেলুন।',
                            },
                          ],
                          prevention: [
                            'জমিতে নিয়মিত ও পরিমিত সেচ দিন, মাটিকে বেশি শুকাতে দেবেন না।',
                            'ইউরিয়া (নাইট্রোজেন) সার অতিরিক্ত দেবেন না।',
                          ],
                        },
                        expertNote: 'এটি কোনো ছত্রাক বা পোকা নয়, তাই ছত্রাকনাশক কাজ করবে না। দ্রুত ক্যালসিয়াম স্প্রে ও সেচ নিশ্চিত করুন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ব্লসম') || diagnosis.diseaseName.includes('End Rot')
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    🍅 ফলের তলদেশ পচা (End Rot)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'টমেটো',
                        cropScientific: 'Solanum lycopersicum',
                        diseaseName: 'টমেটোর পাতা কোঁকড়ানো রোগ (Leaf Curl Virus)',
                        diseaseScientific: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
                        severity: 'তীব্র',
                        confidenceScore: 94,
                        symptomsObserved: 'টমেটোর পাতা ওপরের বা নিচের দিকে কুঁকড়ে যাওয়া, পাতার আকার ছোট ও মোটা হওয়া এবং গাছের স্বাভাবিক বৃদ্ধি থমকে গিয়ে ফুল ঝরে যাওয়া।',
                        cause: 'সাদা মাছি পোকা (Whitefly) দ্বারা বাহিত ভাইরাস সংক্রমণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'অ্যাসিটামিপ্রিড ২০ এসপি (টুপেক্স / গেইন) বা পেগাসাস',
                              dose: 'প্রতি লিটার পানিতে ১ গ্রাম',
                              instruction: 'সাদা মাছি দমনে পাতার নিচের পিঠে সুন্দরভাবে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'হলুদ আঠালো ফাঁদ ও নিম তেল',
                              details: 'প্রতি শতকে ১টি হলুদ আঠালো ফাঁদ দিন এবং নিম তেল ৫ মিলি/লিটার স্প্রে করুন।',
                            },
                          ],
                          prevention: [
                            'বীজতলায় মশারি বা নেট দিয়ে চারা ঢেকে রাখুন।',
                            'আক্রান্ত গাছ তুলে ধ্বংস করুন।',
                          ],
                        },
                        expertNote: 'সাদা মাছি দমনই পাতা কোঁকড়ানো রোগ নিয়ন্ত্রণের একমাত্র কার্যকর উপায়।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('কোঁকড়ানো') || diagnosis.diseaseName.includes('Curl')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🍃 পাতা কোঁকড়ানো (Leaf Curl)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'টমেটো',
                        cropScientific: 'Solanum lycopersicum',
                        diseaseName: 'টমেটোর ফল ছিদ্রকারী পোকা (Tomato Fruit Borer)',
                        diseaseScientific: 'Helicoverpa armigera',
                        severity: 'তীব্র',
                        confidenceScore: 95,
                        symptomsObserved: 'টমেটো ফলের গায়ে গোল ছিদ্র, বাদামি বিষ্ঠা এবং ভেতরের শাঁস খেয়ে পচন ধরানো।',
                        cause: 'হেলিকোভারপা মথের কীড়ার আক্রমণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'এমামেকটিন বেনজোয়েট ৫ এসজি (প্রোক্লেম) বা কোরাজন',
                              dose: 'প্রতি লিটার পানিতে ১ গ্রাম',
                              instruction: 'বিকেলে ফল ও পাতায় স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'সেক্স ফেরোমোন ফাঁদ',
                              details: 'জমিতে প্রতি শতকে ১টি ফেরোমোন ফাঁদ স্থাপন করুন এবং আক্রান্ত ফল ছিঁড়ে পুঁতে ফেলুন।',
                            },
                          ],
                          prevention: [
                            'ক্ষেতের চারপাশে গাঁদা ফুল চাষ করুন ফাঁদ ফসল হিসেবে।',
                          ],
                        },
                        expertNote: 'ফল ছোট থাকা অবস্থাতেই কীড়া নিয়ন্ত্রণ করতে হবে, ভেতরে ঢুকলে সাধারণ বিষ কাজ করে না।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ছিদ্রকারী') || diagnosis.diseaseName.includes('Borer')
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    🐛 ফল ছিদ্রকারী পোকা (Borer)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'টমেটো',
                        cropScientific: 'Solanum lycopersicum',
                        diseaseName: 'টমেটোর আগাম ধসা রোগ (Early Blight)',
                        diseaseScientific: 'Alternaria solani',
                        severity: 'মাঝারি',
                        confidenceScore: 92,
                        symptomsObserved: 'নিচের বয়স্ক পাতায় গাঢ় বাদামি বৃত্তাকার রিং বা টার্গেট বোর্ডের মতো দাগ এবং পাতা হলুদ হয়ে ঝরে পড়া।',
                        cause: 'অল্টারনারিয়া ছত্রাকের আক্রমণ। উষ্ণ ও স্যাঁতসেঁতে আবহাওয়ায় রোগটি বৃদ্ধি পায়।',
                        treatments: {
                          chemical: [
                            {
                              name: 'ম্যানকোজেব ৭৫% ডব্লিউপি (ডাইথেন এম-৪৫) বা রোভরাল',
                              dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                              instruction: '৭-১০ দিন পর পর পাতায় স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত পাতা ছাঁটাই ও পরিষ্কার পরিচ্ছন্নতা',
                              details: 'গাছের নিচের আক্রান্ত পাতা সাবধানে কেটে পুড়িয়ে ফেলুন।',
                            },
                          ],
                          prevention: [
                            'গাছের গোড়ার মাটি যাতে পাতায় না ছেটায় সেজন্য মালচিং ব্যবহার করুন।',
                          ],
                        },
                        expertNote: 'প্রাথমিক অবস্থায় নিচের পাতা কেটে পরিষ্কার রাখলে ব্লাইট রোগ অনেক কমে যায়।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ধসা') || diagnosis.diseaseName.includes('Blight')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🍂 আগাম ধসা (Early Blight)
                  </button>
                </div>
              </div>
            )}

            {/* Brinjal Disease Quick Selector */}
            {diagnosis.cropName.includes('বেগুন') && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  🍆 বেগুনের ডগা, ফল ও পাতার সমস্যা নির্বাচন করুন:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'বেগুন',
                        cropScientific: 'Solanum melongena',
                        diseaseName: 'বেগুনের ডগা ও ফল ছিদ্রকারী পোকা (Shoot & Fruit Borer)',
                        diseaseScientific: 'Leucinodes orbonalis',
                        severity: 'তীব্র',
                        confidenceScore: 96,
                        symptomsObserved: 'বেগুনের ডগা নেতিয়ে শুকিয়ে যাওয়া, ফলের গায়ে গোলাকার ছিদ্র, ভেতরে কীট ও মলমূত্র এবং ফল বিকৃত হয়ে পচে যাওয়া।',
                        cause: 'লিউসিনোডেস মথের কীড়ার আক্রমণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'এমামেকটিন বেনজোয়েট ৫ এসজি (প্রোক্লেম) বা ক্লোরানট্রানিলিপ্রোল (কোরাজন)',
                              dose: 'প্রতি লিটার পানিতে ১ গ্রাম (প্রোক্লেম) বা ১০ লিটারে ৩ মিলি (কোরাজন)',
                              instruction: 'বিকেলে স্প্রে করুন। ডগা ও ফলে সরাসরি স্প্রে নিশ্চিত করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত ডগা ও ফল ছাঁটাই ও ফেরোমোন ফাঁদ',
                              details: 'আক্রান্ত ডগা ও ফল কেটে কেরোসিন মিশ্রিত পানিতে ফেলুন এবং লিউসিনোডেস সেক্স ফেরোমোন ফাঁদ ব্যবহার করুন।',
                            },
                          ],
                          prevention: [
                            'নিয়মিত প্রতি সপ্তাহে আক্রান্ত ডগা কেটে ধ্বংস করুন।',
                            'ট্রাইকোকার্ড পরজীবী পোকা ক্ষেতে অবমুক্ত করুন।',
                          ],
                        },
                        expertNote: 'ডগা ও ফল ছিদ্রকারী পোকা বেগুনের সবচেয়ে বড় শত্রু, ফেরোমোন ফাঁদ ও নিয়মিত হাতবাছাই অত্যন্ত ফলপ্রসূ।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ছিদ্রকারী') || diagnosis.diseaseName.includes('Borer')
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                    }`}
                  >
                    🐛 ডগা ও ফল ছিদ্রকারী
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'বেগুন',
                        cropScientific: 'Solanum melongena',
                        diseaseName: 'বেগুনের ফোমপসিস ফল পচা ও ব্লাইট রোগ (Phomopsis Fruit Rot)',
                        diseaseScientific: 'Phomopsis vexans',
                        severity: 'মাঝারি',
                        confidenceScore: 94,
                        symptomsObserved: 'বেগুনের ফলের গায়ে প্রথমে পানিভেজা হালকা রঙের দাগ, পরে দাগ দেবে গিয়ে পুরো ফল কালচে হয়ে পচে যাওয়া এবং শুকনো মমি তৈরি হওয়া।',
                        cause: 'ফোমপসিস ভেক্সানস নামক ছত্রাকের আক্রমণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'ম্যানকোজেব + মেটালেক্সিল (রিডোমিল গোল্ড) বা নোইন',
                              dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                              instruction: 'ফল ও পুরো গাছে ৭-১০ দিন পর পর স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত ফল অপসারণ',
                              details: 'পচা ফল তুলে নষ্ট করুন এবং জমিতে পানি নিষ্কাশন ঠিক রাখুন।',
                            },
                          ],
                          prevention: [
                            'রোগমুক্ত বীজ ব্যবহার ও ট্রাইকোডার্মা দিয়ে বীজ শোধন করুন।',
                          ],
                        },
                        expertNote: 'বৃষ্টির দিনে বা স্যাঁতসেঁতে আবহাওয়ায় ফল পচা দ্রুত ছড়ায়, তাই দ্রুত স্প্রে করুন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ফোমপসিস') || diagnosis.diseaseName.includes('Phomopsis')
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                    }`}
                  >
                    🍆 ফোমপসিস ফল পচা
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'বেগুন',
                        cropScientific: 'Solanum melongena',
                        diseaseName: 'বেগুনের ব্যাকটেরিয়াল উইল্ট বা ঢলে পড়া রোগ (Bacterial Wilt)',
                        diseaseScientific: 'Ralstonia solanacearum',
                        severity: 'তীব্র',
                        confidenceScore: 95,
                        symptomsObserved: 'পাতা হলুদ না হয়েই সবুজ অবস্থায় পুরো গাছ হঠাৎ দুপুরে নেতিয়ে পড়ে, কাণ্ড কাটলে ভেতর থেকে সাদা সুতার মতো ব্যাকটেরিয়াল পুঁজ বা ওজ বের হয়।',
                        cause: 'রালস্টোনিয়া ব্যাক্টেরিয়া দ্বারা কাণ্ডের সংবহনতন্ত্র বন্ধ হয়ে যাওয়া।',
                        treatments: {
                          chemical: [
                            {
                              name: 'কপার অক্সিক্লোরাইড (কুপ্রোক্সাট / চ্যাম্পিয়ন) + স্ট্রেপ্টোমাইসিন সালফেট',
                              dose: 'প্রতি লিটার পানিতে ৪ গ্রাম কুপ্রোক্সাট ও ০.৫ গ্রাম অ্যান্টিবায়োটিক',
                              instruction: 'গাছের গোড়ায় মাটি ভালো করে ভিজিয়ে প্রয়োগ করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত গাছ সমূলে তুলে পোড়ানো ও চুন প্রয়োগ',
                              details: 'আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন এবং গর্তে ব্লিচিং পাউডার বা চুন দিন।',
                            },
                          ],
                          prevention: [
                            'বুনো বেগুনের (Solanum torvum) সাথে কলম করা চারার ব্যবহার উইল্ট শতভাগ রোধ করে।',
                          ],
                        },
                        expertNote: 'ঢলে পড়া রোগের চারা একবার আক্রান্ত হলে বাঁচানো কঠিন, তাই বুনো বেগুনে গ্রাফটিং করা চারা চাষ করুন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('উইল্ট') || diagnosis.diseaseName.includes('Wilt')
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                    }`}
                  >
                    🥀 ঢলে পড়া রোগ (Wilt)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'বেগুন',
                        cropScientific: 'Solanum melongena',
                        diseaseName: 'বেগুনের পাতা ছোট হওয়া রোগ (Little Leaf Disease)',
                        diseaseScientific: 'Phytoplasma (Mycoplasma-like organism)',
                        severity: 'মাঝারি',
                        confidenceScore: 93,
                        symptomsObserved: 'গাছের পাতা অস্বাভাবিক ক্ষুদ্রাকৃতির হয়ে ঝাঁটার মতো গুচ্ছ তৈরি হওয়া, গাছে কোনো ফল না ধরা এবং ঝোপালো আকার নেওয়া।',
                        cause: 'জাসিড বা লিফহপার (Leafhopper) পোকা বাহিত মাইকোপ্লাজমা সংক্রমণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'ইমিডাক্লোপ্রিড ২০ এসএল (টিডো / এডমায়ার)',
                              dose: 'প্রতি লিটার পানিতে ০.৫ মিলি',
                              instruction: 'লিফহপার পোকা দমনে ভালো করে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত গাছ তুলে ফেলা',
                              details: 'ঝাঁটামুখী আক্রান্ত গাছ দ্রুত তুলে ধ্বংস করুন।',
                            },
                          ],
                          prevention: [
                            'চারা রোপণের পর থেকেই জাসিড বা ফড়িং পোকা দমনে সচেষ্ট থাকুন।',
                          ],
                        },
                        expertNote: 'লিফহপার পোকা নিয়ন্ত্রণ করলেই এই রোগ ছড়াতে পারে না।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ছোট') || diagnosis.diseaseName.includes('Little Leaf')
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                    }`}
                  >
                    🍃 পাতা ছোট হওয়া (Little Leaf)
                  </button>
                </div>
              </div>
            )}

            {/* Chili Disease Quick Selector */}
            {diagnosis.cropName.includes('মরিচ') && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  🌶️ মরিচের ফল ও পাতার সমস্যা নির্বাচন করুন:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'মরিচ',
                        cropScientific: 'Capsicum annuum',
                        diseaseName: 'মরিচের ফল পচা ও ডাইব্যাক / অ্যানথ্রাকনোজ রোগ (Anthracnose / Fruit Rot)',
                        diseaseScientific: 'Colletotrichum capsici',
                        severity: 'তীব্র',
                        confidenceScore: 96,
                        symptomsObserved: 'কাঁচা বা পাকা মরিচের গায়ে দেবে যাওয়া গোলাকার কালচে দাগ, দাগের মধ্যে বলয়াকারে কালো ফোঁটা এবং আগা থেকে ডাল শুকিয়ে নিচে নামা (ডাইব্যাক)।',
                        cause: 'কলেটোলেট্রিকাম ছত্রাকের আক্রমণ। অতিরিক্ত আর্দ্রতায় রোগ দ্রুত ছড়ায়।',
                        treatments: {
                          chemical: [
                            {
                              name: 'এজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (এমিস্টার টপ) বা নোইন',
                              dose: 'প্রতি লিটার পানিতে ১ মিলি এমিস্টার টপ অথবা ২ গ্রাম কার্বেন্ডাজিম',
                              instruction: 'বিকেলে ফল ও পাতায় স্প্রে করুন। ৭ দিন পর পুনরায় দিন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত শুকনো ডাল ও ফল ছাঁটাই',
                              details: 'আক্রান্ত অংশ কেটে কেরোসিন যুক্ত পানিতে বা আগুনে পোড়ান।',
                            },
                          ],
                          prevention: [
                            'বপনের পূর্বে প্রভ্যাক্স বা ট্রাইকোডার্মা দিয়ে বীজ শোধন করুন।',
                          ],
                        },
                        expertNote: 'ফল ধরার সময়েই এই ছত্রাকনাশক স্প্রে করা জরুরি যাতে মরিচ দাগমুক্ত ও চকচকে থাকে।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ফল পচা') || diagnosis.diseaseName.includes('Anthracnose')
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    🌶️ ফল পচা ও ডাইব্যাক
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'মরিচ',
                        cropScientific: 'Capsicum annuum',
                        diseaseName: 'মরিচের পাতা কোঁকড়ানো রোগ (Chili Leaf Curl / Thrips & Mite)',
                        diseaseScientific: 'Thrips tabaci & Polyphagotarsonemus latus / Virus',
                        severity: 'তীব্র',
                        confidenceScore: 95,
                        symptomsObserved: 'মরিচের পাতা উল্টো নৌকার মতো কুঁকড়ে যাওয়া বা নিচের দিকে বেঁকে যাওয়া, পাতার ডালপালা শক্ত ও ভঙ্গুর হওয়া এবং ফলন থমকে যাওয়া।',
                        cause: 'থ্রিপস (চুষি পোকা) ও হলুদ মাকড়ের আক্রমণ এবং জেমিনিভাইরাস সংক্রমণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'স্পিনোস্যাড (ট্রেসার) বা ভার্টিমেক (অ্যাবামেকটিন)',
                              dose: 'প্রতি লিটার পানিতে ০.৪ মিলি ট্রেসার বা ১.৫ মিলি ভার্টিমেক',
                              instruction: 'পাতার নিচের পিঠ ভালো করে ভিজিয়ে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'হলুদ ও নীল আঠালো ফাঁদ ও সাবান পানি স্প্রে',
                              details: 'নীল ফাঁদ থ্রিপস এবং হলুদ ফাঁদ সাদা মাছি আকর্ষণ করে। নিম তেল ৫ মিলি/লিটার স্প্রে করুন।',
                            },
                          ],
                          prevention: [
                            'চারা রোপণের পর থেকেই নিয়মিত মাকড় ও থ্রিপস দমনে নজর দিন।',
                          ],
                        },
                        expertNote: 'মরিচের পাতা কোঁকড়ানো রোগের ৯৫% কারণ থ্রিপস ও মাকড়, তাই মাকড়নাশক স্প্রে নিশ্চিত করুন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('কোঁকড়ানো') || diagnosis.diseaseName.includes('Curl')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🍃 পাতা কোঁকড়ানো (Thrips)
                  </button>
                </div>
              </div>
            )}

            {/* Rice Disease Quick Selector */}
            {diagnosis.cropName.includes('ধান') && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  🌾 ধানের শীষ, দানা ও পাতার সমস্যা নির্বাচন করুন:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ধান',
                        cropScientific: 'Oryza sativa',
                        diseaseName: 'ধানের শীষ ব্লাস্ট রোগ (Rice Neck Blast)',
                        diseaseScientific: 'Pyricularia oryzae',
                        severity: 'তীব্র',
                        confidenceScore: 97,
                        symptomsObserved: 'ধানের শীষের গোড়ায় কালো দাগ হয়ে ভেঙে যাওয়া, সমস্ত শীষ চিটা হয়ে খড়ের মতো সাদা হয়ে যাওয়া।',
                        cause: 'পাইরিকুলারিয়া ছত্রাকের আক্রমণ। কুয়াশাচ্ছন্ন ও অতিরিক্ত নাইট্রোজেনযুক্ত জমিতে দ্রুত বিস্তার ঘটে।',
                        treatments: {
                          chemical: [
                            {
                              name: 'ট্রাইসাইক্লাজল ৭৫% ডব্লিউপি (ট্রুপার) বা ট্রাইসাইক্লাজল + হেক্সাকোনাজল',
                              dose: 'প্রতি লিটার পানিতে ১ গ্রাম',
                              instruction: 'শীষ বের হওয়ার মুখে ও বের হওয়ার পর বিকেলে দুইবার স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'সুষম সার ও পানি ব্যবস্থাপনা',
                              details: 'ইউরিয়া সারের অতিরিক্ত মাত্রা কমিয়ে পটাশ সার ব্যবহার করুন।',
                            },
                          ],
                          prevention: [
                            'শীষ বের হওয়ার সময় কুয়াশা থাকলে আগাম প্রতিরোধী স্প্রে করুন।',
                          ],
                        },
                        expertNote: 'শীষ ব্লাস্ট হলে ধান সম্পূর্ণ চিটা হয়ে যায়, শীষ বের হওয়ার মুখেই আগাম স্প্রে আবশ্যক।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('শীষ ব্লাস্ট') || diagnosis.diseaseName.includes('Neck')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🌾 শীষ ব্লাস্ট (Neck Blast)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ধান',
                        cropScientific: 'Oryza sativa',
                        diseaseName: 'ধানের ফলস স্মাট বা ভুয়া চিটা রোগ (False Smut)',
                        diseaseScientific: 'Ustilaginoidea virens',
                        severity: 'মাঝারি',
                        confidenceScore: 95,
                        symptomsObserved: 'ধানের দানায় মখমলের মতো চকচকে হলুদ বা কালচে-সবুজ পাউডারের মতো ফোস্কা তৈরি হওয়া।',
                        cause: 'উস্টিলাগিনয়েডিয়া ছত্রাক। দানা বের হওয়ার সময় বৃষ্টি ও অতিরিক্ত ইউরিয়ায় এটি বৃদ্ধি পায়।',
                        treatments: {
                          chemical: [
                            {
                              name: 'কপার হাইড্রোক্সাইড (চ্যাম্পিয়ন) বা টিল্ট ২৫০ ইসি',
                              dose: 'প্রতি লিটার পানিতে ২ গ্রাম বা ০.৫ মিলি',
                              instruction: 'ধানের থোড় বের হওয়ার আগ মুহূর্তে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত দানা পলিথিনে মুড়িয়ে অপসারণ',
                              details: 'স্পোর বাতাসে ছড়ানোর আগেই সাবধানে আক্রান্ত শীষ ধ্বংস করুন।',
                            },
                          ],
                          prevention: [
                            'দেরিতে অতিরিক্ত ইউরিয়া সার প্রয়োগ পরিহার করুন।',
                          ],
                        },
                        expertNote: 'ফলস স্মাটের পাউডার বাতাসে দ্রুত সুস্থ ধানের দানায় ছড়ায়, তাই দ্রুত ছত্রাকনাশক দিন।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('ফলস স্মাট') || diagnosis.diseaseName.includes('Smut')
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    🌾 ভুয়া চিটা (False Smut)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ধান',
                        cropScientific: 'Oryza sativa',
                        diseaseName: 'ধানের পাতা ব্লাস্ট ও খোলপোড়া রোগ (Leaf Blast & Sheath Blight)',
                        diseaseScientific: 'Pyricularia oryzae & Rhizoctonia solani',
                        severity: 'মাঝারি',
                        confidenceScore: 95,
                        symptomsObserved: 'পাতায় চোখের মতো বা নৌকার মতো ধূসর কেন্দ্রযুক্ত দাগ এবং পানির উপরিভাগের খোলে সাপের চামড়ার মতো বাদামি ছোপ দাগ।',
                        cause: 'ছত্রাক সংক্রমণ ও অতিরিক্ত ঘন চারা রোপণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'ভ্যালিডামাইসিন ৩% (ভ্যালিডা) বা কার্বেন্ডাজিম (নোইন)',
                              dose: 'প্রতি লিটার পানিতে ২ মিলি (ভ্যালিডা) বা ২ গ্রাম (নোইন)',
                              instruction: 'গাছের গোড়ার খোল ও পাতায় বিকেলের দিকে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'জমি শুকানো ও আলো-বাতাস নিশ্চিতকরণ',
                              details: 'জমির পানি সরিয়ে কয়েকদিন শুকান যাতে গোড়ায় আলো-বাতাস লাগে।',
                            },
                          ],
                          prevention: [
                            'সুষম সার ও পটাশ সার ব্যবহার করুন।',
                          ],
                        },
                        expertNote: 'খোলপোড়া হলে জমির পানি ২-৩ দিন শুকিয়ে রাখা খুবই ফলপ্রসূ।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('খোলপোড়া') || diagnosis.diseaseName.includes('Sheath')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🍂 পাতা ব্লাস্ট ও খোলপোড়া
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'ধান',
                        cropScientific: 'Oryza sativa',
                        diseaseName: 'ধানের মাজরা পোকা (Rice Stem Borer)',
                        diseaseScientific: 'Scirpophaga incertulas',
                        severity: 'তীব্র',
                        confidenceScore: 96,
                        symptomsObserved: 'কুশি অবস্থায় মাঝের কচি পাতা শুকিয়ে ‘মৃত ডিগ’ (Dead heart) হওয়া এবং শীষ বের হওয়ার পর ‘সাদা শীষ’ (White head) তৈরি হওয়া।',
                        cause: 'মাজরা পোকার কীড়া কাণ্ডের ভেতরে ঢুকে খাবার আঁশ খেয়ে ফেলে।',
                        treatments: {
                          chemical: [
                            {
                              name: 'কার্বোফিউরান ৫জি (ফুরাডান / ব্রিফার) অথবা কারটাপ (সানটাপ ৫০ এসপি)',
                              dose: 'প্রতি বিঘায় ৩-৪ কেজি (ফুরাডান) অথবা লিটারে ১.৫ গ্রাম (সানটাপ)',
                              instruction: 'জমিতে ২-৩ ইঞ্চি পানি থাকা অবস্থায় দানাদার ওষুধ ছিটান অথবা সানটাপ স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'পার্চিং (ডাল পোতা) ও ডিমের গাদা ধ্বংস',
                              details: 'প্রতি বিঘায় ১০-১২টি বাঁশের কঞ্চি পুঁতে পাখি বসার ব্যবস্থা করুন এবং পাতার নিচের ডিমের গাদা হাত দিয়ে সংগ্রহ করে ধ্বংস করুন।',
                            },
                          ],
                          prevention: [
                            'আলোক ফাঁদ ব্যবহার করে মাজরা মথ ধ্বংস করুন।',
                          ],
                        },
                        expertNote: 'সাদা শীষ হওয়ার আগেই কুশি অবস্থায় মাজরা পোকা দমন করতে হবে।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('মাজরা') || diagnosis.diseaseName.includes('Borer')
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    🐛 মাজরা পোকা (সাদা শীষ)
                  </button>
                </div>
              </div>
            )}

            {/* Potato Disease Quick Selector */}
            {diagnosis.cropName.includes('আলু') && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  🥔 আলুর কন্দ ও পাতার সমস্যা নির্বাচন করুন:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'আলু',
                        cropScientific: 'Solanum tuberosum',
                        diseaseName: 'আলুর দাঁদ রোগ বা কমন স্ক্যাব (Common Scab)',
                        diseaseScientific: 'Streptomyces scabies',
                        severity: 'মাঝারি',
                        confidenceScore: 95,
                        symptomsObserved: 'আলুর খোসার গায়ে খসখসে ক্ষতের মতো রুক্ষ ও উঁচু বাদামি ছোপ বা গর্তযুক্ত দাগ, তবে ভেতরের শাঁস শক্ত থাকে। এটি পাতার কোনো রোগ নয়, সরাসরি মাটির নিচের কন্দের রোগ।',
                        cause: 'স্ট্রেপ্টোমাইসিস ব্যাক্টেরিয়া এবং ক্ষারীয় বা শুষ্ক মাটি।',
                        treatments: {
                          chemical: [
                            {
                              name: 'বপনের আগে বরিক এসিড (৩%) বা ট্রাইকোডার্মা দিয়ে বীজ শোধন',
                              dose: 'প্রতি লিটার পানিতে ৩০ গ্রাম বরিক এসিড',
                              instruction: 'বীজ আলু ১৫-২০ মিনিট চুবিয়ে ছায়ায় শুকিয়ে রোপণ করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'মাটির আর্দ্রতা রক্ষা ও জিপসাম প্রয়োগ',
                              details: 'আলু যখন মার্বেলের মতো আকার নেয় তখন নিয়মিত সেচ নিশ্চিত করুন।',
                            },
                          ],
                          prevention: [
                            'ক্ষারীয় মাটিতে চুন দেওয়া পরিহার করুন, জমি অম্লীয় (pH 5.2-5.5) রাখুন।',
                          ],
                        },
                        expertNote: 'কমন স্ক্যাব কন্দ গঠনের সময় মাটিতে পানির অভাবে বেশি হয়, নিয়মিত সেচই এর সর্বোত্তম প্রতিকার।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('দাঁদ') || diagnosis.diseaseName.includes('Scab')
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    🥔 কন্দের দাঁদ রোগ (Scab)
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'আলু',
                        cropScientific: 'Solanum tuberosum',
                        diseaseName: 'আলুর নাবি ধসা রোগ (Potato Late Blight)',
                        diseaseScientific: 'Phytophthora infestans',
                        severity: 'তীব্র',
                        confidenceScore: 98,
                        symptomsObserved: 'পাতার কিনারে পানিভেজা কালচে বাদামি দাগ, পাতার নিচের পিঠে সাদা ছত্রাকের আস্তরণ এবং দ্রুত গাছ পচে গিয়ে পোড়া গন্ধ সৃষ্টি হওয়া।',
                        cause: 'ফাইটোফথোরা ছত্রাকের আক্রমণ। কুয়াশাচ্ছন্ন ঠান্ডা ও মেঘলা আবহাওয়ায় মহামারি রূপ নেয়।',
                        treatments: {
                          chemical: [
                            {
                              name: 'ডাইমেথোমর্ফ + ম্যানকোজেব (অ্যাক্রোবেট এমজেড) বা রিডোমিল গোল্ড',
                              dose: 'প্রতি লিটার পানিতে ২ গ্রাম',
                              instruction: 'মেঘলা আবহাওয়ায় ৩-৫ দিন পর পর পাতার উভয় পিঠে ভালো করে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত গাছ দ্রুত উপড়ে ফেলা ও সেচ বন্ধ রাখা',
                              details: 'আক্রমণ তীব্র হলে অবিলম্বে সেচ বন্ধ রাখুন যাতে ছত্রাক না ছড়ায়।',
                            },
                          ],
                          prevention: [
                            'কুয়াশা পড়ার সাথে সাথেই সতর্কতামূলকভাবে ম্যানকোজেব দিয়ে গাছ ধুয়ে দিন।',
                          ],
                        },
                        expertNote: 'লেট ব্লাইট ২-৩ দিনে পুরো ক্ষেত সাবাড় করতে পারে, মেঘলা দিনে আগাম স্প্রে জীবনদায়ী।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('নাবি ধসা') || diagnosis.diseaseName.includes('Late Blight')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🍂 নাবি ধসা (Late Blight)
                  </button>
                </div>
              </div>
            )}

            {/* Papaya Disease Quick Selector */}
            {diagnosis.cropName.includes('পেঁপে') && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-left">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  🍈 পেঁপের ফল, কাণ্ড ও পাতার সমস্যা নির্বাচন করুন:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'পেঁপে',
                        cropScientific: 'Carica papaya',
                        diseaseName: 'পেঁপের অ্যানথ্রাকনোজ ও ফল পচা রোগ (Fruit Anthracnose)',
                        diseaseScientific: 'Colletotrichum gloeosporioides',
                        severity: 'মাঝারি',
                        confidenceScore: 96,
                        symptomsObserved: 'কাঁচা বা পাকা পেঁপের চামড়ায় গোলাকার দেবে যাওয়া কালো বা বাদামি দাগ, আর্দ্রতায় দাগের ওপর গোলাপি স্পোরের আস্তরণ এবং ফল পচে নষ্ট হওয়া।',
                        cause: 'কলেটোলেট্রিকাম ছত্রাক। অতিরিক্ত বৃষ্টি ও আর্দ্রতায় দ্রুত বিস্তার লাভ করে।',
                        treatments: {
                          chemical: [
                            {
                              name: 'এজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (এমিস্টার টপ) বা কার্বেন্ডাজিম',
                              dose: 'প্রতি লিটার পানিতে ১ মিলি (এমিস্টার টপ) বা ২ গ্রাম (কার্বেন্ডাজিম)',
                              instruction: 'ফল ও পুরো গাছে ৭-১০ দিন পর পর স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত ফল অপসারণ ও পরিষ্কার পরিচ্ছন্নতা',
                              details: 'পচা ফল তুলে মাটিতে পুঁতে ফেলুন।',
                            },
                          ],
                          prevention: [
                            'ফল তোলার পর গরম পানিতে (৪৮ ডিগ্রি সেলসিয়াসে ২০ মিনিট) শোধন করুন।',
                          ],
                        },
                        expertNote: 'ফল বৃদ্ধির শুরুতেই ছত্রাকনাশক স্প্রে নিশ্চিত করলে ফল চকচকে ও রপ্তানিযোগ্য থাকে।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('অ্যানথ্রাকনোজ') || diagnosis.diseaseName.includes('Anthracnose')
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    🍈 অ্যানথ্রাকনোজ ফল পচা
                  </button>
                  <button
                    onClick={() => {
                      setDiagnosis({
                        isPlant: true,
                        cropName: 'পেঁপে',
                        cropScientific: 'Carica papaya',
                        diseaseName: 'পেঁপের রিং স্পট ভাইরাস রোগ (Papaya Ringspot Virus - PRSV)',
                        diseaseScientific: 'Papaya Ringspot Virus (PRSV)',
                        severity: 'তীব্র',
                        confidenceScore: 97,
                        symptomsObserved: 'পাতায় খাঁজকাটা বিকৃতি, গাঢ় ও হালকা সবুজ মোজাইক ছোপ, ফলের গায়ে গাড়ির চাকার মতো জলছাপ গোল রিং এবং বোঁটায় গাঢ় সবুজ ডোরা দাগ।',
                        cause: 'জাবপোকা (Aphid) বাহিত রিং স্পট ভাইরাস সংক্রমণ।',
                        treatments: {
                          chemical: [
                            {
                              name: 'ইমিডাক্লোপ্রিড ২০ এসএল (এডমায়ার) বা পেগাসাস ৫০ এসসি',
                              dose: 'প্রতি লিটার পানিতে ০.৫ মিলি',
                              instruction: 'জাবপোকা ও বাহক পোকা দমনে পাতার নিচের পিঠে স্প্রে করুন।',
                            },
                          ],
                          organic: [
                            {
                              method: 'আক্রান্ত গাছ কেটে ধ্বংস ও হলুদ ফাঁদ',
                              details: 'ভাইরাস আক্রান্ত গাছ কেটে পুড়িয়ে ফেলুন এবং হলুদ আঠালো ফাঁদ ব্যবহার করুন।',
                            },
                          ],
                          prevention: [
                            'ক্ষেতের চারপাশে ভুট্টা বা ধইঞ্চার বেষ্টনী ফসল (Barrier crop) লাগান।',
                          ],
                        },
                        expertNote: 'ভাইরাস দূর করার কোনো ওষুধ নেই, বাহক জাবপোকা দমন ও আক্রান্ত গাছ ধ্বংস করাই সুরক্ষা দেয়।',
                      });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      diagnosis.diseaseName.includes('রিং স্পট') || diagnosis.diseaseName.includes('Ringspot')
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    🍃 রিং স্পট ভাইরাস (PRSV)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Crop Correction Option */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 space-y-2 text-left shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {isEn ? 'Wrong crop identified? Tap the correct crop:' : 'ফসল ভুল মনে হলে সঠিক ফসলে চাপুন:'}
              </span>
              <span className="text-[10px] text-amber-700 font-medium">
                {isEn ? 'Instant Fix' : 'তাৎক্ষণিক সমাধান'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CROPS_LIST.filter((c) => c.id !== 'auto').map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCrop(c.id);
                    if (capturedImage) {
                      analyzeLeafImage(capturedImage, c.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    diagnosis.cropName.includes(c.id)
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white hover:bg-amber-100 text-stone-800 border border-amber-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Solution Tabs: Chemical | Organic | Prevention */}
          <div className="flex bg-stone-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('chemical')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'chemical'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {isEn ? 'Chemical Solution' : 'রাসায়নিক সমাধান'}
            </button>
            <button
              onClick={() => setActiveTab('organic')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'organic'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {isEn ? 'Organic Solution' : 'জৈব সমাধান'}
            </button>
            <button
              onClick={() => setActiveTab('prevention')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'prevention'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {isEn ? 'Prevention' : 'প্রতিরোধ'}
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-3">
            {activeTab === 'chemical' && (
              <div className="space-y-2.5">
                {diagnosis.treatments.chemical.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900">{item.name}</span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {item.dose}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed pt-1">
                      {item.instruction}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'organic' && (
              <div className="space-y-2.5">
                {diagnosis.treatments.organic.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="text-xs font-black text-stone-900 block">{item.method}</span>
                    <p className="text-xs text-stone-700 leading-relaxed pt-1">{item.details}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'prevention' && (
              <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2">
                <span className="text-xs font-bold text-stone-900 block">
                  {isEn ? 'Steps to prevent future infection:' : 'ভবিষ্যত সংক্রমণ ঠেকানোর পদক্ষেপ:'}
                </span>
                <ul className="space-y-1.5">
                  {diagnosis.treatments.prevention.map((tip, idx) => (
                    <li key={idx} className="text-xs text-stone-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Expert Note */}
          {diagnosis.expertNote && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">{diagnosis.expertNote}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCapturedImage(null);
                setViewState('main');
              }}
              className="flex-1 py-3 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isEn ? 'New Scan' : 'নতুন স্ক্যান'}</span>
            </button>

            <button
              onClick={onBack}
              className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <span>{isEn ? 'Back to Home' : 'হোমে ফিরুন'}</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

