const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authenticateToken } = require('../middleware/auth')

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/logos')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for logo upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `team-${req.user.id}-${Date.now()}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)
        if (extname && mimetype) {
            cb(null, true)
        } else {
            cb(new Error('Only image files are allowed'))
        }
    }
})

// All routes require auth
router.use(authenticateToken)

// Get team profile
router.get('/', async (req, res) => {
    try {
        let profile = await req.prisma.teamProfile.findUnique({
            where: { userId: req.user.id },
            include: { coaches: true }
        })

        // If no profile exists, create one
        if (!profile) {
            profile = await req.prisma.teamProfile.create({
                data: {
                    userId: req.user.id,
                    teamName: req.user.teamName
                },
                include: { coaches: true }
            })
        }

        // Get athlete count for coach limit calculation
        const athleteCount = await req.prisma.athlete.count({
            where: { userId: req.user.id }
        })

        const maxCoaches = athleteCount >= 50 ? 4 : 2

        res.json({
            ...profile,
            athleteCount,
            maxCoaches
        })
    } catch (error) {
        console.error('Get team profile error:', error)
        res.status(500).json({ error: 'Failed to get team profile' })
    }
})

// Update team profile
router.post('/', async (req, res) => {
    try {
        const { teamName } = req.body

        let profile = await req.prisma.teamProfile.findUnique({
            where: { userId: req.user.id }
        })

        if (profile) {
            profile = await req.prisma.teamProfile.update({
                where: { userId: req.user.id },
                data: { teamName },
                include: { coaches: true }
            })
        } else {
            profile = await req.prisma.teamProfile.create({
                data: {
                    userId: req.user.id,
                    teamName: teamName || req.user.teamName
                },
                include: { coaches: true }
            })
        }

        // Check if profile is complete
        await updateProfileCompleteness(req.prisma, req.user.id)

        res.json(profile)
    } catch (error) {
        console.error('Update team profile error:', error)
        res.status(500).json({ error: 'Failed to update team profile' })
    }
})

// Upload team logo
router.post('/logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const logoUrl = `/uploads/logos/${req.file.filename}`

        // Delete old logo if exists
        const oldProfile = await req.prisma.teamProfile.findUnique({
            where: { userId: req.user.id }
        })

        if (oldProfile?.logoUrl) {
            const oldPath = path.join(__dirname, '../..', oldProfile.logoUrl)
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath)
            }
        }

        const profile = await req.prisma.teamProfile.upsert({
            where: { userId: req.user.id },
            update: { logoUrl },
            create: {
                userId: req.user.id,
                teamName: req.user.teamName,
                logoUrl
            },
            include: { coaches: true }
        })

        // Check completeness
        await updateProfileCompleteness(req.prisma, req.user.id)

        res.json({
            message: 'Logo uploaded successfully',
            logoUrl,
            profile
        })
    } catch (error) {
        console.error('Upload logo error:', error)
        res.status(500).json({ error: 'Failed to upload logo' })
    }
})

// Add coach
router.post('/coaches', async (req, res) => {
    try {
        const { name, phone, role } = req.body

        if (!name) {
            return res.status(400).json({ error: 'Coach name is required' })
        }

        // Get or create team profile
        let profile = await req.prisma.teamProfile.findUnique({
            where: { userId: req.user.id },
            include: { coaches: true }
        })

        if (!profile) {
            profile = await req.prisma.teamProfile.create({
                data: {
                    userId: req.user.id,
                    teamName: req.user.teamName
                },
                include: { coaches: true }
            })
        }

        // Check coach limit
        const athleteCount = await req.prisma.athlete.count({
            where: { userId: req.user.id }
        })
        const maxCoaches = athleteCount >= 50 ? 4 : 2

        if (profile.coaches.length >= maxCoaches) {
            return res.status(400).json({
                error: `Maximum ${maxCoaches} coaches allowed for your team. Register 50+ athletes to add up to 4 coaches.`
            })
        }

        const coach = await req.prisma.coach.create({
            data: {
                name,
                phone,
                role: role || 'assistant',
                teamProfileId: profile.id
            }
        })

        // Check completeness
        await updateProfileCompleteness(req.prisma, req.user.id)

        res.status(201).json(coach)
    } catch (error) {
        console.error('Add coach error:', error)
        res.status(500).json({ error: 'Failed to add coach' })
    }
})

// Update coach
router.patch('/coaches/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, phone, role } = req.body

        // Verify coach belongs to user's team
        const coach = await req.prisma.coach.findFirst({
            where: {
                id,
                teamProfile: { userId: req.user.id }
            }
        })

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' })
        }

        const updated = await req.prisma.coach.update({
            where: { id },
            data: { name, phone, role }
        })

        res.json(updated)
    } catch (error) {
        console.error('Update coach error:', error)
        res.status(500).json({ error: 'Failed to update coach' })
    }
})

// Delete coach
router.delete('/coaches/:id', async (req, res) => {
    try {
        const { id } = req.params

        // Verify coach belongs to user's team
        const coach = await req.prisma.coach.findFirst({
            where: {
                id,
                teamProfile: { userId: req.user.id }
            }
        })

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' })
        }

        await req.prisma.coach.delete({ where: { id } })

        // Update completeness
        await updateProfileCompleteness(req.prisma, req.user.id)

        res.json({ message: 'Coach removed successfully' })
    } catch (error) {
        console.error('Delete coach error:', error)
        res.status(500).json({ error: 'Failed to delete coach' })
    }
})

// Get profile status (is complete?)
router.get('/status', async (req, res) => {
    try {
        const profile = await req.prisma.teamProfile.findUnique({
            where: { userId: req.user.id },
            include: { coaches: true }
        })

        const isComplete = profile && profile.logoUrl && profile.coaches.length >= 1

        res.json({
            isComplete,
            hasLogo: !!profile?.logoUrl,
            coachCount: profile?.coaches?.length || 0,
            missingItems: getMissingItems(profile)
        })
    } catch (error) {
        console.error('Get status error:', error)
        res.status(500).json({ error: 'Failed to get status' })
    }
})

// Helper: Update profile completeness
async function updateProfileCompleteness(prisma, userId) {
    const profile = await prisma.teamProfile.findUnique({
        where: { userId },
        include: { coaches: true }
    })

    if (profile) {
        const isComplete = !!profile.logoUrl && profile.coaches.length >= 1

        if (profile.isComplete !== isComplete) {
            await prisma.teamProfile.update({
                where: { userId },
                data: { isComplete }
            })
        }
    }
}

// Helper: Get missing items
function getMissingItems(profile) {
    const missing = []
    if (!profile) {
        missing.push('Team profile not created')
    } else {
        if (!profile.logoUrl) missing.push('Team logo')
        if (!profile.coaches || profile.coaches.length === 0) missing.push('At least 1 coach')
    }
    return missing
}

module.exports = router
