
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

const extractKnowledgePrompt = ai.definePrompt({
    name: 'extractKnowledgePrompt',
    input: { schema: ExtractKnowledgeInputSchema },
    output: { schema: ExtractKnowledgeOutputSchema },
    prompt: `You are a highly intelligent AI assistant with expertise in deep analysis and knowledge synthesis. Your task is to process the following content and generate a comprehensive and informative knowledge base from it.

Instead of just listing key points, I want you to truly understand the text and present your understanding. Your output should be a detailed, well-structured summary that captures the core concepts, key arguments, and any important data or examples. Explain the main ideas in your own words, as if you were creating a study guide for someone who needs to master this information.

If the content is empty, nonsensical, or too brief to analyze, please state that clearly.

Your final output should only be the extracted knowledge, without any preamble or extra formatting.

Content:
{{{content}}}
`,
});


const extractKnowledgeFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFlow',
    inputSchema: ExtractKnowledgeInputSchema,
    outputSchema: ExtractKnowledgeOutputSchema,
  },
  async input => {
    const models = ['googleai/gemini-1.5-flash-latest', 'googleai/gemini-pro'];

    for (const modelName of models) {
        try {
            const { output } = await extractKnowledgePrompt(input, { model: modelName });
            if (output) {
                return output;
            }
        } catch (error) {
            console.warn(`Model ${modelName} failed. Trying next model.`, error);
        }
    }
    
    throw new Error('All AI models failed to process the request.');
  }
);
