import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from './types';
import type { AppDispatch } from '../store';

// Typed versions of useDispatch and useSelector hooks
// These provide type safety when using Redux in components
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;