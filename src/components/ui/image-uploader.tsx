
// src/components/ui/image-uploader.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { uploadImageAndGetURL } from '@/lib/firebase'; // Your existing upload function
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  // The ID of the current user, required for the upload path.
  userId: string;
  // An array of existing image URLs to display.
  imageUrls: string[];
  // A callback function that fires when the list of URLs changes (add or remove).
  onUrlsChange: (urls: string[]) => void;
  // Optional: Maximum number of files allowed.
  maxFiles?: number;
  // Optional: Maximum file size in megabytes.
  maxFileSizeMB?: number;
}

export function ImageUploader({
  userId,
  imageUrls,
  onUrlsChange,
  maxFiles = 5,
  maxFileSizeMB = 10,
}: ImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // --- Pre-upload checks ---
    if (!userId) {
      setError("You must be logged in to upload images.");
      return;
    }
    
    const totalImages = imageUrls.length + files.length;
    if (totalImages > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} images.`);
      return;
    }

    const filesToUpload = Array.from(files).filter(file => {
        if (file.size > maxFileSizeMB * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: `${file.name} is larger than ${maxFileSizeMB}MB and was not uploaded.`
            });
            return false;
        }
        return true;
    });

    if (filesToUpload.length === 0) return;
    
    // --- Start upload process ---
    setIsUploading(true);
    setError(null);
    setUploadProgress({});

    const uploadPromises = filesToUpload.map(file => 
      uploadImageAndGetURL(file, userId, (progress) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      }).catch(err => ({ error: err, file })) // Catch individual errors
    );

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUrls = results.filter(res => typeof res === 'string') as string[];
      const failedUploads = results.filter(res => res && typeof res === 'object' && res.error);

      if (successfulUrls.length > 0) {
        onUrlsChange([...imageUrls, ...successfulUrls]);
        toast({
          title: 'Upload Complete',
          description: `${successfulUrls.length} image(s) uploaded successfully.`,
        });
      }

      if (failedUploads.length > 0) {
        setError(`${failedUploads.length} image(s) failed to upload. Please try again.`);
        console.error("Failed uploads:", failedUploads);
      }

    } catch (err) {
      setError("An unexpected error occurred during upload. Please check the console.");
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      // Clear the file input so the same file can be selected again
      event.target.value = '';
    }
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    const updatedUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    onUrlsChange(updatedUrls);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">Upload Photos</Label>
        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
              <Label
                htmlFor="file-upload"
                className={cn(
                  "relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80",
                  isUploading && "cursor-not-allowed opacity-50"
                )}
              >
                <span>{isUploading ? 'Uploading...' : 'Choose files'}</span>
                <Input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  multiple 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/gif, image/webp" 
                  disabled={isUploading} 
                />
              </Label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Up to {maxFiles} images, {maxFileSizeMB}MB per file</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-x-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
        </div>
      )}

      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name}>
              <p className="text-sm text-muted-foreground">{name}</p>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          ))}
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {imageUrls.map((src, index) => (
            <div key={src} className="group relative">
              <Image
                src={src}
                alt={`Preview ${index + 1}`}
                width={200}
                height={200}
                className="aspect-square w-full rounded-lg object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveImage(index)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
