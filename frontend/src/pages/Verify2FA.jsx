import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verify2FA } from '../../client.js';

export default function Verify2FA() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingEmail');
    if (pending) {
      setEmail(pending);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await verify2FA(email, code, 'login');
      if (res && res.success) {
        const token = res.data?.token;
        const user = res.data?.user;
        if (token) {
          localStorage.setItem('token', token);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        sessionStorage.removeItem('pendingEmail');
        navigate('/dashboard');
      } else {
        setMsg(res.message || 'Verification failed');
      }
    } catch (err) {
      setMsg(err.message || 'Verification error');
    }
  };

  const resend = async () => {
    setMsg('Resending code...');
    try {
      await fetch(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api' + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setMsg('Code resent');
    } catch (err) {
      setMsg('Resend failed');
    }
  }

  return (
    <div>
      <h2>Verify 2FA</h2>
      <p>A 6-digit code has been sent to {email}</p>
      <form onSubmit={submit}>
        <input placeholder="Enter code" value={code} onChange={e => setCode(e.target.value)} />
        <button type="submit">Verify</button>
      </form>
      <button onClick={resend}>Resend code</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
