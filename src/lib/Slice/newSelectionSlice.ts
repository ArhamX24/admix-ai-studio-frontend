import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from "@reduxjs/toolkit";

interface NewsSelectionState {
  selectedNewsId: string | null; // single selection only
}

const initialState: NewsSelectionState = {
  selectedNewsId: null,
};

const newsSelectionSlice = createSlice({
  name: "newsSelection",
  initialState,
  reducers: {
    // Toggle: if same ID clicked again → deselect, else → select the new one
    toggleNewsId: (state, action: PayloadAction<string>) => {
      if (state.selectedNewsId === action.payload) {
        state.selectedNewsId = null;
      } else {
        state.selectedNewsId = action.payload;
      }
    },

    clearSelectedNewsIds: (state) => {
      state.selectedNewsId = null;
    },

    // Keep for any other place that might call setSelectedNewsIds
    setSelectedNewsId: (state, action: PayloadAction<string | null>) => {
      state.selectedNewsId = action.payload;
    },
  },
});

export const { toggleNewsId, clearSelectedNewsIds, setSelectedNewsId } =
  newsSelectionSlice.actions;

export default newsSelectionSlice.reducer;