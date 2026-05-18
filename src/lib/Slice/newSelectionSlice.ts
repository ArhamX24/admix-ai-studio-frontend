import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from "@reduxjs/toolkit";

interface NewsSelectionState {
  selectedNewsId: string | null;
}

const initialState: NewsSelectionState = {
  selectedNewsId: null,
};

const newsSelectionSlice = createSlice({
  name: 'newsSelection',
  initialState,
  reducers: {
    // ✅ Toggle: if same ID clicked again → deselect, else select new one
    toggleNewsId: (state, action: PayloadAction<string>) => {
      if (state.selectedNewsId === action.payload) {
        state.selectedNewsId = null; // deselect
      } else {
        state.selectedNewsId = action.payload; // select new
      }
    },
    clearSelectedNewsIds: (state) => {
      state.selectedNewsId = null;
    },
  },
});

export const { toggleNewsId, clearSelectedNewsIds } = newsSelectionSlice.actions;
export default newsSelectionSlice.reducer;