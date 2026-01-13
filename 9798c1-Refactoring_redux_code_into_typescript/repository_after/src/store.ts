import { createStore, applyMiddleware, combineReducers, Store } from 'redux';
import thunk, { ThunkMiddleware, ThunkDispatch } from 'redux-thunk';
import betReducer from './redux/reducer';
import { RootState, BetAction } from './redux/types';

// Combined root reducer with explicit return type
const rootReducer = combineReducers({
  bet: betReducer,
});

// Create store with proper typing
const store: Store<RootState, BetAction> = createStore(
  rootReducer,
  applyMiddleware(thunk as ThunkMiddleware<RootState, BetAction>)
);

// Export typed hooks for use in components
export type AppDispatch = ThunkDispatch<RootState, unknown, BetAction>;
export type RootStateType = RootState;

export default store;