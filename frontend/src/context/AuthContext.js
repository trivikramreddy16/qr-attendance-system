import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Verify token is still valid by fetching profile
        validateToken();
      } catch (error) {
        console.error('Error parsing user data:', error);
        clearAuthData();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success) {
        setUser(response.data);
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', credentials.email);
      
      const response = await apiService.login(credentials.email, credentials.password);
      console.log('📈 Login response received:', response);
      
      if (response.success) {
        const { token, user: userData } = response;
        
        if (!token || !userData) {
          console.error('❌ Invalid response format - missing token or user data');
          return { success: false, message: 'Invalid response from server' };
        }
        
        console.log('✅ Login successful for:', userData.email, 'Role:', userData.role);
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.message);
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
      
      let message = 'Network error. Please try again.';
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        message = 'Cannot connect to server. Please check your network connection and try again.';
      } else if (error.message.includes('NetworkError')) {
        message = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('TypeError')) {
        message = 'Connection error. Please make sure the server is running.';
      } else if (error.message) {
        message = error.message;
      }
      
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: error.message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await apiService.changePassword(passwordData);
      return { success: response.success, message: response.message };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    login,
    logout,
    updateProfile,
    changePassword,
    loading,
    isAuthenticated: !!user,
    isFaculty: user?.role === 'faculty',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};