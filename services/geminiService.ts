/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Custom error class for handling specific Gemini API errors.
 */
export class GeminiError extends Error {
    public userFriendlyMessage: string;

    constructor(message: string, userFriendlyMessage: string) {
        super(message);
        this.name = 'GeminiError';
        this.userFriendlyMessage = userFriendlyMessage;
    }
}

// --- Helper Functions ---

/**
 * Creates a simpler, fallback prompt to use when the primary one might be blocked.
 * @param activity The user-provided activity string.
 * @returns The fallback prompt string.
 */
function getFallbackPrompt(activity: string): string {
    return `Show the person in the photo doing this: "${activity}". Create a very simple 3-panel image that shows the steps. The style must be a clear and easy-to-understand drawing.`;
}

/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
function processGeminiResponse(response: GenerateContentResponse): string {
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
        throw new GeminiError(
            `Generation failed due to safety reasons.`,
            'De beschrijving werd als ongepast gemarkeerd. Probeer het met andere woorden.'
        );
    }
    
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const textResponse = response.text;
    console.error("API did not return an image. Response:", textResponse);
    throw new GeminiError(
        `The AI model responded with text instead of an image: "${textResponse || 'No text response received.'}"`,
        'Het is niet gelukt een afbeelding te maken. De AI gaf een onverwacht antwoord. Probeer een andere activiteit.'
    );
}

/**
 * A wrapper for the Gemini API call that includes a retry mechanism for internal server errors.
 * @param parts The array of image and text parts for the request.
 * @returns The GenerateContentResponse from the API.
 */
async function callGeminiWithRetry(parts: Part[]): Promise<GenerateContentResponse> {
    const maxRetries = 3;
    const initialDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
            });
        } catch (error) {
            console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');

            if (isInternalError && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Internal error detected. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error; // Re-throw if not a retriable error or if max retries are reached.
        }
    }
    // This should be unreachable due to the loop and throw logic above.
    throw new Error("Gemini API call failed after all retries.");
}

/**
 * Generates a visual, multi-panel "activity strip" from a source image and a user prompt.
 * It includes a fallback mechanism for prompts that might be blocked.
 * @param personImageDataUrl Data URL for the person's image.
 * @param activity The activity to be visualized (e.g., "Make a cup of tea").
 * @param environmentImageDataUrl Optional data URL for an environment image (e.g., a kitchen).
 * @returns A promise that resolves to a base64-encoded image data URL of the generated activity strip.
 */
export async function generateActivityStrip(personImageDataUrl: string, activity: string, environmentImageDataUrl: string | null): Promise<string> {
    const createPart = (dataUrl: string) => {
        const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
        if (!match) throw new Error("Invalid image data URL format.");
        const [, mimeType, data] = match;
        return { inlineData: { mimeType, data } };
    };

    const parts: Part[] = [createPart(personImageDataUrl)];
    
    if (environmentImageDataUrl) {
        parts.push(createPart(environmentImageDataUrl));
    }
    
    const environmentInstruction = environmentImageDataUrl ? "Use the second photo as the background environment." : "";
    const primaryPrompt = `
        You are an assistant creating a visual guide for a person with cognitive challenges.
        Your task is to create a simple, clear, 3-panel comic strip showing the person from the first photo performing the activity: "${activity}".
        ${environmentInstruction}
        The style MUST be photorealistic, bright, and easy to understand.
        Do not add any text, speech bubbles, or labels to the image.
        The final output must be a single, wide image containing the 3 panels side-by-side.
    `;
    
    parts.push({ text: primaryPrompt });

    try {
        console.log("Attempting generation with original prompt...");
        const response = await callGeminiWithRetry(parts);
        return processGeminiResponse(response);
    } catch (error) {
         if (error instanceof GeminiError) {
            // This error already has a user-friendly message, so just re-throw it.
            throw error;
        }

        console.error("An unrecoverable error occurred during image generation.", error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        
        // Check for safety keywords in the raw error message as a fallback.
        if (errorMessage.toLowerCase().includes('safety')) {
             throw new GeminiError(
                `Generation failed due to safety reasons: ${errorMessage}`,
                'De beschrijving werd als ongepast gemarkeerd. Probeer het met andere woorden.'
            );
        }

        // Generic fallback for everything else (e.g., network errors, final 500s).
        throw new GeminiError(
            `The AI model failed to generate an image. Details: ${errorMessage}`,
            'Er is een technische fout opgetreden bij het maken van de afbeelding. Controleer uw internetverbinding en probeer het later opnieuw.'
        );
    }
}