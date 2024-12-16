// src/Pages/Login.jsx

import React, { useState, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axiosConfig'; // Use the Axios instance
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext); // Use login from AuthContext

  // Determine where to redirect after login
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors('');

    const { email, password } = formData;

    // Basic validation
    if (!email || !password) {
      setErrors('Both email and password are required.');
      return;
    }

    try {
      const response = await API.post('/login', {
        email,
        password,
      });

      if (response.data.token) {
        login(response.data.token); // Update AuthContext with token
        toast.success('Login successful!');
        navigate(from, { replace: true });
      }
    } catch (error) {
      if (error.response && error.response.data) {
        // Handle validation errors from backend
        if (error.response.data.errors) {
          const backendErrors = error.response.data.errors.map((err) => err.msg).join(' ');
          setErrors(backendErrors);
        } else if (error.response.data.error) {
          setErrors(error.response.data.error);
        } else {
          setErrors('Login failed.');
        }
      } else {
        setErrors('An error occurred. Please try again.');
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pt: 5 }}>
      <ToastContainer />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Login
        </Typography>
        {errors && (
          <Box mt={2} sx={{ width: '100%' }}>
            <Typography color="error">{errors}</Typography>
          </Box>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button type="submit" fullWidth variant="contained" color="primary">
              Login
            </Button>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" mt={2}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                Sign Up
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
