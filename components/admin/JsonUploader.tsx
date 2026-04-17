"use client";

import React, { useState } from 'react';
import { ZodSchema } from 'zod';
import { toast } from 'sonner';

interface JsonUploaderProps {
  mode: 'brain-ring' | 'zakovat' | 'kahoot' | 'erudit';
  schema: ZodSchema<any>;
}

export function JsonUploader({ mode, schema }: JsonUploaderProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors([]);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        
        const parseResult = schema.safeParse(json);
        if (!parseResult.success) {
          const formattedErrors = parseResult.error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
          setErrors(formattedErrors);
          return;
        }

        setIsUploading(true);
        const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8080/api/admin/upload-questions';
        
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, data: parseResult.data })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload failed');
        }

        toast.success(`${mode} questions uploaded successfully!`);
      } catch (err: any) {
        setErrors([err.message || 'An unexpected error occurred']);
        toast.error('Upload failed');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-6 border rounded-xl shadow-sm space-y-4 bg-white text-black">
      <h3 className="text-xl font-bold capitalize">{mode.replace('-', ' ')} Uploader</h3>
      
      <input 
        type="file" 
        accept=".json" 
        onChange={handleFileChange}
        disabled={isUploading}
        className="block w-full text-sm text-gray-700
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100 cursor-pointer"
      />

      {isUploading && <p className="text-sm text-blue-600 animate-pulse font-medium">Uploading...</p>}

      {errors.length > 0 && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mt-4 border border-red-200">
          <p className="font-semibold mb-2">Validation Errors:</p>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
