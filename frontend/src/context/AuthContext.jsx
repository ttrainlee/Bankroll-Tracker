import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';

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
        setAuth({
          ...auth,
          user: {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          },
        });
      } catch (error) {
        console.error('Invalid token', error);
        logout();
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
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; // Default export
