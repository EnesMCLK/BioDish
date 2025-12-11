import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION, SUPPORTED_LANGUAGES } from "../constants";
import { Message, Role, LanguageCode } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Translates a given text to the target language using Gemini as a pure translator.
 */
export const translateText = async (text: string, targetLanguage: LanguageCode): Promise<string> => {
  try {
    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage];
    
    // We use a separate generateContent call for translation to avoid messing with the chat context
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [{ text: `Translate the following text to ${targetLangName}. Preserve all Markdown formatting (bolding, lists, etc.) exactly. Do not add any explanations or preamble. Just return the translation.\n\nText to translate:\n${text}` }]
        }
      ],
      config: {
        temperature: 0.1, // Low temperature for deterministic translation
      }
    });

    return response.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original
  }
};

/**
 * Sends a message to Gemini and returns a stream.
 * Handles both text-only and text-plus-image interactions.
 */
export const sendMessageStream = async (
  history: Message[],
  newMessage: string,
  language: LanguageCode,
  imageBase64?: string,
  mimeType: string = 'image/jpeg'
) => {
  
  // Create history compatible with the SDK
  // We need to map our internal Message type to the SDK's Content type
  // Note: 2.5 Flash handles multimodal history well.
  
  // Construct the chat history for the SDK
  // We exclude the very last user message because we send it in sendMessageStream
  const pastHistory = history.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  try {
    // If there is an image, we use a slightly different approach or just attach it to the current message
    // Since the SDK Chat object is stateful, we recreate it here for the stateless HTTP request style 
    // or use a persistent object if we were maintaining the instance.
    // For this app, we re-instantiate chat with history to keep state management in React.
    
    // Dynamically append language instruction
    const languageName = SUPPORTED_LANGUAGES[language] || "English";
    const localizedSystemInstruction = `${SYSTEM_INSTRUCTION}\n\nIMPORTANT: You must respond to the user in ${languageName} (${language}).`;

    const chat: Chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: localizedSystemInstruction,
      },
      history: pastHistory
    });

    let resultStream;

    if (imageBase64) {
      // If there's an image, we send it as a part of the message
      // Note: `sendMessageStream` takes a string message OR parts. 
      // The Type definition for sendMessageStream usually expects a string or parts.
      // Ideally, for multimodal input in a chat, we construct the parts.
      
       resultStream = await chat.sendMessageStream({
         message: {
           parts: [
             {
               inlineData: {
                 mimeType: mimeType,
                 data: imageBase64
               }
             },
             { text: newMessage }
           ]
         }
       });

    } else {
      resultStream = await chat.sendMessageStream({ message: newMessage });
    }

    return resultStream;

  } catch (error) {
    console.error("Error interacting with Gemini:", error);
    throw error;
  }
};