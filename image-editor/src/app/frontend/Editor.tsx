'use client';

import { useState, useEffect } from 'react';

import PromptField from './PromptField';
import Canvas from './Canvas';
import NoImagePlaceholder from './NoImagePlaceholder';
import Sidebar from './Sidebar';

export type Theme = 'light' | 'dark';
export type Tool = 'lasso' | 'outwardCrop' | 'none';

export default function Editor() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [userImages, setUserImages] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<Tool>('none');
  const [paths, setPaths] = useState<Array<{ x: number, y: number }[]>>([]);
  const [cropHandles, setCropHandles] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setCurrentImage(imageUrl);
      if (!userImages.includes(imageUrl)) {
        setUserImages((prev) => [...prev, imageUrl]);
      }
    }
    reader.readAsDataURL(file);
  }

  const generateLassoMask = (image: string, paths: Array<{ x: number, y: number }[]>): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas to match the original image dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        
        paths.forEach(path => {
          if (path.length > 2) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.closePath();
            ctx.fill();
          }
        });
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject('Failed to load image');
      };
      
      img.src = image;
    });
  }

  const generateCropMask = (image: string, cropHandles: { top: number, right: number, bottom: number, left: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const newWidth = img.width + cropHandles.left + cropHandles.right;
        const newHeight = img.height + cropHandles.top + cropHandles.bottom;
        
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, newWidth, newHeight);
        ctx.fillStyle = 'black';
        ctx.fillRect(cropHandles.left, cropHandles.top, img.width, img.height);

        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject('Failed to load image');
      };
      
      img.src = image;
    });
  }

  const extendImage = (image: string, cropHandles: { top: number, right: number, bottom: number, left: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const newWidth = img.width + cropHandles.left + cropHandles.right;
        const newHeight = img.height + cropHandles.top + cropHandles.bottom;
        
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, newWidth, newHeight);
        ctx.drawImage(img, cropHandles.left, cropHandles.top, img.width, img.height);

        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject('Failed to load image');
      };
      
      img.src = image;
    });
  }

  const generateImage = async (promptText: string) => {
    if(!promptText.trim()) {
      //TODO: show that prompt is required
      return;
    }

    try {
      setPrompt(promptText);
      setIsGenerating(true);

      const formData = new FormData();
      formData.append('prompt', promptText);
      formData.append('model', 'black-forest-labs/FLUX.1-schnell-Free');

      if (currentImage && selectedTool === "lasso") {
        const mask = await generateLassoMask(currentImage, paths);
        // Convert image to JPEG format
        const convertToJpeg = (dataUrl: string): Promise<string> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject('Could not get canvas context');
                return;
              }
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = () => reject('Failed to load image');
            img.src = dataUrl;
          });
        };

        const jpegImage = await convertToJpeg(currentImage);
        formData.append("image", jpegImage);
        formData.append('mask', mask);
      } else if (currentImage && selectedTool === "outwardCrop") {
        const extendedImage = await extendImage(currentImage, cropHandles);
        const mask = await generateCropMask(currentImage, cropHandles);
        formData.append("image", extendedImage);
        formData.append('mask', mask);
      }

      const response = await fetch(`${window.location.origin}/api/gen`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json();

      if (!data.image || data.image.length === 0) {
        throw new Error('No image data returned from API');
      }

      const rawImage = data.image;

      if (!rawImage || typeof rawImage !== 'string') {
        throw new Error('Invalid image data format');
      }

      let imageUrl: string = `data:image/png;base64,${rawImage}`;

      const testImg = new Image();

      const imageLoadPromise = new Promise<string>((resolve, reject) => {
        testImg.onload = () => {
          console.log("Image loaded successfully, dimensions:", testImg.width, "x", testImg.height);
          resolve(imageUrl);
        };

        testImg.onerror = (err) => {
          console.error("Error loading image:", err);
          reject(new Error("Failed to load image"));
        };

        testImg.src = imageUrl;
      });

      const validImageUrl = await imageLoadPromise;

      setCurrentImage(validImageUrl);

      if (!userImages.includes(validImageUrl)) {
        setUserImages((prev) => [...prev, validImageUrl]);
      }
    } catch (error) {
      console.error("Error generating image from API:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className="flex flex-col h-screen transition-colors">
      <header className="flex justify-between items-center p-3">
      </header>
      <main className="flex-1 flex flex-row overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center px-4">
            {currentImage ? (
              <Canvas
                imageUrl={currentImage}
                paths={paths}
                setPaths={setPaths}
                cropHandles={cropHandles}
                setCropHandles={setCropHandles}
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                onImageUpload={handleImageUpload}
                sideBarCollapsed={sidebarCollapsed}
              />
            ) : (
              <NoImagePlaceholder
                onImageUpload={handleImageUpload}
                onGenerate={generateImage}
                prompt={prompt}
                setPrompt={setPrompt}
                isGenerating={isGenerating}
              />
            )}
          </div>
          {currentImage && (
            <div className="px-4 bg-background">
              <PromptField
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={() => generateImage(prompt)}
                isGenerating={isGenerating}
                onImageUpload={handleImageUpload}
              />
            </div>
          )}
        </div>
        <div>
          <Sidebar
            currentImage={currentImage}
            setCurrentImage={setCurrentImage}
            userImages={userImages}
            setUserImages={setUserImages}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            theme={theme}
            setTheme={setTheme}
          />
        </div>
      </main>
    </div>
  )
}
