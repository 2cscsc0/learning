'use client';

import { useState, useRef, memo } from 'react';

interface PromptFieldProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  onImageUpload?: (file: File) => void;
}

function PromptField({ prompt, setPrompt, onSubmit, isGenerating, onImageUpload }: PromptFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onSubmit();
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onImageUpload) {
      onImageUpload(files[0]);
      // Reset the file input
      e.target.value = '';
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center overflow-hidden p-1 pl-4 border rounded-lg transition-all shadow-sm ${
          isFocused
            ? 'border-border bg-focus'
            : 'border-border bg-primary'
        }`}>
          {onImageUpload && (
            <button 
              type="button"
              onClick={triggerFileUpload}
              className="text-grey5 hover:text-foreground"
              title="Upload image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </button>
          )}
          {onImageUpload && <div className="h-6 border-l border-grey5 mx-4"></div>}
          <input
            type="Text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe what to generate..."
            className={'flex-1 py-2 bg-transparent border-none focus:outline-none text-foreground placeholder:text-grey7 dark:placeholder:text-gray-500'}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`rounded-full p-2 px-3 ml-1 flex items-center justify-center ${
              prompt.trim() && !isGenerating
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-primary text-foreground cursor-not-allowed"
            }`}
            title={isGenerating ? "Generating..." : "Generate"}
          >
            {isGenerating ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </form>
      <div className={'text-xs text-center mt-2 text-grey5 dark:text-grey6'}>
        {isGenerating
          ? "Generating..."
          : "Enter a description to modify the selected area or generate a new image"
        }
      </div>
    </div>
  );
}

export default memo(PromptField);
