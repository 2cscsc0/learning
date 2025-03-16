'use client';

import { useRef, useEffect, useState, SetStateAction } from 'react';
import { Tool } from './Editor';

interface CanvasProps {
  imageUrl: string;
  paths: Array<{ x: number, y: number }[]>;
  setPaths: (value: SetStateAction<{ x: number; y: number; }[][]>) => void
  cropHandles: { top: number; right: number; bottom: number; left: number; };
  setCropHandles: (value: SetStateAction<{ top: number; right: number; bottom: number; left: number; }>) => void
  selectedTool: Tool;
  setSelectedTool: (value: SetStateAction<Tool>) => void;
  onImageUpload: (file: File) => void;
  sideBarCollapsed: boolean; 
}

export default function Canvas({imageUrl, paths, cropHandles, setCropHandles, setPaths, selectedTool, setSelectedTool, onImageUpload, sideBarCollapsed}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  //const [selectedTool, setSelectedTool] = useState<Tool>('none');
  //const [paths, setPaths] = useState<Array<{ x: number, y: number }[]>>([]);
  //const [cropHandles, setCropHandles] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMiddleMouseDragging, setIsMiddleMouseDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [cropActive, setCropActive] = useState<boolean>(false);
  const [savedCropHandles, setSavedCropHandles] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [activeCropHandle, setActiveCropHandle] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState<boolean>(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.items.length > 0) {
      const file = e.dataTransfer.items[0];
      if (file.kind === "file" && file.type.startsWith("image/")) {
        setIsDraggingOver(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageUpload(file);
      }
    }
  };

  const calculateCanvasSize = (imgWidth: number, imgHeight: number) => {
    const maxWidth = 900;
    const maxHeight = 600;

    let newWidth = imgWidth;
    let newHeight = imgHeight;
    let newScale = 1;

    if (imgWidth > maxWidth || imgHeight > maxHeight) {
      const widthRatio = maxWidth / imgWidth;
      const heightRatio = maxHeight / imgHeight;

      newScale = Math.min(widthRatio, heightRatio);
      newWidth = imgWidth * newScale;
      newHeight = imgHeight * newScale;
    }

    if (imgWidth < 200 && imgHeight < 200) {
      newScale = Math.min(200 / imgWidth, 200 / imgHeight);
      newWidth = imgWidth * newScale;
      newHeight = imgHeight * newScale;
    }
    return { width: newWidth, height: newHeight, scale: newScale };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setImageLoaded(false);
    setCropActive(false);
    setCropHandles({ top: 0, right: 0, bottom: 0, left: 0 });
    setActiveCropHandle(null);
    setSavedCropHandles({ top: 0, right: 0, bottom: 0, left: 0 });

    setSelectedTool('none');
    setCropHandles({ top: 0, right: 0, bottom: 0, left: 0 });
    setPaths([]);

    const img = new Image();
    imageRef.current = img;
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const { width, height, scale: newScale} = calculateCanvasSize(img.width, img.height);

      const container = containerRef.current;
      let canvasWidth = width;
      let canvasHeight = height;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        canvasWidth = containerRect.width;
        canvasHeight = containerRect.height;
      }
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      setCanvasSize({width: canvasWidth, height: canvasHeight});

      setScale(newScale);

      const centerPosition = {
        x: (canvasWidth - img.width * newScale) / 2,
        y: (canvasHeight - img.height * newScale) / 2
      };

      setPosition(centerPosition);

      setImageLoaded(true);
    }
  }, [imageUrl]);

  const updateCanvasSize = () => {
    if (!imageLoaded || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const oldCanvasSize = canvasSize;

    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    setCanvasSize({ width: containerRect.width, height: containerRect.height });

    if (imageRef.current) {
      const newPosition = {
        x: canvas.width * position.x / oldCanvasSize.width,
        y: canvas.height * position.y / oldCanvasSize.height
      }
      setPosition(newPosition);
    }
    renderCanvas();
  };

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    }
  }, [imageLoaded, scale, position]);

  useEffect(() => {
    updateCanvasSize();
  }, [sideBarCollapsed]);


  useEffect(() => {
    if (selectedTool === 'outwardCrop') {
      setCropActive(true);
      setCropHandles(savedCropHandles);
    } else {
      if (cropActive) {
        setSavedCropHandles(cropHandles);
      }
      setCropActive(false);
    }
  }, [selectedTool]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);

    if (cropActive) {
      const { top, right, bottom, left } = cropHandles;
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.fillRect(-left, -top, img.width + left + right, img.height + top + bottom);

      ctx.drawImage(img, 0, 0);

      drawCropHandles(ctx, img.width, img.height);
    } else {
      ctx.drawImage(img, 0, 0);
    }

    drawPaths(ctx);
    ctx.restore();
  };

  const drawCropHandles = (ctx: CanvasRenderingContext2D, imgWidth: number, imgHeight: number) => {
    const { top, right, bottom, left } = cropHandles;
    const handleSize = 14 / scale;

    ctx.lineWidth = 2 / scale;
    ctx.strokeStyle = '#AAAAAA';
    ctx.strokeRect(-left, -top, imgWidth + left + right, imgHeight + top + bottom);

    const drawHandle = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, handleSize/2, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#666666';
      ctx.stroke();
    }
    // Corner handles
    drawHandle(-left, -top); // Top-left
    drawHandle(imgWidth + right, -top); // Top-right
    drawHandle(imgWidth + right, imgHeight + bottom); // Bottom-right
    drawHandle(-left, imgHeight + bottom); // Bottom-left
    
    // Middle handles
    drawHandle(imgWidth/2, -top); // Top-middle
    drawHandle(imgWidth + right, imgHeight/2); // Right-middle
    drawHandle(imgWidth/2, imgHeight + bottom); // Bottom-middle
    drawHandle(-left, imgHeight/2); // Left-middle
  };

  useEffect(() => {
    if (!imageLoaded) return;
    renderCanvas();
  }, [position, scale, paths, imageLoaded, cropActive, cropHandles, canvasSize]);

  const drawPaths = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2/scale;

    for (const path of paths) {
      if (path.length < 2) continue;
      ctx.beginPath();

      if (selectedTool === 'lasso' || path.length > 10) {
        ctx.setLineDash([5/scale, 3/scale]);

        ctx.moveTo(path[0].x, path[0].y);

        if (path.length > 2) {
          for (let i = 0; i < path.length - 2; i++) {
            const xc = (path[i].x + path[i + 1].x) / 2;
            const yc = (path[i].y + path[i + 1].y) / 2;
            ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
          }

          const lastIndex = path.length - 1;
          ctx.quadraticCurveTo(
            path[lastIndex - 1].x,
            path[lastIndex - 1].y,
            path[lastIndex].x,
            path[lastIndex].y
          );
        } else {
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
        }

        if (path.length > 2) {
          ctx.closePath();

          ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
          ctx.fill();
        }
      } else {
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    //e.preventDefault();
    
    let newScale = scale;
    if (e.deltaY < 0) {
      newScale = Math.min(scale * 1.1, 5); // Maximum zoom 5x
    } else {
      newScale = Math.max(scale * 0.9, 0.1); // Minimum zoom 0.2x
    }
    
    if (newScale !== scale) {
      // Get cursor position relative to canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const imageX = (mouseX - position.x) / scale;
      const imageY = (mouseY - position.y) / scale;
      
      const newPositionX = mouseX - imageX * newScale;
      const newPositionY = mouseY - imageY * newScale;
      
      setScale(newScale);
      setPosition({ x: newPositionX, y: newPositionY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMouseDownPos({ x: mouseX, y: mouseY });
    setHasMoved(false);
    
    if (e.button === 1) {
      setIsMiddleMouseDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      return;
    }
    
    if (cropActive) {
      const handle = detectCropHandle(mouseX, mouseY);
      if (handle) {
        setActiveCropHandle(handle);
        setCropDragStart({ x: mouseX, y: mouseY });
        return;
      }
    }
    
    if (selectedTool === 'none') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      return;
    }
    
    setIsDrawing(true);
    
    const x = (mouseX - position.x) / scale;
    const y = (mouseY - position.y) / scale;
    
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const movementThreshold = 3; // pixels
    if (isDragging || isMiddleMouseDragging || activeCropHandle || isDrawing) {
      const deltaX = Math.abs(mouseX - mouseDownPos.x);
      const deltaY = Math.abs(mouseY - mouseDownPos.y);
      if (deltaX > movementThreshold || deltaY > movementThreshold) {
        setHasMoved(true);
      }
    }
    
    if (cropActive && !activeCropHandle) {
      const handle = detectCropHandle(mouseX, mouseY);
      if (handle) {
        if (handle === 'topLeft' || handle === 'bottomRight') {
          canvas.style.cursor = 'nwse-resize';
        } else if (handle === 'topRight' || handle === 'bottomLeft') {
          canvas.style.cursor = 'nesw-resize';
        } else if (handle === 'middleLeft' || handle === 'middleRight') {
          canvas.style.cursor = 'ew-resize';
        } else if (handle === 'topMiddle' || handle === 'bottomMiddle') {
          canvas.style.cursor = 'ns-resize';
        } else {
          canvas.style.cursor = 'default';
        }
      } else {
        canvas.style.cursor = 'default';
      }
    }
    
    if (activeCropHandle && cropActive && imageRef.current) {
      const img = imageRef.current;
      const deltaX = (mouseX - cropDragStart.x) / scale;
      const deltaY = (mouseY - cropDragStart.y) / scale;
      
      const newCropHandles = { ...cropHandles };
      
      if (activeCropHandle === 'topLeft' || activeCropHandle === 'middleLeft' || activeCropHandle === 'bottomLeft') {
        newCropHandles.left = Math.min(
          Math.max(cropHandles.left - deltaX, 0),
          512
        );
      }
      if (activeCropHandle === 'topRight' || activeCropHandle === 'middleRight' || activeCropHandle === 'bottomRight') {
        newCropHandles.right = Math.min(
          Math.max(cropHandles.right + deltaX, 0),
          512
        );
      }
      if (activeCropHandle === 'topLeft' || activeCropHandle === 'topMiddle' || activeCropHandle === 'topRight') {
        newCropHandles.top = Math.min(
          Math.max(cropHandles.top - deltaY, 0),
          512
        );
      }
      if (activeCropHandle === 'bottomLeft' || activeCropHandle === 'bottomMiddle' || activeCropHandle === 'bottomRight') {
        newCropHandles.bottom = Math.min(
          Math.max(cropHandles.bottom + deltaY, 0),
          512
        );
      }
      
      setCropHandles(newCropHandles);
      setCropDragStart({ x: mouseX, y: mouseY });
      return;
    }
    
    if (isDragging || isMiddleMouseDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      
      if (imageRef.current) {
        const img = imageRef.current;
        const containerWidth = canvasSize.width;
        const containerHeight = canvasSize.height;
        const scaledImgWidth = img.width * scale;
        const scaledImgHeight = img.height * scale;
        
        const minVisiblePixels = 50;
        
        const minX = -scaledImgWidth + minVisiblePixels;
        const maxX = containerWidth - minVisiblePixels;
        const minY = -scaledImgHeight + minVisiblePixels;
        const maxY = containerHeight - minVisiblePixels;
        
        newPosition.x = Math.min(Math.max(newPosition.x, minX), maxX);
        newPosition.y = Math.min(Math.max(newPosition.y, minY), maxY);
      }
      
      setPosition(newPosition);
      return;
    }
    
    if (!isDrawing || selectedTool === 'none' || cropActive) return;
    
    const x = (mouseX - position.x) / scale;
    const y = (mouseY - position.y) / scale;
    
    setCurrentPath((prev) => [...prev, { x, y }]);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);
    
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }
    
    drawPaths(ctx);
    
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2 / scale;
    
    if (selectedTool === 'lasso') {
      ctx.setLineDash([5 / scale, 3 / scale]);
    }
    
    ctx.beginPath();
    
    if (selectedTool === 'lasso' && currentPath.length > 2) {
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 0; i < currentPath.length - 2; i++) {
        const xc = (currentPath[i].x + currentPath[i + 1].x) / 2;
        const yc = (currentPath[i].y + currentPath[i + 1].y) / 2;
        ctx.quadraticCurveTo(currentPath[i].x, currentPath[i].y, xc, yc);
      }
      
      const lastIndex = currentPath.length - 1;
      ctx.quadraticCurveTo(
        currentPath[lastIndex - 1].x, 
        currentPath[lastIndex - 1].y, 
        currentPath[lastIndex].x, 
        currentPath[lastIndex].y
      );
      
      if (currentPath.length > 3) {
        const tempPath = new Path2D();
        tempPath.moveTo(currentPath[0].x, currentPath[0].y);
        
        for (let i = 0; i < currentPath.length - 2; i++) {
          const xc = (currentPath[i].x + currentPath[i + 1].x) / 2;
          const yc = (currentPath[i].y + currentPath[i + 1].y) / 2;
          tempPath.quadraticCurveTo(currentPath[i].x, currentPath[i].y, xc, yc);
        }
        
        const lastIdx = currentPath.length - 1;
        tempPath.quadraticCurveTo(
          currentPath[lastIdx - 1].x, 
          currentPath[lastIdx - 1].y, 
          currentPath[lastIdx].x, 
          currentPath[lastIdx].y
        );
        
        tempPath.closePath();
        
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.fill(tempPath);
      }
    } else {
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
    if (activeCropHandle) {
      setActiveCropHandle(null);
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    
    if (isMiddleMouseDragging) {
      setIsMiddleMouseDragging(false);
      return;
    }
    
    if (!isDrawing || selectedTool === 'none') return;
    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath([]);
    }
  };
  
  const clearPaths = () => {
    setPaths([]);
  };

  const resetCrop = () => {
    const resetHandles = { top: 0, right: 0, bottom: 0, left: 0 };
    setCropHandles(resetHandles);
    setSavedCropHandles(resetHandles);
  };
  
  const isPointOnImage = (x: number, y: number) => {
    if (!imageRef.current) return false;
    
    const imageX = (x - position.x) / scale;
    const imageY = (y - position.y) / scale;
    
    return (
      imageX >= 0 && 
      imageX <= imageRef.current.width && 
      imageY >= 0 && 
      imageY <= imageRef.current.height
    );
  };

  const isPointInCropArea = (x: number, y: number) => {
    if (!imageRef.current || !cropActive) return false;
    
    const imageX = (x - position.x) / scale;
    const imageY = (y - position.y) / scale;
    
    const imgWidth = imageRef.current.width;
    const imgHeight = imageRef.current.height;
    
    const left = -cropHandles.left;
    const top = -cropHandles.top;
    const right = imgWidth + cropHandles.right;
    const bottom = imgHeight + cropHandles.bottom;
    
    return (
      imageX >= left && 
      imageX <= right && 
      imageY >= top && 
      imageY <= bottom
    );
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (cropActive) {
      const handle = detectCropHandle(mouseX, mouseY);
      if (!handle && !isPointInCropArea(mouseX, mouseY) && !isPointInCropArea(mouseDownPos.x, mouseDownPos.y)) {
        setSelectedTool('none');
        return;
      }
    }
    
    if (selectedTool !== 'none' || cropActive || hasMoved) return;
    
    if (isPointOnImage(mouseX, mouseY)) {
      setSelectedTool('outwardCrop');
    }
    
    setHasMoved(false);
  };
  
  const detectCropHandle = (x: number, y: number) => {
    if (!cropActive || !imageRef.current) return null;
    
    const img = imageRef.current;
    const { top, right, bottom, left } = cropHandles;
    const handleSize = 15 / scale;
    
    const imageX = (x - position.x) / scale;
    const imageY = (y - position.y) / scale;
    
    // Top-left
    if (
      Math.abs(imageX - (-left)) < handleSize &&
      Math.abs(imageY - (-top)) < handleSize
    ) {
      return 'topLeft';
    }
    
    // Top-middle
    if (
      Math.abs(imageX - (img.width/2)) < handleSize &&
      Math.abs(imageY - (-top)) < handleSize
    ) {
      return 'topMiddle';
    }
    
    // Top-right
    if (
      Math.abs(imageX - (img.width + right)) < handleSize &&
      Math.abs(imageY - (-top)) < handleSize
    ) {
      return 'topRight';
    }
    
    // Middle-right
    if (
      Math.abs(imageX - (img.width + right)) < handleSize &&
      Math.abs(imageY - (img.height/2)) < handleSize
    ) {
      return 'middleRight';
    }
    
    // Bottom-right
    if (
      Math.abs(imageX - (img.width + right)) < handleSize &&
      Math.abs(imageY - (img.height + bottom)) < handleSize
    ) {
      return 'bottomRight';
    }
    
    // Bottom-middle
    if (
      Math.abs(imageX - (img.width/2)) < handleSize &&
      Math.abs(imageY - (img.height + bottom)) < handleSize
    ) {
      return 'bottomMiddle';
    }
    
    // Bottom-left
    if (
      Math.abs(imageX - (-left)) < handleSize &&
      Math.abs(imageY - (img.height + bottom)) < handleSize
    ) {
      return 'bottomLeft';
    }
    
    // Middle-left
    if (
      Math.abs(imageX - (-left)) < handleSize &&
      Math.abs(imageY - (img.height/2)) < handleSize
    ) {
      return 'middleLeft';
    }
    
    return null;
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center w-full h-full">
      <div
        className="relative w-full h-full overflow-hidden border border-border rounded-lg shadow-md"
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-600 border-dashed rounded-xl flex items-center justify-center z-20">
            <div className="bg-background p-4 rounded-lg shadow-lg flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <p className="text-lg font-medium text-foreground">Drop image to replace</p>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: isDragging || isMiddleMouseDragging ? 'move' : 'defautlt' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        />
        { /* Floating toolbar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background_secondary rounded-full shadow-lg p-1 flex items-center gap-1">
          {/* Tools */}
          <button
            onClick={() => setSelectedTool('none')}
            className={`p-2 rounded-full text-foreground ${
              selectedTool === 'none' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-hover'
            }`}
            title="Move"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52z"/>
            </svg>
          </button>
          
          <button 
            onClick={() => setSelectedTool('lasso')}
            className={`p-2 rounded-full text-foreground ${
              selectedTool === 'lasso' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-hover'
            }`}
            title="Lasso Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" height="20" viewBox="0 0 20 20" width="20">
              <g fill="currentColor">
                <path d="m8.16234 2.21224c.59078-.13892 1.20614-.21224 1.83766-.21224.6315 0 1.2469.07332 1.8377.21224.4032.09482.6532.49855.5584.90177-.0948.40321-.4986.65322-.9018.55841-.4791-.11265-.9792-.17242-1.4943-.17242-.51508 0-1.01525.05977-1.4943.17242-.40322.09481-.80695-.1552-.90177-.55841-.09481-.40322.15519-.80695.55841-.90177z"/>
                <path d="m6.82518 3.4372c.21812.35213.10948.81441-.24265 1.03253-.8571.53091-1.58189 1.2557-2.1128 2.1128-.21812.35213-.6804.46077-1.03253.24265s-.46077-.6804-.24265-1.03253c.65299-1.0542 1.5439-1.94511 2.5981-2.5981.35213-.21812.81441-.10948 1.03253.24265z"/>
                <path d="m13.1748 3.4372c.2181-.35213.6804-.46077 1.0326-.24265 1.0541.65299 1.9451 1.5439 2.5981 2.5981.2181.35213.1094.81441-.2427 1.03253s-.8144.10948-1.0325-.24265c-.5309-.8571-1.2557-1.58189-2.1128-2.1128-.3522-.21812-.4608-.6804-.2427-1.03253z"/>
                <path d="m3.11401 7.60393c.40321.09482.65322.49855.55841.90177-.11265.47905-.17242.97922-.17242 1.4943 0 .5151.05977 1.0152.17242 1.4943.09481.4032-.1552.807-.55841.9018-.40322.0948-.80695-.1552-.90177-.5584-.13892-.5908-.21224-1.2062-.21224-1.8377 0-.63152.07332-1.24688.21224-1.83766.09482-.40322.49855-.65323.90177-.55841z"/>
                <path d="m16.886 7.60393c.4032-.09481.8069.15519.9018.55841.1389.59078.2122 1.20614.2122 1.83766 0 .6315-.0733 1.2469-.2122 1.8377-.0949.4032-.4986.6532-.9018.5584s-.6532-.4986-.5584-.9018c.1126-.4791.1724-.9792.1724-1.4943 0-.51508-.0598-1.01525-.1724-1.4943-.0948-.40322.1552-.80695.5584-.90177z"/>
                <path d="m3.4372 13.1748c.35213-.2181.81441-.1095 1.03253.2427.53091.8571 1.2557 1.5819 2.1128 2.1128.35213.2181.46077.6804.24265 1.0325s-.6804.4608-1.03253.2427c-1.0542-.653-1.94511-1.544-2.5981-2.5981-.21812-.3522-.10948-.8145.24265-1.0326z"/>
                <path d="m17.1103 14.4359c.2407-.337.1626-.8055-.1744-1.0462s-.8054-.1624-1.0462.1744l-.0027.0036-.0167.0225c-.0157.0211-.0406.0539-.0743.0968-.0675.0859-.1698.2117-.3041.3641-.2454.2785-.5936.6417-1.0267 1.0114-1.0173-.7288-2.34-1.3125-3.9652-1.3125-.7525 0-1.38802.2438-1.84051.677-.44759.4286-.67193 1.002-.67194 1.573s.22432 1.1444.67191 1.573c.45247.4332 1.08798.677 1.84054.677 1.5318 0 2.868-.5843 3.9147-1.274.0184.0181.0367.0362.0548.0543.4571.4571.8016.9162 1.0312 1.2607.1144.1716.1992.313.2541.4092.0274.048.0473.0846.0597.1078l.0129.0245.0013.0026c-.1513-.2664.0008.0016.0008.0016.1857.3695.6355.5191 1.0056.3341.3704-.1851.5206-.6354.3356-1.0059.1889.3778.0002.0004-.0007-.0015l-.0009-.0016-.0021-.0043-.0066-.0129c-.0055-.0105-.0129-.0247-.0223-.0424-.0189-.0354-.0458-.0848-.0809-.1461-.0701-.1226-.1728-.2937-.3084-.4971-.2565-.3848-.6348-.8917-1.1367-1.4064.4184-.3721.7575-.7286 1.0053-1.01.1548-.1757.2751-.3233.358-.4288.0415-.0529.0737-.0952.0963-.1254l.0266-.036.0078-.0108.0026-.0035zm-6.6103.8141c1.0274 0 1.9102.3037 2.6501.7426-.7844.4437-1.6826.7574-2.6501.7574-.4225 0-.66816-.1312-.80316-.2605-.13989-.1339-.20929-.3105-.20929-.4895s.06941-.3556.20931-.4895c.13501-.1293.38074-.2605.80314-.2605z"/>
              </g>
            </svg>
          </button>

          <button 
            onClick={() => setSelectedTool('outwardCrop')}
            className={`p-2 rounded-full text-foreground ${
              selectedTool === 'outwardCrop' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-hover'
            }`}
            title="Outward Crop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2M0 2a2 2 0 0 1 3.937-.5h8.126A2 2 0 1 1 14.5 3.937v8.126a2 2 0 1 1-2.437 2.437H3.937A2 2 0 1 1 1.5 12.063V3.937A2 2 0 0 1 0 2m2.5 1.937v8.126c.703.18 1.256.734 1.437 1.437h8.126a2 2 0 0 1 1.437-1.437V3.937A2 2 0 0 1 12.063 2.5H3.937A2 2 0 0 1 2.5 3.937M14 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m12 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
            </svg>
          </button>

          {/* Conditional separator before tool-specific buttons */}
          {(selectedTool !== 'none' || cropActive) && (
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
          )}

          {/* Tool-specific buttons */}
          {/* Outward crop reset button */}
          {selectedTool === 'outwardCrop' && cropActive && (
            <button 
              onClick={resetCrop}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              title="Reset Crop"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Lasso tool buttons */}
          {selectedTool === 'lasso' && (
            <>
              <button 
                onClick={() => {
                  // Here you would implement undo functionality
                  // For now, just clear the last path as a simple "undo"
                  if (paths.length > 0) {
                    setPaths(paths.slice(0, -1));
                  }
                }}
                className={`p-2 rounded-full ${
                  paths.length > 0 ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                disabled={paths.length === 0}
                title="Undo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  // Here you would implement redo functionality
                  // For demonstration, this is just a placeholder
                  alert('Redo functionality would be implemented here');
                }}
                className="p-2 rounded-full text-gray-400 dark:text-gray-600 cursor-not-allowed"
                disabled={true} // Enable when redo history is available
                title="Redo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
              </button>
              
              {/* Reset button for lasso tool */}
              <button 
                onClick={clearPaths}
                className={`p-2 rounded-full ${
                  paths.length > 0 ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                disabled={paths.length === 0}
                title="Reset Selections"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
