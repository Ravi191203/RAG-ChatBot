
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
  description: z.string().describe('A brief, one-paragraph description of the image content.'),
  extractedText: z.string().optional().describe('Any and all text found within the image. If no text is present, this should be an empty string or omitted.'),
});
export type ClassifyImageOutput = z.infer<typeof ClassifyImageOutputSchema>;


export async function classifyImage(input: ClassifyImageInput): Promise<ClassifyImageOutput> {
  return classifyImageFlow(input);
}


const prompt = ai.definePrompt({
  name: 'classifyImagePrompt',
  input: { schema: ClassifyImageInputSchema },
  output: { schema: ClassifyImageOutputSchema },
  prompt: `Analyze the following image. Your task is to do three things:
1.  Identify its main subject and provide the most specific classification possible.
2.  Write a brief, one-paragraph description of the entire image.
3.  Extract any and all text present in the image. If there is no text, return an empty string for the extractedText field.

Image: {{media url=imageDataUri}}`,
  model: 'googleai/gemini-1.5-flash-latest',
});


const classifyImageFlow = ai.defineFlow(
  {
    name: 'classifyImageFlow',
    inputSchema: ClassifyImageInputSchema,
    outputSchema: ClassifyImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
