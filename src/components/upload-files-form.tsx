
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
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
    .refine((files) => Array.from(files).every(file => file instanceof File), 'Ocorreu um problema com os arquivos selecionados.'),
});

interface UploadFilesFormProps {
  onSave?: () => void;
  service: Service;
}

export function UploadFilesForm({ onSave, service }: UploadFilesFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        files: undefined,
    }
  });
  
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
        
        // Fetch the current document to get existing attachments
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
        setSelectedFileNames([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      form.setValue('files', files, { shouldValidate: true });
      setSelectedFileNames(Array.from(files).map(f => f.name));
    } else {
      form.setValue('files', undefined, { shouldValidate: true });
      setSelectedFileNames([]);
    }
  };

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
                <div>
                  <Label htmlFor="file-upload" className="w-full inline-block cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    Escolher arquivos
                  </Label>
                  <Input 
                    id="file-upload"
                    type="file" 
                    multiple 
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedFileNames.length > 0 && (
            <div className="space-y-2">
                <p className="text-sm font-medium">Arquivos selecionados:</p>
                <div className="flex flex-wrap gap-2">
                    {selectedFileNames.map((name, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2">
                            {name}
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
