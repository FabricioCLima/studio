
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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
    .refine((files) => files ? Array.from(files).every((file) => file.size <= MAX_FILE_SIZE) : true, `Cada arquivo deve ter no máximo 5MB.`)
    .refine(
      (files) => files ? Array.from(files).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)) : true,
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const files = Array.from(values.files);

    try {
      for (const file of files) {
        setUploadingFileName(file.name);
        setUploadProgress(0);
        
        const storageRef = ref(storage, `servicos/${service.id}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload Error:", error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const serviceRef = doc(db, 'servicos', service.id);
                await updateDoc(serviceRef, {
                    anexos: arrayUnion({ name: file.name, url: downloadURL })
                });
                resolve();
              } catch(error) {
                console.error("Error updating firestore:", error)
                reject(error);
              }
            }
          );
        });
      }

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
            description: `Ocorreu um erro ao enviar o arquivo: ${error.message}. Verifique a configuração de CORS e as permissões de Storage do seu projeto Firebase.`,
        });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
        setUploadingFileName(null);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="files"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Arquivos</FormLabel>
              <FormControl>
                 <Input 
                    type="file" 
                    multiple
                    onChange={(e) => onChange(e.target.files)}
                    disabled={isSubmitting}
                    className="pt-2 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                    accept={ACCEPTED_FILE_EXTENSIONS}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isSubmitting && (
            <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                    {uploadingFileName 
                        ? `Enviando "${uploadingFileName}": ${Math.round(uploadProgress)}%`
                        : `Enviando... ${Math.round(uploadProgress)}%`
                    }
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
                ? 'Enviando...'
                : <><UploadCloud className="mr-2 h-4 w-4" /> Enviar Arquivos</>
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
