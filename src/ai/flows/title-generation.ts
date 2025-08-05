
'use server';

/**
 * @fileOverview Generates a concise title for a given piece of content.
 *
 * - generateTitle - A function that generates a title.
 * - GenerateTitleInput - The input type for the generateTitle function.
 * - GenerateTitleOutput - The return type for the generateTitle function.
 */

import {ai, googleAI, backupAi} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTitleInputSchema = z.object({
  content: z.string().describe('The content to generate a title for.'),
});
export type GenerateTitleInput = z.infer<typeof GenerateTitleInputSchema>;

const GenerateTitleOutputSchema = z.object({
  title: z
    .string()
    .describe('A concise, descriptive title for the content (max 5 words).'),
  apiKeyUsed: z.enum(['primary', 'backup']).optional(),
});
export type GenerateTitleOutput = z.infer<typeof GenerateTitleOutputSchema>;

export async function generateTitle(input: GenerateTitleInput): Promise<GenerateTitleOutput> {
  return generateTitleFlow(input);
}

const generateTitlePrompt = (client: typeof ai, modelName: string) => client.definePrompt({
      name: `generateTitlePrompt_${modelName.replace(/-/g, '_')}`,
      input: {schema: GenerateTitleInputSchema},
      output: {schema: GenerateTitleOutputSchema.omit({apiKeyUsed: true})},
      prompt: `You are an expert in summarizing content. Your task is to generate a short, descriptive title (maximum 5 words) for the following content. The title should capture the main topic of the text.

Content:
{{{content}}}

Your Title:`,
      model: googleAI.model(modelName as any),
    });

const generateTitleFlow = ai.defineFlow(
  {
    name: 'generateTitleFlow',
    inputSchema: GenerateTitleInputSchema,
    outputSchema: GenerateTitleOutputSchema,
  },
  async input => {
    
    try {
        const prompt = generateTitlePrompt(ai, 'gemini-1.5-flash-latest');
        const {output} = await prompt(input);
        if (!output) {
            throw new Error("The AI model failed to respond.");
        }
        return { ...output, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn("Primary title generation failed, trying fallback model.", error.message);
        try {
            const prompt = generateTitlePrompt(backupAi, 'gemini-1.5-pro-latest');
            const {output} = await prompt(input);
            if (!output) {
                throw new Error("The AI model and the backup both failed to respond.");
            }
            return { ...output, apiKeyUsed: 'backup' };
        } catch (backupError: any) {
            console.error("Backup title generation failed.", backupError.message);
            throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
        }
    }
  }
);
