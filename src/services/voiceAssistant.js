// Offline-capable Natural Language Parser and Speech Recognition Assistant for UrjaMitra
import { soundFx } from './soundFx';

// Number word dictionary across languages
const NUMBER_WORDS = {
  // English
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20,
  // Hindi
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'बारह': 12,
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'chhah': 6, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
  // Telugu
  'ఒకటి': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5, 'ఆరు': 6, 'ఏడు': 7, 'ఎనిమిది': 8, 'తొమ్మిది': 9, 'పది': 10,
  'okati': 1, 'rendu': 2, 'moodu': 3, 'naalugu': 4, 'aaru': 6, 'padhi': 10,
  // Bengali
  'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
  // Marathi
  'दोन': 2, 'पाच': 5, 'सहा': 6, 'नऊ': 9, 'दहा': 10
};

// Common rural appliances catalog with default wattage and usage hours
export const APPLIANCE_CATALOG = {
  light: {
    id: 'light',
    name: 'Lights / Tube lights',
    nameHi: 'लाइटें / ट्यूबलाइट',
    nameTe: 'లైట్లు / ట్యూబ్‌లైట్లు',
    nameBn: 'লাইট / টিউবলাইট',
    nameMr: 'दिवे / ट्यूबलाइट',
    defaultWatts: 40, // Incandescent/Fluorescent baseline
    efficientWatts: 9, // 9W LED
    defaultHours: 6,
    icon: 'Sun',
    category: 'Lighting'
  },
  fan: {
    id: 'fan',
    name: 'Ceiling Fans',
    nameHi: 'छत के पंखे',
    nameTe: 'సీలింగ్ ఫ్యాన్లు',
    nameBn: 'সিলিং ফ্যান',
    nameMr: 'पंखा',
    defaultWatts: 75, // Standard induction fan
    efficientWatts: 28, // 5-Star BLDC Fan
    defaultHours: 8,
    icon: 'Wind',
    category: 'Ventilation'
  },
  fridge: {
    id: 'fridge',
    name: 'Refrigerator / Cooler',
    nameHi: 'रेफ्रिजरेटर / डीप फ्रीजर',
    nameTe: 'రిఫ్రిజిరేటర్ / ఫ్రీజర్',
    nameBn: 'রেফ্রিজারেটর / কুলার',
    nameMr: 'रेफ्रिजरेटर / फ्रीज',
    defaultWatts: 160,
    efficientWatts: 85, // 5-star Inverter compressor
    defaultHours: 24,
    icon: 'Snowflake',
    category: 'Cooling'
  },
  pump: {
    id: 'pump',
    name: 'Agricultural / Water Pump (2 HP)',
    nameHi: 'कृषि / पानी मोटर पंप (2 HP)',
    nameTe: 'నీటి మోటార్ పంప్ (2 HP)',
    nameBn: 'জল পাম্প মোটর (2 HP)',
    nameMr: 'पाण्याचा पंप (2 HP)',
    defaultWatts: 1500,
    efficientWatts: 1100, // Solar direct DC brush pump
    defaultHours: 4,
    icon: 'Droplets',
    category: 'Motive Power'
  },
  mill: {
    id: 'mill',
    name: 'Flour Mill / Huller Motor (3 HP)',
    nameHi: 'आटा चक्की / मिलेट हलिंग मोटर',
    nameTe: 'పిండి గిర్ని / ప్రాసెసింగ్ మోటార్',
    nameBn: 'তেল ঘানি / চালের মিল মোটর',
    nameMr: 'धान्य गिरणी मोटर',
    defaultWatts: 2200,
    efficientWatts: 1800,
    defaultHours: 5,
    icon: 'Cog',
    category: 'Productive Use'
  },
  sewing: {
    id: 'sewing',
    name: 'Electric Sewing Machine',
    nameHi: 'विद्युत सिलाई मशीन',
    nameTe: 'ఎలక్ట్రిక్ కుట్టు మిషన్',
    nameBn: 'বৈদ্যুতিক সেলাই মেশিন',
    nameMr: 'विद्युत शिलाई मशीन',
    defaultWatts: 120,
    efficientWatts: 60,
    defaultHours: 6,
    icon: 'Scissors',
    category: 'Livelihood'
  },
  tv: {
    id: 'tv',
    name: 'Television / Display',
    nameHi: 'टेलीविज़न / डिस्प्ले',
    nameTe: 'టెలివిజన్ / టీవీ',
    nameBn: 'টেলিভিশন',
    nameMr: 'टीव्ही',
    defaultWatts: 90,
    efficientWatts: 40,
    defaultHours: 4,
    icon: 'Tv',
    category: 'Information'
  }
};

