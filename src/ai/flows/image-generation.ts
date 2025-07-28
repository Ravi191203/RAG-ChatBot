
'use server';

/**
 * @fileOverview Generates an image from a text prompt.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a base64-encoded data URI."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}


const makeRequest = async (apiKey: string | undefined, input: GenerateImageInput) => {
    const model = googleAI.model('gemini-2.0-flash-preview-image-generation', { apiKey });
    const { media } = await ai.generate({
        model,
        prompt: input.prompt,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });
    return media;
}


const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    let media;
    try {
        media = await makeRequest(process.env.GEMINI_API_KEY, input);
        if (!media?.url) throw new Error("Primary key returned empty response.");
    } catch (primaryError: any) {
        console.warn(`Primary API key failed for image generation. Error: ${primaryError.message}`);
        const backupApiKey = process.env.GEMINI_BACKUP_API_KEY;
        if (backupApiKey) {
            console.log("Attempting to use backup API key for image generation...");
            try {
                media = await makeRequest(backupApiKey, input);
                if (!media?.url) throw new Error("Backup key returned empty response.");
            } catch (backupError: any) {
                console.error(`Backup API key also failed for image generation. Error: ${backupError.message}`);
                throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
            }
        } else {
             throw new Error(`The AI model failed to respond. Details: ${primaryError.message}`);
        }
    }

    if (!media?.url) {
      throw new Error('Image generation failed to produce an image.');
    }
    
    return {
      imageUrl: media.url,
    };
  }
);
