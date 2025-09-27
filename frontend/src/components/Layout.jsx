import React from 'react';
import { Container, Box } from '@mui/material';

const Layout = ({ maxWidth = 'md', children, center = false }) => {
  return (
    <Container maxWidth={maxWidth} sx={{ pt: 6, pb: 10 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        ...(center && { alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)' })
      }}>
        {children}
      </Box>
    </Container>
  );
};

export default Layout;
