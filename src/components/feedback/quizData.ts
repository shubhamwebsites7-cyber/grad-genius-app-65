export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "भारत की राजधानी क्या है?",
    options: ["मुंबई", "कोलकाता", "नई दिल्ली", "चेन्नई"],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "भारत के पहले प्रधानमंत्री कौन थे?",
    options: ["महात्मा गांधी", "जवाहरलाल नेहरू", "सरदार पटेल", "डॉ. अंबेडकर"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "ताजमहल कहाँ स्थित है?",
    options: ["दिल्ली", "जयपुर", "आगरा", "लखनऊ"],
    correctAnswer: 2
  },
  {
    id: 4,
    question: "भारत का राष्ट्रीय पशु कौन सा है?",
    options: ["शेर", "हाथी", "बाघ", "घोड़ा"],
    correctAnswer: 2
  },
  {
    id: 5,
    question: "भारत का राष्ट्रीय पक्षी कौन सा है?",
    options: ["तोता", "मोर", "कौआ", "कबूतर"],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "सूर्य किस दिशा से निकलता है?",
    options: ["पश्चिम", "उत्तर", "दक्षिण", "पूर्व"],
    correctAnswer: 3
  },
  {
    id: 7,
    question: "सप्ताह में कितने दिन होते हैं?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 2
  },
  {
    id: 8,
    question: "भारत का राष्ट्रीय खेल क्या माना जाता है?",
    options: ["क्रिकेट", "हॉकी", "फुटबॉल", "कबड्डी"],
    correctAnswer: 1
  },
  {
    id: 9,
    question: "पानी का रासायनिक सूत्र क्या है?",
    options: ["CO₂", "H₂O", "O₂", "NaCl"],
    correctAnswer: 1
  },
  {
    id: 10,
    question: "भारत का राष्ट्रीय फूल कौन सा है?",
    options: ["गुलाब", "कमल", "सूरजमुखी", "गेंदा"],
    correctAnswer: 1
  },
  {
    id: 11,
    question: "भारत में कितने राज्य हैं?",
    options: ["26", "27", "28", "29"],
    correctAnswer: 2
  },
  {
    id: 12,
    question: "सबसे बड़ा महासागर कौन सा है?",
    options: ["हिंद महासागर", "अटलांटिक महासागर", "आर्कटिक महासागर", "प्रशांत महासागर"],
    correctAnswer: 3
  },
  {
    id: 13,
    question: "भारत का राष्ट्रीय ध्वज कितने रंगों का होता है?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1
  },
  {
    id: 14,
    question: "कंप्यूटर का दिमाग किसे कहा जाता है?",
    options: ["RAM", "हार्ड डिस्क", "CPU", "मॉनिटर"],
    correctAnswer: 2
  },
  {
    id: 15,
    question: "भारत का स्वतंत्रता दिवस कब मनाया जाता है?",
    options: ["26 जनवरी", "2 अक्टूबर", "15 अगस्त", "14 नवंबर"],
    correctAnswer: 2
  },
  {
    id: 16,
    question: "भारत का राष्ट्रीय गीत कौन सा है?",
    options: ["जन गण मन", "वंदे मातरम्", "सारे जहाँ से अच्छा", "ऐ मेरे वतन के लोगों"],
    correctAnswer: 1
  },
  {
    id: 17,
    question: "महात्मा गांधी का जन्म कब हुआ था?",
    options: ["15 अगस्त", "26 जनवरी", "2 अक्टूबर", "14 अप्रैल"],
    correctAnswer: 2
  },
  {
    id: 18,
    question: "भारत का राष्ट्रीय फल कौन सा है?",
    options: ["सेब", "आम", "केला", "अंगूर"],
    correctAnswer: 1
  },
  {
    id: 19,
    question: "भारत की सबसे लंबी नदी कौन सी है?",
    options: ["यमुना", "गंगा", "ब्रह्मपुत्र", "गोदावरी"],
    correctAnswer: 1
  },
  {
    id: 20,
    question: "सबसे छोटा महाद्वीप कौन सा है?",
    options: ["एशिया", "अफ्रीका", "ऑस्ट्रेलिया", "यूरोप"],
    correctAnswer: 2
  },
  {
    id: 21,
    question: "भारत का राष्ट्रीय वृक्ष कौन सा है?",
    options: ["पीपल", "बरगद", "नीम", "आम"],
    correctAnswer: 1
  },
  {
    id: 22,
    question: "मोबाइल फोन किस नेटवर्क पर काम करता है?",
    options: ["रेडियो", "सैटेलाइट", "सेलुलर नेटवर्क", "केबल"],
    correctAnswer: 2
  },
  {
    id: 23,
    question: "कंप्यूटर की भाषा क्या होती है?",
    options: ["हिंदी", "अंग्रेजी", "बाइनरी", "संस्कृत"],
    correctAnswer: 2
  },
  {
    id: 24,
    question: "मानव शरीर में कितने हृदय होते हैं?",
    options: ["2", "3", "1", "4"],
    correctAnswer: 2
  },
  {
    id: 25,
    question: "भारत का राष्ट्रीय प्रतीक क्या है?",
    options: ["अशोक स्तंभ", "तिरंगा", "कमल", "चक्र"],
    correctAnswer: 0
  }
];
