'use server';

/**
 * @fileOverview An intelligent question answering AI agent.
 *
 * - intelligentResponse - A function that handles the question answering process.
 * - IntelligentResponseInput - The input type for the intelligentResponse function.
 * - IntelligentResponseOutput - The return type for the intelligentResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentResponseInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  context: z.string().describe('The context to use when answering the question.'),
});
export type IntelligentResponseInput = z.infer<typeof IntelligentResponseInputSchema>;

const IntelligentResponseOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type IntelligentResponseOutput = z.infer<typeof IntelligentResponseOutputSchema>;

export async function intelligentResponse(input: IntelligentResponseInput): Promise<IntelligentResponseOutput> {
  return intelligentResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentResponsePrompt',
  input: {schema: IntelligentResponseInputSchema},
  output: {schema: IntelligentResponseOutputSchema},
  prompt: `You are a helpful and conversational AI assistant. Your goal is to answer the user's question based on the provided context.

If the answer is available in the context, you should use it to form a comprehensive and friendly response.

If the answer is not in the context, you should say that you cannot find the answer in the provided document and ask if the user would like you to answer based on your general knowledge.

Context:
{{{context}}}

Question:
{{{question}}}`,
  model: 'googleai/gemini-2.0-flash',
  retry: {
    backoff: {
      delay: 1000,
      maxRetries: 5,
      multiplier: 2,
    },
  },
});

const intelligentResponseFlow = ai.defineFlow(
  {
    name: 'intelligentResponseFlow',
    inputSchema: IntelligentResponseInputSchema,
    outputSchema: IntelligentResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
