// src/Pages/AddSession.jsx

import React, { useState, useContext } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import API from '../api/axiosConfig'; // Axios instance
import { AuthContext } from '../context/AuthContext'; // AuthContext
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function AddSession() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    buy_in_amount: '',
    cash_out_amount: '',
    number_of_buy_ins: '',
    stakes: '',
    game_type: 'NLH',
    location: '',
    session_date: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGameTypeChange = (event) => {
    setFormData({ ...formData, game_type: event.target.value });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For number fields, ensure the value is numeric
    const numericFields = ['buy_in_amount', 'cash_out_amount', 'number_of_buy_ins'];
    if (numericFields.includes(name)) {
      setFormData({ ...formData, [name]: value.replace(/[^0-9.]/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.buy_in_amount || parseFloat(formData.buy_in_amount) <= 0) {
      newErrors.buy_in_amount = 'Buy-in amount must be a positive number.';
    }

    if (formData.cash_out_amount && parseFloat(formData.cash_out_amount) < 0) {
      newErrors.cash_out_amount = 'Cash-out amount cannot be negative.';
    }

    if (!formData.number_of_buy_ins || parseInt(formData.number_of_buy_ins, 10) <= 0) {
      newErrors.number_of_buy_ins = 'Number of buy-ins must be a positive integer.';
    }

    if (!/^\d+\/\d+$/.test(formData.stakes)) {
      newErrors.stakes = 'Stakes must be in the format X/Y (e.g., 1/3).';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required.';
    }

    if (!formData.session_date) {
      newErrors.session_date = 'Session date is required.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        buy_in_amount: parseFloat(formData.buy_in_amount),
        cash_out_amount: formData.cash_out_amount ? parseFloat(formData.cash_out_amount) : 0,
        number_of_buy_ins: parseInt(formData.number_of_buy_ins, 10),
        stakes: formData.stakes,
        game_type: formData.game_type,
        location: formData.location.trim(),
        session_date: formData.session_date,
        notes: formData.notes.trim() || null,
      };

      const response = await API.post('/sessions', payload);

      if (response.data) {
        toast.success('Session saved successfully!');
        navigate('/bankroll-history');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          const backendErrors = error.response.data.errors.map((err) => err.msg).join(' ');
          toast.error(backendErrors);
        } else if (error.response.data.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Failed to save session.');
        }
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Add a Session
        </Typography>
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Stack spacing={3}>
          <TextField
            label="Buy-in Amount"
            type="number"
            name="buy_in_amount"
            fullWidth
            variant="outlined"
            value={formData.buy_in_amount}
            onChange={handleChange}
            error={!!errors.buy_in_amount}
            helperText={errors.buy_in_amount}
            required
            inputProps={{ step: '0.01', min: '0' }}
          />
          <TextField
            label="Cash-out Amount"
            type="number"
            name="cash_out_amount"
            fullWidth
            variant="outlined"
            value={formData.cash_out_amount}
            onChange={handleChange}
            error={!!errors.cash_out_amount}
            helperText={errors.cash_out_amount}
            inputProps={{ step: '0.01', min: '0' }}
          />
          <TextField
            label="Number of Buy-ins"
            type="number"
            name="number_of_buy_ins"
            fullWidth
            variant="outlined"
            value={formData.number_of_buy_ins}
            onChange={handleChange}
            error={!!errors.number_of_buy_ins}
            helperText={errors.number_of_buy_ins}
            required
            inputProps={{ step: '1', min: '1' }}
          />
          <TextField
            label="Stakes (e.g., 1/3 or 2/5)"
            name="stakes"
            fullWidth
            variant="outlined"
            value={formData.stakes}
            onChange={handleChange}
            error={!!errors.stakes}
            helperText={errors.stakes}
            required
          />
          <FormControl fullWidth>
            <InputLabel id="game-type-label">Game Type</InputLabel>
            <Select
              labelId="game-type-label"
              value={formData.game_type}
              label="Game Type"
              onChange={handleGameTypeChange}
              name="game_type"
            >
              <MenuItem value="NLH">NLH</MenuItem>
              <MenuItem value="PLO">PLO</MenuItem>
              {/* Add more game types if needed */}
            </Select>
          </FormControl>
          <TextField
            label="Location"
            name="location"
            fullWidth
            variant="outlined"
            value={formData.location}
            onChange={handleChange}
            error={!!errors.location}
            helperText={errors.location}
            required
          />
          <TextField
            label="Date"
            type="date"
            name="session_date"
            fullWidth
            variant="outlined"
            value={formData.session_date}
            onChange={handleChange}
            error={!!errors.session_date}
            helperText={errors.session_date}
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="Notes"
            name="notes"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={formData.notes}
            onChange={handleChange}
          />
          <Box textAlign="center">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Session'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}

export default AddSession;
