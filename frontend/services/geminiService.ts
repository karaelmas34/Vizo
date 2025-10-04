import { GoogleGenAI, Type } from "@google/genai";
import type { Character, Dialogue, VideoSettings } from '../types';

// Helper to convert a File to a Gemini-compatible format
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result includes the data URL prefix (e.g., "data:image/jpeg;base64,"), which needs to be removed.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as string"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Detects characters in an image using the Gemini API.
 * @returns A promise that resolves with an array of detected characters.
 */
export const detectCharacters = async (imageFile: File): Promise<Character[]> => {
  console.log("Detecting characters with Gemini for:", imageFile.name);

  try {
    const imagePart = await fileToGenerativePart(imageFile);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          imagePart,
          { text: "Detect all distinct, human-like faces in this image. For each face, provide its bounding box coordinates (x, y, width, height) relative to the image dimensions. If no faces are found, return an empty array." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              box: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER, description: "The x-coordinate of the top-left corner of the bounding box." },
                  y: { type: Type.NUMBER, description: "The y-coordinate of the top-left corner of the bounding box." },
                  width: { type: Type.NUMBER, description: "The width of the bounding box." },
                  height: { type: Type.NUMBER, description: "The height of the bounding box." },
                },
                required: ["x", "y", "width", "height"]
              }
            },
            required: ["box"]
          }
        }
      }
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
      console.log("Gemini returned empty response for character detection.");
      return [];
    }

    // The Gemini response gives us an array of objects without an `id` or `name`.
    const detectedCharacters: Omit<Character, 'id' | 'name'>[] = JSON.parse(jsonString);

    // Add a unique client-side ID and name to each character for UI state management.
    return detectedCharacters.map((char, index) => ({
      ...char,
      name: `Character ${index + 1}`,
      id: `char_${Date.now()}_${index}`,
    }));

  } catch (error) {
      console.error("Error detecting characters with Gemini:", error);
      // In case of an API error, return an empty array so the user can add characters manually.
      return [];
  }
};


/**
 * Simulates generating a video from an image, dialogues, and settings.
 * @returns A promise that resolves with a URL to the generated video.
 */
export const generateVideo = async (
  imageFile: File,
  characters: Character[],
  dialogues: Dialogue[],
  settings: VideoSettings,
  loadingMessages: string[],
  updateLoadingMessage: (message: string) => void
): Promise<string> => {
    console.log("Simulating video generation with:", { imageFile, characters, dialogues, settings });
    
    for (const message of loadingMessages) {
        updateLoadingMessage(message);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Return a placeholder video URL.
    return "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h24/360/Big_Buck_Bunny_360_10s_1MB.mp4";
};