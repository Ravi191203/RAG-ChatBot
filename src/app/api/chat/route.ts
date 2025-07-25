
import {NextRequest, NextResponse} from 'next/server';
import {intelligentResponse} from '@/ai/flows/intelligent-responses';
import clientPromise from '@/lib/mongodb';
import {ObjectId} from 'mongodb';

export type ChatMessage = {
  _id?: string | ObjectId;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const dbEnabled = !!process.env.MONGODB_URI;

async function getChatHistory(
  sessionId: string,
  limit = 20
): Promise<ChatMessage[]> {
  if (!dbEnabled) return [];
  try {
    const client = await clientPromise;
    const db = client.db();
    const history = await db
      .collection<ChatMessage>('chat_history')
      .find({sessionId})
      .sort({timestamp: -1})
      .limit(limit)
      .toArray();
    return history.reverse();
  } catch (error) {
    console.warn("Could not fetch chat history, proceeding without it.", error);
    return [];
  }
}

async function saveChatMessage(message: Omit<ChatMessage, 'timestamp' | '_id'>) {
    if (!dbEnabled) return;
    try {
        const client = await clientPromise;
        const db = client.db();
        const timestamp = new Date();
        await db
        .collection<ChatMessage>('chat_history')
        .insertOne({...message, timestamp});
    } catch (error) {
        console.warn("Could not save chat message.", error);
    }
}

export async function POST(req: NextRequest) {
  try {
    const {question, knowledge, sessionId, history: clientHistory} = await req.json();

    if (!question || !sessionId) {
      return NextResponse.json(
        {error: 'Missing question or sessionId'},
        {status: 400}
      );
    }

    let history: ChatMessage[] = [];
    if (dbEnabled) {
      history = await getChatHistory(sessionId);
    } else {
      history = clientHistory || [];
    }
    
    const contextWithHistory =
      (knowledge || '') +
      '\n\n--- Chat History ---\n' +
      history.map(h => `${h.role}: ${h.content}`).join('\n');

    await saveChatMessage({
      sessionId,
      role: 'user',
      content: question,
    });

    const result = await intelligentResponse({
      question,
      context: contextWithHistory,
    });

    await saveChatMessage({
      sessionId,
      role: 'assistant',
      content: result.answer,
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
  const {searchParams} = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      {error: 'Session ID is required'},
      {status: 400}
    );
  }

  if (!dbEnabled) {
    return NextResponse.json([]);
  }

  try {
    const history = await getChatHistory(sessionId);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      {error: 'Internal Server Error', details: error.message},
      {status: 500}
    );
  }
}
