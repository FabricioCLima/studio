
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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Badge } from './ui/badge';
import { Label } from './ui/label';

const formSchema = z.object({
  files: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, 'Selecione pelo menos um arquivo.')
    .refine(
        (files) => !files || Array.from(files).every((file) => file instanceof File),
        'Ocorreu um problema com os arquivos selecionados.'
    ),
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
            const storageRef = ref(storage, `services/${service.id}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return { url: downloadURL, name: file.name };
        });

        const newFileData = await Promise.all(uploadPromises);

        const serviceRef = doc(db, 'servicos', service.id);
        
        const serviceSnap = await getDoc(serviceRef);
        const existingAnexos = serviceSnap.data()?.anexos || [];
        
        const updatedAnexos = [...existingAnexos, ...newFileData];

        await updateDoc(serviceRef, {
            anexos: updatedAnexos
        });

        toast({
            title: 'Sucesso!',
            description: 'Arquivos enviados com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        
        form.reset();
        onSave?.();
    } catch (error) {
      console.error('Error uploading files: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível enviar os arquivos.',
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
