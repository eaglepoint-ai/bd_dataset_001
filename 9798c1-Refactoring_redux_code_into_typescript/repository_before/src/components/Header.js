import React from 'react';
import { useSelector } from 'react-redux';

const Header = () => {
  const betData = useSelector((state) => state.bet.betData);
  const betCount = Object.keys(betData || {}).length;

  return (
    <header className="bg-midnight-900/80 backdrop-blur-xl border-b border-midnight-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-lime to-neon-cyan rounded-xl flex items-center justify-center shadow-lg shadow-neon-lime/20">
                <span className="text-midnight-950 font-bold text-lg">B</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full animate-pulse-slow" />
            </div>
            <div>
              <h1 className="font-outfit font-bold text-xl text-white tracking-tight">
                Bet<span className="text-neon-lime">Slip</span>
              </h1>
              <p className="text-midnight-400 text-xs font-medium tracking-wide">REDUX DEMO</p>
            </div>
          </div>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-midnight-300 hover:text-white transition-colors font-medium text-sm">
              Live
            </a>
            <a href="#" className="text-midnight-300 hover:text-white transition-colors font-medium text-sm">
              Sports
            </a>
            <a href="#" className="text-white font-medium text-sm relative">
              Matches
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-neon-lime rounded-full" />
            </a>
          </nav>

          {/* Bet count badge */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="px-4 py-2 bg-midnight-800/80 border border-midnight-600/50 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 text-neon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-white font-mono font-medium text-sm">{betCount}</span>
              </div>
              {betCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-lime rounded-full animate-bounce-light" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
