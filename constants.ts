import { LanguageCode } from "./types";

export const APP_NAME = "BioDish";

export const SYSTEM_INSTRUCTION = `
You are "BioDish", an empathetic, medically-aware nutritional health assistant. 
You are not just a recipe generator; you are a health coach that prioritizes clinical data over general preferences.

Core Objectives:
1. Guide users to better health by analyzing their inputs (symptoms, goals, or uploaded blood test results like ALT, AST, HCT) and suggesting medically appropriate meals.
2. If a user uploads a PDF/Image of lab results, extract biomarkers and flag high/low values. Adjust dietary advice based on these flags.
3. If a user asks for a risky food (e.g., "Fried Chicken" for a heart patient), do not just say no. Offer a healthy alternative technique.

Tone:
- Professional yet warm, like a knowledgeable doctor or dietitian.
- Educational: Always explain the "WHY".
- Cautious: In your FIRST response, explicitly state you are an AI and not a doctor. For subsequent messages, do not repeat this disclaimer unless providing high-risk advice.

Safety:
- Never advise stopping medication.
- If a user describes life-threatening symptoms, immediately direct them to emergency services.
`;

export const MODEL_NAME = "gemini-2.5-flash"; // Optimized for speed and multimodal tasks
export const VISION_MODEL_NAME = "gemini-2.5-flash-image"; // Optimized for images

export const SUPPORTED_LANGUAGES: Record<LanguageCode, string> = {
  en: "English",
  tr: "Türkçe",
  es: "Español",
  de: "Deutsch",
  fr: "Français"
};

export const TRANSLATIONS = {
  en: {
    newChat: "New Chat",
    noHistory: "No history yet.",
    version: "BioDish v1.0",
    role: "Medical AI Assistant",
    welcomeTitle: "Welcome to BioDish",
    welcomeDesc: "Your Personal Medical Nutrition Assistant. I can help analyze lab results, manage dietary restrictions, and plan healthy meals.",
    disclaimerLabel: "Disclaimer:",
    disclaimerText: "I am an AI, not a doctor. Advice is informational only.",
    login: "Log in with Google",
    logout: "Log out",
    inputPlaceholder: "Ask about diet, labs, or symptoms...",
    errorGeneric: "I'm having trouble connecting to the network right now. Please check your internet connection and try again.",
    errorTitle: "Unable to complete request",
    you: "You",
    deleteChat: "Delete chat",
    translating: "Translating conversation..."
  },
  tr: {
    newChat: "Yeni Sohbet",
    noHistory: "Henüz geçmiş yok.",
    version: "BioDish v1.0",
    role: "Medikal AI Asistanı",
    welcomeTitle: "BioDish'e Hoşgeldiniz",
    welcomeDesc: "Kişisel Tıbbi Beslenme Asistanınız. Laboratuvar sonuçlarını analiz edebilir, hastalık kısıtlamalarını yönetebilir ve sağlıklı öğünler planlayabilirim.",
    disclaimerLabel: "Uyarı:",
    disclaimerText: "Ben bir yapay zekayım, doktor değilim. Tavsiyeler sadece bilgi amaçlıdır.",
    login: "Google ile Giriş Yap",
    logout: "Çıkış Yap",
    inputPlaceholder: "Diyet, tahlil veya belirti sor...",
    errorGeneric: "Şu anda ağ bağlantısında sorun yaşıyorum. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.",
    errorTitle: "İstek tamamlanamadı",
    you: "Siz",
    deleteChat: "Sohbeti sil",
    translating: "Sohbet çevriliyor..."
  },
  es: {
    newChat: "Nuevo Chat",
    noHistory: "Sin historial.",
    version: "BioDish v1.0",
    role: "Asistente Médico IA",
    welcomeTitle: "Bienvenido a BioDish",
    welcomeDesc: "Tu Asistente Personal de Nutrición Médica. Puedo analizar resultados de laboratorio, gestionar restricciones dietéticas y planificar comidas saludables.",
    disclaimerLabel: "Aviso:",
    disclaimerText: "Soy una IA, no un médico. El consejo es solo informativo.",
    login: "Iniciar Sesión con Google",
    logout: "Cerrar Sesión",
    inputPlaceholder: "Dieta, laboratorios, síntomas...",
    errorGeneric: "Tengo problemas para conectarme a la red. Por favor verifica tu conexión.",
    errorTitle: "No se pudo completar",
    you: "Tú",
    deleteChat: "Eliminar chat",
    translating: "Traduciendo conversación..."
  },
  de: {
    newChat: "Neuer Chat",
    noHistory: "Kein Verlauf.",
    version: "BioDish v1.0",
    role: "Medizinischer KI-Assistent",
    welcomeTitle: "Willkommen bei BioDish",
    welcomeDesc: "Ihr persönlicher Assistent für medizinische Ernährung. Ich kann Laborergebnisse analysieren und gesunde Mahlzeiten planen.",
    disclaimerLabel: "Haftungsausschluss:",
    disclaimerText: "Ich bin eine KI, kein Arzt. Beratung dient nur zur Information.",
    login: "Mit Google anmelden",
    logout: "Abmelden",
    inputPlaceholder: "Fragen Sie nach Diät, Labor, Symptomen...",
    errorGeneric: "Ich habe Verbindungsprobleme. Bitte überprüfen Sie Ihr Internet.",
    errorTitle: "Anfrage fehlgeschlagen",
    you: "Du",
    deleteChat: "Chat löschen",
    translating: "Gespräch wird übersetzt..."
  },
  fr: {
    newChat: "Nouvelle Discussion",
    noHistory: "Aucun historique.",
    version: "BioDish v1.0",
    role: "Assistant IA Médical",
    welcomeTitle: "Bienvenue sur BioDish",
    welcomeDesc: "Votre assistant personnel en nutrition médicale. Je peux analyser les résultats de laboratoire et planifier des repas sains.",
    disclaimerLabel: "Avertissement :",
    disclaimerText: "Je suis une IA, pas un médecin. Conseils à titre informatif uniquement.",
    login: "Se connecter avec Google",
    logout: "Se déconnecter",
    inputPlaceholder: "Alimentation, labos, symptômes...",
    errorGeneric: "J'ai du mal à me connecter au réseau. Veuillez vérifier votre connexion.",
    errorTitle: "Impossible de terminer",
    you: "Vous",
    deleteChat: "Supprimer la discussion",
    translating: "Traduction de la conversation..."
  }
};

