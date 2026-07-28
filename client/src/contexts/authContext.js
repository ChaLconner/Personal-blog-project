import { createContext, useContext } from "react";

const defaultState = {
  state: { loading: false, getUserLoading: false, error: null, user: null },
  login: async () => ({ error: "AuthNotReady" }),
  logout: async () => ({ success: false }),
  register: async () => ({ error: "AuthNotReady" }),
  isAuthenticated: false,
  fetchUser: async () => {},
  resendVerification: async () => {},
  user: null,
  loading: false,
  error: null
};

export const AuthContext = createContext(defaultState);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultState;
};
