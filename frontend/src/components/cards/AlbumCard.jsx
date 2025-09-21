import React from 'react';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';

const AlbumCard = ({ album, onOpen }) => {
  const cover = album.image || album.cover || `https://picsum.photos/seed/album-${encodeURIComponent(album.id || album.name)}/300/300`;
  return (
    <Card>
      <CardActionArea onClick={() => onOpen?.(album)}>
        <CardMedia component="img" height="160" image={cover} alt={album.name} />
        <CardContent>
          <Typography variant="subtitle1" noWrap title={album.name} sx={{ fontWeight: 600 }}>{album.name}</Typography>
          {album.artist && <Typography variant="body2" color="text.secondary" noWrap title={album.artist}>{album.artist}</Typography>}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AlbumCard;
