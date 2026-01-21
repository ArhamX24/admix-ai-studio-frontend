import { createSlice} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
    avatarId: string;
    avatarName: string;
    avatarImage: string;
    avatarVideo: string;
    gender: string;
    voiceId: string;
    voiceName: string;
    voicePreviewUrl: string;
}

const initialState: ModalState = {
    avatarId: "",
    avatarName: "",
    avatarImage: "",
    avatarVideo: "",
    gender: "",
    voiceId: "",
    voiceName: "",
    voicePreviewUrl: ""
}

interface AvatarPayload {
    avatarId: string;
    avatarName: string;
    avatarImage: string;
    avatarVideo: string;
    gender: string;
}

interface VoicePayload {
    voiceId: string;
    voiceName: string;
    voicePreviewUrl: string;
}

const ModalSlice = createSlice({
    name: "modal",
    initialState: initialState,
    reducers: {
        addAvatarDetails: (state, action: PayloadAction<AvatarPayload>) => {
            state.avatarId = action.payload.avatarId;
            state.avatarName = action.payload.avatarName;
            state.avatarImage = action.payload.avatarImage;
            state.avatarVideo = action.payload.avatarVideo;
            state.gender = action.payload.gender;
        },
        addVoiceDetails: (state, action: PayloadAction<VoicePayload>) => {
            state.voiceId = action.payload.voiceId;
            state.voiceName = action.payload.voiceName;
            state.voicePreviewUrl = action.payload.voicePreviewUrl;
        },
        resetModalState: (state) => {
            return initialState;
        }
    }
})

export const { addAvatarDetails, addVoiceDetails, resetModalState } = ModalSlice.actions;

export default ModalSlice.reducer;
