
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';
import type { Service } from '@/app/(main)/engenharia/page';
import { Progress } from './ui/progress';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const formSchema = z.object({
  files: z
    .custom<FileList>((val) => val instanceof FileList, 'Selecione um arquivo')
    .refine((files) => files.length > 0, `Selecione ao menos um arquivo.`)
    .refine((files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE), `Cada arquivo deve ter no máximo 1MB.`),
});

interface UploadFilesFormProps {
    service: Service;
    onSave?: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
};

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
    
    try {
        const uploadedFilesData = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setCurrentFile(`Processando: ${file.name}`);
            setUploadProgress(((i + 1) / files.length) * 100);

            const base64Data = await fileToBase64(file);
            uploadedFilesData.push({
                name: file.name,
                type: file.type,
                data: base64Data,
            });
        }
        
        const serviceRef = doc(db, 'servicos', service.id);
        await updateDoc(serviceRef, {
            anexos: arrayUnion(...uploadedFilesData),
        });

        toast({
            title: 'Sucesso!',
            description: 'Arquivos salvos no serviço com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        
        form.reset();
        onSave?.();

    } catch (error) {
        console.error('Error during upload process: ', error);
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: 'Não foi possível salvar os arquivos.',
        });
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
                <p className="text-sm text-muted-foreground">{currentFile}</p>
            </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando...' : 'Salvar Arquivos'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
