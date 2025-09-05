import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from "../../client.js";
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
    Person,
    Email,
    Lock,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setMsg('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setMsg('Password must be at least 6 characters long');
            return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setMsg('Password must contain at least one lowercase letter, one uppercase letter, and one number');
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMsg(null);

        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await register(formData.username, formData.email, formData.password);
            if (response && response.success) {
                setMsg('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setMsg(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error("Registration error:", error);
            setMsg(error.message || 'Registration error');
        } finally {
            setLoading(false);
        }
    };

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
                        Create Account
                    </Typography>

                    {msg && (
                        <Alert
                            severity={msg.includes('successful') ? 'success' : 'error'}
                            sx={{ width: '100%', mb: 2 }}
                        >
                            {msg}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleRegister} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={formData.username}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
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
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
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
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle confirm password visibility"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </Box>

                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Already have an account?{' '}
                        <Link href="/" variant="body2">
                            Sign in here
                        </Link>
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
}

export default Register;