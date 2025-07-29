
import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/ai/flows/image-generation';

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const result = await generateImage({ prompt });
        
        return NextResponse.json({ imageUrl: result.imageUrl });
    } catch (error: any) {
        console.error('Error in Image Generation API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
