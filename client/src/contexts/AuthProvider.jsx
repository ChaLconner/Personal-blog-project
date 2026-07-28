import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import blogApi, { API_BASE_URL } from "../services/api.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    loading: false,
    getUserLoading: true,
    error: null,
    user: null,
  });

  const fetchUser = async () => {
    const token = blogApi.auth.getToken();
    
    if (!token) {
      setState((prevState) => ({
        ...prevState,
        user: null,
        getUserLoading: false,
      }));
      return;
    }

    setState((prevState) => ({ ...prevState, getUserLoading: true }));

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          throw new Error('Session token expired');
        }
      } catch (decodeErr) {
        if (decodeErr.message === 'Session token expired') throw decodeErr;
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/auth/get-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setState((prevState) => ({
        ...prevState,
        user: response.data,
        getUserLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('fetchUser error:', error.response?.data || error.message);
      setState((prevState) => ({
        ...prevState,
        error: error.message,
        user: null,
        getUserLoading: false,
      }));
      blogApi.auth.removeToken();
    }
  };

  useEffect(() => {
    fetchUser();
    
    const handleTokenExpired = () => {
      setState(prevState => ({
        ...prevState,
        user: null,
        error: "Your session has expired. Please log in again.",
        getUserLoading: false
      }));
    };
    
    window.addEventListener('auth:token-expired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, []);

  const login = async (data) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        data
      );
      
      const token = response.data.access_token;
      blogApi.auth.setToken(token);

      const userResponse = await axios.get(
        `${API_BASE_URL}/auth/get-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setState((prevState) => ({ 
        ...prevState, 
        loading: false, 
        error: null,
        user: userResponse.data,
        getUserLoading: false,
      }));
      
      return { success: true };
    } catch (error) {
      const serverData = error.response?.data;
      const errorMessage = serverData?.error || serverData?.message || "Login failed";
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return {
        error: errorMessage,
        requiresVerification: Boolean(serverData?.requiresVerification),
        message: serverData?.message || null
      };
    }
  };

  const resendVerification = async (email) => {
    if (!email) {
      return { success: false, error: "Email is required" };
    }
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/resend-verification`,
        { email }
      );
      return { success: true, message: data?.message || "Verification email sent" };
    } catch (error) {
      const serverData = error.response?.data;
      const errorMessage = serverData?.error || serverData?.message || error.message || "Failed to resend verification email";
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      await axios.post(
        `${API_BASE_URL}/auth/register`,
        data
      );
      
      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      const serverData = error.response?.data;
      const errorMessage = serverData?.message || serverData?.error || "Registration failed";
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await blogApi.auth.logout();
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    blogApi.auth.removeToken();
    setState({ 
      user: null, 
      error: null, 
      loading: false, 
      getUserLoading: false
    });
    
    return { success: true };
  };

  const isAuthenticated = Boolean(state.user);

  const value = useMemo(() => ({
    state,
    login,
    logout,
    register,
    isAuthenticated,
    fetchUser,
    resendVerification,
    user: state.user,
    loading: state.loading || state.getUserLoading,
    error: state.error
  }), [state, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
