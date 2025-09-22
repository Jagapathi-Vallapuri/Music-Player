import React, { useEffect, useMemo, useState } from 'react';
import { Container, Stack, Typography, Skeleton } from '@mui/material';
import Carousel from '../components/Carousel.jsx';
import AlbumCard from '../components/cards/AlbumCard.jsx';
import api from '../../client.js';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';

const DEFAULT_CATEGORIES = ['rock','pop','electronic','jazz','hiphop','classical','relaxation','world','metal','soundtrack'];

const AlbumsPage = () => {
  const navigate = useNavigate();
  const { toastError } = useUI();
  const categories = useMemo(() => DEFAULT_CATEGORIES, []);
  const [state, setState] = useState({ loading: true, data: {} });

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await api.get('/music/albums/by-categories', {
          params: { cats: categories.join(','), per: 5 },
          signal: ac.signal,
        });
        setState({ loading: false, data: res.data || {} });
      } catch (err) {
        const msg = (err?.message || '').toLowerCase();
        const isAbort = err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError' || msg.includes('canceled') || msg.includes('cancelled') || msg.includes('aborted');
        if (!isAbort) toastError(err?.response?.data?.message || 'Failed to load albums');
        setState({ loading: false, data: {} });
      }
    })();
    return () => ac.abort();
  }, [categories, toastError]);

  return (
    <Container maxWidth="lg" sx={{ pt: 8, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Albums by Category</Typography>

      <Stack spacing={4}>
        {categories.map((cat) => (
          <Stack key={cat} spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{cat}</Typography>
            {state.loading ? (
              <Stack direction="row" spacing={1}>
                {[...Array(5)].map((_, i) => (<Skeleton key={i} variant="rectangular" width={200} height={220} />))}
              </Stack>
            ) : (
              <Carousel ariaLabel={`albums-${cat}`}>
                {(state.data[cat] || []).map((al) => (
                  <AlbumCard
                    key={al.id || al.name}
                    album={al}
                    onOpen={(alb) => navigate(`/album/${encodeURIComponent(alb.id)}`)}
                  />
                ))}
              </Carousel>
            )}
          </Stack>
        ))}
      </Stack>
    </Container>
  );
};

export default AlbumsPage;
