import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Container, Typography, Box, Button, Stack } from '@mui/material';
import AddSession from './pages/AddSession'; // Make sure this path is correct

function App() {
  return (
    <Routes>
      {/* Landing Page Route */}
      <Route 
        path="/" 
        element={
          <Container maxWidth="sm" sx={{ pt: 0 }}>
            <Box textAlign="center" sx={{ mt: 0 }}>
              <Typography variant="h3" gutterBottom>
                Welcome to Bankroll Tracker
              </Typography>
              <Typography variant="body1" gutterBottom>
                Keep track of your poker bankroll effortlessly.
              </Typography>
              <Stack spacing={2} direction="row" justifyContent="center" sx={{ mt: 3 }}>
                <Button variant="contained" color="primary">
                  View Bankroll History
                </Button>
                {/* Use the Link component to navigate to the Add Session page */}
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
      
      {/* Add Session Page Route */}
      <Route path="/add-session" element={<AddSession />} />
    </Routes>
  );
}

export default App;
