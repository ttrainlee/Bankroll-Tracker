import React, { useState } from 'react';
import { Container, Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Button, Stack } from '@mui/material';

function AddSession() {
  const [gameType, setGameType] = useState('NLH');

  const handleGameTypeChange = (event) => {
    setGameType(event.target.value);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Add a Session
        </Typography>
      </Box>
      <Box component="form" sx={{ mt: 2 }}>
        <Stack spacing={3}>
          <TextField
            label="Buy-in Amount"
            type="number"
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Cash-out Amount"
            type="number"
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Number of Buy-ins"
            type="number"
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Stakes (e.g. 1/3 or 2/5)"
            fullWidth
            variant="outlined"
          />
          <FormControl fullWidth>
            <InputLabel id="game-type-label">Game Type</InputLabel>
            <Select
              labelId="game-type-label"
              value={gameType}
              label="Game Type"
              onChange={handleGameTypeChange}
            >
              <MenuItem value="NLH">NLH</MenuItem>
              <MenuItem value="PLO">PLO</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Location"
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="Notes"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
          />
          <Box textAlign="center">
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              Save Session
            </Button>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}

export default AddSession;
