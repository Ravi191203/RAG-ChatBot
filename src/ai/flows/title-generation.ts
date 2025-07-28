
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
  apiKeyUsed: z.string().optional().describe('The API key that was used for the response (primary or backup).')
});
export type GenerateTitleOutput = z.infer<typeof GenerateTitleOutputSchema>;

export async function generateTitle(input: GenerateTitleInput): Promise<GenerateTitleOutput> {
  return generateTitleFlow(input);
}


const makeRequest = async (apiKey: string | undefined, input: GenerateTitleInput) => {
    const model = googleAI.model('gemini-1.5-flash-latest', { apiKey });

    const prompt = ai.definePrompt({
      name: 'generateTitlePrompt',
      input: {schema: GenerateTitleInputSchema},
      output: {schema: GenerateTitleOutputSchema.omit({ apiKeyUsed: true })},
      prompt: `You are an expert in summarizing content. Your task is to generate a short, descriptive title (maximum 5 words) for the following content. The title should capture the main topic of the text.

Content:
{{{content}}}

Your Title:`,
      model,
    });

    const {output} = await prompt(input);
    return output;
}


const generateTitleFlow = ai.defineFlow(
  {
    name: 'generateTitleFlow',
    inputSchema: GenerateTitleInputSchema,
    outputSchema: GenerateTitleOutputSchema,
  },
  async input => {
    try {
        const output = await makeRequest(process.env.GEMINI_API_KEY, input);
        if (output) return { ...output, apiKeyUsed: 'primary' };
        throw new Error("Primary key returned empty response.");
    } catch (primaryError: any) {
        console.warn(`Primary API key failed for title generation. Error: ${primaryError.message}`);
        const backupApiKey = process.env.GEMINI_BACKUP_API_KEY;
        if (backupApiKey) {
            console.log("Attempting to use backup API key for title generation...");
            try {
                const output = await makeRequest(backupApiKey, input);
                if (output) return { ...output, apiKeyUsed: 'backup' };
                throw new Error("Backup key returned empty response.");
            } catch (backupError: any) {
                console.error(`Backup API key also failed for title generation. Error: ${backupError.message}`);
                throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
            }
        }
        throw new Error(`The AI model failed to respond. Details: ${primaryError.message}`);
    }
  }
);
