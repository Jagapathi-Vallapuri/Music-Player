import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Stack, Paper, Avatar, Skeleton, Button, Divider, List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import api from '../../client.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useUI } from '../context/UIContext.jsx';

const AlbumPage = () => {
  const { id } = useParams();
  const { toastError } = useUI();
  const { playQueue, enqueue, playNow } = usePlayer();
  const [state, setState] = useState({ loading: true, data: null });
  const [dlg, setDlg] = useState({ open: false, mode: 'album', track: null });
  const [playlists, setPlaylists] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await api.get(`/music/albums/${encodeURIComponent(id)}`, { signal: ac.signal });
        setState({ loading: false, data: res.data });
      } catch (err) {
        setState({ loading: false, data: null });
        const msg = (err?.message || '').toLowerCase();
        const isAbort = err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError' || msg.includes('canceled') || msg.includes('cancelled') || msg.includes('aborted');
        if (!isAbort) {
          toastError(err?.response?.data?.message || err.message || 'Failed to load album');
        }
      }
    })();
    return () => ac.abort();
  }, [id, toastError]);

  const openAddDialog = async (mode, track = null) => {
    setDlg({ open: true, mode, track });
    try {
      const res = await api.get('/users/playlists');
      setPlaylists(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to load playlists');
    }
  };

  const closeAddDialog = () => {
    setDlg({ open: false, mode: 'album', track: null });
    setSelectedId('');
    setNewName('');
    setSaving(false);
  };

  const confirmAdd = async () => {
    try {
      setSaving(true);
      let targetId = selectedId;
      // Create a new playlist if name provided and no selection
      if (!targetId && newName.trim()) {
        const coverUrl = state.data?.image || undefined;
        const cre = await api.post('/users/playlists', { name: newName.trim(), tracks: [], coverUrl });
        targetId = cre.data?._id;
      }
      if (!targetId) return;
      // Compute tracks to add
      const toAdd = dlg.mode === 'album' ? (state.data?.tracks || []) : [dlg.track];
      const ids = toAdd.map((t) => String(t.id));
      // Fetch current playlist, append, and save
      const plRes = await api.get(`/users/playlists/${encodeURIComponent(targetId)}`);
      const current = plRes.data || {};
      const nextTracks = [...(current.tracks || [])];
      ids.forEach((id) => { if (!nextTracks.includes(id)) nextTracks.push(id); });
      await api.put(`/users/playlists/${encodeURIComponent(targetId)}`, { name: current.name, tracks: nextTracks, coverUrl: current.coverUrl });
      closeAddDialog();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to add to playlist');
      setSaving(false);
    }
  };

  const album = state.data;
  const header = (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, mb: 4, display: 'flex', gap: 3, alignItems: 'center' }}>
      {state.loading ? (
        <Skeleton variant="rectangular" width={160} height={160} />
      ) : (
        <Avatar variant="rounded" src={album?.image} alt={album?.name} sx={{ width: 160, height: 160, borderRadius: 3 }} />
      )}
      <Box>
        <Typography variant="overline" color="text.secondary">Album</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {state.loading ? <Skeleton width={280} /> : (album?.name || 'Unknown Album')}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {state.loading ? <Skeleton width={180} /> : (album?.artist || 'Unknown Artist')}
        </Typography>
        {/* Metrics removed */}
      </Box>
      <Box sx={{ flex: 1 }} />
      {!state.loading && album?.tracks?.length ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" onClick={() => playNow(album.tracks)}>Play now</Button>
          <Button variant="outlined" onClick={() => enqueue(album.tracks)}>Add to queue</Button>
          <Button variant="outlined" onClick={() => openAddDialog('album')}>Add album to playlist</Button>
        </Stack>
      ) : null}
      <Button component={RouterLink} to="/albums" variant="outlined">Back to albums</Button>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
      {header}
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Tracks</Typography>
        {state.loading ? (
          <Stack spacing={1}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={56} />
            ))}
          </Stack>
        ) : !album?.tracks?.length ? (
          <Typography color="text.secondary">No tracks found in this album.</Typography>
        ) : (
          <List>
            {album.tracks.map((t, idx) => (
              <React.Fragment key={t.id || idx}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Button size="small" onClick={() => openAddDialog('track', t)}>Add to playlist</Button>
                  }
                >
                  <ListItemButton onClick={() => playQueue(album.tracks, idx)}>
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={t.image} alt={t.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={t.name}
                    secondary={t.artist}
                  />
                  <Typography variant="body2" color="text.secondary">{formatDuration(t.duration)}</Typography>
                  </ListItemButton>
                </ListItem>
                {idx < album.tracks.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      <Dialog open={dlg.open} onClose={closeAddDialog} fullWidth maxWidth="xs">
        <DialogTitle>Add to playlist</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="pl-select-label">Select playlist</InputLabel>
              <Select labelId="pl-select-label" label="Select playlist" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {playlists.map((p) => (
                  <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography align="center" color="text.secondary">— or —</Typography>
            <TextField label="New playlist name" value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth />
            {state.data?.image && <Typography variant="caption" color="text.secondary">New playlists will use this album cover by default.</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog} disabled={saving}>Cancel</Button>
          <Button onClick={confirmAdd} variant="contained" disabled={saving || (!selectedId && !newName.trim())}>Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default AlbumPage;
