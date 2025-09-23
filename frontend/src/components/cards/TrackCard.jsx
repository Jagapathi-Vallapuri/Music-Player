import React from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, IconButton, Typography, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';

const TrackCard = ({ track, onPlay, onFavorite, isFavorite = false, onToggleFavorite }) => {
  const cover = track.image || track.cover || track.albumImage || `https://picsum.photos/seed/${encodeURIComponent(track.id)}/300/300`;
  return (
    <Card sx={(theme) => ({ background: theme.palette.gradients.surface })}>
      <CardActionArea onClick={() => onPlay?.(track)}>
        <CardMedia component="img" height="160" image={cover} alt={track.title} />
      </CardActionArea>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap title={track.title} sx={{ fontWeight: 600 }}>{track.title}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap title={track.artist}>{track.artist}</Typography>
        </Box>
        <Box>
          <Tooltip title="Play">
            <IconButton size="small" onClick={() => onPlay?.(track)}>
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFavorite ? 'Unfavorite' : 'Favorite'}>
            <IconButton size="small" color={isFavorite ? 'error' : 'default'} onClick={() => (onToggleFavorite ? onToggleFavorite(track, !isFavorite) : onFavorite?.(track))}>
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrackCard;
