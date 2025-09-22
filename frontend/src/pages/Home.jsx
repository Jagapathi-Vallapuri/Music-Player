import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Stack, Paper, Skeleton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import Carousel from '../components/Carousel.jsx';
import TrackCard from '../components/cards/TrackCard.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import AlbumCard from '../components/cards/AlbumCard.jsx';
import PlaylistCard from '../components/cards/PlaylistCard.jsx';
import api from '../../client.js';
import { useUI } from '../context/UIContext.jsx';

const Home = () => {
    const { toastError } = useUI();
    const { playTrack } = usePlayer();
    const navigate = useNavigate();
    const [popular, setPopular] = useState({ loading: true, data: [] });
    const [albums, setAlbums] = useState({ loading: true, data: [] });
    const [playlists, setPlaylists] = useState({ loading: true, data: [] });

    useEffect(() => {
        const ac = new AbortController();
        const fetchAll = async () => {
            const isAbort = (e) => {
                const msg = (e?.message || '').toLowerCase();
                return e?.code === 'ERR_CANCELED' || e?.name === 'AbortError' || e?.name === 'CanceledError' || msg.includes('canceled') || msg.includes('cancelled') || msg.includes('aborted');
            };

            try {
                const [pRes, aRes] = await Promise.allSettled([
                    api.get('/music/popular', { signal: ac.signal }),
                    api.get('/music/albums', { signal: ac.signal }),
                ]);

                if (pRes.status === 'fulfilled') {
                    const p = pRes.value;
                    setPopular({ loading: false, data: Array.isArray(p.data) ? p.data : [] });
                } else {
                    setPopular(s => ({ ...s, loading: false }));
                    if (!isAbort(pRes.reason)) {
                        toastError(pRes.reason?.response?.data?.message || 'Failed to load popular');
                    }
                }

                if (aRes.status === 'fulfilled') {
                    const a = aRes.value;
                    setAlbums({ loading: false, data: Array.isArray(a.data) ? a.data : [] });
                } else {
                    setAlbums(s => ({ ...s, loading: false }));
                    if (aRes.status === 'rejected' && !isAbort(aRes.reason)) {
                        toastError(aRes.reason?.response?.data?.message || 'Failed to load albums');
                    }
                }
            } catch (err) {
                // Should rarely happen since allSettled handles individual failures
                if (!isAbort(err)) {
                    toastError(err?.message || 'Failed to load content');
                }
            }

            try {
                const pl = await api.get('/users/playlists', { signal: ac.signal });
                setPlaylists({ loading: false, data: Array.isArray(pl.data) ? pl.data : [] });
            } catch (err) {
                setPlaylists(s => ({ ...s, loading: false }));
            }
        };
        fetchAll();
        return () => ac.abort();
    }, [toastError]);
    return (
        <>
            <Container maxWidth="lg" sx={{ pt: 6, pb: 8 }}>
                {/* Popular Section */}
                <Stack spacing={2} sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Popular Right Now</Typography>
                        <Button component={RouterLink} to="/popular" variant="text">View all</Button>
                    </Stack>
                    {popular.loading ? (
                        <Stack direction="row" spacing={1}>
                            {[...Array(5)].map((_, i) => (<Skeleton key={i} variant="rectangular" width={200} height={220} />))}
                        </Stack>
                    ) : (
                                    <Carousel ariaLabel="popular-tracks">
                                        {popular.data.map((t, idx) => {
                                            const track = {
                                                id: t.id || t.track_id || t.title,
                                                title: t.title || t.name,
                                                artist: t.artist_name || t.artist,
                                                image: t.image,
                                                audioUrl: t.audioUrl || t.audio || t.preview_url,
                                            };
                                            return (
                                                <TrackCard
                                                    key={track.id}
                                                    track={track}
                                                    onPlay={() => playTrack(track)}
                                                />
                                            );
                                        })}
                                    </Carousel>
                    )}
                </Stack>

                {/* Albums Section */}
                <Stack spacing={2} sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>New & Noteworthy Albums</Typography>
                        <Button component={RouterLink} to="/albums" variant="text">View all</Button>
                    </Stack>
                    {albums.loading ? (
                        <Stack direction="row" spacing={1}>
                            {[...Array(5)].map((_, i) => (<Skeleton key={i} variant="rectangular" width={200} height={220} />))}
                        </Stack>
                    ) : (
                        <Carousel ariaLabel="albums">
                            {albums.data.map((al) => (
                                <AlbumCard
                                    key={al.id || al.name}
                                    album={{ id: al.id, name: al.name || al.title, artist: al.artist }}
                                    onOpen={(alb) => navigate(`/album/${encodeURIComponent(alb.id)}`)}
                                />
                            ))}
                        </Carousel>
                    )}
                </Stack>

                {/* Your Playlists Section */}
                <Stack spacing={2}>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Your Playlists</Typography>
                        <Button component={RouterLink} to="/playlists" variant="text">View all</Button>
                    </Stack>
                    {playlists.loading ? (
                        <Stack direction="row" spacing={1}>
                            {[...Array(5)].map((_, i) => (<Skeleton key={i} variant="rectangular" width={200} height={120} />))}
                        </Stack>
                    ) : playlists.data.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography>You don't have any playlists yet.</Typography>
                        </Paper>
                    ) : (
                        <Carousel ariaLabel="user-playlists">
                            {playlists.data.map((pl) => (
                                <PlaylistCard key={pl._id} playlist={pl} />
                            ))}
                        </Carousel>
                    )}
                </Stack>
            </Container>
        </>
    );
};

export default Home;
