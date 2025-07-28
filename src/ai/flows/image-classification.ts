
'use server';

/**
 * @fileOverview Classifies the content of an image.
 *
 * - classifyImage - A function that handles the image classification process.
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
});
export type ClassifyImageOutput = z.infer<typeof ClassifyImageOutputSchema>;


export async function classifyImage(input: ClassifyImageInput): Promise<ClassifyImageOutput> {
  return classifyImageFlow(input);
}


const prompt = ai.definePrompt({
  name: 'classifyImagePrompt',
  input: { schema: ClassifyImageInputSchema },
  output: { schema: ClassifyImageOutputSchema },
  prompt: `Analyze the following image and identify its main subject. Provide the most specific classification possible and a brief, one-paragraph description.

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
