
import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize storage.
// The service account associated with the App Hosting backend will be used automatically.
const storage = new Storage({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
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
            
            // Convert file to buffer
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            // Save the file to GCS
            await blob.save(fileBuffer, {
                metadata: { contentType: file.type },
            });

            // Construct the public URL manually.
            // This assumes the bucket is public or has public access enabled via signed URLs or other mechanisms.
            // For simplicity, we construct a simple public URL.
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
