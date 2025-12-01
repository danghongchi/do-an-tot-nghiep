import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('mc_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('mc_token') || null);

  useEffect(() => {
    if(token) api.setToken(token);
    else api.setToken(null);
  }, [token]);

  const login = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('mc_token', token);
    localStorage.setItem('mc_user', JSON.stringify(user));
    api.setToken(token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    api.setToken(null);
  };

  return <AuthContext.Provider value={{user, token, login, logout}}>{children}</AuthContext.Provider>
};

export const useAuth = () => useContext(AuthContext);
