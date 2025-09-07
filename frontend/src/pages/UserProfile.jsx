import React from 'react';
import { Avatar, Box, Container, Grid, Paper, Stack, Typography, Divider } from '@mui/material';

const placeholderAbout = `Music enthusiast. Curator of eclectic playlists. Exploring independent artists and immersive soundscapes.`;

const metrics = [
  { label: 'Playlists', value: 7 },
  { label: 'Favorites', value: 42 },
  { label: 'Hours Listened', value: 128 },
  { label: 'Uploads', value: 3 }
];

const UserProfile = () => {
  return (
    <Container maxWidth="lg" sx={{ pt: 6, pb: 10 }}>
      <Stack spacing={4}>
        <Paper elevation={0} sx={(theme) => ({ p: 4, display: 'flex', gap: 3, alignItems: 'center', background: theme.palette.gradients.surface })}>
          <Avatar
            src={`https://api.dicebear.com/7.   x/initials/svg?seed=User`}
            alt="User avatar"
            sx={{ width: 96, height: 96, border: (theme) => `3px solid ${theme.palette.primary.main}` }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>Username</Typography>
            <Typography variant="subtitle1" color="text.secondary">@username</Typography>
            <Typography variant="body1" sx={{ mt: 2, maxWidth: 640 }}>{placeholderAbout}</Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {metrics.map(m => (
            <Grid item xs={12} sm={6} md={3} key={m.label}>
              <Paper elevation={0} sx={(theme) => ({ p: 3, textAlign: 'center', background: theme.palette.gradients.surface })}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>{m.value}</Typography>
                <Typography variant="body2" color="text.secondary">{m.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper elevation={0} sx={(theme) => ({ p: 4, background: theme.palette.gradients.surface })}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Recent Activity</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">Recent listening history or favorite additions will appear here.</Typography>
        </Paper>
      </Stack>
    </Container>
  );
};

export default UserProfile;
