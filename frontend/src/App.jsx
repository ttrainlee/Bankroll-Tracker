// src/App.jsx

import React, { useContext } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Container, Typography, Box, Button, Stack, AppBar, Toolbar } from '@mui/material';
import AddSession from './Pages/AddSession';
import Signup from './Pages/Signup';
import Login from './Pages/Login';
import BankrollHistory from './Pages/BankrollHistory'; // New import
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if the current path is the landing page
  const isHome = location.pathname === '/';

  // Handler for logout that also redirects to the landing page
  const handleLogout = () => {
    logout();          // Clear authentication state
    navigate('/');     // Redirect to the landing page
  };

  return (
    <>
      {/* Navbar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bankroll Tracker
          </Typography>

          {/* Conditionally render Home button if not on the landing page */}
          {!isHome && (
            <Button color="inherit" component={Link} to="/">
              Home
            </Button>
          )}

          {/* Authentication Links */}
          {!auth.user ? (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/signup">
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/bankroll-history">
                Bankroll History
              </Button>
              <Button color="inherit" component={Link} to="/add-session">
                Add a Session
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Toast Container for Notifications */}
      <ToastContainer />

      {/* Application Routes */}
      <Routes>
        {/* Landing Page Route */}
        <Route
          path="/"
          element={
            <Container maxWidth="sm" sx={{ pt: 5 }}>
              <Box textAlign="center" sx={{ mt: 5 }}>
                <Typography variant="h3" gutterBottom>
                  Welcome to Bankroll Tracker
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Keep track of your poker bankroll effortlessly.
                </Typography>
                <Stack spacing={2} direction="row" justifyContent="center" sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/bankroll-history"
                  >
                    View Bankroll History
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    component={Link}
                    to="/add-session"
                  >
                    Add a Session
                  </Button>
                </Stack>
              </Box>
            </Container>
          }
        />

        {/* Signup Page Route */}
        <Route path="/signup" element={<Signup />} />

        {/* Login Page Route */}
        <Route path="/login" element={<Login />} />

        {/* Bankroll History Page Route (Protected) */}
        <Route
          path="/bankroll-history"
          element={
            <ProtectedRoute>
              <BankrollHistory />
            </ProtectedRoute>
          }
        />

        {/* Add Session Page Route (Protected) */}
        <Route
          path="/add-session"
          element={
            <ProtectedRoute>
              <AddSession />
            </ProtectedRoute>
          }
        />

        {/* Catch-All Route for 404 */}
        <Route
          path="*"
          element={
            <Typography variant="h4" align="center" sx={{ mt: 5 }}>
              404: Page Not Found
            </Typography>
          }
        />
      </Routes>
    </>
  );
}

export default App;
