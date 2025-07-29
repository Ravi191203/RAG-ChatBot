
'use server';

/**
 * @fileOverview Classifies the content of an image and extracts text from it.
 *
 * - classifyImage - A function that handles the image classification and text extraction process.
 * - ClassifyImageInput - The input type for the classifyImage function.
 * - ClassifyImageOutput - The return type for the classifyImage function.
 */

import { ai, backupAi, googleAI } from '@/ai/genkit';
import { z } from 'genkit';

const ClassifyImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image to classify, as a a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ClassifyImageInput = z.infer<typeof ClassifyImageInputSchema>;


const ClassifyImageOutputSchema = z.object({
  classification: z.string().describe('The most specific classification for the main subject of the image (e.g., "Golden Retriever", "Eiffel Tower").'),
  description: z.string().describe('A detailed, step-by-step description of the image, covering the subject, setting, colors, and any actions.'),
  extractedText: z.string().optional().describe('Any and all text found within the image. If no text is present, this should be an empty string or omitted.'),
  apiKeyUsed: z.enum(['primary', 'backup']).optional().describe('The API key that was used for the response.'),
});
export type ClassifyImageOutput = z.infer<typeof ClassifyImageOutputSchema>;


export async function classifyImage(input: ClassifyImageInput): Promise<ClassifyImageOutput> {
  return classifyImageFlow(input);
}

const classifyImagePrompt = (client: typeof ai) => client.definePrompt({
      name: 'classifyImagePrompt',
      input: { schema: ClassifyImageInputSchema },
      output: { schema: ClassifyImageOutputSchema },
      prompt: `You are an expert image analyst. Analyze the following image in detail. Your task is to provide a comprehensive, step-by-step breakdown of its contents.

1.  **Classification**: Identify the main subject of the image. Be as specific as possible (e.g., "A red 1967 Ford Mustang convertible" instead of just "car").
2.  **Step-by-Step Description**: Provide a detailed, multi-step description of the entire image. Break down the scene, objects, and any actions taking place. Describe the setting, background, foreground, colors, and lighting.
3.  **Text Extraction**: Extract any and all text visible within the image. If no text is present, return an empty string for the extractedText field.

Your response must follow the structured output format.

Image: {{media url=imageDataUri}}`,
      model: googleAI.model('gemini-pro-vision'),
    });

const classifyImageFlow = ai.defineFlow(
  {
    name: 'classifyImageFlow',
    inputSchema: ClassifyImageInputSchema,
    outputSchema: ClassifyImageOutputSchema,
  },
  async (input) => {
    
    try {
        const primaryPrompt = classifyImagePrompt(ai);
        const { output } = await primaryPrompt(input);
        if (!output) {
          throw new Error("The AI model failed to respond.");
        }
        return { ...output, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn("Primary API key failed for image classification. Trying backup key.", error.message);
        if (process.env.GEMINI_BACKUP_API_KEY) {
            try {
                const backupPrompt = classifyImagePrompt(backupAi);
                const { output } = await backupPrompt(input);
                 if (!output) {
                    throw new Error("The AI model and the backup both failed to respond.");
                }
                return { ...output, apiKeyUsed: 'backup' };
            } catch (backupError: any) {
                 throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
            }
        }
        throw new Error(`The AI model failed to respond. Details: ${error.message}`);
    }
  }
);
