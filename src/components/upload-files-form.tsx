
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useState } from 'react';
import type { Service } from '@/app/(main)/engenharia/page';
import { Badge } from './ui/badge';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const formSchema = z.object({
  files: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, 'Selecione pelo menos um arquivo.')
    .refine((files) => !files || (files.length > 0 && Array.from(files).every((file) => file instanceof File)), 'Ocorreu um problema com os arquivos selecionados.'),
});

interface UploadFilesFormProps {
  onSave?: () => void;
  service: Service;
}

export function UploadFilesForm({ onSave, service }: UploadFilesFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: undefined,
    }
  });

  const files = form.watch("files");
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.files || values.files.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado.' });
        return;
    }
    setIsSubmitting(true);
    try {
        const uploadPromises = Array.from(values.files).map(async (file) => {
            const filePath = `services/${service.id}/${file.name}`;
            const fileRef = ref(storage, filePath);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            return { name: file.name, url: url };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        const serviceRef = doc(db, 'servicos', service.id);
        
        await updateDoc(serviceRef, {
            anexos: arrayUnion(...uploadedFiles)
        });

        toast({
            title: 'Sucesso!',
            description: 'Arquivos enviados com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        
        form.reset();
        onSave?.();
    } catch (error: any) {
      console.error('Error uploading files: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro de Upload!',
        description: error.code === 'storage/unauthorized' 
            ? 'Permissão negada. Verifique as regras de CORS e segurança do Storage.'
            : error.message || 'Não foi possível enviar os arquivos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {files && files.length > 0 && (
            <div className="space-y-2">
                <p className="text-sm font-medium">Arquivos selecionados:</p>
                <div className="flex flex-wrap gap-2">
                    {Array.from(files).map((file, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2">
                            {(file as File).name}
                        </Badge>
                    ))}
                </div>
            </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Enviando...' : 'Enviar Arquivos'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
