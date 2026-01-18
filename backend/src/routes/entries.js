const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const {
    sendEntrySubmittedEmail,
    sendEntryApprovedEmail,
    sendEntryRejectedEmail
} = require('../services/email')

const router = express.Router()

// GET /api/entries - List entries (filtered by role)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query

        const where = req.user.role === 'admin'
            ? {}
            : { userId: req.user.id }

        if (status) {
            where.status = status
        }

        const entries = await req.prisma.entry.findMany({
            where,
            include: {
                athlete: true,
                user: {
                    select: { id: true, name: true, teamName: true, email: true }
                },
                reviewedBy: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        res.json({ entries })
    } catch (err) {
        console.error('Get entries error:', err)
        res.status(500).json({ error: 'Failed to fetch entries' })
    }
})

// GET /api/entries/stats - Get entry statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [pending, approved, rejected, total] = await Promise.all([
            req.prisma.entry.count({ where: { status: 'pending' } }),
            req.prisma.entry.count({ where: { status: 'approved' } }),
            req.prisma.entry.count({ where: { status: 'rejected' } }),
            req.prisma.entry.count()
        ])

        res.json({ pending, approved, rejected, total })
    } catch (err) {
        console.error('Get stats error:', err)
        res.status(500).json({ error: 'Failed to fetch stats' })
    }
})

// Helper: Check if team profile is complete
async function checkTeamProfileComplete(prisma, userId) {
    const profile = await prisma.teamProfile.findUnique({
        where: { userId },
        include: { coaches: true }
    })
    return profile && profile.logoUrl && profile.coaches.length >= 1
}

// POST /api/entries - Create new entry (as draft)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { athleteId, category, eventType, ageClass, weightClass, teamName } = req.body

        // Check team profile is complete first
        const isProfileComplete = await checkTeamProfileComplete(req.prisma, req.user.id)
        if (!isProfileComplete) {
            return res.status(400).json({
                error: 'Lengkapi profil tim terlebih dahulu (upload logo dan tambah minimal 1 pelatih)'
            })
        }

        // Validate required fields
        if (!athleteId || !category || !eventType || !ageClass) {
            return res.status(400).json({ error: 'athleteId, category, eventType, and ageClass are required' })
        }

        // Verify athlete belongs to user
        const athlete = await req.prisma.athlete.findFirst({
            where: { id: athleteId, userId: req.user.id }
        })

        if (!athlete) {
            return res.status(404).json({ error: 'Athlete not found' })
        }

        // Create entry as DRAFT (not pending)
        const entry = await req.prisma.entry.create({
            data: {
                athleteId,
                userId: req.user.id,
                teamName: teamName || req.user.teamName,
                category,
                eventType,
                ageClass,
                weightClass: weightClass || null,
                status: 'draft'  // Changed from 'pending' to 'draft'
            },
            include: {
                athlete: true
            }
        })

        // No email for drafts - only when submitted
        res.status(201).json({
            entry,
            message: 'Entry berhasil disimpan sebagai draft. Klik "Kirim ke Admin" untuk mengirim semua entry.'
        })
    } catch (err) {
        console.error('Create entry error:', err)
        res.status(500).json({ error: 'Failed to create entry' })
    }
})

// PATCH /api/entries/:id - Update entry (only if draft)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const { category, eventType, ageClass, weightClass } = req.body

        // Check ownership and status - only drafts can be edited
        const existing = await req.prisma.entry.findFirst({
            where: { id, userId: req.user.id, status: 'draft' }
        })

        if (!existing) {
            return res.status(404).json({ error: 'Entry tidak ditemukan atau sudah tidak bisa diedit' })
        }

        const entry = await req.prisma.entry.update({
            where: { id },
            data: {
                category: category || existing.category,
                eventType: eventType || existing.eventType,
                ageClass: ageClass || existing.ageClass,
                weightClass: weightClass !== undefined ? weightClass : existing.weightClass
            },
            include: { athlete: true }
        })

        res.json({ entry })
    } catch (err) {
        console.error('Update entry error:', err)
        res.status(500).json({ error: 'Failed to update entry' })
    }
})

// DELETE /api/entries/:id - Delete entry (only if draft)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params

        // Check ownership and status - only drafts can be deleted
        const existing = await req.prisma.entry.findFirst({
            where: { id, userId: req.user.id, status: 'draft' }
        })

        if (!existing) {
            return res.status(404).json({ error: 'Entry tidak ditemukan atau sudah tidak bisa dihapus' })
        }

        await req.prisma.entry.delete({ where: { id } })

        res.json({ message: 'Entry berhasil dihapus' })
    } catch (err) {
        console.error('Delete entry error:', err)
        res.status(500).json({ error: 'Failed to delete entry' })
    }
})

