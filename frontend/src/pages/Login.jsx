import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../client.js';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Link,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    Security,
    ArrowBack
} from '@mui/icons-material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [code, setCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const response = await login(email, password);
            if (response && response.success && response.data && response.data.twoFactorRequired) {
                const { sessionId } = response.data;
                sessionStorage.setItem('pendingEmail', email);
                sessionStorage.setItem('pendingSessionId', sessionId);
                setMode('verify');
                setResendCooldown(30);
                const iv = setInterval(() => {
                    setResendCooldown(s => {
                        if (s <= 1) { clearInterval(iv); return 0; }
                        return s - 1;
                    })
                }, 1000);
                return;
            }
            if (response && response.success && response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                sessionStorage.removeItem('pendingEmail');
                sessionStorage.removeItem('pendingSessionId');
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

    const handleVerify = async (e) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const pending = sessionStorage.getItem('pendingEmail') || email;
            const sessionId = sessionStorage.getItem('pendingSessionId');
            const { verify2FA } = await import('../../client.js');
            const res = await verify2FA(pending, code, 'login', sessionId);
            if (res && res.success && res.data && res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user.username));
                sessionStorage.removeItem('pendingEmail');
                sessionStorage.removeItem('pendingSessionId');
                navigate('/home');
                return;
            }
            setMsg(res.message || 'Verification failed');
        } catch (err) {
            setMsg(err.message || 'Verification error');
        } finally {
            setLoading(false);
        }
    }

    const handleResend = async () => {
        setMsg(null);
        if (resendCooldown > 0) return;
        setLoading(true);
        try {
            const response = await login(email, password);
            if (response && response.success && response.data && response.data.sessionId) {
                sessionStorage.setItem('pendingSessionId', response.data.sessionId);
            }
            setMsg('Code resent');
            setResendCooldown(30);
            const iv = setInterval(() => {
                setResendCooldown(s => {
                    if (s <= 1) { clearInterval(iv); return 0; }
                    return s - 1;
                })
            }, 1000);
        } catch (err) {
            setMsg(err.message || 'Resend failed');
        } finally {
            setLoading(false);
        }
    }

    const handleBackToLogin = () => {
        setMode('login');
        setCode('');
        sessionStorage.removeItem('pendingEmail');
        sessionStorage.removeItem('pendingSessionId');
    }

    // restore pending verification state on mount
    React.useEffect(() => {
        const pendingEmail = sessionStorage.getItem('pendingEmail');
        const pendingSessionId = sessionStorage.getItem('pendingSessionId');
        if (pendingEmail && pendingSessionId) {
            setEmail(pendingEmail);
            setMode('verify');
        }
    }, []);

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: 400
                    }}
                >
                    <Typography component="h1" variant="h4" gutterBottom>
                        {mode === 'login' ? 'Sign In' : 'Verify 2FA'}
                    </Typography>

                    {msg && (
                        <Alert
                            severity={msg === 'Code resent' ? 'success' : 'error'}
                            sx={{ width: '100%', mb: 2 }}
                        >
                            {msg}
                        </Alert>
                    )}

                    {mode === 'login' && (
                        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </Box>
                    )}

                    {mode === 'verify' && (
                        <Box component="form" onSubmit={handleVerify} sx={{ mt: 1, width: '100%' }}>
                            <Typography variant="body1" gutterBottom align="center">
                                Enter the 6-digit code sent to {sessionStorage.getItem('pendingEmail') || email}
                            </Typography>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="code"
                                label="6-Digit Code"
                                name="code"
                                autoFocus
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                inputProps={{ maxLength: 6 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Security />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify'}
                            </Button>
                            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0 || loading}
                                >
                                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="text"
                                    onClick={handleBackToLogin}
                                    startIcon={<ArrowBack />}
                                >
                                    Back
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {mode === 'login' && (
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Don't have an account?{' '}
                            <Link href="/register" variant="body2">
                                Register here
                            </Link>
                        </Typography>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}

export default Login;