import React from 'react';
import { Container, Typography, Box, Button, Stack, Paper } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const Home = () => {
  return (
    <>
      <Container maxWidth="lg" sx={{ pt: 8 }}>
        <Paper elevation={0} sx={(theme) => ({
          p: { xs: 4, md: 8 },
          textAlign: 'center',
          background: theme.palette.gradients.surface,
          backdropFilter: 'blur(12px)',
            borderRadius: 5,
          boxShadow: theme.palette.mode === 'light'
            ? '0 6px 28px rgba(0,0,0,0.08)'
            : '0 8px 40px rgba(0,0,0,0.65)',
          position: 'relative',
          overflow: 'hidden'
        })}>
          <Box sx={(theme) => ({
            position: 'absolute',
            top: -80,
            right: -80,
            width: 260,
            height: 260,
            background: theme.palette.gradients.accent,
            filter: 'blur(2px)'
          })} />
          <Box sx={(theme) => ({
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            background: `radial-gradient(circle at center, ${theme.palette.secondary.main}55, ${theme.palette.secondary.main}00 70%)`,
            filter: 'blur(2px)'
          })} />

          <Stack spacing={3} alignItems="center" sx={{ position: 'relative' }}>
            <Box sx={(theme) => ({
              width: 72,
              height: 72,
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: theme.palette.gradients.primary,
              boxShadow: '0 4px 18px rgba(0,0,0,0.35)'
            })}>
              <MusicNoteIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              Pulse Music Platform
            </Typography>
            <Typography variant="h6" component="p" sx={{ maxWidth: 760, color: 'text.secondary', fontWeight: 400 }}>
              Stream, explore, and manage your playlists securely with two-factor authentication and a sleek modern interface.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
              <Button variant="contained" size="large" color="primary">Get Started</Button>
              <Button variant="outlined" size="large" color="secondary">Browse Library</Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default Home;
