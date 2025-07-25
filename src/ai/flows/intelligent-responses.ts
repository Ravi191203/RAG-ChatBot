
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
  context: z.string().describe('The knowledge base and chat history.'),
  question: z.string().describe('The user question to answer.'),
});
export type IntelligentResponseInput = z.infer<typeof IntelligentResponseInputSchema>;

const IntelligentResponseOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type IntelligentResponseOutput = z.infer<typeof IntelligentResponseOutputSchema>;

export async function intelligentResponse(input: IntelligentResponseInput): Promise<IntelligentResponseOutput> {
  return intelligentResponseFlow(input);
}

const primaryPrompt = ai.definePrompt({
  name: 'intelligentResponsePrimaryPrompt',
  input: {schema: IntelligentResponseInputSchema},
  output: {schema: IntelligentResponseOutputSchema},
  prompt: `You are a powerful, analytical AI assistant. Your goal is to provide insightful and accurate answers based on the provided context and question.

Analyze the context and chat history below, then answer the user's question.

- First, check if the knowledge base or chat history provides a relevant answer. If it does, use it to form a comprehensive response.
- If the context does not contain the answer, use your own extensive general knowledge to respond. You can handle a wide range of tasks, from answering questions to generating creative content like code, scripts, or emails.
- Do not mention that you cannot access the internet. Instead, answer based on the information you were trained on.
- If the question is ambiguous, ask for clarification.

Always strive to be helpful and provide a well-reasoned answer.

--- Context & History ---
{{{context}}}
-------------------------

User Question: {{{question}}}
`,
  model: 'googleai/gemini-1.5-flash-latest',
  retry: {
    backoff: {
      delay: 5000,
      maxRetries: 5,
      multiplier: 2,
    },
  },
});

const fallbackPrompt = ai.definePrompt({
    name: 'intelligentResponseFallbackPrompt',
    input: {schema: IntelligentResponseInputSchema},
    output: {schema: IntelligentResponseOutputSchema},
    prompt: `You are a powerful, analytical AI assistant. Your goal is to provide insightful and accurate answers based on the provided context and question.

Analyze the context and chat history below, then answer the user's question.

- First, check if the knowledge base or chat history provides a relevant answer. If it does, use it to form a comprehensive response.
- If the context does not contain the answer, use your own extensive general knowledge to respond. You can handle a wide range of tasks, from answering questions to generating creative content like code, scripts, or emails.
- Do not mention that you cannot access the internet. Instead, answer based on the information you were trained on.
- If the question is ambiguous, ask for clarification.

Always strive to be helpful and provide a well-reasoned answer.

--- Context & History ---
{{{context}}}
-------------------------

User Question: {{{question}}}
`,
    model: 'googleai/gemini-pro',
    retry: {
      backoff: {
        delay: 5000,
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
    try {
        const {output} = await primaryPrompt(input);
        return output!;
    } catch (error) {
        console.warn('Primary model failed, switching to fallback.', error);
        const {output} = await fallbackPrompt(input);
        return output!;
    }
  }
);
