import { configureStore } from '@reduxjs/toolkit'
import ModalSlice from "../lib/Slice/videoagentslice"
import newsSelectionReducer from "../lib/Slice/newSelectionSlice"

export const store = configureStore({
  reducer: {
    modal: ModalSlice,
    newsSelection: newsSelectionReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch