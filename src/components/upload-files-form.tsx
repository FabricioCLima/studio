
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useState } from 'react';
import type { Service } from '@/app/(main)/engenharia/page';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

const formSchema = z.object({
  files: z.custom<FileList>().refine((files) => files.length > 0, 'Selecione pelo menos um arquivo.'),
});

interface UploadFilesFormProps {
  onSave?: () => void;
  service: Service;
}

export function UploadFilesForm({ onSave, service }: UploadFilesFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
      form.setValue('files', event.target.files);
    }
  };

  async function onSubmit() {
    if (selectedFiles.length === 0) {
        form.setError("files", { message: "Selecione pelo menos um arquivo." });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const uploadPromises = selectedFiles.map(async (file) => {
            const storageRef = ref(storage, `services/${service.id}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return { url: downloadURL, name: file.name };
        });

        const fileData = await Promise.all(uploadPromises);

        const serviceRef = doc(db, 'servicos', service.id);
        await updateDoc(serviceRef, {
            anexos: arrayUnion(...fileData)
        });

        toast({
            title: 'Sucesso!',
            description: 'Arquivos enviados com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        
        form.reset();
        setSelectedFiles([]);
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
          render={() => (
            <FormItem>
              <FormLabel>Arquivos</FormLabel>
              <FormControl>
                <Input type="file" multiple onChange={handleFileChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {selectedFiles.length > 0 && (
            <div className="space-y-2">
                <p className="text-sm font-medium">Arquivos selecionados:</p>
                <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2">
                            {file.name}
                        </Badge>
                    ))}
                </div>
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
