import React from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography, Avatar, LinearProgress } from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import { usePlayer } from '../context/PlayerContext.jsx';

const PlayerBar = () => {
  const { current, playing, togglePlay, progress } = usePlayer();
  const pct = progress.duration ? Math.min(100, (progress.currentTime / progress.duration) * 100) : 0;
  if (!current) return null;
  return (
    <AppBar position="fixed" color="default" sx={{ top: 'auto', bottom: 0, bgcolor: 'background.paper', borderTop: (t) => `1px solid ${t.palette.divider}` }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar variant="rounded" src={current.image} alt={current.title} sx={{ width: 40, height: 40 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>{current.title}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{current.artist || 'Unknown Artist'}</Typography>
        </Box>
        <IconButton color="primary" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Toolbar>
      <LinearProgress variant="determinate" value={pct} sx={{ height: 2 }} />
    </AppBar>
  );
};

export default PlayerBar;
