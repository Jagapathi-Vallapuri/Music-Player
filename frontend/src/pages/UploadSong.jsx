import React, { useMemo, useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography, Avatar, LinearProgress } from '@mui/material';
import { useUI } from '../context/UIContext.jsx';
import { deleteMySong, getMySongs, uploadUserSong } from '../../client.js';

const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

const UploadSongPage = () => {
  const { toastError, toastSuccess } = useUI();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [songs, setSongs] = useState([]);

  const isAudio = useMemo(() => (file?.type || '').startsWith('audio/'), [file]);
  const isImage = useMemo(() => (cover?.type || '').startsWith('image/'), [cover]);

  const load = async () => {
    try {
      const data = await getMySongs();
      setSongs(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore
    }
  };

  React.useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toastError('Please select an audio file');
    if (!isAudio) return toastError('Selected file must be audio');
    if (cover && !isImage) return toastError('Cover must be an image');
    setUploading(true);
    try {
      const res = await uploadUserSong({ file, cover, title: title.trim() });
      toastSuccess(res?.message || 'Uploaded');
      setTitle('');
      setFile(null);
      setCover(null);
      await load();
    } catch (err) {
      toastError(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (filename) => {
    try {
      await deleteMySong(filename);
      toastSuccess('Deleted');
      await load();
    } catch (e) {
      toastError(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Upload Your Song</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Audio only. Optionally add a title and cover image. We compute a curation score to help you manage uploads.</Typography>
      <Paper component="form" onSubmit={onSubmit} sx={{ p: 3, mb: 4 }}>
        <Stack spacing={2}>
          <TextField label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" component="label">
              Select Audio
              <input type="file" accept="audio/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
            {file && (
              <Typography variant="body2" sx={{ alignSelf: 'center' }}>{file.name} • {toMB(file.size)} MB</Typography>
            )}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" component="label">
              Select Cover (optional)
              <input type="file" accept="image/*" hidden onChange={(e) => setCover(e.target.files?.[0] || null)} />
            </Button>
            {cover && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src={URL.createObjectURL(cover)} variant="square" sx={{ width: 40, height: 40 }} />
                <Typography variant="body2">{cover.name}</Typography>
              </Stack>
            )}
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={uploading}>Upload</Button>
            {uploading && <Box sx={{ flex: 1, alignSelf: 'center' }}><LinearProgress /></Box>}
          </Stack>
        </Stack>
      </Paper>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Your Uploads</Typography>
      <Stack spacing={2}>
        {songs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No uploads yet.</Typography>
        ) : (
          songs.map((s) => (
            <Paper key={s.filename} sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Avatar variant="square" src={s.coverFilename ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/songs/cover/${encodeURIComponent(s.coverFilename)}` : undefined} sx={{ width: 56, height: 56 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>{s.title || s.originalName}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{s.mimeType} • {toMB(s.size)} MB</Typography>
                  {typeof s.curationScore === 'number' && (
                    <Typography variant="caption" color="text.secondary">Curation score: {s.curationScore}</Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" color="error" onClick={() => onDelete(s.filename)}>Delete</Button>
                </Stack>
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </Container>
  );
};

export default UploadSongPage;
