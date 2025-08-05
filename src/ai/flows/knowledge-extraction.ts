
'use server';

/**
 * @fileOverview Extracts key information from documents or links.
 *
 * - extractKnowledge - A function that handles the knowledge extraction process.
 * - ExtractKnowledgeInput - The input type for the extractKnowledge function.
 * - ExtractKnowledgeOutput - The return type for the extractKnowledge function.
 */

import {ai, googleAI, backupAi} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKnowledgeInputSchema = z.object({
  content: z.string().describe('The content to extract knowledge from.'),
});
export type ExtractKnowledgeInput = z.infer<typeof ExtractKnowledgeInputSchema>;

const ExtractKnowledgeOutputSchema = z.object({
  extractedKnowledge: z
    .string()
    .describe('The key information extracted from the content.'),
  apiKeyUsed: z.enum(['primary', 'backup']).optional(),
});
export type ExtractKnowledgeOutput = z.infer<
  typeof ExtractKnowledgeOutputSchema
>;

export async function extractKnowledge(
  input: ExtractKnowledgeInput
): Promise<ExtractKnowledgeOutput> {
  return extractKnowledgeFlow(input);
}

const extractKnowledgePrompt = (client: typeof ai, modelName: string) => client.definePrompt({
        name: `extractKnowledgePrompt_${modelName.replace(/-/g, '_')}`,
        input: { schema: ExtractKnowledgeInputSchema },
        output: { schema: ExtractKnowledgeOutputSchema.omit({apiKeyUsed: true}) },
        prompt: `You are a highly intelligent AI assistant with expertise in deep analysis and knowledge synthesis. Your task is to process the following content and generate a comprehensive and informative knowledge base from it.

Instead of just listing key points, I want you to truly understand the text and present your understanding. Your output should be a detailed, well-structured summary that captures the core concepts, key arguments, and any important data or examples. Explain the main ideas in your own words, as if you were creating a study guide for someone who needs to master this information.

If the content is empty, nonsensical, or too brief to analyze, please state that clearly.

Your final output should be only the extracted knowledge, without any preamble or extra formatting.

Content:
{{{content}}}
`,
      model: googleAI.model(modelName as any),
    });

const extractKnowledgeFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFlow',
    inputSchema: ExtractKnowledgeInputSchema,
    outputSchema: ExtractKnowledgeOutputSchema,
  },
  async input => {
    try {
        const prompt = extractKnowledgePrompt(ai, 'gemini-1.5-flash-latest');
        const { output } = await prompt(input);
        if (!output) {
          throw new Error("The AI model failed to respond.");
        }
        return { ...output, apiKeyUsed: 'primary' };
    } catch (error: any) {
        console.warn("Primary knowledge extraction failed, trying fallback model.", error.message);
        try {
            const prompt = extractKnowledgePrompt(backupAi, 'gemini-1.5-pro-latest');
            const { output } = await prompt(input);
            if (!output) {
                throw new Error("The AI model and the backup both failed to respond.");
            }
            return { ...output, apiKeyUsed: 'backup' };
        } catch (backupError: any) {
            console.error("Backup knowledge extraction failed.", backupError.message);
            throw new Error(`The AI model and the backup both failed to respond. Details: ${backupError.message}`);
        }
    }
  }
);
