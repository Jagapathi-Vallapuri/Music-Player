import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Stack, Typography, TextField, InputAdornment, IconButton, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Button, Skeleton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../client.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useUI } from '../context/UIContext.jsx';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const SearchPage = () => {
  const qs = useQuery();
  const initialQ = qs.get('q') || '';
  const [q, setQ] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { playQueue, enqueue, playNow } = usePlayer();
  const { toastError } = useUI();

  const doSearch = async (term, signal) => {
    if (!term?.trim()) { setResults([]); return; }
    try {
      setLoading(true);
      const res = await api.get('/music/search', { params: { q: term.trim() }, signal });
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      const isAbort = err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError' || msg.includes('canceled') || msg.includes('cancelled') || msg.includes('aborted');
      if (!isAbort) toastError(err?.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Run when URL changes
  useEffect(() => {
    const ac = new AbortController();
    const term = qs.get('q') || '';
    setQ(term);
    doSearch(term, ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('q', q.trim());
    window.history.replaceState(null, '', url.toString());
    const ac = new AbortController();
    doSearch(q, ac.signal);
  };

  return (
    <Container maxWidth="md" sx={{ pt: 8, pb: 6 }}>
      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tracks, artists..."
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" aria-label="search"><SearchIcon /></IconButton>
              </InputAdornment>
            )
          }}
        />
      </form>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" disabled={!results.length} onClick={() => playNow(results)}>Play all</Button>
        <Button variant="outlined" disabled={!results.length} onClick={() => enqueue(results)}>Add all to queue</Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2 }}>
        {loading ? (
          <Stack spacing={1} sx={{ p: 2 }}>{Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} variant="rectangular" height={56} />))}</Stack>
        ) : results.length === 0 ? (
          <Typography sx={{ p: 2 }} color="text.secondary">{q?.trim() ? 'No results.' : 'Type to search.'}</Typography>
        ) : (
          <List>
            {results.map((t, idx) => (
              <React.Fragment key={t.id || idx}>
                <ListItem
                  disablePadding
                  secondaryAction={<Button size="small" onClick={() => enqueue([t])}>Add</Button>}
                >
                  <ListItemAvatar><Avatar variant="rounded" src={t.image} alt={t.name} /></ListItemAvatar>
                  <ListItemText primary={t.name} secondary={t.artist} onClick={() => playQueue(results, idx)} />
                </ListItem>
                {idx < results.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default SearchPage;
