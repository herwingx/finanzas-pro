import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../services/database';

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  console.log('📝 Register attempt:', { email, name, hasPassword: !!password });

  if (!email || !password || !name) {
    console.log('❌ Registration failed: Missing fields', { email: !!email, password: !!password, name: !!name });
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    console.log('✅ User registered successfully:', user.email);
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.log('❌ Registration error:', error);
    res.status(400).json({ message: 'User already exists or invalid data' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt:', { email, hasPassword: !!password });

  if (!email || !password) {
    console.log('❌ Login failed: Missing credentials');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('❌ Login failed: User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    console.log('✅ Login successful:', email);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.log('❌ Login error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Request password reset
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;

  console.log('🔄 Password reset request for:', email);

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Don't reveal if user exists or not for security
    if (!user) {
      console.log('⚠️  Reset requested for non-existent email:', email);
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    // Generate a random token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In production, you would send an email here
    // For development, we'll log the token
    console.log('✅ Reset token generated for:', email);
    console.log('🔑 Token:', resetToken);
    console.log('⏰ Expires:', resetTokenExpiry);
    console.log('🔗 Reset URL: http://192.168.1.105/reset-password?token=' + resetToken);

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    console.log('❌ Error requesting password reset:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  console.log('🔐 Password reset attempt with token');

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      console.log('❌ Invalid or expired reset token');
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('✅ Password reset successful for:', user.email);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.log('❌ Error resetting password:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

export default router;
