const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// GET /api/users - List all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await req.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                teamName: true,
                phone: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        athletes: true,
                        entries: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        res.json({ users })
    } catch (err) {
        console.error('Get users error:', err)
        res.status(500).json({ error: 'Failed to fetch users' })
    }
})

// PATCH /api/users/:id/role - Update user role (admin only)
router.patch('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { role } = req.body

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Use "user" or "admin"' })
        }

        // Prevent demoting the original admin
        const user = await req.prisma.user.findUnique({ where: { id } })
        if (user?.email === 'admin@ugmtc.com' && role === 'user') {
            return res.status(400).json({ error: 'Cannot demote the default admin' })
        }

        const updatedUser = await req.prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                teamName: true,
                phone: true,
                role: true,
                createdAt: true
            }
        })

        res.json({ user: updatedUser })
    } catch (err) {
        console.error('Update role error:', err)
        res.status(500).json({ error: 'Failed to update role' })
    }
})

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params

        // Prevent deleting the original admin
        const user = await req.prisma.user.findUnique({ where: { id } })
        if (user?.email === 'admin@ugmtc.com') {
            return res.status(400).json({ error: 'Cannot delete the default admin' })
        }

        await req.prisma.user.delete({ where: { id } })

        res.json({ message: 'User deleted successfully' })
    } catch (err) {
        console.error('Delete user error:', err)
        res.status(500).json({ error: 'Failed to delete user' })
    }
})

module.exports = router
