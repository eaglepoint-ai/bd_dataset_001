import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addBetSlip, deleteBetSlip } from '../redux/action';

const MatchCard = ({ match }) => {
  const dispatch = useDispatch();
  const betData = useSelector((state) => state.bet.betData);
  
  const handleOddsClick = (selection, odds) => {
    const betId = `${match.id}-${selection}`;
    const existingBet = betData[betId];
    
    if (existingBet) {
      dispatch(deleteBetSlip(betId));
    } else {
      const betPayload = {
        id: betId,
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        selection,
        odds,
        time: match.time,
        date: match.date
      };
      dispatch(addBetSlip(betPayload));
    }
  };

  const isSelected = (selection) => {
    const betId = `${match.id}-${selection}`;
    return !!betData[betId];
  };

  const getSelectionLabel = (selection) => {
    switch (selection) {
      case 'home': return '1';
      case 'draw': return 'X';
      case 'away': return '2';
      default: return selection;
    }
  };

  return (
    <div className="bg-midnight-900/60 backdrop-blur-sm border border-midnight-700/40 rounded-2xl p-5 hover:border-midnight-600/60 transition-all duration-300 group">
      {/* League and time */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full" />
          <span className="text-midnight-400 text-xs font-medium uppercase tracking-wider">
            {match.league}
          </span>
        </div>
        <div className="flex items-center gap-2 text-midnight-400 text-xs">
          <span className="px-2 py-1 bg-midnight-800/60 rounded-md font-mono">
            {match.date}
          </span>
          <span className="px-2 py-1 bg-midnight-800/60 rounded-md font-mono">
            {match.time}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex-1">
          <p className="text-white font-semibold text-lg group-hover:text-neon-lime transition-colors">
            {match.homeTeam}
          </p>
        </div>
        <div className="px-4">
          <span className="text-midnight-500 font-bold text-sm">VS</span>
        </div>
        <div className="flex-1 text-right">
          <p className="text-white font-semibold text-lg group-hover:text-neon-cyan transition-colors">
            {match.awayTeam}
          </p>
        </div>
      </div>

      {/* Odds buttons */}
      <div className="grid grid-cols-3 gap-3">
        {['home', 'draw', 'away'].map((selection) => (
          <button
            key={selection}
            onClick={() => handleOddsClick(selection, match.odds[selection])}
            className={`
              relative py-3 px-4 rounded-xl font-mono text-sm font-semibold
              transition-all duration-200 overflow-hidden
              ${isSelected(selection)
                ? 'bg-gradient-to-r from-neon-lime/20 to-neon-cyan/20 text-neon-lime border-2 border-neon-lime/50 shadow-lg shadow-neon-lime/10'
                : 'bg-midnight-800/60 text-white border border-midnight-600/40 hover:border-midnight-500/60 hover:bg-midnight-700/60'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-midnight-400 text-xs font-medium">
                {getSelectionLabel(selection)}
              </span>
              <span className="text-lg">{match.odds[selection].toFixed(2)}</span>
            </div>
            {isSelected(selection) && (
              <div className="absolute top-1 right-1">
                <svg className="w-4 h-4 text-neon-lime" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MatchCard;
