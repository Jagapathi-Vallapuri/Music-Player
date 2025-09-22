import React from 'react';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';

const PlaylistCard = ({ playlist, onOpen }) => {
  const cover = playlist.coverUrl || `https://picsum.photos/seed/playlist-${encodeURIComponent(playlist._id || playlist.name)}/300/300`;
  return (
    <Card>
      <CardActionArea onClick={() => onOpen?.(playlist)}>
        <CardMedia component="img" height="140" image={cover} alt={playlist.name} />
        <CardContent>
          <Typography variant="subtitle1" noWrap title={playlist.name} sx={{ fontWeight: 600 }}>{playlist.name}</Typography>
          <Typography variant="body2" color="text.secondary">{(playlist.tracks?.length || 0)} tracks</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default PlaylistCard;
