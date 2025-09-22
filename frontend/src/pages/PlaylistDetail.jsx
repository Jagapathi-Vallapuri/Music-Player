import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Stack, Typography, IconButton, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Paper, Button, Skeleton, TextField } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../client.js';
import { useUI } from '../context/UIContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';

const PlaylistDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toastError, toastSuccess } = useUI();
  const { playQueue } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [desc, setDesc] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);

  const load = async (signal) => {
    try {
      setLoading(true);
      const res = await api.get(`/users/playlists/${encodeURIComponent(id)}`, { signal });
      const pl = res.data;
  setPlaylist(pl);
  setDesc(pl.description || '');
      const ids = Array.isArray(pl.tracks) ? pl.tracks : [];
      if (ids.length) {
        const tRes = await api.get('/music/tracks', { params: { ids: ids.join(',') }, signal });
        setTracks(tRes.data || []);
      } else {
        setTracks([]);
      }
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      const isAbort = err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError' || msg.includes('canceled') || msg.includes('cancelled') || msg.includes('aborted');
      if (!isAbort) toastError(err?.response?.data?.message || 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const move = (index, dir) => {
    setTracks((prev) => {
      const next = prev.slice();
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const newOrderIds = tracks.map((t) => String(t.id));
      await api.put(`/users/playlists/${encodeURIComponent(id)}`, { name: playlist.name, tracks: newOrderIds, coverUrl: playlist.coverUrl, description: desc });
      toastSuccess('Playlist updated');
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onChangeCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('cover', file);
    try {
      setCoverUploading(true);
      const res = await api.post(`/users/playlists/${encodeURIComponent(id)}/cover`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPlaylist((prev) => ({ ...prev, coverUrl: res.data?.coverUrl || prev.coverUrl }));
      toastSuccess('Cover updated');
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to upload cover');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Container maxWidth="md" sx={{ pt: 8, pb: 6 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar variant="rounded" src={playlist?.coverUrl} alt={playlist?.name} sx={{ width: 72, height: 72 }} />
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{playlist?.name || 'Playlist'}</Typography>
            <Button size="small" variant="outlined" component="label" disabled={coverUploading}>
              Change cover
              <input hidden type="file" accept="image/*" onChange={onChangeCover} />
            </Button>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/playlists')}>Back</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={saving || loading}>Save order</Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
        <TextField
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe this playlist..."
          fullWidth
          multiline
          minRows={2}
        />
      </Paper>

      {loading ? (
        <Paper elevation={0} sx={{ p: 2 }}>
          <Stack spacing={1}>{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} variant="rectangular" height={56} />))}</Stack>
        </Paper>
      ) : tracks.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>No tracks in this playlist.</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 1 }}>
          <List>
            {tracks.map((t, idx) => (
              <React.Fragment key={t.id || idx}>
                <ListItem
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton aria-label="move up" onClick={() => move(idx, -1)} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                      <IconButton aria-label="move down" onClick={() => move(idx, 1)} disabled={idx === tracks.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                    </Stack>
                  }
                  disablePadding
                >
                  <ListItemAvatar><Avatar variant="rounded" src={t.image} alt={t.name} /></ListItemAvatar>
                  <ListItemText primary={t.name} secondary={t.artist} onClick={() => playQueue(tracks, idx)} />
                </ListItem>
                {idx < tracks.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default PlaylistDetailPage;
