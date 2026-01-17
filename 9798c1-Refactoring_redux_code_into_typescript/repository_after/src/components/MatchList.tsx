import React from 'react';
import MatchCard from './MatchCard';
import { Match } from '../redux/types';

// Sample match data with explicit typing
const sampleMatches: Match[] = [
  {
    id: 1,
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool FC',
    league: 'Premier League',
    time: '15:00',
    date: 'Today',
    odds: { home: 2.45, draw: 3.20, away: 2.90 }
  },
  {
    id: 2,
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    time: '20:00',
    date: 'Today',
    odds: { home: 2.10, draw: 3.50, away: 3.25 }
  },
  {
    id: 3,
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    time: '18:30',
    date: 'Tomorrow',
    odds: { home: 1.85, draw: 3.80, away: 4.00 }
  },
  {
    id: 4,
    homeTeam: 'PSG',
    awayTeam: 'Marseille',
    league: 'Ligue 1',
    time: '21:00',
    date: 'Tomorrow',
    odds: { home: 1.55, draw: 4.20, away: 5.50 }
  },
  {
    id: 5,
    homeTeam: 'Inter Milan',
    awayTeam: 'AC Milan',
    league: 'Serie A',
    time: '19:45',
    date: 'Sunday',
    odds: { home: 2.30, draw: 3.10, away: 3.00 }
  },
  {
    id: 6,
    homeTeam: 'Ajax',
    awayTeam: 'PSV Eindhoven',
    league: 'Eredivisie',
    time: '16:30',
    date: 'Sunday',
    odds: { home: 2.00, draw: 3.40, away: 3.60 }
  }
];

const MatchList: React.FC = () => {
  return (
    <div className="animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-outfit font-bold text-white mb-1">
            Upcoming Matches
          </h2>
          <p className="text-midnight-400 text-sm">
            Select odds to add to your bet slip
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-neon-lime rounded-full animate-pulse" />
          <span className="text-neon-lime text-sm font-medium">Live updates</span>
        </div>
      </div>

      {/* Match cards grid */}
      <div className="grid gap-4">
        {sampleMatches.map((match, index) => (
          <div 
            key={match.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <MatchCard match={match} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchList;