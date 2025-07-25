
import {NextRequest, NextResponse} from 'next/server';
import {intelligentResponse} from '@/ai/flows/intelligent-responses';

export type ChatMessage = {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export async function POST(req: NextRequest) {
  try {
    const { knowledge, sessionId, history } = await req.json();

    if (!history || history.length === 0 || !sessionId) {
      return NextResponse.json(
        {error: 'Missing history or sessionId'},
        {status: 400}
      );
    }
    
    // Construct the full context from knowledge base and the entire chat history
    const context =
      (knowledge ? `--- Knowledge Base ---\n${knowledge}\n\n` : '') +
      '--- Chat History ---\n' +
      history.map((h: {role: string; content: string;}) => `${h.role}: ${h.content}`).join('\n');

    const result = await intelligentResponse({
      context: context,
    });

    return NextResponse.json({answer: result.answer});
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {error: 'Internal Server Error', details: error.message},
      {status: 500}
    );
  }
}

export async function GET(req: NextRequest) {
    // This endpoint is no longer used for fetching history.
    // Returning an empty array for compatibility.
    return NextResponse.json([]);
}
