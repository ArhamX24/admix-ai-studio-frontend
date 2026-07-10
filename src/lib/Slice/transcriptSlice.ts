import { createSlice} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";


interface TranscriptState {
  fullText: string | null;
}

const initialState: TranscriptState = {
  fullText: null,
};

export const transcriptSlice = createSlice({
  name: 'transcript',
  initialState,
  reducers: {
    setTranscript: (state, action: PayloadAction<string>) => {
      state.fullText = action.payload;
    },
    clearTranscript: (state) => {
      state.fullText = null;
    },
  },
});

export const { setTranscript, clearTranscript } = transcriptSlice.actions;
export default transcriptSlice.reducer;
