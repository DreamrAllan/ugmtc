const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { generateToken, authenticateToken } = require('../middleware/auth')
const {
    sendVerificationEmail,
    sendPasswordResetEmail
} = require('../services/email')

const router = express.Router()

// Generate random token
const generateRandomToken = () => crypto.randomBytes(32).toString('hex')

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, teamName, phone } = req.body

        // Validate required fields
        if (!email || !password || !name || !teamName) {
            return res.status(400).json({
                error: 'Email, password, name, and teamName are required'
            })
        }

        // Check if email already exists
        const existingUser = await req.prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return res.status(400).json({ error: 'Email sudah terdaftar' })
        }

        // Hash password and generate verification token
        const hashedPassword = await bcrypt.hash(password, 10)
        const emailVerifyToken = generateRandomToken()

        // Create user
        const user = await req.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                teamName,
                phone: phone || null,
                role: 'user',
                emailVerified: false,
                emailVerifyToken
            }
        })

        // Send verification email
        await sendVerificationEmail(email, name, emailVerifyToken)

        // Generate token
        const token = generateToken(user.id)

        // Return user without password
        const { password: _, emailVerifyToken: __, ...userWithoutSensitive } = user

        res.status(201).json({
            user: userWithoutSensitive,
            token,
            message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.'
        })
    } catch (err) {
        console.error('Register error:', err)
        res.status(500).json({ error: 'Registration failed' })
    }
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body

        if (!token) {
            return res.status(400).json({ error: 'Verification token required' })
        }

        const user = await req.prisma.user.findFirst({
            where: { emailVerifyToken: token }
        })

        if (!user) {
            return res.status(400).json({ error: 'Token tidak valid atau sudah digunakan' })
        }

        // Update user
        await req.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null
            }
        })

        res.json({ message: 'Email berhasil diverifikasi!' })
    } catch (err) {
        console.error('Verify email error:', err)
        res.status(500).json({ error: 'Verification failed' })
    }
})

// POST /api/auth/resend-verification
router.post('/resend-verification', authenticateToken, async (req, res) => {
    try {
        if (req.user.emailVerified) {
            return res.status(400).json({ error: 'Email sudah terverifikasi' })
        }

        const emailVerifyToken = generateRandomToken()

        await req.prisma.user.update({
            where: { id: req.user.id },
            data: { emailVerifyToken }
        })

        await sendVerificationEmail(req.user.email, req.user.name, emailVerifyToken)

        res.json({ message: 'Email verifikasi telah dikirim ulang' })
    } catch (err) {
        console.error('Resend verification error:', err)
        res.status(500).json({ error: 'Failed to resend verification' })
    }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        const user = await req.prisma.user.findUnique({
            where: { email }
        })

        // Don't reveal if user exists
        if (!user) {
            return res.json({ message: 'Jika email terdaftar, link reset password akan dikirim' })
        }

        // Generate reset token
        const resetToken = generateRandomToken()
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Save reset token
        await req.prisma.passwordReset.create({
            data: {
                token: resetToken,
                expiresAt,
                userId: user.id
            }
        })

        // Send email
        await sendPasswordResetEmail(email, user.name, resetToken)

        res.json({ message: 'Jika email terdaftar, link reset password akan dikirim' })
    } catch (err) {
        console.error('Forgot password error:', err)
        res.status(500).json({ error: 'Failed to process request' })
    }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password minimal 6 karakter' })
        }

        // Find valid reset token
        const resetRecord = await req.prisma.passwordReset.findFirst({
            where: {
                token,
                used: false,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        })

        if (!resetRecord) {
            return res.status(400).json({ error: 'Token tidak valid atau sudah kadaluarsa' })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update password and mark token as used
        await req.prisma.$transaction([
            req.prisma.user.update({
                where: { id: resetRecord.userId },
                data: { password: hashedPassword }
            }),
            req.prisma.passwordReset.update({
                where: { id: resetRecord.id },
                data: { used: true }
            })
        ])

        res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' })
    } catch (err) {
        console.error('Reset password error:', err)
        res.status(500).json({ error: 'Failed to reset password' })
    }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        // Find user
        const user = await req.prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(401).json({ error: 'Email atau password salah' })
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ error: 'Email atau password salah' })
        }

        // Generate token
        const token = generateToken(user.id)

        // Return user without sensitive data
        const { password: _, emailVerifyToken: __, ...userWithoutSensitive } = user

        res.json({
            user: userWithoutSensitive,
            token
        })
    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({ error: 'Login failed' })
    }
})

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
    // Get fresh user data
    const user = await req.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            teamName: true,
            phone: true,
            role: true,
            emailVerified: true,
            createdAt: true
        }
    })
    res.json({ user })
})

// POST /api/auth/logout - Just for consistency (client should delete token)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logged out successfully' })
})

module.exports = router
