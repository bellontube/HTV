
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to introduce a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a set of images from a text prompt.
 * @param prompt The text prompt to generate images from.
 * @param numberOfImages The total number of images to generate.
 * @param artStyle A string describing the desired art style.
 * @returns A promise that resolves to an array of base64-encoded JPEG image strings.
 */
export const generateImagesFromPrompt = async (prompt: string, numberOfImages: number, artStyle: string): Promise<string[]> => {
    if (!prompt) {
        throw new Error("Prompt cannot be empty.");
    }
    const finalPrompt = `${prompt}, ${artStyle}`;
    // The Imagen-3 model can generate up to 4 images per request, per API error feedback.
    // We will batch requests to stay within this limit.
    const MAX_PER_REQUEST = 4;
    
    if (numberOfImages <= 0) {
        return [];
    }
    
    try {
        const numRequests = Math.ceil(numberOfImages / MAX_PER_REQUEST);
        const allImages: string[] = [];

        for (let i = 0; i < numRequests; i++) {
            if (i > 0) {
                // To comply with the free tier rate limit of 5 requests per minute,
                // we wait over 12 seconds between batched requests.
                await sleep(12100); 
            }

            const isLastRequest = i === numRequests - 1;
            const numImagesInRequest = isLastRequest && (numberOfImages % MAX_PER_REQUEST !== 0)
                ? numberOfImages % MAX_PER_REQUEST
                : MAX_PER_REQUEST;

            if (numImagesInRequest === 0) continue;

            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: finalPrompt,
                config: {
                    numberOfImages: numImagesInRequest,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '9:16',
                }
            });

            if (!response.generatedImages || response.generatedImages.length === 0) {
                console.warn("An API call returned no valid images, possibly due to safety filters.");
                continue; 
            }

            const imagesFromResponse = response.generatedImages.map(img => {
                if (!img.image?.imageBytes) {
                    throw new Error('API response missing image data for one or more images.');
                }
                return `data:image/jpeg;base64,${img.image.imageBytes}`;
            });
            allImages.push(...imagesFromResponse);
        }
        
        if (allImages.length === 0) {
            throw new Error("API returned no valid images across all requests. This could be due to safety filters.");
        }

        return allImages;

    } catch (error) {
        console.error(`Error generating images for prompt "${prompt}":`, error);
        
        const errorMessage = (error as any)?.error?.message || (error as any)?.message || '';

        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
            throw new Error("API rate limit exceeded. Please wait a moment before generating more images.");
        }
        if (errorMessage.includes('Invalid sample count')) {
            throw new Error(`The model returned an error about the number of images requested. Please try again.`);
        }
        if (errorMessage) {
            throw new Error(`Failed to generate images. The AI may have refused the request due to safety policies. Original error: ${errorMessage}`);
        }
        
        throw new Error("An unknown error occurred during image generation.");
    }
};

/**
 * Generates a list of creative image prompt ideas based on a theme.
 * @param theme A user-provided description of the video or desired content.
 * @returns A promise that resolves to an array of prompt strings.
 */
export const generatePromptIdeas = async (theme: string): Promise<string[]> => {
    try {
        const systemInstruction = `You are a creative assistant for a video editor. Your task is to generate a list of 5 diverse, visually interesting image generation prompts based on a theme provided by the user. These prompts will be used to create supplemental imagery for a video. The prompts should be concise, descriptive, and inspiring. Output the list as a JSON array of strings. For example: ["A close-up shot of an ancient map", "A sun setting over a castle"]. Output ONLY the JSON array.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Theme: "${theme}"`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
            },
        });
        
        const responseText = response.text.trim();
        const ideas = JSON.parse(responseText);

        if (!Array.isArray(ideas) || ideas.some(idea => typeof idea !== 'string')) {
            throw new Error("AI returned data in an unexpected format.");
        }
        
        return ideas;

    } catch (error) {
        console.error("Error generating prompt ideas:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error("The AI returned an invalid response. Please try rephrasing your theme.");
        }
        throw new Error("Could not generate creative prompts from the theme.");
    }
};
