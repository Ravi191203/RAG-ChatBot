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
  prompt: `You are a chatbot that answers questions based on the context provided. You should only use the context provided to answer the question. If the context does not contain the answer to the question, you should respond with I don't know.

Context: {{{context}}}

Question: {{{question}}}

Answer:`,
  retry: {
    backoff: {
      delay: 1000,
      maxRetries: 3,
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
