
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
import {ModelReference} from 'genkit/model';

const IntelligentResponseInputSchema = z.object({
  context: z.string().describe('The knowledge base and chat history.'),
  question: z.string().describe('The user question to answer.'),
  model: z.string().optional().describe('The name of the model to use.'),
});
export type IntelligentResponseInput = z.infer<
  typeof IntelligentResponseInputSchema
>;

const IntelligentResponseOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type IntelligentResponseOutput = z.infer<
  typeof IntelligentResponseOutputSchema
>;

export async function intelligentResponse(
  input: IntelligentResponseInput
): Promise<IntelligentResponseOutput> {
  return intelligentResponseFlow(input);
}

const basePrompt = {
    system: `You are a powerful, analytical AI assistant. Your goal is to provide insightful and accurate answers based on the provided context and question.

- First, check if the knowledge base or chat history provides a relevant answer. If it does, use it to form a comprehensive response.
- If the context does not contain the answer, use your own extensive general knowledge to respond. You can handle a wide range of tasks, from answering questions to generating creative content like code, scripts, or emails.
- Do not mention that you cannot access the internet. Instead, answer based on the information you were trained on.
- If the question is ambiguous, ask for clarification.

Your final output should be only the answer to the user's question, without any preamble or extra formatting.
`,
    input: {
        schema: z.object({
            context: z.string(),
            question: z.string(),
        }),
    },
    output: {
        schema: IntelligentResponseOutputSchema
    },
    prompt: `--- Context & History ---
{{{context}}}
-------------------------

User Question: {{{question}}}`,
}

const flashPrompt = ai.definePrompt(
  {
    name: 'intelligentResponseFlashPrompt',
    ...basePrompt,
  },
);

const proPrompt = ai.definePrompt(
  {
    name: 'intelligentResponseProPrompt',
    ...basePrompt,
  },
);

const pro15Prompt = ai.definePrompt(
  {
    name: 'intelligentResponsePro15Prompt',
    ...basePrompt,
  },
);


const intelligentResponseFlow = ai.defineFlow(
  {
    name: 'intelligentResponseFlow',
    inputSchema: IntelligentResponseInputSchema,
    outputSchema: IntelligentResponseOutputSchema,
  },
  async (input) => {
    const model = input.model || 'googleai/gemini-1.5-flash-latest';
    
    try {
        let response;
        const promptInput = { context: input.context, question: input.question };

        switch (model) {
            case 'googleai/gemini-pro':
                response = await proPrompt(promptInput, { model: 'googleai/gemini-pro' });
                break;
            case 'googleai/gemini-1.5-pro-latest':
                response = await pro15Prompt(promptInput, { model: 'googleai/gemini-1.5-pro-latest' });
                break;
            case 'googleai/gemini-1.5-flash-latest':
            default:
                response = await flashPrompt(promptInput, { model: 'googleai/gemini-1.5-flash-latest' });
                break;
        }
        
        return response.output!;

    } catch (error: any) {
      console.error(`Model ${model} failed.`, error);
      throw new Error(
        `The selected AI model (${model}) failed to respond. Please try a different model or try again later.`
      );
    }
  }
);
