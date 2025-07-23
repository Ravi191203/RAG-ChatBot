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
export type ExtractKnowledgeOutput = z.infer<typeof ExtractKnowledgeOutputSchema>;

export async function extractKnowledge(input: ExtractKnowledgeInput): Promise<ExtractKnowledgeOutput> {
  return extractKnowledgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKnowledgePrompt',
  input: {schema: ExtractKnowledgeInputSchema},
  output: {schema: ExtractKnowledgeOutputSchema},
  prompt: `You are an expert at extracting key information from documents and web pages.

  Please extract the key information from the following content:

  Content: {{{content}}}

  Please focus on extracting information that would be useful for answering questions about the content.
  `,
});

const extractKnowledgeFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFlow',
    inputSchema: ExtractKnowledgeInputSchema,
    outputSchema: ExtractKnowledgeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
