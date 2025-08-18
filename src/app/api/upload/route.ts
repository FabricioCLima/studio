
import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

// Initialize storage
const storage = new Storage({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // Se estiver rodando localmente, você talvez precise do keyFilename
    // keyFilename: './path/to/your/serviceAccountKey.json',
});

const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
if (!bucketName) {
    throw new Error("Firebase Storage bucket name is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.");
}
const bucket = storage.bucket(bucketName);


async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}


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
            
            // Make the file public to get a downloadable URL
            // Alternativamente, use signed URLs para acesso privado e temporário
            await blob.makePublic();

            return {
                url: blob.publicUrl(),
                name: file.name,
            };
        });
        
        const fileData = await Promise.all(uploadPromises);

        return NextResponse.json({
            message: 'Files uploaded successfully',
            fileData,
        });

    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
