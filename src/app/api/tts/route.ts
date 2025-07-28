import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/ai/flows/tts-generation';

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();
        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const result = await generateSpeech({ text });
        
        return NextResponse.json({ audio: result.audio });
    } catch (error: any) {
        console.error('Error in TTS API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
