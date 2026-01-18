const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/athletes')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mime = allowedTypes.test(file.mimetype)
        if (ext && mime) {
            cb(null, true)
        } else {
            cb(new Error('Only images (jpg, png) and PDF files are allowed'))
        }
    }
})

// GET /api/athletes - List athletes for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const athletes = await req.prisma.athlete.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        })

        res.json({ athletes })
    } catch (err) {
        console.error('Get athletes error:', err)
        res.status(500).json({ error: 'Failed to fetch athletes' })
    }
})

// POST /api/athletes - Create new athlete with file uploads
router.post('/', authenticateToken, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
    { name: 'beltCertificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const { fullName, birthPlace, birthDate, gender, weight, height, beltRank } = req.body

        // Validate required fields
        if (!fullName || !birthPlace || !birthDate || !gender || !weight || !height) {
            return res.status(400).json({ error: 'All fields are required' })
        }

        // Get file URLs
        const files = req.files || {}
        const baseUrl = `${req.protocol}://${req.get('host')}`

        const photoUrl = files.photo ?
            `${baseUrl}/uploads/athletes/${files.photo[0].filename}` : null
        const idDocumentUrl = files.idDocument ?
            `${baseUrl}/uploads/athletes/${files.idDocument[0].filename}` : null
        const beltCertificateUrl = files.beltCertificate ?
            `${baseUrl}/uploads/athletes/${files.beltCertificate[0].filename}` : null

        const athlete = await req.prisma.athlete.create({
            data: {
                fullName,
                birthPlace,
                birthDate: new Date(birthDate),
                gender,
                weight: parseFloat(weight),
                height: parseFloat(height),
                beltRank: beltRank || null,
                photo: photoUrl,
                idDocument: idDocumentUrl,
                beltCertificate: beltCertificateUrl,
                userId: req.user.id
            }
        })

        res.status(201).json({ athlete })
    } catch (err) {
        console.error('Create athlete error:', err)
        res.status(500).json({ error: 'Failed to create athlete' })
    }
})

// PUT /api/athletes/:id - Update athlete
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        const { fullName, birthPlace, birthDate, gender, weight, height } = req.body

        // Check ownership
        const existing = await req.prisma.athlete.findFirst({
            where: { id, userId: req.user.id }
        })

        if (!existing) {
            return res.status(404).json({ error: 'Athlete not found' })
        }

        const athlete = await req.prisma.athlete.update({
            where: { id },
            data: {
                fullName: fullName || existing.fullName,
                birthPlace: birthPlace || existing.birthPlace,
                birthDate: birthDate ? new Date(birthDate) : existing.birthDate,
                gender: gender || existing.gender,
                weight: weight ? parseFloat(weight) : existing.weight,
                height: height ? parseFloat(height) : existing.height
            }
        })

        res.json({ athlete })
    } catch (err) {
        console.error('Update athlete error:', err)
        res.status(500).json({ error: 'Failed to update athlete' })
    }
})

// DELETE /api/athletes/:id - Delete athlete
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params

        // Check ownership
        const existing = await req.prisma.athlete.findFirst({
            where: { id, userId: req.user.id }
        })

        if (!existing) {
            return res.status(404).json({ error: 'Athlete not found' })
        }

        await req.prisma.athlete.delete({ where: { id } })

        res.json({ message: 'Athlete deleted successfully' })
    } catch (err) {
        console.error('Delete athlete error:', err)
        res.status(500).json({ error: 'Failed to delete athlete' })
    }
})

// POST /api/athletes/bulk - Create multiple athletes
router.post('/bulk', authenticateToken, async (req, res) => {
    try {
        const { athletes } = req.body

        if (!Array.isArray(athletes) || athletes.length === 0) {
            return res.status(400).json({ error: 'Athletes array is required' })
        }

        const created = await req.prisma.athlete.createMany({
            data: athletes.map(a => ({
                fullName: a.fullName,
                birthPlace: a.birthPlace,
                birthDate: new Date(a.birthDate),
                gender: a.gender,
                weight: parseFloat(a.weight),
                height: parseFloat(a.height),
                userId: req.user.id
            }))
        })

        res.status(201).json({ count: created.count })
    } catch (err) {
        console.error('Bulk create athletes error:', err)
        res.status(500).json({ error: 'Failed to create athletes' })
    }
})

module.exports = router
