
'use server';

/**
 * @fileOverview Generates an image from a text prompt.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai, googleAI, backupAi } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a base64-encoded data URI."),
  apiKeyUsed: z.enum(['primary', 'backup']).optional(),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}


const runImageGeneration = async (client: typeof ai, input: GenerateImageInput) => {
    const { media } = await client.generate({
        model: googleAI.model('gemini-2.0-flash-preview-image-generation'),
        prompt: input.prompt,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media?.url) {
        throw new Error('Image generation failed to produce an image.');
    }
    
    return {
        imageUrl: media.url,
    };
};

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    try {
        const result = await runImageGeneration(ai, input);
        return { ...result, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn("Primary image generation failed, trying backup.", error.message);
        try {
            const result = await runImageGeneration(backupAi, input);
            return { ...result, apiKeyUsed: 'backup' };
        } catch (backupError: any) {
            console.error("Backup image generation failed.", backupError.message);
            throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
        }
    }
  }
);
