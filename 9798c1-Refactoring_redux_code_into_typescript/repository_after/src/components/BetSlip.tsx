import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { deleteBetSlip, clearBetSlip, handleBet } from '../redux/actions';
import { Bet, BetResponse, BetSelection } from '../redux/types';
import { isBetResponse } from '../redux/types';

const BetSlip: React.FC = () => {
  const dispatch = useAppDispatch();
  // Narrow selectors: only select specific properties, not entire state
  const betData = useAppSelector((state) => state.bet.betData);
  const betResponse = useAppSelector((state) => state.bet.res);
  const [stake, setStake] = useState<number>(10);
  
  // Type-safe array of bets from the dictionary
  // Use optional chaining/nullish coalescing for potentially undefined betData
  const bets: Bet[] = Object.values(betData ?? {});
  const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWin = (stake * totalOdds).toFixed(2);

  const handleRemoveBet = (id: string): void => {
    dispatch(deleteBetSlip(id));
  };

  const handleClearAll = (): void => {
    dispatch(clearBetSlip());
  };

  const handlePlaceBet = (): void => {
    const betPayload: {
      bets: Bet[];
      stake: number;
      totalOdds: string;
      potentialWin: string;
    } = {
      bets: bets,
      stake: stake,
      totalOdds: totalOdds.toFixed(2),
      potentialWin: potentialWin
    };
    dispatch(handleBet(betPayload));
  };

  const getSelectionDisplay = (selection: BetSelection): string => {
    switch (selection) {
      case 'home': return 'Home Win';
      case 'draw': return 'Draw';
      case 'away': return 'Away Win';
      default: {
        const _exhaustiveCheck: never = selection;
        return _exhaustiveCheck;
      }
    }
  };

  // Type-safe access to betResponse with type guard validation
  // Use optional chaining for safe property access
  const validatedResponse: BetResponse | null = 
    betResponse && 
    Object.keys(betResponse).length > 0 && 
    isBetResponse(betResponse)
      ? betResponse
      : null;

  return (
    <div className="bg-midnight-900/80 backdrop-blur-xl border border-midnight-700/40 rounded-2xl overflow-hidden sticky top-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-midnight-800/80 to-midnight-900/80 px-5 py-4 border-b border-midnight-700/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-orange to-neon-pink rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Bet Slip</h3>
              <p className="text-midnight-400 text-xs">{bets.length} selection{bets.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {bets.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-midnight-400 hover:text-neon-pink transition-colors text-xs font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Bet items */}
      <div className="max-h-80 overflow-y-auto">
        {bets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-midnight-800/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-midnight-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-midnight-400 text-sm mb-2">Your bet slip is empty</p>
            <p className="text-midnight-500 text-xs">Click on odds to add selections</p>
          </div>
        ) : (
          <div className="divide-y divide-midnight-700/30">
            {bets.map((bet, index) => (
              <div 
                key={bet.id} 
                className="p-4 hover:bg-midnight-800/30 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {bet.homeTeam} vs {bet.awayTeam}
                    </p>
                    <p className="text-midnight-400 text-xs mt-1">
                      {getSelectionDisplay(bet.selection)}
                    </p>
                    <p className="text-midnight-500 text-xs mt-0.5">
                      {bet.league} • {bet.date} {bet.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-lime font-mono font-semibold text-sm">
                      {bet.odds.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveBet(bet.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-midnight-800/60 hover:bg-neon-pink/20 text-midnight-400 hover:text-neon-pink transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with totals and place bet */}
      {bets.length > 0 && (
        <div className="border-t border-midnight-700/40 p-5 bg-gradient-to-b from-midnight-900/50 to-midnight-950/80">
          {/* Stake input */}
          <div className="mb-4">
            <label className="text-midnight-400 text-xs font-medium mb-2 block">
              Stake Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-400 font-medium">$</span>
              <input
                type="number"
                value={stake}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                  const value: number = parseFloat(e.target.value);
                  setStake(isNaN(value) ? 0 : Math.max(0, value));
                }}
                className="w-full bg-midnight-800/60 border border-midnight-600/40 rounded-xl py-3 px-8 text-white font-mono text-center focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/20 transition-all"
                min="0"
                step="5"
              />
            </div>
            {/* Quick stake buttons */}
            <div className="flex gap-2 mt-2">
              {[5, 10, 25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setStake(amount)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stake === amount
                      ? 'bg-neon-lime/20 text-neon-lime border border-neon-lime/30'
                      : 'bg-midnight-800/40 text-midnight-400 border border-midnight-700/30 hover:text-white hover:border-midnight-600/50'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-midnight-400">Total Odds</span>
              <span className="text-white font-mono font-semibold">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-midnight-400 text-sm">Potential Win</span>
              <span className="text-neon-lime font-mono font-bold text-lg">${potentialWin}</span>
            </div>
          </div>

          {/* Place bet button */}
          <button
            onClick={handlePlaceBet}
            className="w-full bg-gradient-to-r from-neon-lime to-neon-cyan text-midnight-950 font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-neon-lime/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Place Bet
          </button>

          {/* API Response with type-safe access */}
          {validatedResponse && (
            <div className="mt-4 p-3 bg-midnight-800/60 rounded-xl border border-midnight-600/30">
              <p className="text-midnight-400 text-xs font-medium mb-2">API Response:</p>
              <pre className="text-neon-cyan text-xs font-mono overflow-auto max-h-24">
                {JSON.stringify(validatedResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BetSlip;