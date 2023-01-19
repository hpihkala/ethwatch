import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import eventListReducer from '../features/eventList/eventListSlice';

export const store = configureStore({
  reducer: {
    events: eventListReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.parsed.args', 'payload.parsed.argsArray', 'payload.confirmations'], // args get toString-ed before adding to store
      },
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
