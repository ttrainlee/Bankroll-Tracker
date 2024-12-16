// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Corrected import
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig'; // Import the Axios instance

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || null,
    user: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (auth.token) {
      try {
        const decoded = jwtDecode(auth.token);
        setAuth((prev) => ({
          ...prev,
          user: {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          },
        }));
      } catch (error) {
        console.error('Invalid token', error);
        setAuth({ token: null, user: null });
        localStorage.removeItem('token');
      }
    }
  }, [auth.token]);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setAuth({
      token,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth({ token: null, user: null });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
