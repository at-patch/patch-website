import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AdminUser {
  email: string;
}

interface AuthState {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = { token: null, admin: null, isAuthenticated: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; admin: AdminUser }>) => {
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.admin = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
