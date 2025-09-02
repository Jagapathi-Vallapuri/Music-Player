const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { send2FACode } = require('../services/emailService');
const cache = require('../services/cacheService');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });

        await newUser.save();

        res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            data: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error registering user', 
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await cache.set(`2fa:${user._id}`, code, 300);
        await send2FACode(user.email, code);
        return res.status(200).json({
            success: true,
            message: '2FA code sent to your email. Please verify to complete login.',
            data: { user: { id: user._id, username: user.username, email: user.email }, twoFactorRequired: true }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed', 
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

// Unified 2FA verification endpoint
const verify2FAUnified = async (req, res) => {
    try {
        const { email, code, type } = req.body;
        if (!type || !['login', 'password-change'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing type. Must be "login" or "password-change"' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }
        if (!(await verify2FACode(user._id, code))) {
            return res.status(401).json({ success: false, message: 'Invalid or expired 2FA code' });
        }
        
        if (type === 'login') {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });
            return res.json({
                success: true,
                message: '2FA verification successful',
                data: {
                    token,
                    user: { id: user._id, username: user.username, email: user.email }
                }
            });
        } else if (type === 'password-change') {
            // Apply pending password change
            const pendingPassword = await cache.get(`pendingPassword:${user._id}`);
            if (pendingPassword) {
                user.password = pendingPassword;
                await user.save();
                await cache.del(`pendingPassword:${user._id}`);
            }
            return res.json({
                success: true,
                message: 'Password change confirmed successfully'
            });
        }
    } catch (err) {
        console.error('Unified 2FA verification error:', err);
        res.status(500).json({ success: false, message: '2FA verification failed', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
    }
};

// Change password with 2FA
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Generate 2FA code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await cache.set(`2fa:${user._id}`, code, 300);
        await cache.set(`pendingPassword:${user._id}`, await bcrypt.hash(newPassword, 10), 300);
        await send2FACode(user.email, code);

        res.json({ success: true, message: '2FA code sent to your email. Please verify to confirm password change.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, message: 'Password change failed', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
    }
};

// Helper function to verify 2FA code and set verified flag
const verify2FACode = async (userId, code) => {
    const storedCode = await cache.get(`2fa:${userId}`);
    if (!storedCode || storedCode !== code) {
        return false;
    }
    await cache.del(`2fa:${userId}`);
    await set2FAVerified(userId);
    return true;
};

const is2FAVerified = async (userId) => {
    const verified = await cache.get(`2faVerified:${userId}`);
    return verified === 'true';
};

const set2FAVerified = async (userId) => {
    await cache.set(`2faVerified:${userId}`, 'true', 300);
};

module.exports = { register, login, verify2FAUnified, changePassword, is2FAVerified, set2FAVerified, verify2FACode };