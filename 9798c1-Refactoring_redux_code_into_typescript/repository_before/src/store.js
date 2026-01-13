import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import betReducer from './redux/reducer';

const rootReducer = combineReducers({
  bet: betReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
