import { configureStore } from '@reduxjs/toolkit'
import ModalSlice from "../lib/Slice/videoagentslice"
import newsSelectionReducer from "../lib/Slice/newSelectionSlice"
import transcriptSlice from "../lib/Slice/transcriptSlice"

export const store = configureStore({
  reducer: {
    modal: ModalSlice,
    newsSelection: newsSelectionReducer,
    transcript: transcriptSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch