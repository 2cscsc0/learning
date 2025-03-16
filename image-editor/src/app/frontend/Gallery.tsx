'use client';

import { useState, useRef, memo } from 'react';

interface GalleryProps {
  currentImage: string | null;
  setCurrentImage: (image: string | null) => void;
  userImages: string[];
  setUserImages: (images: string[]) => void;
  collapsed: boolean;
}

function Gallery({currentImage, setCurrentImage, userImages, setUserImages, collapsed}: GalleryProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const removeImage = (imageToRemove: string) => {
    setUserImages(userImages.filter(image => image !== imageToRemove));
    if (currentImage === imageToRemove) {
      setCurrentImage(null);
    }
    setOpenMenuId(null);
  };
  
  const toggleMenu = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === index ? null : index);
  };

  return (
    <div className={`overflow-y-auto h-full ${collapsed ? 'w-12' : 'w-full'}`}>
      <div className={`
        ${collapsed 
          ? 'flex flex-col space-y-2' 
          : 'grid grid-cols-2 gap-2'
        } p-2
      `}>
        {userImages.map((image, index) => (
          <div 
            key={index} 
            className={`
              relative group cursor-pointer rounded-md overflow-hidden border-2
              ${currentImage === image ? 'border-accent' : 'border-transparent'}
              transition-all duration-200 aspect-square
            `}
            onClick={() => setCurrentImage(image)}
            onMouseLeave={() => openMenuId === index && setOpenMenuId(null)}
          >
            <img 
              src={image} 
              alt={`Generated image ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            
            {!collapsed && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <button 
                    ref={openMenuId === index ? buttonRef : null}
                    className="bg-white dark:bg-gray-800 rounded-full p-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
                    onClick={(e) => toggleMenu(index, e)}
                    title="Image options"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {openMenuId === index && (
                    <div 
                      ref={menuRef}
                      className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 animate-fade-in"
                      style={{
                        transformOrigin: 'top right',
                        animation: 'fadeIn 0.15s ease-out'
                      }}
                      onMouseLeave={() => setOpenMenuId(null)}
                    >
                      <div className="absolute right-2 -top-1 w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 border-t border-l border-gray-200 dark:border-gray-700"></div>
                      <div className="py-0.5 relative">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {currentImage === image && (
              <div className="absolute inset-0 bg-accent bg-opacity-20 pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>
      {userImages.length === 0 && (
        <div className={`text-center py-4 text-gray-500 ${collapsed ? 'hidden' : ''}`}>
          No images yet
        </div>
      )}
    </div>
  );
}

export default memo(Gallery);
