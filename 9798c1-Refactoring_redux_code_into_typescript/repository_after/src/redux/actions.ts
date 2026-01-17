import {
  ADD_BET_SLIP,
  CLEAR_BET_SLIP,
  DELETE_BET_SLIP,
  HANDLE_BET,
  Bet,
  BetResponse,
  BetAction,
  RootState,
  isError,
} from './types';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

// Action creators with explicit return types
export const addBetSlip = (betData: Bet): BetAction => {
  return {
    type: ADD_BET_SLIP,
    payload: betData,
  };
};

export const deleteBetSlip = (id: string): BetAction => {
  return {
    type: DELETE_BET_SLIP,
    payload: id,
  };
};

export const clearBetSlip = (): BetAction => {
  return {
    type: CLEAR_BET_SLIP,
  };
};

// Thunk action type for async operations
type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  BetAction
>;

// Thunk action creator with proper typing and error handling
export const handleBet = (betData: {
  bets: Bet[];
  stake: number;
  totalOdds: string;
  potentialWin: string;
}): AppThunk<void> => {
  return async (dispatch: ThunkDispatch<RootState, unknown, BetAction>): Promise<void> => {
    try {
      // Simulate API call with fake data
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 800); // Simulate network delay
      });

      const fakeResponse: BetResponse = {
        success: true,
        betId: `BET-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'Bet placed successfully!',
        details: {
          totalBets: betData.bets.length,
          stake: betData.stake,
          totalOdds: betData.totalOdds,
          potentialWin: betData.potentialWin,
          status: 'pending',
        },
      };

      console.log('Bet placed:', fakeResponse);
      dispatch({
        type: HANDLE_BET,
        payload: fakeResponse,
      });
    } catch (error: unknown) {
      // Proper error handling with type guard
      // This addresses the production issue: catch blocks accessing properties on unknown
      if (isError(error)) {
        console.error('Error placing bet:', error.message);
      } else {
        console.error('Unknown error placing bet:', error);
      }
      // In a real application, we might dispatch an error action here
      // For now, we just log the error
    }
  };
};