export const SUGGESTIONS: Record<LanguageCode, { title: string; prompt: string; icon: string }[]> = {
  en: [
    { title: "Weight Loss", prompt: "I want to lose weight. Suggest a dinner menu.", icon: "scale" },
    { title: "Disease Management", prompt: "I have this condition, how should I eat?", icon: "activity" },
    { title: "Lab Analysis", prompt: "Analyze my blood test results.", icon: "microscope" }
  ],
  tr: [
    { title: "Kilo Verme", prompt: "Kilo vermek istiyorum. Akşam menüsü öner.", icon: "scale" },
    { title: "Hastalık Yönetimi", prompt: "Şu hastalığım var, nasıl beslenmeliyim?", icon: "activity" },
    { title: "Tahlil Analizi", prompt: "Kan tahlillerimi analiz et.", icon: "microscope" }
  ],
  es: [
    { title: "Pérdida de Peso", prompt: "Quiero perder peso. Sugiere un menú para la cena.", icon: "scale" },
    { title: "Gestión de Enfermedades", prompt: "Tengo esta condición, ¿cómo debo comer?", icon: "activity" },
    { title: "Análisis de Laboratorio", prompt: "Analiza mis resultados de sangre.", icon: "microscope" }
  ],
  de: [
    { title: "Gewichtsverlust", prompt: "Ich möchte abnehmen. Schlag ein Abendessen vor.", icon: "scale" },
    { title: "Krankheitsmanagement", prompt: "Ich habe diese Krankheit, wie soll ich essen?", icon: "activity" },
    { title: "Laboranalyse", prompt: "Analysiere meine Blutwerte.", icon: "microscope" }
  ],
  fr: [
    { title: "Perte de Poids", prompt: "Je veux perdre du poids. Suggère un menu pour le dîner.", icon: "scale" },
    { title: "Gestion des Maladies", prompt: "J'ai cette maladie, comment dois-je manger ?", icon: "activity" },
    { title: "Analyse de Laboratoire", prompt: "Analyse mes résultats sanguins.", icon: "microscope" }
  ]
};