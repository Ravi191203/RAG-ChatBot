
import { NextRequest, NextResponse } from 'next/server';
import { generateVideo, checkVideoStatus } from '@/ai/flows/video-generation';

export async function POST(req: NextRequest) {
    try {
        const { prompt, operationName } = await req.json();

        // If an operation name is provided, check its status
        if (operationName) {
            const result = await checkVideoStatus({ operationName });
            return NextResponse.json(result);
        }

        // Otherwise, start a new video generation job
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const result = await generateVideo({ prompt });
        
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error in Video Generation API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
