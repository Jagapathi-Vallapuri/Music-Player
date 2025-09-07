import React, { useEffect, useState } from 'react';
import { Avatar, Box, Container, Grid, Paper, Stack, Typography, Divider, Button, TextField, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { getMe, updateAbout, uploadAvatar } from '../../client.js';
import { PhotoCamera, Edit, Save, Cancel } from '@mui/icons-material';

const placeholderAbout = `Music enthusiast. Curator of eclectic playlists. Exploring independent artists and immersive soundscapes.`;

const metrics = [
  { label: 'Playlists', value: 7 },
  { label: 'Favorites', value: 42 },
  { label: 'Hours Listened', value: 128 },
  { label: 'Uploads', value: 3 }
];

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aboutEdit, setAboutEdit] = useState(false);
  const [aboutValue, setAboutValue] = useState('');
  const [aboutSaving, setAboutSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMe();
        if (!cancelled) {
          setProfile(data);
          setAboutValue(data?.about || '');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAboutSave = async () => {
    if (aboutValue.length > 500) return;
    setAboutSaving(true);
    setError(null); setSuccessMsg(null);
    try {
      const res = await updateAbout(aboutValue);
      setProfile(p => ({ ...p, about: res.about }));
      setAboutEdit(false);
      setSuccessMsg('About updated');
    } catch (err) {
      setError(err.message);
    } finally { setAboutSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Max size 2MB'); return; }
    setAvatarUploading(true); setError(null); setSuccessMsg(null);
    try {
      const res = await uploadAvatar(file);
      setProfile(p => ({ ...p, avatarFilename: res.filename }));
      setSuccessMsg('Avatar updated');
    } catch (err) {
      setError(err.message);
    } finally { setAvatarUploading(false); }
  };

  const avatarUrl = profile?.avatarFilename ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/users/me/avatar?cacheBust=${profile.avatarFilename}` : undefined;

  return (
    <Container maxWidth="lg" sx={{ pt: 6, pb: 10 }}>
      <Stack spacing={4}>
        <Paper elevation={0} sx={(theme) => ({ p: 4, display: 'flex', gap: 3, alignItems: 'center', background: theme.palette.gradients.surface, position: 'relative' })}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'User'}`}
              alt="User avatar"
              sx={{ width: 112, height: 112, border: (theme) => `3px solid ${theme.palette.primary.main}` }}
            />
            <input id="avatarInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <Tooltip title="Change avatar">
              <IconButton size="small" component="label" htmlFor="avatarInput" sx={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { background: 'rgba(0,0,0,0.7)' } }}>
                {avatarUploading ? <CircularProgress size={18} color="inherit" /> : <PhotoCamera fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>{profile?.username || 'Loading...'}</Typography>
            <Typography variant="subtitle1" color="text.secondary">@{profile?.username || 'user'}</Typography>
            <Box sx={{ mt: 2, maxWidth: 640 }}>
              {aboutEdit ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    multiline
                    minRows={3}
                    value={aboutValue}
                    onChange={(e) => setAboutValue(e.target.value.slice(0, 500))}
                    helperText={`${aboutValue.length}/500`}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" onClick={handleAboutSave} disabled={aboutSaving}>{aboutSaving ? 'Saving...' : 'Save'}</Button>
                    <Button variant="text" size="small" onClick={() => { setAboutValue(profile?.about || ''); setAboutEdit(false); }}>Cancel</Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{profile?.about || placeholderAbout}</Typography>
                  <Tooltip title="Edit about">
                    <IconButton size="small" onClick={() => setAboutEdit(true)}><Edit fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {error && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>{error}</Typography>}
            {successMsg && <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>{successMsg}</Typography>}
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
