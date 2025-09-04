import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../client.js';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState(null);
    const navigate = useNavigate();
    const [mode, setMode] = useState('login');
    const [code, setCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMsg(null);
        try {
            const response = await login(email, password);
            if (response && response.success && response.data && response.data.twoFactorRequired) {
                sessionStorage.setItem('pendingEmail', email);
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
                navigate('/dashboard');
                return;
            }
            setMsg(response.message || 'Login failed');
        } catch (error) {
            setMsg(error.message || 'Login error');
        }
    }

    const handleVerify = async (e) => {
        e.preventDefault();
        setMsg(null);
        try {
            const pending = sessionStorage.getItem('pendingEmail') || email;
            const { verify2FA } = await import('../../client.js');
            const res = await verify2FA(pending, code, 'login');
            if (res && res.success && res.data && res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                sessionStorage.removeItem('pendingEmail');
                navigate('/dashboard');
                return;
            }
            setMsg(res.message || 'Verification failed');
        } catch (err) {
            setMsg(err.message || 'Verification error');
        }
    }

    const handleResend = async () => {
        setMsg(null);
        if (resendCooldown > 0) return;
        try {
            await login(email, password);
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
        }
    }

    const handleBackToLogin = () => {
        setMode('login');
        setCode('');
        sessionStorage.removeItem('pendingEmail');
    }

    return (
        <>
            {mode === 'login' && (
                <form onSubmit={handleLogin}>
                    <input type="email" placeholder="Email" name="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" name="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit">Login</button>
                </form>
            )}

            {mode === 'verify' && (
                <form onSubmit={handleVerify}>
                    <p>Enter the 6-digit code sent to {sessionStorage.getItem('pendingEmail') || email}</p>
                    <input placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value)} required />
                    <button type="submit">Verify</button>
                    <button type="button" onClick={handleResend} disabled={resendCooldown > 0}>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}</button>
                    <button type="button" onClick={handleBackToLogin}>Back</button>
                </form>
            )}

            {msg && <p>{msg}</p>}
            <p>
                Don't have an account? <a href="/register">Register</a>
            </p>
        </>
    );
}

export default Login;