// Appliance keywords mapping
const KEYWORDS = {
  light: ['light', 'lights', 'bulb', 'bulbs', 'tube', 'tubes', 'tubelight', 'tubelights', 'batti', 'battiyan', 'diya', 'बत्ती', 'लाइट', 'लाइटें', 'ट्यूबलाइट', 'बल्ब', 'లైట్లు', 'లైట్', 'বাতি', 'লাইট', 'দিवे'],
  fan: ['fan', 'fans', 'pankha', 'pankhe', 'ceiling fan', 'पंखा', 'पंखे', 'ఫ్యాన్లు', 'ఫ్యాన్', 'ফ্যান', 'পাখা'],
  fridge: ['refrigerator', 'fridge', 'deep freezer', 'freezer', 'cooler', 'vaccine cooler', 'रेफ्रिजरेटर', 'फ्रिज', 'फ्रीजर', 'రిఫ్రిజిరేటర్', 'ఫ్రిజ్', 'ফ্রিজ'],
  pump: ['pump', 'motor', 'submersible', 'borewell', 'पानी पंप', 'मोटर', 'सबमर्सिबल', 'పంప్', 'మోటార్', 'পাম্প'],
  mill: ['flour mill', 'mill', 'huller', 'destoner', 'atta chakki', 'chakki', 'चक्की', 'आटा चक्की', 'మిల్లు', 'ঘানি'],
  sewing: ['sewing', 'silai', 'sewing machine', 'सिलाई मशीन', 'కుట్టు మిషన్', 'সেলাই মেশিন'],
  tv: ['tv', 'television', 'टीवी', 'टेलीविजन', 'టీవీ', 'টেলিভিশন']
};

