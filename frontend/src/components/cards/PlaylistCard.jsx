import React from 'react';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';

const PlaylistCard = ({ playlist, onOpen }) => {
  return (
    <Card>
      <CardActionArea onClick={() => onOpen?.(playlist)}>
        <CardContent>
          <Typography variant="subtitle1" noWrap title={playlist.name} sx={{ fontWeight: 600 }}>{playlist.name}</Typography>
          <Typography variant="body2" color="text.secondary">{(playlist.tracks?.length || 0)} tracks</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default PlaylistCard;
