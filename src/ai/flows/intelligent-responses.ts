
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
import {googleAI} from '@genkit-ai/googleai';
import {streamToReadableStream} from 'ai';

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
): Promise<ReadableStream<any>> {
  const stream = await intelligentResponseFlow(input);
  return streamToReadableStream(stream.stream());
}

const intelligentResponseFlow = ai.defineFlow(
  {
    name: 'intelligentResponseFlow',
    inputSchema: IntelligentResponseInputSchema,
    outputSchema: z.any(),
  },
  async (input) => {
    const modelName = input.model || 'gemini-1.5-flash-latest';
    
    try {
        const model = googleAI.model(modelName);

        const result = await ai.generate({
            model,
            stream: true,
            prompt: `You are a powerful, analytical AI assistant. Your goal is to provide insightful and accurate answers based on the provided context and question.

- First, check if the knowledge base or chat history provides a relevant answer. If it does, use it to form a comprehensive response.
- If the context does not contain the answer, use your own extensive general knowledge to respond. You can handle a wide range of tasks, from answering questions to generating creative content like code, scripts, or emails.
- Do not mention that you cannot access the internet. Instead, answer based on the information you were trained on.
- If the question is ambiguous, ask for clarification.

Your final output should be only the answer to the user's question, without any preamble or extra formatting.

Context:
${input.context}

Question:
${input.question}
`,
        });

        return result;
    } catch (error: any) {
        console.error(`Model ${modelName} failed.`, error);
        throw new Error(
            `The selected AI model (${modelName}) failed to respond. Details: ${error.message}`
        );
    }
  }
);
