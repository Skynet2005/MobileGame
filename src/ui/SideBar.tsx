'use client'

import { useEffect } from 'react';

export default function Sidebar() {
  useEffect(() => {
    console.log('Sidebar component mounted');
  }, []);

  const handleClick = (label: string) => {
    console.log(`Clicked on ${label}`)
    alert(`You clicked on ${label}`)
  }

  return (
    <div className="w-16 flex flex-col items-center py-4 gap-6 bg-transparent">
      {/* Events */}
      <button
        className="flex flex-col items-center text-xs hover:text-yellow-400 text-white/90 transition-colors duration-200"
        onClick={() => handleClick('Events')}
      >
        <span className="text-2xl">📋</span>
        <span className="mt-1">Events</span>
      </button>

      {/* Deals */}
      <button
        className="flex flex-col items-center text-xs hover:text-yellow-400 text-white/90 transition-colors duration-200"
        onClick={() => handleClick('Deals')}
      >
        <span className="text-2xl">🎁</span>
        <span className="mt-1">Deals</span>
      </button>

      {/* Sign-in & Earn It */}
      <button
        className="flex flex-col items-center text-xs hover:text-yellow-400 text-white/90 transition-colors duration-200"
        onClick={() => handleClick('Sign-in & Earn It')}
      >
        <span className="text-2xl">📅</span>
        <span className="mt-1">Sign-in</span>
      </button>

      {/* Fishing Tournament */}
      <button
        className="flex flex-col items-center text-xs hover:text-yellow-400 text-white/90 transition-colors duration-200"
        onClick={() => handleClick('Fishing Tournament')}
      >
        <span className="text-2xl">🐟</span>
        <span className="mt-1">Fishing</span>
      </button>
    </div>
  )
}
