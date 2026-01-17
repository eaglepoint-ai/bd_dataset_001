import React from 'react';
import BetSlip from './components/BetSlip';
import MatchList from './components/MatchList';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-midnight-950 bg-grid-pattern bg-[size:40px_40px] relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 bg-gradient-radial from-midnight-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Match selection area */}
            <div className="lg:col-span-2">
              <MatchList />
            </div>
            
            {/* Bet slip sidebar */}
            <div className="lg:col-span-1">
              <BetSlip />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;