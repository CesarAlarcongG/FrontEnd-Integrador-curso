import React, { createContext, useContext, useEffect, useState } from 'react';
import ApiService from '../services/api';

interface AuthContextType {
  user: any;
  login: (credentials: { correo: string; contrasena: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      ApiService.setToken(token);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { correo: string; contrasena: string }) => {
    try {
      const response = await ApiService.login(credentials);
      setUser(response);
      ApiService.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
  setUser(null);
  ApiService.removeToken();
  localStorage.removeItem('user');

  // Redirección al cerrar sesión
  window.location.href = 'http://localhost:5173/';
};


  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};