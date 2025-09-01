const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { send2FACode } = require('../services/emailService');

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

        // Always send 2FA code for all users
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.twoFactorCode = code;
        user.twoFactorCodeExpires = expires;
        await user.save();
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

// 2FA verification endpoint
const verify2FA = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }
        if (!user.twoFactorCode || !user.twoFactorCodeExpires || user.twoFactorCodeExpires < new Date()) {
            return res.status(400).json({ success: false, message: '2FA code expired or not generated' });
        }
        if (user.twoFactorCode !== code) {
            return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
        }
        // Clear code after successful verification
        user.twoFactorCode = null;
        user.twoFactorCodeExpires = null;
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({
            success: true,
            message: '2FA verification successful',
            data: {
                token,
                user: { id: user._id, username: user.username, email: user.email }
            }
        });
    } catch (err) {
        console.error('2FA verification error:', err);
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
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.twoFactorCode = code;
        user.twoFactorCodeExpires = expires;
        await user.save();
        await send2FACode(user.email, code);

        // Store new password temporarily (will be updated after 2FA)
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: '2FA code sent to your email. Please verify to confirm password change.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, message: 'Password change failed', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
    }
};

module.exports = { register, login, verify2FA, changePassword };