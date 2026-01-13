import {
  ADD_BET_SLIP,
  CLEAR_BET_SLIP,
  DELETE_BET_SLIP,
  HANDLE_BET,
  BetState,
  BetAction,
} from './types';

// Initial state with explicit type
const initialState: BetState = {
  betData: {},
  betData2: {},
  betData3: {},
  res: {},
};

// Reducer with explicit types for state, action, and return value
const betReducer = (
  state: BetState = initialState,
  action: BetAction
): BetState => {
  switch (action.type) {
    case ADD_BET_SLIP: {
      const bet = action.payload;
      const betId = bet.id; // bet.id is string, which matches Record<string, Bet>
      return {
        ...state,
        betData: {
          ...state.betData,
          [betId]: bet,
        },
      };
    }

    case DELETE_BET_SLIP: {
      const id = action.payload; // id is string
      // Use computed property name to remove the bet
      const { [id]: removed, ...remainingBets } = state.betData;

      return {
        ...state,
        betData: remainingBets,
      };
    }

    case CLEAR_BET_SLIP:
      return {
        ...state,
        res: {},
        betData: {},
      };

    case HANDLE_BET: {
      const response = action.payload;
      return {
        ...state,
        res: response,
        betData: {},
      };
    }

    default: {
      // Support for foreign actions from other reducers in combined root reducer
      // This allows the reducer to work with combineReducers without breaking
      // exhaustive checks. Foreign actions from other reducers can pass through
      // without type errors, maintaining extensibility.
      return state;
    }
  }
};

export default betReducer;