
import { NextRequest, NextResponse } from 'next/server';
import { classifyImage } from '@/ai/flows/image-classification';

export async function POST(req: NextRequest) {
    try {
        const { imageDataUri } = await req.json();
        if (!imageDataUri) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
        }

        const result = await classifyImage({ imageDataUri });
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in Image Classification API:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
