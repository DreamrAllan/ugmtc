const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)

        // Get user from database
        const user = await req.prisma.user.findUnique({
            where: { id: decoded.userId }
        })

        if (!user) {
            return res.status(401).json({ error: 'User not found' })
        }

        // Remove password from user object
        const { password, ...userWithoutPassword } = user
        req.user = userWithoutPassword
        next()
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' })
    }
}

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
    }
    next()
}

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
}

module.exports = {
    authenticateToken,
    requireAdmin,
    generateToken
}
