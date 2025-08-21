// src/components/ui/image-uploader.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { uploadImageAndGetURL } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ImageUploaderProps {
  userId: string | undefined;
  imageUrls: string[];
  onUrlsChange: (urls: string[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  debug?: boolean; // Add debug mode
}

export function ImageUploader({
  userId,
  imageUrls,
  onUrlsChange,
  maxFiles = 5,
  maxFileSizeMB = 10,
  debug = false,
}: ImageUploaderProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'uploading' | 'success' | 'error'>>({});
  const [error, setError] = useState<string | null>(null);

  const debugLog = (...args: any[]) => {
    if (debug) {
      console.log('[ImageUploader]', ...args);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    debugLog('File change event triggered');
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      debugLog('No files selected');
      return;
    }

    debugLog('Files selected:', files.length, 'User ID:', userId);

    // Reset previous states
    setError(null);
    setUploadProgress({});
    setUploadStatus({});

    // --- Pre-upload checks ---
    if (!userId) {
      const errorMsg = 'You must be logged in to upload images.';
      debugLog('Authentication error:', errorMsg);
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: errorMsg,
      });
      router.push('/login');
      return;
    }
    
    const totalImages = imageUrls.length + files.length;
    if (totalImages > maxFiles) {
      const errorMsg = `You can only upload a maximum of ${maxFiles} images.`;
      debugLog('Too many files:', errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate individual files
    const filesToUpload = Array.from(files).filter(file => {
      debugLog('Validating file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `${file.name} is larger than ${maxFileSizeMB}MB and was not uploaded.`
        });
        return false;
      }
      
      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: `${file.name} is not a supported image format.`
        });
        return false;
      }
      
      return true;
    });

    if (filesToUpload.length === 0) {
      debugLog('No valid files to upload');
      return;
    }
    
    debugLog('Starting upload for', filesToUpload.length, 'files');
    
    // --- Start upload process ---
    setIsUploading(true);

    // Initialize status for each file
    const initialStatus: Record<string, 'uploading' | 'success' | 'error'> = {};
    filesToUpload.forEach(file => {
      initialStatus[file.name] = 'uploading';
    });
    setUploadStatus(initialStatus);

    const uploadPromises = filesToUpload.map(async (file) => {
      try {
        debugLog('Starting upload for file:', file.name);
        
        const url = await uploadImageAndGetURL(file, userId, (progress) => {
          debugLog('Progress for', file.name, ':', progress);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });
        
        debugLog('Upload successful for', file.name, ':', url);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
        
        return { success: true, url, fileName: file.name };
      } catch (err) {
        debugLog('Upload failed for', file.name, ':', err);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        
        return { 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error', 
          fileName: file.name 
        };
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(res => res.success);
      const failedUploads = results.filter(res => !res.success);

      debugLog('Upload results:', { successful: successfulUploads.length, failed: failedUploads.length });

      if (successfulUploads.length > 0) {
        const newUrls = successfulUploads.map(res => res.url as string);
        onUrlsChange([...imageUrls, ...newUrls]);
        toast({
          title: 'Upload Complete',
          description: `${successfulUploads.length} image(s) uploaded successfully.`,
        });
      }

      if (failedUploads.length > 0) {
        const errorDetails = failedUploads.map(f => `${f.fileName}: ${f.error}`).join(', ');
        setError(`${failedUploads.length} image(s) failed to upload: ${errorDetails}`);
        debugLog('Failed uploads:', failedUploads);
      }

    } catch (err) {
      const errorMsg = "An unexpected error occurred during upload.";
      debugLog('Unexpected error:', err);
      setError(errorMsg);
      console.error('[ImageUploader] Unexpected error:', err);
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    debugLog('Removing image at index:', indexToRemove);
    const updatedUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    onUrlsChange(updatedUrls);
  };

  return (
    <div className="space-y-4">
      {debug && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800">Debug Info</h4>
          <p className="text-sm text-blue-700">User ID: {userId || 'Not available'}</p>
          <p className="text-sm text-blue-700">Current images: {imageUrls.length}</p>
          <p className="text-sm text-blue-700">Max files: {maxFiles}</p>
          <p className="text-sm text-blue-700">Max size: {maxFileSizeMB}MB</p>
        </div>
      )}

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
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" 
                  disabled={isUploading} 
                />
              </Label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Up to {maxFiles} images, {maxFileSizeMB}MB per file
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              Supported: PNG, JPEG, GIF, WebP
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-x-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Upload Progress</h4>
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{name}</span>
                <div className="flex items-center gap-2 ml-2">
                  <span>{Math.round(progress)}%</span>
                  {uploadStatus[name] === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {uploadStatus[name] === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {uploadStatus[name] === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
              </div>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          ))}
        </div>
      )}

      {imageUrls.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Uploaded Images ({imageUrls.length})</h4>
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
        </div>
      )}
    </div>
  );
}