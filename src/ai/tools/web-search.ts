
'use server';

/**
 * @fileOverview A Genkit tool for performing web searches using Tavily.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Tavily from 'tavily';

const WebSearchConfigSchema = z.object({
  tavilyApiKey: z.string().optional(),
});

// We define the tool inside a function so we can attach it to different AI clients (primary and backup)
// and pass configuration to it.
export const getWebSearchTool = (client: typeof ai, config?: z.infer<typeof WebSearchConfigSchema>) => client.defineTool(
  {
    name: 'webSearch',
    description: 'Performs a web search to find up-to-date information on a given topic.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.string().describe('A summary of the search results, including sources.'),
  },
  async (input) => {
    const apiKey = config?.tavilyApiKey || process.env.TAVILY_API_KEY;

    if (!apiKey) {
      throw new Error("Tavily API key not found. Please set TAVILY_API_KEY in your .env file.");
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

// We export a version of the tool attached to the primary client for direct use if needed.
export const webSearch = getWebSearchTool(ai);
