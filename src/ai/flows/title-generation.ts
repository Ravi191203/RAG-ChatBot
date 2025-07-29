
'use server';

/**
 * @fileOverview Generates a concise title for a given piece of content.
 *
 * - generateTitle - A function that generates a title.
 * - GenerateTitleInput - The input type for the generateTitle function.
 * - GenerateTitleOutput - The return type for the generateTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GenerateTitleInputSchema = z.object({
  content: z.string().describe('The content to generate a title for.'),
});
export type GenerateTitleInput = z.infer<typeof GenerateTitleInputSchema>;

const GenerateTitleOutputSchema = z.object({
  title: z
    .string()
    .describe('A concise, descriptive title for the content (max 5 words).'),
});
export type GenerateTitleOutput = z.infer<typeof GenerateTitleOutputSchema>;

export async function generateTitle(input: GenerateTitleInput): Promise<GenerateTitleOutput> {
  return generateTitleFlow(input);
}

const generateTitleFlow = ai.defineFlow(
  {
    name: 'generateTitleFlow',
    inputSchema: GenerateTitleInputSchema,
    outputSchema: GenerateTitleOutputSchema,
  },
  async input => {
    const model = googleAI.model('gemini-1.5-flash-latest');

    const prompt = ai.definePrompt({
      name: 'generateTitlePrompt',
      input: {schema: GenerateTitleInputSchema},
      output: {schema: GenerateTitleOutputSchema},
      prompt: `You are an expert in summarizing content. Your task is to generate a short, descriptive title (maximum 5 words) for the following content. The title should capture the main topic of the text.

Content:
{{{content}}}

Your Title:`,
      model,
    });

    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model failed to respond.");
    }
    return output;
  }
);
