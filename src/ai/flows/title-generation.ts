
'use server';

/**
 * @fileOverview Generates a concise title for a given piece of content.
 *
 * - generateTitle - A function that generates a title.
 * - GenerateTitleInput - The input type for the generateTitle function.
 * - GenerateTitleOutput - The return type for the generateTitle function.
 */

import {ai, backupAi} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTitleInputSchema = z.object({
  content: z.string().describe('The content to generate a title for.'),
});
export type GenerateTitleInput = z.infer<typeof GenerateTitleInputSchema>;

const GenerateTitleOutputSchema = z.object({
  title: z
    .string()
    .describe('A concise, descriptive title for the content (max 5 words).'),
  apiKeyUsed: z.enum(['primary', 'backup']).optional().describe('The API key that was used for the response.'),
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
    
    const generateTitlePrompt = (client: typeof ai) => client.definePrompt({
      name: 'generateTitlePrompt',
      input: {schema: GenerateTitleInputSchema},
      output: {schema: GenerateTitleOutputSchema},
      prompt: `You are an expert in summarizing content. Your task is to generate a short, descriptive title (maximum 5 words) for the following content. The title should capture the main topic of the text.

Content:
{{{content}}}

Your Title:`,
      model: 'gemini-1.5-flash-latest',
    });

    try {
        const primaryPrompt = generateTitlePrompt(ai);
        const {output} = await primaryPrompt(input);
        if (!output) {
            throw new Error("The AI model failed to respond.");
        }
        return { ...output, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn("Primary API key failed for title generation. Trying backup key.", error.message);
        if (process.env.GEMINI_BACKUP_API_KEY) {
            try {
                const backupPrompt = generateTitlePrompt(backupAi);
                const {output} = await backupPrompt(input);
                if (!output) {
                    throw new Error("Title generation failed on both keys.");
                }
                return { ...output, apiKeyUsed: 'backup' };
            } catch (backupError: any) {
                 throw new Error(`Title generation failed on both keys. Details: ${backupError.message}`);
            }
        }
        throw new Error(`Title generation failed. Details: ${error.message}`);
    }
  }
);
