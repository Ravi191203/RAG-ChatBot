
'use server';

/**
 * @fileOverview Extracts key information from documents or links.
 *
 * - extractKnowledge - A function that handles the knowledge extraction process.
 * - ExtractKnowledgeInput - The input type for the extractKnowledge function.
 * - ExtractKnowledgeOutput - The return type for the extractKnowledge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const ExtractKnowledgeInputSchema = z.object({
  content: z.string().describe('The content to extract knowledge from.'),
});
export type ExtractKnowledgeInput = z.infer<typeof ExtractKnowledgeInputSchema>;

const ExtractKnowledgeOutputSchema = z.object({
  extractedKnowledge: z
    .string()
    .describe('The key information extracted from the content.'),
});
export type ExtractKnowledgeOutput = z.infer<
  typeof ExtractKnowledgeOutputSchema
>;

export async function extractKnowledge(
  input: ExtractKnowledgeInput
): Promise<ExtractKnowledgeOutput> {
  return extractKnowledgeFlow(input);
}


const makeRequest = async (apiKey: string | undefined, input: ExtractKnowledgeInput) => {
    const model = googleAI.model('gemini-1.5-flash-latest', { apiKey });
    
    const extractKnowledgePrompt = ai.definePrompt({
        name: 'extractKnowledgePrompt',
        input: { schema: ExtractKnowledgeInputSchema },
        output: { schema: ExtractKnowledgeOutputSchema },
        prompt: `You are a highly intelligent AI assistant with expertise in deep analysis and knowledge synthesis. Your task is to process the following content and generate a comprehensive and informative knowledge base from it.

Instead of just listing key points, I want you to truly understand the text and present your understanding. Your output should be a detailed, well-structured summary that captures the core concepts, key arguments, and any important data or examples. Explain the main ideas in your own words, as if you were creating a study guide for someone who needs to master this information.

If the content is empty, nonsensical, or too brief to analyze, please state that clearly.

Your final output should be only the extracted knowledge, without any preamble or extra formatting.

Content:
{{{content}}}
`,
    });

    const { output } = await ai.generate({
        prompt: extractKnowledgePrompt,
        model,
        input
    });

    return output;
}


const extractKnowledgeFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFlow',
    inputSchema: ExtractKnowledgeInputSchema,
    outputSchema: ExtractKnowledgeOutputSchema,
  },
  async input => {
    try {
        const output = await makeRequest(process.env.GEMINI_API_KEY, input);
        if (output) return output;
        throw new Error("Primary key returned empty response.");
    } catch (primaryError: any) {
        console.warn(`Primary API key failed for knowledge extraction. Error: ${primaryError.message}`);
        const backupApiKey = process.env.GEMINI_BACKUP_API_KEY;
        if (backupApiKey) {
            console.log("Attempting to use backup API key for knowledge extraction...");
            try {
                const output = await makeRequest(backupApiKey, input);
                if (output) return output;
                throw new Error("Backup key returned empty response.");
            } catch (backupError: any) {
                console.error(`Backup API key also failed for knowledge extraction. Error: ${backupError.message}`);
                throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
            }
        }
        throw new Error(`The AI model failed to respond. Details: ${primaryError.message}`);
    }
  }
);
