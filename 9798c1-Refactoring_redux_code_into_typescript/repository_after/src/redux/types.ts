// Action type constants with 'as const' for literal types
export const ADD_BET_SLIP = 'ADD_BET_SLIP' as const;
export const ADD_BET_SLIP_2 = 'ADD_BET_SLIP_2' as const;
export const ADD_BET_SLIP_3 = 'ADD_BET_SLIP_3' as const;
export const DELETE_BET_SLIP = 'DELETE_BET_SLIP' as const;
export const DELETE_BET_SLIP_2 = 'DELETE_BET_SLIP_2' as const;
export const DELETE_BET_SLIP_3 = 'DELETE_BET_SLIP_3' as const;
export const CLEAR_BET_SLIP = 'CLEAR_BET_SLIP' as const;
export const HANDLE_BET = 'HANDLE_BET' as const;

// Match types
export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
}

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
  date: string;
  odds: MatchOdds;
}

// Bet types
export type BetSelection = 'home' | 'draw' | 'away';

export interface Bet {
  id: string; // Format: "{matchId}-{selection}"
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  selection: BetSelection;
  odds: number;
  time: string;
  date: string;
}

// API Response types
export interface BetDetails {
  totalBets: number;
  stake: number;
  totalOdds: string;
  potentialWin: string;
  status: string;
}

export interface BetResponse {
  success: boolean;
  betId: string;
  timestamp: string;
  message: string;
  details: BetDetails;
}

// Action payload types
export interface AddBetSlipPayload {
  type: typeof ADD_BET_SLIP;
  payload: Bet;
}

export interface DeleteBetSlipPayload {
  type: typeof DELETE_BET_SLIP;
  payload: string; // Bet ID
}

export interface ClearBetSlipPayload {
  type: typeof CLEAR_BET_SLIP;
  // No payload for clear action
}

export interface HandleBetPayload {
  type: typeof HANDLE_BET;
  payload: BetResponse;
}

// Discriminated union for all actions
export type BetAction =
  | AddBetSlipPayload
  | DeleteBetSlipPayload
  | ClearBetSlipPayload
  | HandleBetPayload;

// Redux State types
export interface BetState {
  betData: Record<string, Bet>; // Key is bet.id (string)
  betData2: Record<string, unknown>; // Reserved for future use
  betData3: Record<string, unknown>; // Reserved for future use
  res: BetResponse | Record<string, never>; // API response or empty object
}

// Root state with combined reducers support
export interface RootState {
  bet: BetState;
}

// Type guard for BetResponse (deep validation)
export function isBetResponse(value: unknown): value is BetResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Validate top-level properties
  if (typeof obj.success !== 'boolean') return false;
  if (typeof obj.betId !== 'string') return false;
  if (typeof obj.timestamp !== 'string') return false;
  if (typeof obj.message !== 'string') return false;

  // Validate nested details object
  if (typeof obj.details !== 'object' || obj.details === null) {
    return false;
  }

  const details = obj.details as Record<string, unknown>;

  if (typeof details.totalBets !== 'number') return false;
  if (typeof details.stake !== 'number') return false;
  if (typeof details.totalOdds !== 'string') return false;
  if (typeof details.potentialWin !== 'string') return false;
  if (typeof details.status !== 'string') return false;

  return true;
}

// Type guard for Error objects
export function isError(value: unknown): value is Error {
  return (
    value instanceof Error ||
    (typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof (value as Record<string, unknown>).message === 'string')
  );
}

// Type guard for Bet object
export function isBet(value: unknown): value is Bet {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.id !== 'string') return false;
  if (typeof obj.matchId !== 'number') return false;
  if (typeof obj.homeTeam !== 'string') return false;
  if (typeof obj.awayTeam !== 'string') return false;
  if (typeof obj.league !== 'string') return false;
  if (obj.selection !== 'home' && obj.selection !== 'draw' && obj.selection !== 'away') {
    return false;
  }
  if (typeof obj.odds !== 'number') return false;
  if (typeof obj.time !== 'string') return false;
  if (typeof obj.date !== 'string') return false;

  return true;
}