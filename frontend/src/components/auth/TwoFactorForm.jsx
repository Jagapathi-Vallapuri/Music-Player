import React, { useState } from 'react';
import { TextField, Button, InputAdornment, CircularProgress, Typography, Box } from '@mui/material';
import { Security, ArrowBack } from '@mui/icons-material';

const TwoFactorForm = ({ onVerify, onResend, onBack, loading, email, initialCode = '', resendCooldown }) => {
  const [code, setCode] = useState(initialCode);

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify(code);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Typography variant="body1" gutterBottom align="center">
        Enter the 6-digit code sent to {email}
      </Typography>
      <TextField
        margin="normal"
        required
        fullWidth
        id="code"
        label="6-Digit Code"
        name="code"
        autoFocus
        value={code}
        onChange={e => setCode(e.target.value)}
        inputProps={{ maxLength: 6 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Security />
            </InputAdornment>
          ),
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        sx={{ mt: 2 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {loading ? 'Verifying...' : 'Verify'}
      </Button>
      <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onResend}
          disabled={resendCooldown > 0 || loading}
        >
          {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={onBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
      </Box>
    </form>
  );
};

export default TwoFactorForm;