// POST /api/entries/submit-drafts - Submit all draft entries to admin
router.post('/submit-drafts', authenticateToken, async (req, res) => {
    try {
        // Get all draft entries for this user
        const drafts = await req.prisma.entry.findMany({
            where: { userId: req.user.id, status: 'draft' },
            include: { athlete: true }
        })

        if (drafts.length === 0) {
            return res.status(400).json({ error: 'Tidak ada entry draft untuk dikirim' })
        }

        // Update all drafts to pending
        const result = await req.prisma.entry.updateMany({
            where: { userId: req.user.id, status: 'draft' },
            data: { status: 'pending' }
        })

        // Get user for email
        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id }
        })

        res.json({
            count: result.count,
            message: `${result.count} entry berhasil dikirim ke admin! Notifikasi telah dikirim ke email Anda.`
        })

        // Send email notification in background (non-blocking)
        try {
            const athleteNames = drafts.map(d => d.athlete.fullName).join(', ')
            sendEntrySubmittedEmail(
                user.email,
                user.name,
                user.teamName,
                athleteNames,
                `${drafts.length} entry atlet`
            ).catch(emailErr => console.error('Email send error:', emailErr))
        } catch (emailErr) {
            console.error('Email notification error:', emailErr)
        }
    } catch (err) {
        console.error('Submit drafts error:', err)
        res.status(500).json({ error: 'Gagal mengirim entry' })
    }
})

// PATCH /api/entries/:id/approve - Approve entry (admin only)
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { notes } = req.body

        const entry = await req.prisma.entry.update({
            where: { id },
            data: {
                status: 'approved',
                reviewedAt: new Date(),
                reviewedById: req.user.id,
                notes: notes || null
            },
            include: {
                athlete: true,
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        // Send approval notification email
        const categoryDisplay = `${entry.category} - ${entry.eventType} (${entry.ageClass}${entry.weightClass ? ', ' + entry.weightClass : ''})`
        await sendEntryApprovedEmail(
            entry.user.email,
            entry.user.name,
            entry.athlete.fullName,
            categoryDisplay,
            notes
        )

        res.json({
            entry,
            message: 'Entry approved! Notifikasi telah dikirim ke email pendaftar.'
        })
    } catch (err) {
        console.error('Approve entry error:', err)
        res.status(500).json({ error: 'Failed to approve entry' })
    }
})

// PATCH /api/entries/:id/reject - Reject entry (admin only)
router.patch('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { notes } = req.body

        const entry = await req.prisma.entry.update({
            where: { id },
            data: {
                status: 'rejected',
                reviewedAt: new Date(),
                reviewedById: req.user.id,
                notes: notes || null
            },
            include: {
                athlete: true,
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        // Send rejection notification email
        const categoryDisplay = `${entry.category} - ${entry.eventType} (${entry.ageClass}${entry.weightClass ? ', ' + entry.weightClass : ''})`
        await sendEntryRejectedEmail(
            entry.user.email,
            entry.user.name,
            entry.athlete.fullName,
            categoryDisplay,
            notes
        )

        res.json({
            entry,
            message: 'Entry rejected. Notifikasi telah dikirim ke email pendaftar.'
        })
    } catch (err) {
        console.error('Reject entry error:', err)
        res.status(500).json({ error: 'Failed to reject entry' })
    }
})

// POST /api/entries/bulk-approve - Bulk approve entries (admin only)
router.post('/bulk-approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { entryIds } = req.body

        if (!Array.isArray(entryIds) || entryIds.length === 0) {
            return res.status(400).json({ error: 'entryIds array is required' })
        }

        // Get entries with user info for notifications
        const entries = await req.prisma.entry.findMany({
            where: { id: { in: entryIds } },
            include: {
                athlete: true,
                user: { select: { id: true, name: true, email: true } }
            }
        })

        // Update all entries
        const result = await req.prisma.entry.updateMany({
            where: { id: { in: entryIds } },
            data: {
                status: 'approved',
                reviewedAt: new Date(),
                reviewedById: req.user.id
            }
        })

        // Send notification emails
        for (const entry of entries) {
            const categoryDisplay = `${entry.category} - ${entry.eventType} (${entry.ageClass}${entry.weightClass ? ', ' + entry.weightClass : ''})`
            await sendEntryApprovedEmail(
                entry.user.email,
                entry.user.name,
                entry.athlete.fullName,
                categoryDisplay,
                null
            )
        }

        res.json({
            count: result.count,
            message: `${result.count} entries approved. Notifikasi telah dikirim.`
        })
    } catch (err) {
        console.error('Bulk approve error:', err)
        res.status(500).json({ error: 'Failed to bulk approve' })
    }
})

module.exports = router
