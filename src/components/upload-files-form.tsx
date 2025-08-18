
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useState } from 'react';
import type { Service } from '@/app/(main)/engenharia/page';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { Progress } from './ui/progress';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];


const formSchema = z.object({
  files: z
    .custom<FileList>((val) => val instanceof FileList, 'Selecione um arquivo')
    .refine((files) => files.length > 0, `Selecione ao menos um arquivo.`)
    .refine((files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE), `Cada arquivo deve ter no máximo 5MB.`)
    .refine(
      (files) => Array.from(files).every((file) => ALLOWED_FILE_TYPES.includes(file.type)),
      "Tipos de arquivo permitidos: .jpg, .jpeg, .png, .webp, .pdf, .txt, .doc, .docx"
    ),
});

interface UploadFilesFormProps {
    service: Service;
    onSave?: () => void;
}

export function UploadFilesForm({ service, onSave }: UploadFilesFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: undefined,
    },
  });

  const fileRef = form.register('files');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setUploadProgress(0);
    
    const files = Array.from(values.files);
    const uploadedFilesData = [];

    try {
        for (const file of files) {
            setCurrentFile(`Enviando: ${file.name}`);
            const uniqueFileName = `${uuidv4()}-${file.name}`;
            const storageRef = ref(storage, `services/${service.id}/${uniqueFileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            await new Promise<void>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        console.error("Upload Error:", error);
                        toast({
                            variant: 'destructive',
                            title: 'Erro no Upload!',
                            description: `Ocorreu um erro ao enviar o arquivo ${file.name}: ${error.message}`,
                        });
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        uploadedFilesData.push({ name: file.name, url: downloadURL });
                        resolve();
                    }
                );
            });
        }
        
        const serviceRef = doc(db, 'servicos', service.id);
        await updateDoc(serviceRef, {
            anexos: arrayUnion(...uploadedFilesData),
        });

        toast({
            title: 'Sucesso!',
            description: 'Arquivos enviados e associados ao serviço com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        
        form.reset();
        onSave?.();

    } catch (error) {
        console.error('Error during upload process: ', error);
        // Toast for general error is handled inside the promise reject
    } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
        setCurrentFile('');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="files"
            render={() => (
                <FormItem>
                    <FormLabel>Arquivos</FormLabel>
                    <FormControl>
                        <Input type="file" multiple {...fileRef} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        {isSubmitting && (
            <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground">{currentFile} {Math.round(uploadProgress)}%</p>
            </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Enviando...' : 'Enviar Arquivos'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
