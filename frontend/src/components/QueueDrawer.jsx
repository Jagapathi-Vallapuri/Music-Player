import React, { useMemo, useState } from 'react';
import { Drawer, Box, IconButton, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Tooltip, Button } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function QueueDrawer({ open, onClose }) {
  const { queue, index, move, removeAt, playAt, clearQueue, togglePlay, playing } = usePlayer();
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleDragStart = (i) => (e) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(i)); } catch {}
  };
  const handleDragOver = (i) => (e) => {
    e.preventDefault();
    setOverIndex(i);
  };
  const handleDrop = (i) => (e) => {
    e.preventDefault();
    const from = dragIndex != null ? dragIndex : parseInt(e.dataTransfer.getData('text/plain'), 10);
    const to = i;
    if (Number.isInteger(from) && Number.isInteger(to)) move(from, to);
    setDragIndex(null);
    setOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setOverIndex(null); };

  const empty = !queue || queue.length === 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Up Next</Typography>
        {!empty && (
          <Button size="small" color="secondary" onClick={clearQueue}>Clear</Button>
        )}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      {empty ? (
        <Box sx={{ p: 3, color: 'text.secondary' }}>
          <Typography>No tracks in the queue.</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {queue.map((t, i) => {
            const isCurrent = i === index;
            const isPlaying = isCurrent && playing;
            return (
            <React.Fragment key={`${t.id || t.title}-${i}`}>
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={isCurrent ? (isPlaying ? 'Pause' : 'Play') : 'Play'}>
                      <IconButton edge="end" onClick={() => (isCurrent ? togglePlay() : playAt(i))} size="small" color={isCurrent ? 'primary' : 'default'}>
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton edge="end" onClick={() => removeAt(i)} size="small">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Drag to reorder">
                      <IconButton edge="end" draggable onDragStart={handleDragStart(i)} onDragEnd={handleDragEnd} size="small">
                        <DragIndicatorIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
                onDragOver={handleDragOver(i)}
                onDrop={handleDrop(i)}
                selected={i === index}
              >
                <ListItemAvatar>
                  <Avatar variant="rounded" src={t.image} alt={t.title} />
                </ListItemAvatar>
                <ListItemText
                  primary={t.title}
                  secondary={t.artist}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
            );
          })}
        </List>
      )}
    </Drawer>
  );
}
