'use server';

/**
 * @fileOverview A Genkit tool for performing web searches using Tavily.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Tavily from 'tavily';

export const webSearch = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Performs a web search to find up-to-date information on a given topic.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.string().describe('A summary of the search results, including sources.'),
  },
  async (input) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return "Web search is not available. The TAVILY_API_KEY is not configured.";
    }

    console.log(`Performing web search for: ${input.query}`);
    const tavily = new Tavily(apiKey);

    try {
        const response = await tavily.search(input.query, {
            search_depth: "advanced",
            include_answer: true,
        });

        // The answer provides a concise summary, and the results provide the sources.
        const searchResult = `Answer from web search:\n${response.answer}\n\nSources:\n${response.results.map(r => `- [${r.title}](${r.url})`).join('\n')}`;

        return searchResult;

    } catch (error) {
        console.error("Error performing Tavily search:", error);
        return `Sorry, the web search failed. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
);
