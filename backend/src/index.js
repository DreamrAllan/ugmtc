require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')

const path = require('path')

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const athleteRoutes = require('./routes/athletes')
const entryRoutes = require('./routes/entries')
const teamRoutes = require('./routes/team')

// Initialize
const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Build CORS origins list
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL)
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))
app.use(express.json())

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Make prisma available to routes
app.use((req, res, next) => {
    req.prisma = prisma
    next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/athletes', athleteRoutes)
app.use('/api/entries', entryRoutes)
app.use('/api/team', teamRoutes)

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

// Start server
app.listen(PORT, () => {
    console.log(`🚀 UGMTC Backend running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
})
