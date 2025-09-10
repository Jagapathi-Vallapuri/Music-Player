import React, { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Header = ({ title = 'Pulse' }) => {
  const auth = useAuth();
  const { themeMode, toggleTheme } = useTheme();

  const [avatarUrl, setAvatarUrl] = useState(null);
  useEffect(() => {
    let active = true;
    const fetchAvatar = async () => {
      if (auth?.isAuthenticated && auth.user?.avatarFilename) {
        try {
          const baseApi = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
          const token = localStorage.getItem('token');
          const res = await fetch(`${baseApi}/users/me/avatar?cacheBust=${auth.user.avatarFilename}`, {
            headers: { Authorization: token ? `Bearer ${token}` : undefined }
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            if (active) {
              setAvatarUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
            } else {
              URL.revokeObjectURL(url);
            }
          } else {
            setAvatarUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
          }
        } catch (_) {
          setAvatarUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
        }
      } else {
        setAvatarUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
      }
    };
    fetchAvatar();
    return () => { active = false; setAvatarUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; }); };
  }, [auth?.user?.avatarFilename, auth?.isAuthenticated]);

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton edge="start" color="inherit" aria-label="logo" sx={{ mr: 1 }}>
            <MusicNoteIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={toggleTheme} aria-label="toggle theme">
            {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          
          {auth && auth.isAuthenticated ? (
            <>
              <Box component={RouterLink} to="/profile" sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                mr: 1,
                '&:hover .username': { textDecoration: 'underline' }
              }}>
                <Avatar
                  alt={auth.user?.username}
                  src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(auth.user?.username || 'User')}`}
                  sx={{ width: 36, height: 36, mr: 1, border: (theme) => `2px solid ${theme.palette.primary.light}` }}
                />
                <Typography component="span" className="username" sx={{ fontWeight: 500 }}>
                  {auth.user?.username || 'User'}
                </Typography>
              </Box>
              <Button color="inherit" onClick={auth.logout}>Logout</Button>
            </>
          ) : (
            <Button color="inherit" href="/">Sign In</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
