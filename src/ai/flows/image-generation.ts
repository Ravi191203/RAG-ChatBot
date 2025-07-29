
'use server';

/**
 * @fileOverview Generates an image from a text prompt.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai, backupAi, googleAI } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a base64-encoded data URI."),
  apiKeyUsed: z.enum(['primary', 'backup']).optional().describe('The API key that was used for the response.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    
    const makeRequest = async (client: typeof ai) => {
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
    }

    try {
        const result = await makeRequest(ai);
        return { ...result, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn("Primary API key failed for image generation. Trying backup key.", error.message);
        if (process.env.GEMINI_BACKUP_API_KEY) {
            try {
                const result = await makeRequest(backupAi);
                return { ...result, apiKeyUsed: 'backup' };
            } catch (backupError: any) {
                 throw new Error(`Image generation failed on both primary and backup keys. Details: ${backupError.message}`);
            }
        }
        throw new Error(`Image generation failed. Details: ${error.message}`);
    }
  }
);
