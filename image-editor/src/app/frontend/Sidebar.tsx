'use client';

import { useRef, memo } from 'react';

import ThemeSwitcher from './ThemeSwitcher';
import Gallery from './Gallery';
import { Theme } from './Editor';

interface SidebarProps {
  currentImage: string | null;
  setCurrentImage: (image: string | null) => void;
  userImages: string[];
  setUserImages: (images: string[]) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function Sidebar({ currentImage, setCurrentImage, userImages, setUserImages, collapsed, setCollapsed, theme, setTheme }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    
    const handleTransitionEnd = () => {
      setCollapsed(newCollapsedState);
      sidebarRef.current?.removeEventListener('transitionend', handleTransitionEnd);
    };
    
    sidebarRef.current?.addEventListener('transitionend', handleTransitionEnd);
    
    if (sidebarRef.current) {
      sidebarRef.current.classList.toggle('collapsed', newCollapsedState);
      sidebarRef.current.style.width = newCollapsedState ? '3.5rem' : '24rem'; // w-14 = 3.5rem, w-96 = 24rem
    }
  };
  return (
    <div ref={sidebarRef} className={`relative transition-all duration-300 ${collapsed ? "w-14" : "w-96"} h-full rounded-tl-lg bg-primary`}>
      <div className="flex flex-col h-full justify-between pt-4 pb-4">
        <div className="flex-none pl-4">
          <button
            onClick={toggleSidebar}
            title={`${collapsed ? "Expand" : "Collapse"} sidebar`}
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            )}
          </button>
        </div>
        <div className="flex-grow overflow-hidden mt-2">
          <Gallery
            currentImage={currentImage}
            setCurrentImage={setCurrentImage}
            userImages={userImages}
            setUserImages={setUserImages}
            collapsed={collapsed}
          />
        </div>
        <div className="flex-none flex flex-row pt-2 pl-2">
          <button
            onClick={() => alert("Not implemented")}
            className="p-2 rounded-full bg-primary shadow-sm border border-border transition-all hover:shadow-md"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
            <div className="ml-auto pl-5 pr-4">
            <ThemeSwitcher theme={theme} setTheme={setTheme}/>
            </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Sidebar);
