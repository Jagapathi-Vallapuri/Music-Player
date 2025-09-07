import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { login } from '../../client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Container, Paper, Typography, Alert, Link } from '@mui/material';
import LoginForm from '../components/auth/LoginForm.jsx';


const Login = () => {
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const auth = useAuth();

    const handleLogin = async ({ email: eEmail, password }) => {
        setMsg(null);
        setLoading(true);
        try {
            setEmail(eEmail);
            const response = await login(eEmail, password);
            if (response && response.success && response.data && response.data.token) {
                auth.login(response.data.token, response.data.user);
                navigate('/home');
                return;
            }
            setMsg(response.message || 'Login failed');
        } catch (error) {
            setMsg(error.message || 'Login error');
        } finally {
            setLoading(false);
        }
    }
    // Removed 2FA related hooks/state

    return (
        <>
            <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{
                    minHeight: 'calc(100vh - 64px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 6
                }}>
                                        <Paper
                                                elevation={0}
                                                sx={(theme) => ({
                                                        p: 5,
                                                        width: '100%',
                                                        maxWidth: 520,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'stretch',
                                                        gap: 2,
                                                        background: theme.palette.gradients.surface,
                                                        backdropFilter: 'blur(14px)',
                                                        borderRadius: 4,
                                                        boxShadow: theme.palette.mode === 'light'
                                                            ? '0 6px 24px rgba(0,0,0,0.08)'
                                                            : '0 8px 40px rgba(0,0,0,0.65)',
                                                        position: 'relative'
                                                })}
                                        >
                    <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center' }}>
                        Welcome Back
                    </Typography>

                    {msg && (
                        <Alert
                            severity={msg === 'Code resent' ? 'success' : 'error'}
                            sx={{ width: '100%', mb: 2 }}
                        >
                            {msg}
                        </Alert>
                    )}

                    <LoginForm onSubmit={handleLogin} loading={loading} initialEmail={email} />

                    <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                        Don't have an account?{' '}
                        <Link href="/register" variant="subtitle2" underline="hover" sx={{ fontWeight: 600 }}>
                            Create one
                        </Link>
                    </Typography>
                </Paper>
            </Box>
        </Container>
        </>
    );
}

export default Login;