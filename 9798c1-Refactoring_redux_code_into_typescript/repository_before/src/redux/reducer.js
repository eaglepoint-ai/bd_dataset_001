import { ADD_BET_SLIP, CLEAR_BET_SLIP, DELETE_BET_SLIP, HANDLE_BET } from "./type";

const initialState = {
  betData: {},
  betData2: {},
  betData3: {},
};

const betReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_BET_SLIP:
      const data = action.payload.id;
      return {
        ...state,
        betData: {
          ...state.betData,
          [data]: action.payload,
        },
      };
    
    case DELETE_BET_SLIP:
      const id = action.payload;
      const { [id]: removed, ...remainingBets } = state.betData;
      
      return {
        ...state,
        betData: remainingBets,
      };

    case CLEAR_BET_SLIP:
      return {
        ...state,
        res: {},
        betData: {},
      }
    
    case HANDLE_BET:
      return {
        ...state,
        res: action.payload,
        betData: {},
      }
    default:
      return state;
  }
};

export default betReducer;
