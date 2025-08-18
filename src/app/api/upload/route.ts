
import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize storage
const storage = new Storage({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
if (!bucketName) {
    throw new Error("Firebase Storage bucket name is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.");
}
const bucket = storage.bucket(bucketName);


export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const serviceId = formData.get('serviceId') as string;

        if (!files.length) {
            return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
        }
        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID is missing.' }, { status: 400 });
        }

        const uploadPromises = files.map(async (file) => {
            const filePath = `services/${serviceId}/${file.name}`;
            const blob = bucket.file(filePath);
            
            const fileBuffer = await file.arrayBuffer();

            await blob.save(Buffer.from(fileBuffer), {
                metadata: { contentType: file.type },
            });

            // Construct the public URL manually
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
            
            return {
                url: publicUrl,
                name: file.name,
            };
        });
        
        const fileData = await Promise.all(uploadPromises);

        return NextResponse.json({
            message: 'Files uploaded successfully',
            fileData,
        });

    } catch (error: any) {
        console.error('Upload failed:', error);
        const errorMessage = error.message || 'An unexpected error occurred during upload.';
        return NextResponse.json({ error: 'Upload failed', details: errorMessage }, { status: 500 });
    }
}
