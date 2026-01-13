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
        
        betData: {
          ...state.betData,
          [data]: action.payload,
        },
      };
    
    case DELETE_BET_SLIP:
      const id = action.payload;
      const obj = state.betData;
      const asArray = Object.entries(obj);
      const filtered = asArray.filter(([key, value]) => {
        key = parseInt(key);
        if (key !== id) return true;
        return false;
      });
      const filteredData = Object.fromEntries(filtered);

      return {
        betData: {
          ...filteredData,
        },
      };

    case CLEAR_BET_SLIP:
      return {
        res:{},
        betData: {},
      }
    
    case HANDLE_BET:
      return {
        res:action.payload,
        betData: {},
      }
    default:
      return state;
  }
};

export default betReducer;
