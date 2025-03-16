'use client';

import { useRef, useState } from 'react';

interface NoImagePlaceholderProps {
  onImageUpload: (file: File) => void;
  onGenerate: (prompt: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
}

export default function NoImagePlaceholder({
  onImageUpload,
  onGenerate,
  prompt,
  setPrompt,
  isGenerating,
}: NoImagePlaceholderProps){
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onImageUpload(files[0])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt);
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const file = Array.from(e.dataTransfer.items)[0]
      if (file.kind === "file" && file.type.startsWith("image/")) {
        setIsDraggingOver(true);
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageUpload(file);
      }
    }
  }

  return (
    <div
      className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-8 rounded-xl bg-background_secondary shadow-md border border-border relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    > 
      {isDraggingOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-600 border-dashed rounded-xl flex items-center justify-center z-10">
          <div className="bg-background p-4 rounded-lg shadow-lg flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <p className="text-lg font-medium text-foreground">Drop image to upload</p>
          </div>
        </div>
      )}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-accent_primary to-accent_secondary bg-clip-text text-transparent">Create an Image</h2>
        <p className="text-foreground">
          {isGenerating
            ? "Generating your image, please wait..."
            : "Upload an image or generate one from a prompt"
          }
        </p>
      </div>

      <div className="flex flex-col w-full max-w-md gap-5">
        <form onSubmit={handleSubmit} className="w-full mb-6">
          <div className="flex items-center p-1 pl-4 border rounded-lg transition-all shadow-sm bg-background_secondary border-border focus-within:border-blue-400 focus-within:shadow-md">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe an image to generate..."
              className="flex-1 py-3 bg-transparent focus:outline-none text-foreground"
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border "></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background_secondary text-sm text-foreground ">or</span>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 py-3 px-4 bg-primary border border-border rounded-lg transition-colors ${
            isGenerating
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-hover hover:text-foreground"
          }`}
          disabled={isGenerating}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Upload Image</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isGenerating}
      />
    </div>
  )
}
