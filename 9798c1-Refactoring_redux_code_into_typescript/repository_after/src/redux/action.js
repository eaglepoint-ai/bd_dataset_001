import {
  ADD_BET_SLIP,
  CLEAR_BET_SLIP,
  DELETE_BET_SLIP,
  HANDLE_BET,
} from "./type";

export const addBetSlip = (betData) => {
  return {
    type: ADD_BET_SLIP,
    payload: betData,
  };
};

export const deleteBetSlip = (id) => {
  return {
    type: DELETE_BET_SLIP,
    payload: id,
  };
};

export const clearBetSlip = () => {
  return {
    type: CLEAR_BET_SLIP,
  };
};

export const handleBet = (betData) => {
  return (dispatch) => {
    // Simulate API call with fake data
    setTimeout(() => {
      const fakeResponse = {
        success: true,
        betId: `BET-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: "Bet placed successfully!",
        details: {
          totalBets: betData.bets.length,
          stake: betData.stake,
          totalOdds: betData.totalOdds,
          potentialWin: betData.potentialWin,
          status: "pending"
        }
      };
      
      console.log('Bet placed:', fakeResponse);
      dispatch({
        type: HANDLE_BET,
        payload: fakeResponse
      });
    }, 800); // Simulate network delay
  };
};
