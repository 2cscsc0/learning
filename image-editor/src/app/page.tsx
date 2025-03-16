'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('./frontend/Editor'));

export default function Home() {
  return (
    <main className="min-h-screen">
      <Editor />
    </main>
  )
}