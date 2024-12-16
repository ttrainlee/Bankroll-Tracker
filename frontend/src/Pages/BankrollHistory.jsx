// src/Pages/BankrollHistory.jsx

import React, { useEffect, useState, useContext } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import API from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const BankrollHistory = () => {
  const { auth } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [cumulativeWinLoss, setCumulativeWinLoss] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await API.get('/sessions');
      setSessions(response.data.sessions);
      setCumulativeWinLoss(response.data.cumulative_win_loss);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box textAlign="center" sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bankroll History
        </Typography>
        <Typography variant="h6">
          Cumulative W/L: {cumulativeWinLoss >= 0 ? '+' : '-'}${Math.abs(cumulativeWinLoss).toFixed(2)}
        </Typography>
      </Box>
      {sessions.length === 0 ? (
        <Typography variant="body1" align="center">
          No sessions found. Add a new session to get started.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="sessions table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Game Type</TableCell>
                <TableCell>Stakes</TableCell>
                <TableCell>Buy-in</TableCell>
                <TableCell>Cash-out</TableCell>
                <TableCell>Buy-ins</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Win/Loss</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{new Date(session.session_date).toLocaleDateString()}</TableCell>
                  <TableCell>{session.game_type}</TableCell>
                  <TableCell>{session.stakes}</TableCell>
                  <TableCell>${parseFloat(session.buy_in_amount).toFixed(2)}</TableCell>
                  <TableCell>${parseFloat(session.cash_out_amount).toFixed(2)}</TableCell>
                  <TableCell>{session.number_of_buy_ins}</TableCell>
                  <TableCell>{session.location}</TableCell>
                  <TableCell>
                    {session.win_loss >= 0 ? '+' : '-'}${Math.abs(parseFloat(session.win_loss)).toFixed(2)}
                  </TableCell>
                  <TableCell>{session.notes || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default BankrollHistory;
