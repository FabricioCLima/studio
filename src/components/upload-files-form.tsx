
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Service } from '@/app/(main)/engenharia/page';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { Progress } from './ui/progress';
import { CheckCircle, UploadCloud } from 'lucide-react';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
    "image/jpeg", 
    "image/jpg", 
    "image/png", 
    "image/webp", 
    "application/pdf", 
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const ACCEPTED_FILE_EXTENSIONS = ".jpg, .jpeg, .png, .webp, .pdf, .txt, .doc, .docx";


const formSchema = z.object({
  files: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, "Selecione pelo menos um arquivo.")
    .refine((files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE), `Cada arquivo deve ter no máximo 5MB.`)
    .refine(
      (files) => Array.from(files).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)),
      `Apenas arquivos ${ACCEPTED_FILE_EXTENSIONS} são aceitos.`
    ),
});

interface UploadFilesFormProps {
    service: Service;
    onSave?: () => void;
}

export function UploadFilesForm({ service, onSave }: UploadFilesFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    const files = Array.from(values.files);

    try {
        const uploadPromises = files.map(async (file, index) => {
            const storageRef = ref(storage, `servicos/${service.id}/${file.name}`);
            
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const serviceRef = doc(db, 'servicos', service.id);
            await updateDoc(serviceRef, {
                anexos: arrayUnion({ name: file.name, url: downloadURL })
            });

            setUploadProgress((prev) => (prev !== null ? prev + (100 / files.length) : null));
        });

        await Promise.all(uploadPromises);

      toast({
        title: 'Sucesso!',
        description: `${files.length} arquivo(s) enviados com sucesso.`,
        className: 'bg-accent text-accent-foreground',
      });
      
      form.reset();
      onSave?.();

    } catch (error: any) {
        console.error('Error uploading files: ', error);
        toast({
            variant: 'destructive',
            title: 'Erro no Upload!',
            description: error.message || 'Não foi possível enviar os arquivos. Verifique se o Storage está ativado no seu projeto Firebase.',
        });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(null);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arquivos</FormLabel>
              <FormControl>
                 <Input 
                    type="file" 
                    multiple
                    onChange={(e) => field.onChange(e.target.files)}
                    disabled={isSubmitting}
                    className="pt-2 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isSubmitting && uploadProgress !== null && (
            <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                    {uploadProgress < 100 ? `Enviando... ${Math.round(uploadProgress)}%` : 'Finalizando...'}
                </p>
            </div>
        )}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="bg-accent hover:bg-accent/90"
          >
            {isSubmitting 
                ? (uploadProgress === 100 ? <><CheckCircle className="mr-2 h-4 w-4" /> Concluído</> : 'Enviando...')
                : <><UploadCloud className="mr-2 h-4 w-4" /> Enviar Arquivos</>
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