export class VoiceAssistant {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.onResultCallback = null;
    this.onStatusCallback = null;
    this.onErrorCallback = null;
    this.initRecognition();
  }

  initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // Fallback dynamically adjusted

      this.recognition.onstart = () => {
        this.isListening = true;
        soundFx.playMicStart();
        if (this.onStatusCallback) this.onStatusCallback(true);
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const fullText = (finalTranscript || interimTranscript).trim();
        if (fullText && this.onResultCallback) {
          this.onResultCallback(fullText, event.results[event.results.length - 1].isFinal);
        }
      };

      this.recognition.onerror = (event) => {
        if (this.onErrorCallback) this.onErrorCallback(event.error);
        this.isListening = false;
        if (this.onStatusCallback) this.onStatusCallback(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        soundFx.playMicStop();
        if (this.onStatusCallback) this.onStatusCallback(false);
      };
    }
  }

  startListening(language = 'en') {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition && !this.isListening) {
      // Map language code for recognition
      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        bn: 'bn-IN',
        mr: 'mr-IN'
      };
      this.recognition.lang = langMap[language] || 'en-IN';
      try {
        this.recognition.start();
      } catch {
        // If already started or browser blocked, ignore
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
      if (this.onStatusCallback) this.onStatusCallback(false);
    }
  }

  // Speak aloud in selected language
  speak(text, language = 'en') {
    if (!this.synth) return;

    try {
      this.synth.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for clarity in rural field settings
      utterance.pitch = 1.0;

      const langMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        bn: 'bn-IN',
        mr: 'mr-IN'
      };
      utterance.lang = langMap[language] || 'en-IN';

      // Pick matching voice if available
      const voices = this.synth.getVoices();
      const targetLangPrefix = utterance.lang.split('-')[0];
      const matchingVoice = voices.find(v => v.lang.startsWith(targetLangPrefix));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      this.synth.speak(utterance);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  // Intelligent offline Rule-Based Indic NLP Entity Extractor
  parseSpokenAudit(text) {
    if (!text || typeof text !== 'string') return null;

    const lowerText = text.toLowerCase().trim();
    const tokens = lowerText.replace(/[,;:.!?]/g, ' ').split(/\s+/);

    const detectedAppliances = [];
    let detectedGenerator = false;
    let generatorHours = 3;
    let globalHours = null;

    // 1. Check for diesel generator mentions
    const genWords = ['generator', 'diesel', 'dg set', 'genset', 'जनरेटर', 'डीजल', 'డీజిల్', 'ডিজেল', 'डिझेल'];
    if (genWords.some(w => lowerText.includes(w))) {
      detectedGenerator = true;
    }

    // 2. Scan for specific hour mentions (e.g. "6 hours", "4 घंटे", "6 hrs", "12 hours/day")
    const hourRegex = /(\d+|one|two|three|four|five|six|seven|eight|ten|twelve|एक|दो|तीन|चार|पांच|छह|आठ|दस|बारह)\s*(?:hours|hour|hrs|hr|घंटे|घंटा|గం|గంటలు|ঘণ্টা|तास)/i;
    const hourMatch = lowerText.match(hourRegex);
    if (hourMatch) {
      const numRaw = hourMatch[1];
      globalHours = NUMBER_WORDS[numRaw] || parseInt(numRaw, 10);
      if (isNaN(globalHours) || globalHours <= 0) globalHours = 6;
      if (globalHours > 24) globalHours = 24;
    }

    // 3. Scan for each appliance
    Object.keys(APPLIANCE_CATALOG).forEach((appKey) => {
      const config = APPLIANCE_CATALOG[appKey];
      const matchKeywords = KEYWORDS[appKey] || [];

      // Check if appliance name appears in text
      let foundIndex = -1;
      let matchedKeyword = '';

      for (const kw of matchKeywords) {
        const idx = lowerText.indexOf(kw);
        if (idx !== -1) {
          foundIndex = idx;
          matchedKeyword = kw;
          break;
        }
      }

      if (foundIndex !== -1) {
        // Find preceding or succeeding number
        let count = 1;

        // Look around the keyword in tokens
        const kwTokens = matchedKeyword.split(' ');
        const firstKwToken = kwTokens[0];
        const tokenPos = tokens.findIndex(t => t.includes(firstKwToken));

        if (tokenPos > 0) {
          const prevToken = tokens[tokenPos - 1];
          if (NUMBER_WORDS[prevToken] !== undefined) {
            count = NUMBER_WORDS[prevToken];
          } else if (!isNaN(parseInt(prevToken, 10))) {
            count = parseInt(prevToken, 10);
          }
        }

        // If not found before, check after: "lights 6" or "fans 3"
        if (count === 1 && tokenPos < tokens.length - 1) {
          const nextToken = tokens[tokenPos + 1];
          if (NUMBER_WORDS[nextToken] !== undefined) {
            count = NUMBER_WORDS[nextToken];
          } else if (!isNaN(parseInt(nextToken, 10))) {
            count = parseInt(nextToken, 10);
          }
        }

        // Specific defaults
        let hours = config.defaultHours;
        if (globalHours && appKey !== 'fridge') {
          hours = globalHours;
        }

        // Special check for health clinics or refrigerators
        if (appKey === 'fridge') {
          hours = 24;
        }

        detectedAppliances.push({
          id: `${appKey}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: appKey,
          name: config.name,
          nameHi: config.nameHi,
          nameTe: config.nameTe,
          nameBn: config.nameBn,
          nameMr: config.nameMr,
          count: count,
          watts: config.defaultWatts,
          efficientWatts: config.efficientWatts,
          hoursPerDay: hours,
          icon: config.icon
        });
      }
    });

    // Determine missing data questions to guide the field worker
    const missingPrompts = [];
    if (detectedAppliances.length > 0 && !globalHours) {
      missingPrompts.push({
        type: 'hours',
        questionEn: "How many hours per day do these appliances typically operate?",
        questionHi: "ये उपकरण दिन में आमतौर पर कितने घंटे चलते हैं?",
        questionTe: "ఈ పరికరాలు సాధారణంగా రోజుకు ఎన్ని గంటలు పనిచేస్తాయి?",
        questionBn: "এই যন্ত্রপাতিগুলি দিনে সাধারণত কত ঘণ্টা চলে?",
        questionMr: "ही उपकरणे दिवसातून साधारणपणे किती तास चालतात?",
        suggestedAnswers: [
          { label: '4 hrs (Part-time)', value: 4 },
          { label: '6 hrs (Standard)', value: 6 },
          { label: '10 hrs (Heavy)', value: 10 },
          { label: '24 hrs (Continuous)', value: 24 }
        ]
      });
    }

    if (detectedGenerator) {
      missingPrompts.push({
        type: 'generator',
        questionEn: "How many hours of power cuts occur per day?",
        questionHi: "प्रतिदिन कितने घंटे बिजली कटती है (लोडशेडिंग)?",
        questionTe: "రోజుకు ఎన్ని గంటల కరెంట్ కోత ఉంటుంది?",
        questionBn: "প্রতিদিন কত ঘণ্টা লোডশেডিং হয়?",
        questionMr: "दररोज किती तास वीजपुरवठा खंडित होतो?",
        suggestedAnswers: [
          { label: '2 hrs / day', value: 2 },
          { label: '4 hrs / day', value: 4 },
          { label: '6 hrs / day', value: 6 }
        ]
      });
    }

    return {
      rawText: text,
      appliances: detectedAppliances,
      hasGenerator: detectedGenerator,
      generatorHours: detectedGenerator ? generatorHours : 0,
      missingPrompts
    };
  }
}

export const voiceAssistant = new VoiceAssistant();
