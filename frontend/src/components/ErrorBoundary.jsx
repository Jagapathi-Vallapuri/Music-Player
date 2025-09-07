import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI error boundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Paper elevation={0} sx={{ p: 5, maxWidth: 520, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>Something went wrong</Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              An unexpected error occurred while rendering the application.
            </Typography>
            <Button variant="contained" onClick={this.handleReload}>Reload Page</Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
