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
      console.log('🔐 Attempting login...', { email: data.email });
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      const response = await axios.post(
        "http://localhost:3001/api/auth/login",
        data
      );
      
      console.log('✅ Login response:', response.data);
      
  const token = response.data.access_token;
  // Store token for both legacy and api service compatibility
  localStorage.setItem("token", token);
  localStorage.setItem("authToken", token);

      // ดึงและตั้งค่าข้อมูลผู้ใช้ทันทีหลังจากล็อกอินสำเร็จ
      console.log('📋 Fetching user data...');
      const userResponse = await axios.get(
        "http://localhost:3001/api/auth/get-user",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ User data received:', userResponse.data);
      
      setState((prevState) => ({ 
        ...prevState, 
        loading: false, 
        error: null,
        user: userResponse.data,
        getUserLoading: false
      }));
      
      // Return success to handle navigation in component
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
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

  // ส่งอีเมลยืนยันใหม่
  const resendVerification = async (email) => {
    if (!email) {
      return { success: false, error: "Email is required" };
    }
    try {
      const { data } = await axios.post(
        "http://localhost:3001/api/auth/resend-verification",
        { email }
      );
      return { success: true, message: data?.message || "Verification email sent" };
    } catch (error) {
      const serverData = error.response?.data;
      const errorMessage = serverData?.error || serverData?.message || error.message || "Failed to resend verification email";
      return { success: false, error: errorMessage };
    }
  };

  // ลงทะเบียนผู้ใช้
  const register = async (data) => {
    try {
      console.log('📝 Attempting registration...', { 
        email: data.email, 
        username: data.username, 
        name: data.name,
        hasPassword: !!data.password 
      });
      
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      
      const response = await axios.post(
        "http://localhost:3001/api/auth/register",
        data
      );
      
      console.log('✅ Registration response:', response.data);
      
      setState((prevState) => ({ ...prevState, loading: false, error: null }));
      
      // Return success to handle navigation in component
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data || error.message);
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
  localStorage.removeItem("authToken");
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
  resendVerification,
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
