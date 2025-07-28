
'use server';

/**
 * @fileOverview Classifies the content of an image and extracts text from it.
 *
 * - classifyImage - A function that handles the image classification and text extraction process.
 * - ClassifyImageInput - The input type for the classifyImage function.
 * - ClassifyImageOutput - The return type for the classifyImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ClassifyImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image to classify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ClassifyImageInput = z.infer<typeof ClassifyImageInputSchema>;


const ClassifyImageOutputSchema = z.object({
  classification: z.string().describe('The most specific classification for the main subject of the image (e.g., "Golden Retriever", "Eiffel Tower").'),
  description: z.string().describe('A detailed, step-by-step description of the image, covering the subject, setting, colors, and any actions.'),
  extractedText: z.string().optional().describe('Any and all text found within the image. If no text is present, this should be an empty string or omitted.'),
  apiKeyUsed: z.string().optional().describe('The API key that was used for the response (primary or backup).')
});
export type ClassifyImageOutput = z.infer<typeof ClassifyImageOutputSchema>;


export async function classifyImage(input: ClassifyImageInput): Promise<ClassifyImageOutput> {
  return classifyImageFlow(input);
}


const makeRequest = async (apiKey: string | undefined, input: ClassifyImageInput) => {
    const model = googleAI.model('gemini-1.5-flash-latest', { apiKey });
    
    const prompt = ai.definePrompt({
      name: 'classifyImagePrompt',
      input: { schema: ClassifyImageInputSchema },
      output: { schema: ClassifyImageOutputSchema.omit({ apiKeyUsed: true }) },
      prompt: `You are an expert image analyst. Analyze the following image in detail. Your task is to provide a comprehensive, step-by-step breakdown of its contents.

1.  **Classification**: Identify the main subject of the image. Be as specific as possible (e.g., "A red 1967 Ford Mustang convertible" instead of just "car").
2.  **Step-by-Step Description**: Provide a detailed, multi-step description of the entire image. Break down the scene, objects, and any actions taking place. Describe the setting, background, foreground, colors, and lighting.
3.  **Text Extraction**: Extract any and all text visible within the image. If no text is present, return an empty string for the extractedText field.

Your response must follow the structured output format.

Image: {{media url=imageDataUri}}`,
      model,
    });
    
    const { output } = await prompt(input);
    return output;
}


const classifyImageFlow = ai.defineFlow(
  {
    name: 'classifyImageFlow',
    inputSchema: ClassifyImageInputSchema,
    outputSchema: ClassifyImageOutputSchema,
  },
  async (input) => {
    try {
        const output = await makeRequest(process.env.GEMINI_API_KEY, input);
        if (output) return { ...output, apiKeyUsed: 'primary' };
        throw new Error("Primary key returned empty response.");
    } catch (primaryError: any) {
        console.warn(`Primary API key failed for image classification. Error: ${primaryError.message}`);
        const backupApiKey = process.env.GEMINI_BACKUP_API_KEY;
        if (backupApiKey) {
            console.log("Attempting to use backup API key for image classification...");
            try {
                const output = await makeRequest(backupApiKey, input);
                if (output) return { ...output, apiKeyUsed: 'backup' };
                throw new Error("Backup key returned empty response.");
            } catch (backupError: any) {
                console.error(`Backup API key also failed for image classification. Error: ${backupError.message}`);
                throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
            }
        }
        throw new Error(`The AI model failed to respond. Details: ${primaryError.message}`);
    }
  }
);
