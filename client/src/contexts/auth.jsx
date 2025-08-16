import React, { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    loading: false,
    getUserLoading: false,
    error: null,
    user: null,
  });

  // ดึงข้อมูลผู้ใช้โดยใช้ Supabase API
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState((prevState) => ({
        ...prevState,
        user: null,
        getUserLoading: false,
      }));
      return;
    }

    try {
      setState((prevState) => ({ ...prevState, getUserLoading: true }));
      const response = await axios.get(
        "http://localhost:3001/api/auth/get-user",
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
      }));
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        error: error.message,
        user: null,
        getUserLoading: false,
      }));
      // Remove invalid token
      localStorage.removeItem("token");
    }
  };

  useEffect(() => {
    fetchUser(); // โหลดข้อมูลผู้ใช้เมื่อแอปเริ่มต้น
  }, []);

  // ล็อกอินผู้ใช้
  const login = async (data) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      const response = await axios.post(
        "http://localhost:3001/api/auth/login",
        data
      );
      const token = response.data.access_token;
      localStorage.setItem("token", token);

      // ดึงและตั้งค่าข้อมูลผู้ใช้
      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      await fetchUser();
      
      // Return success to handle navigation in component
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed";
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  // ลงทะเบียนผู้ใช้
  const register = async (data) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      await axios.post(
        "http://localhost:3001/api/auth/register",
        data
      );
      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      
      // Return success to handle navigation in component
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed";
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  // ล็อกเอาท์ผู้ใช้
  const logout = () => {
    localStorage.removeItem("token");
    setState({ user: null, error: null, loading: false, getUserLoading: false });
    
    // Return success to handle navigation in component
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
    // Add these for compatibility with ProtectedRoute
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

// Hook สำหรับใช้งาน AuthContext
// useAuth and AuthContext have been moved to authContext.js for Fast Refresh compatibility.
