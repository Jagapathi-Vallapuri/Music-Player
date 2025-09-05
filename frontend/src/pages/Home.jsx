import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Home = () => (
  <Container>
    <Box sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h4">Home</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>Welcome — this is a placeholder home page.</Typography>
    </Box>
  </Container>
);

export default Home;
