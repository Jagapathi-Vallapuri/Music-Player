import React, { useMemo, useState } from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography, Avatar, Slider, Stack, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { usePlayer } from '../context/PlayerContext.jsx';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import QueueDrawer from './QueueDrawer.jsx';
import ShuffleIcon from '@mui/icons-material/Shuffle';

const PlayerBar = () => {
  const { current, playing, togglePlay, progress, seekTo, next, prev, volume, setVolume, muted, toggleMute, queue, index, shuffleUpcoming } = usePlayer();
  const [queueOpen, setQueueOpen] = useState(false);
  const theme = useTheme();
  const uiColor = theme.palette.mode === 'light' ? '#fff' : '#000';
  const pct = progress.duration ? Math.max(0, Math.min(100, (progress.currentTime / progress.duration) * 100)) : 0;
  const timeLabel = useMemo(() => {
    const fmt = (s) => {
      if (!Number.isFinite(s)) return '0:00';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };
    return `${fmt(progress.currentTime)} / ${fmt(progress.duration || 0)}`;
  }, [progress]);
  const isEmpty = !current && (!queue || queue.length === 0);
  const placeholder = {
    title: 'Nothing playing',
    artist: queue && queue.length ? `${queue.length} track(s) in queue` : 'Add a song to get started',
    image: undefined,
  };
  return (
    <AppBar position="fixed" color="default" sx={{ top: 'auto', bottom: 0, bgcolor: 'background.paper', borderTop: (t) => `1px solid ${t.palette.divider}` }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25, minHeight: 48 }}>
        {/* Left: track info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1, color: uiColor }}>
          <Avatar variant="square" src={(current || placeholder).image} alt={(current || placeholder).title} sx={{ width: 30, height: 30 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, lineHeight: 1.2, color: uiColor }}>{(current || placeholder).title}</Typography>
            <Typography variant="caption" noWrap sx={{ color: uiColor }}>{(current || placeholder).artist}</Typography>
          </Box>
        </Box>

        {/* Center: playback controls + seek */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', flex: 2, mx: 'auto', color: uiColor }}>
          <IconButton onClick={prev} disabled={index <= 0} aria-label="Previous" size="small" sx={{ color: uiColor, opacity: index <= 0 ? 0.5 : 1 }}>
            <SkipPreviousIcon />
          </IconButton>
          <IconButton onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} size="medium" sx={{ color: uiColor }}>
            {playing ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton onClick={next} disabled={!queue || index >= (queue.length - 1)} aria-label="Next" size="small" sx={{ color: uiColor, opacity: !queue || index >= (queue.length - 1) ? 0.5 : 1 }}>
            <SkipNextIcon />
          </IconButton>
          <Tooltip title="Shuffle upcoming">
            {/* MUI recommends wrapping disabled button in a span for Tooltip */}
            <span>
              <IconButton onClick={shuffleUpcoming} aria-label="Shuffle" size="small" sx={{ color: uiColor }} disabled={!queue || queue.length <= 2}>
                <ShuffleIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Queue">
            <IconButton onClick={() => setQueueOpen(true)} aria-label="Open queue" size="small" sx={{ color: uiColor }}>
              <QueueMusicIcon />
            </IconButton>
          </Tooltip>
          {/* Seek slider inline */}
          <Typography variant="caption" sx={{ color: uiColor, ml: 1 }}>{timeLabel.split(' / ')[0]}</Typography>
          <Slider
            aria-label="Seek"
            size="small"
            value={pct}
            onChange={(_, v) => {
              if (!progress.duration) return;
              const pctVal = Array.isArray(v) ? v[0] : v;
              const sec = (pctVal / 100) * progress.duration;
              seekTo(sec);
            }}
            sx={{
              mx: 1,
              maxWidth: { xs: 240, sm: 340, md: 420 },
              color: uiColor,
              '& .MuiSlider-thumb': { color: uiColor },
              '& .MuiSlider-track': { color: uiColor },
              '& .MuiSlider-rail': { color: uiColor, opacity: 0.3 },
            }}
          />
          <Typography variant="caption" sx={{ color: uiColor }}>{timeLabel.split(' / ')[1]}</Typography>
        </Box>

        {/* Right: volume */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', flex: 1, color: uiColor }}>
          <IconButton onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} size="small" sx={{ color: uiColor }}>
            {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
          <Slider
            aria-label="Volume"
            size="small"
            value={(muted ? 0 : volume) * 100}
            onChange={(_, v) => {
              const pctVal = Array.isArray(v) ? v[0] : v;
              setVolume((pctVal || 0) / 100);
            }}
            sx={{ width: { xs: 80, sm: 120 }, color: uiColor, '& .MuiSlider-thumb': { color: uiColor }, '& .MuiSlider-track': { color: uiColor }, '& .MuiSlider-rail': { color: uiColor, opacity: 0.3 } }}
          />
        </Box>
      </Toolbar>
      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
    </AppBar>
  );
};

export default PlayerBar;
