import React, { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    loading: false,
    getUserLoading: true,
    error: null,
    user: null,
  });

  const fetchUser = async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    
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
      // Validate token format before making request
      if (token.split('.').length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const response = await axios.get(
        "http://localhost:3001/auth/get-user",
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
      // Clear invalid tokens
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
    }
  };

  useEffect(() => {
    fetchUser();
    
    // Listen for token expiration events
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
        "http://localhost:3001/auth/login",
        data
      );
      
      const token = response.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("authToken", token);

      const userResponse = await axios.get(
        "http://localhost:3001/auth/get-user",
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
        "http://localhost:3001/auth/resend-verification",
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
        "http://localhost:3001/auth/register",
        data
      );
      
      
      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || "Registration failed";
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    setState({ 
      user: null, 
      error: null, 
      loading: false, 
      getUserLoading: false
    });
    
    return { success: true };
  };

  const isAuthenticated = Boolean(state.user);

  const value = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

