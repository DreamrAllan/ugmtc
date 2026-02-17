const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

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

// Configure multer for Excel uploads
const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for Excel
    fileFilter: (req, file, cb) => {
        const allowedExts = /xlsx|xls/
        const ext = allowedExts.test(path.extname(file.originalname).toLowerCase())
        if (ext) {
            cb(null, true)
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'))
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

// GET /api/athletes/template - Download Excel template
router.get('/template', authenticateToken, (req, res) => {
    try {
        const wb = XLSX.utils.book_new()

        // ========== SHEET 1: KYORUGI ==========
        const kyorugiData = [
            ['No', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir (dd/mm/yyyy)', 'Jenis Kelamin (L/P)', 'Berat Badan (kg)', 'Tinggi Badan (cm)', 'Tingkatan Sabuk', 'Mode Event', 'Kelas'],
            [1, 'Ahmad Rizky', 'Jakarta', '15/03/2010', 'L', 45, 155, 'geup-8', 'Prestasi', 'U-42'],
            [2, 'Siti Aisyah', 'Surabaya', '20/07/2012', 'P', 38, 142, 'geup-6', 'Festival', 'U-39']
        ]
        const kyorugiWs = XLSX.utils.aoa_to_sheet(kyorugiData)
        kyorugiWs['!cols'] = [
            { wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 28 }, { wch: 20 },
            { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 }
        ]

        // ========== SHEET 2: POOMSAE ==========
        const poomsaeData = [
            ['No', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir (dd/mm/yyyy)', 'Jenis Kelamin (L/P)', 'Berat Badan (kg)', 'Tinggi Badan (cm)', 'Tingkatan Sabuk', 'Mode Event', 'Jenis (Individu/Pair/Beregu)', 'Nama Grup'],
            [1, 'Allan', 'Ternate', '10/05/2008', 'L', 60, 170, 'dan-1', 'Prestasi', 'Individu', ''],
            [2, 'Allan', 'Ternate', '10/05/2008', 'L', 60, 170, 'dan-1', 'Prestasi', 'Pair', 'Tim Alpha'],
            [3, 'Haikal', 'Jakarta', '22/08/2008', 'L', 55, 168, 'poom-2', 'Prestasi', 'Pair', 'Tim Alpha'],
            [4, 'Allan', 'Ternate', '10/05/2008', 'L', 60, 170, 'dan-1', 'Prestasi', 'Beregu', 'Tim Bravo'],
            [5, 'Dafa', 'Makassar', '15/01/2009', 'L', 50, 165, 'poom-1', 'Prestasi', 'Beregu', 'Tim Bravo'],
            [6, 'Jamal', 'Surabaya', '03/11/2008', 'L', 52, 167, 'poom-2', 'Prestasi', 'Beregu', 'Tim Bravo']
        ]
        const poomsaeWs = XLSX.utils.aoa_to_sheet(poomsaeData)
        poomsaeWs['!cols'] = [
            { wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 28 }, { wch: 20 },
            { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 28 }, { wch: 18 }
        ]

        // ========== SHEET 3: PETUNJUK (TABLE FORMAT) ==========
        const instrData = [
            ['PETUNJUK PENGISIAN TEMPLATE DATA ATLET UGMTC', '', ''],
            ['', '', ''],
            ['CARA PENGISIAN', '', ''],
            ['Kolom', 'Keterangan', 'Contoh'],
            ['No', 'Nomor urut', '1, 2, 3, ...'],
            ['Nama Lengkap', 'Nama lengkap atlet', 'Ahmad Rizky'],
            ['Tempat Lahir', 'Kota/kabupaten lahir', 'Jakarta'],
            ['Tanggal Lahir', 'Format dd/mm/yyyy', '15/03/2010'],
            ['Jenis Kelamin', 'L = Laki-laki, P = Perempuan', 'L'],
            ['Berat Badan', 'Dalam kg', '45'],
            ['Tinggi Badan', 'Dalam cm', '155'],
            ['Tingkatan Sabuk', 'Kode sabuk (lihat tabel di bawah)', 'geup-8'],
            ['Mode Event', 'Prestasi / Pemula / Festival', 'Prestasi'],
            ['Kelas (Kyorugi)', 'Kelas berat sesuai umur & gender', 'U-42'],
            ['Jenis (Poomsae)', 'Individu / Pair / Beregu', 'Pair'],
            ['Nama Grup (Poomsae)', 'Nama tim utk Pair/Beregu (sama = 1 tim)', 'Tim Alpha'],
            ['', '', ''],
            ['DAFTAR KODE SABUK', '', ''],
            ['Kode', 'Nama', 'Tipe'],
            ['geup-10', '10 Geup (Putih)', 'Geup'],
            ['geup-9', '9 Geup (Putih Strip Kuning)', 'Geup'],
            ['geup-8', '8 Geup (Kuning)', 'Geup'],
            ['geup-7', '7 Geup (Kuning Strip Hijau)', 'Geup'],
            ['geup-6', '6 Geup (Hijau)', 'Geup'],
            ['geup-5', '5 Geup (Hijau Strip Biru)', 'Geup'],
            ['geup-4', '4 Geup (Biru)', 'Geup'],
            ['geup-3', '3 Geup (Biru Strip Merah)', 'Geup'],
            ['geup-2', '2 Geup (Merah)', 'Geup'],
            ['geup-1', '1 Geup (Merah Strip Hitam)', 'Geup'],
            ['poom-1', '1 Poom', 'Poom'],
            ['poom-2', '2 Poom', 'Poom'],
            ['poom-3', '3 Poom', 'Poom'],
            ['dan-1', '1 Dan', 'Dan'],
            ['dan-2', '2 Dan', 'Dan'],
            ['dan-3', '3 Dan', 'Dan'],
            ['dan-4', '4 Dan', 'Dan'],
            ['dan-5', '5 Dan', 'Dan'],
            ['dan-6', '6 Dan', 'Dan'],
            ['dan-7', '7 Dan', 'Dan'],
            ['dan-8', '8 Dan', 'Dan'],
            ['dan-9', '9 Dan', 'Dan'],
            ['', '', ''],
            ['KATEGORI UMUR (otomatis dari tanggal lahir, tanggal kompetisi: 1 Juni 2026)', '', ''],
            ['Mode', 'Kategori', 'Usia'],
            ['Prestasi', 'Pra-Cadet', '10-11 tahun'],
            ['Prestasi', 'Cadet', '12-14 tahun'],
            ['Prestasi', 'Junior', '15-17 tahun'],
            ['Prestasi', 'Senior', '18+ tahun'],
            ['Pemula / Festival', 'Pra-Cadet A', '7-8 tahun'],
            ['Pemula / Festival', 'Pra-Cadet B', '9-11 tahun'],
            ['Pemula / Festival', 'Cadet', '12-14 tahun'],
            ['Pemula / Festival', 'Junior', '15-17 tahun'],
            ['Pemula / Festival', 'Senior', '18+ tahun'],
            ['', '', ''],
            ['KELAS BERAT KYORUGI - PRESTASI', '', ''],
            ['Kategori', 'Putra', 'Putri'],
            ['Pra-Cadet', 'U-20, U-22, U-24, U-26, U-28, U-30, U-33, U-42', 'U-22, U-24, U-26, U-28, U-30, U-33, U-36, U-39, U-42'],
            ['Cadet', 'U-33, U-37, U-41, U-45, U-49, U-53, U-57, U-61, U-65, Over 65', 'U-33, U-37, U-41, U-44, U-47, U-51, U-55, U-59, Over 59'],
            ['Junior', 'U-45, U-48, U-51, U-55, U-59, U-63, U-68, U-73, Over 78', 'U-42, U-44, U-46, U-49, U-52, U-55, U-59, U-63, U-68'],
            ['Senior', 'U-54, U-58, U-63, U-68, U-74, U-80, U-87, Over 87', 'U-46, U-49, U-53, U-57, U-62, U-67, U-73, Over 73'],
            ['', '', ''],
            ['KELAS BERAT KYORUGI - FESTIVAL / PEMULA', '', ''],
            ['Kategori', 'Putra', 'Putri'],
            ['Pra-Cadet A', 'U-18, U-20, U-22, U-24, U-26, U-28, U-30, U-33, U-40, U-45, Over 45', 'U-18, U-20, U-22, U-24, U-26, U-28, U-39'],
            ['Pra-Cadet B', 'U-20, U-22, U-23, U-24, U-26, U-28, U-30, U-33, U-36, U-39, U-42, U-45, Over 45', 'U-20, U-22, U-24, U-26, U-28, U-30, U-33, U-36, U-39, U-42, U-45, Over 45'],
            ['Cadet', 'U-33, U-37, U-41, U-45, U-49, U-53, U-57, U-61, U-65, Over 65', 'U-29, U-33, U-35, U-37, U-41, U-44, U-47, U-51, U-55, U-59, Over 59'],
            ['Junior', 'U-45, U-48, U-51, U-55, U-59, U-63, U-68, U-73, U-78, Over 78', 'U-41, U-42, U-44, U-46, U-49, U-52, U-55, U-59, U-63, U-68'],
            ['Senior', 'U-54, U-58, U-63, U-68, U-74, U-80, U-87, Over 87', 'U-46, U-49, U-53, U-57, U-62, U-67, U-73, Over 73'],
            ['', '', ''],
            ['KATEGORI POOMSAE', '', ''],
            ['Jenis', 'Keterangan', 'Nama Grup'],
            ['Individu', '1 atlet tampil sendiri', 'Kosongkan'],
            ['Pair', '2 atlet tampil berpasangan', 'Isi nama grup yang sama untuk 2 atlet'],
            ['Beregu', '3-5 atlet tampil berkelompok', 'Isi nama grup yang sama untuk 3-5 atlet'],
            ['', '', ''],
            ['CATATAN PENTING', '', ''],
            ['1. Sheet "Kyorugi" untuk atlet yang ikut Kyorugi', '', ''],
            ['2. Sheet "Poomsae" untuk atlet yang ikut Poomsae', '', ''],
            ['3. Satu atlet bisa didaftarkan di kedua sheet', '', ''],
            ['4. Untuk Pair/Beregu, Nama Grup yang sama = satu tim', '', ''],
            ['5. Satu atlet bisa ikut Individu + Pair + Beregu (baris terpisah)', '', ''],
            ['6. Dokumen diupload terpisah di web setelah import', '', '']
        ]

        const instrWs = XLSX.utils.aoa_to_sheet(instrData)
        instrWs['!cols'] = [{ wch: 25 }, { wch: 65 }, { wch: 55 }]

        XLSX.utils.book_append_sheet(wb, instrWs, 'Petunjuk')
        XLSX.utils.book_append_sheet(wb, kyorugiWs, 'Kyorugi')
        XLSX.utils.book_append_sheet(wb, poomsaeWs, 'Poomsae')

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        res.setHeader('Content-Disposition', 'attachment; filename=Template_Data_Atlet_UGMTC.xlsx')
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.send(buffer)
    } catch (err) {
        console.error('Template generation error:', err)
        res.status(500).json({ error: 'Failed to generate template' })
    }
})

// Age category helper (mirrors frontend categories.js)
const COMPETITION_DATE = new Date('2026-06-01')
function calcAge(birthDate) {
    const birth = new Date(birthDate)
    let age = COMPETITION_DATE.getFullYear() - birth.getFullYear()
    const md = COMPETITION_DATE.getMonth() - birth.getMonth()
    if (md < 0 || (md === 0 && COMPETITION_DATE.getDate() < birth.getDate())) age--
    return age
}
function getAgeCategory(birthDate, eventMode) {
    const age = calcAge(birthDate)
    if (eventMode === 'prestasi') {
        if (age >= 10 && age <= 11) return 'pra-cadet'
        if (age >= 12 && age <= 14) return 'cadet'
        if (age >= 15 && age <= 17) return 'junior'
        if (age >= 18) return 'senior'
    } else {
        if (age >= 7 && age <= 8) return 'pra-cadet-a'
        if (age >= 9 && age <= 11) return 'pra-cadet-b'
        if (age >= 12 && age <= 14) return 'cadet'
        if (age >= 15 && age <= 17) return 'junior'
        if (age >= 18) return 'senior'
    }
    return null
}

// Helper: Parse athlete rows from any sheet (shared between Kyorugi/Poomsae)
function parseAthleteRow(row, i) {
    const fullName = String(row[1] || '').trim()
    const birthPlace = String(row[2] || '').trim()
    const birthDateRaw = row[3]
    const genderRaw = String(row[4] || '').trim().toUpperCase()
    const weight = parseFloat(row[5])
    const height = parseFloat(row[6])
    const beltRank = String(row[7] || '').trim().toLowerCase()

    if (!fullName) return { error: `Baris ${i + 1}: Nama lengkap kosong` }
    if (!birthPlace) return { error: `Baris ${i + 1}: Tempat lahir kosong` }

    // Parse birth date
    let birthDate
    if (typeof birthDateRaw === 'number') {
        birthDate = new Date(Math.round((birthDateRaw - 25569) * 86400 * 1000))
    } else if (typeof birthDateRaw === 'string') {
        const parts = birthDateRaw.split(/[\/\-]/)
        if (parts.length === 3) {
            const day = parseInt(parts[0])
            const month = parseInt(parts[1]) - 1
            const year = parseInt(parts[2])
            birthDate = new Date(year, month, day)
        }
    } else if (birthDateRaw instanceof Date) {
        birthDate = birthDateRaw
    }

    if (!birthDate || isNaN(birthDate.getTime())) {
        return { error: `Baris ${i + 1}: Tanggal lahir tidak valid (gunakan format dd/mm/yyyy)` }
    }

    let gender
    if (genderRaw === 'L' || genderRaw === 'LAKI-LAKI' || genderRaw === 'MALE') {
        gender = 'male'
    } else if (genderRaw === 'P' || genderRaw === 'PEREMPUAN' || genderRaw === 'FEMALE') {
        gender = 'female'
    } else {
        return { error: `Baris ${i + 1}: Jenis kelamin tidak valid (gunakan L atau P)` }
    }

    if (isNaN(weight) || weight <= 0) return { error: `Baris ${i + 1}: Berat badan tidak valid` }
    if (isNaN(height) || height <= 0) return { error: `Baris ${i + 1}: Tinggi badan tidak valid` }

    return {
        data: { fullName, birthPlace, birthDate, gender, weight, height, beltRank: beltRank || null }
    }
}

// POST /api/athletes/import-excel - Import athletes from Excel
router.post('/import-excel', authenticateToken, excelUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File Excel diperlukan' })
        }

        const wb = XLSX.read(req.file.buffer, { type: 'buffer' })
        const errors = []
        const athleteDataList = [] // { athleteData, entryData, sheetSource }

        // ============ PARSE KYORUGI SHEET ============
        const kyorugiSheet = wb.SheetNames.find(n => n.toLowerCase().includes('kyorugi'))
        if (kyorugiSheet) {
            const ws = wb.Sheets[kyorugiSheet]
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i]
                if (!row || row.length === 0 || !row[1]) continue

                const parsed = parseAthleteRow(row, i)
                if (parsed.error) { errors.push(`[Kyorugi] ${parsed.error}`); continue }

                const modeRaw = String(row[8] || '').trim().toLowerCase()
                const kelasRaw = String(row[9] || '').trim()

                let eventType = null
                if (modeRaw) {
                    if (['prestasi', 'pemula', 'festival'].includes(modeRaw)) eventType = modeRaw
                    else { errors.push(`[Kyorugi] Baris ${i + 1}: Mode '${row[8]}' tidak valid`); continue }
                }

                athleteDataList.push({
                    athleteData: { ...parsed.data, userId: req.user.id },
                    entryData: eventType ? {
                        category: 'kyorugi',
                        eventType,
                        weightClass: kelasRaw || null,
                        poomsaeGroup: null
                    } : null,
                    sheetSource: 'kyorugi'
                })
            }
        }

        // ============ PARSE POOMSAE SHEET ============
        const poomsaeSheet = wb.SheetNames.find(n => n.toLowerCase().includes('poomsae'))
        if (poomsaeSheet) {
            const ws = wb.Sheets[poomsaeSheet]
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i]
                if (!row || row.length === 0 || !row[1]) continue

                const parsed = parseAthleteRow(row, i)
                if (parsed.error) { errors.push(`[Poomsae] ${parsed.error}`); continue }

                const modeRaw = String(row[8] || '').trim().toLowerCase()
                const jenisRaw = String(row[9] || '').trim().toLowerCase()
                const namaGrup = String(row[10] || '').trim()

                let eventType = null
                if (modeRaw) {
                    if (['prestasi', 'pemula', 'festival'].includes(modeRaw)) eventType = modeRaw
                    else { errors.push(`[Poomsae] Baris ${i + 1}: Mode '${row[8]}' tidak valid`); continue }
                }

                let poomsaeJenis = 'individu'
                if (jenisRaw === 'pair') poomsaeJenis = 'pair'
                else if (jenisRaw === 'beregu') poomsaeJenis = 'beregu'

                // For pair/beregu, nama grup is required
                if ((poomsaeJenis === 'pair' || poomsaeJenis === 'beregu') && !namaGrup) {
                    errors.push(`[Poomsae] Baris ${i + 1}: Nama Grup wajib diisi untuk ${poomsaeJenis}`)
                    continue
                }

                athleteDataList.push({
                    athleteData: { ...parsed.data, userId: req.user.id },
                    entryData: eventType ? {
                        category: 'poomsae',
                        eventType,
                        weightClass: poomsaeJenis, // Store jenis in weightClass field
                        poomsaeGroup: (poomsaeJenis === 'pair' || poomsaeJenis === 'beregu') ? namaGrup : null
                    } : null,
                    sheetSource: 'poomsae'
                })
            }
        }

        // ============ LEGACY: Try old format (single sheet) ============
        if (!kyorugiSheet && !poomsaeSheet) {
            const sheetName = wb.SheetNames.find(n => n.includes('Data Atlet')) || wb.SheetNames[0]
            const ws = wb.Sheets[sheetName]
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i]
                if (!row || row.length === 0 || !row[1]) continue

                const parsed = parseAthleteRow(row, i)
                if (parsed.error) { errors.push(parsed.error); continue }

                athleteDataList.push({
                    athleteData: { ...parsed.data, userId: req.user.id },
                    entryData: null,
                    sheetSource: 'legacy'
                })
            }
        }

        if (athleteDataList.length === 0) {
            return res.status(400).json({
                error: 'Tidak ada data atlet yang valid',
                errors
            })
        }

        // ============ CREATE ATHLETES & ENTRIES ============
        // Deduplicate athletes by name+birthDate (same person across sheets)
        const athleteMap = new Map() // key: "name|birthDate" -> athlete record
        let athleteCount = 0
        let entryCount = 0
        const createdAthletes = []

        for (const item of athleteDataList) {
            const key = `${item.athleteData.fullName.toLowerCase()}|${item.athleteData.birthDate.toISOString()}`

            let athlete
            if (athleteMap.has(key)) {
                // Reuse existing athlete (same person in multiple entries)
                athlete = athleteMap.get(key)
            } else {
                // Create new athlete
                athlete = await req.prisma.athlete.create({ data: item.athleteData })
                athleteMap.set(key, athlete)
                createdAthletes.push(athlete)
                athleteCount++
            }

            if (item.entryData) {
                const ageClass = getAgeCategory(item.athleteData.birthDate, item.entryData.eventType)
                if (ageClass) {
                    await req.prisma.entry.create({
                        data: {
                            athleteId: athlete.id,
                            userId: req.user.id,
                            teamName: req.user.teamName || '',
                            category: item.entryData.category,
                            eventType: item.entryData.eventType,
                            ageClass,
                            weightClass: item.entryData.weightClass || null,
                            poomsaeGroup: item.entryData.poomsaeGroup || null,
                            status: 'draft'
                        }
                    })
                    entryCount++
                } else {
                    errors.push(`${item.athleteData.fullName}: umur tidak memenuhi kategori ${item.entryData.eventType}`)
                }
            }
        }

        let msg = `Berhasil mengimport ${athleteCount} atlet`
        if (entryCount > 0) msg += ` dan ${entryCount} entry`

        res.status(201).json({
            message: msg,
            count: athleteCount,
            entryCount,
            athletes: createdAthletes,
            errors: errors.length > 0 ? errors : undefined
        })
    } catch (err) {
        console.error('Import Excel error:', err)
        res.status(500).json({ error: 'Gagal mengimport data dari Excel' })
    }
})

// POST /api/athletes - Create new athlete with file uploads
router.post('/', authenticateToken, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
    { name: 'beltCertificate', maxCount: 1 },
    { name: 'healthCertificate', maxCount: 1 }
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
        const healthCertificateUrl = files.healthCertificate ?
            `${baseUrl}/uploads/athletes/${files.healthCertificate[0].filename}` : null

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
                healthCertificate: healthCertificateUrl,
                userId: req.user.id
            }
        })

        res.status(201).json({ athlete })
    } catch (err) {
        console.error('Create athlete error:', err)
        res.status(500).json({ error: 'Failed to create athlete' })
    }
})

// POST /api/athletes/:id/documents - Upload documents for specific athlete
router.post('/:id/documents', authenticateToken, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
    { name: 'beltCertificate', maxCount: 1 },
    { name: 'healthCertificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params

        // Check ownership
        const existing = await req.prisma.athlete.findFirst({
            where: { id, userId: req.user.id }
        })

        if (!existing) {
            return res.status(404).json({ error: 'Athlete not found' })
        }

        const files = req.files || {}
        const baseUrl = `${req.protocol}://${req.get('host')}`

        const updateData = {}

        if (files.photo) {
            updateData.photo = `${baseUrl}/uploads/athletes/${files.photo[0].filename}`
        }
        if (files.idDocument) {
            updateData.idDocument = `${baseUrl}/uploads/athletes/${files.idDocument[0].filename}`
        }
        if (files.beltCertificate) {
            updateData.beltCertificate = `${baseUrl}/uploads/athletes/${files.beltCertificate[0].filename}`
        }
        if (files.healthCertificate) {
            updateData.healthCertificate = `${baseUrl}/uploads/athletes/${files.healthCertificate[0].filename}`
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No files uploaded' })
        }

        const athlete = await req.prisma.athlete.update({
            where: { id },
            data: updateData
        })

        res.json({ athlete })
    } catch (err) {
        console.error('Upload documents error:', err)
        res.status(500).json({ error: 'Failed to upload documents' })
    }
})

// PUT /api/athletes/:id - Update athlete (only if draft or rejected)
router.put('/:id', authenticateToken, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
    { name: 'beltCertificate', maxCount: 1 },
    { name: 'healthCertificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params
        const { fullName, birthPlace, birthDate, gender, weight, height, beltRank } = req.body

        // Check ownership
        const existing = await req.prisma.athlete.findFirst({
            where: { id, userId: req.user.id }
        })

        if (!existing) {
            return res.status(404).json({ error: 'Athlete not found' })
        }

        // Only allow editing if draft or rejected
        if (!['draft', 'rejected'].includes(existing.status)) {
            return res.status(403).json({ error: 'Hanya atlet dengan status Draft atau Ditolak yang bisa diedit' })
        }

        const updateData = {
            fullName: fullName || existing.fullName,
            birthPlace: birthPlace || existing.birthPlace,
            birthDate: birthDate ? new Date(birthDate) : existing.birthDate,
            gender: gender || existing.gender,
            weight: weight ? parseFloat(weight) : existing.weight,
            height: height ? parseFloat(height) : existing.height,
            beltRank: beltRank !== undefined ? (beltRank || null) : existing.beltRank,
            // Reset to draft if was rejected and being edited
            status: 'draft',
            adminNote: null
        }

        // Handle file uploads
        const files = req.files || {}
        const baseUrl = `${req.protocol}://${req.get('host')}`

        if (files.photo) {
            updateData.photo = `${baseUrl}/uploads/athletes/${files.photo[0].filename}`
        }
        if (files.idDocument) {
            updateData.idDocument = `${baseUrl}/uploads/athletes/${files.idDocument[0].filename}`
        }
        if (files.beltCertificate) {
            updateData.beltCertificate = `${baseUrl}/uploads/athletes/${files.beltCertificate[0].filename}`
        }
        if (files.healthCertificate) {
            updateData.healthCertificate = `${baseUrl}/uploads/athletes/${files.healthCertificate[0].filename}`
        }

        const athlete = await req.prisma.athlete.update({
            where: { id },
            data: updateData
        })

        res.json({ athlete })
    } catch (err) {
        console.error('Update athlete error:', err)
        res.status(500).json({ error: 'Failed to update athlete' })
    }
})

// DELETE /api/athletes/:id - Delete athlete (only if draft or rejected)
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

        // Only allow deleting if draft or rejected
        if (!['draft', 'rejected'].includes(existing.status)) {
            return res.status(403).json({ error: 'Hanya atlet dengan status Draft atau Ditolak yang bisa dihapus' })
        }

        await req.prisma.athlete.delete({ where: { id } })

        res.json({ message: 'Athlete deleted successfully' })
    } catch (err) {
        console.error('Delete athlete error:', err)
        res.status(500).json({ error: 'Failed to delete athlete' })
    }
})

// POST /api/athletes/submit-drafts - Submit all draft athletes to admin
router.post('/submit-drafts', authenticateToken, async (req, res) => {
    try {
        const drafts = await req.prisma.athlete.findMany({
            where: { userId: req.user.id, status: 'draft' }
        })

        if (drafts.length === 0) {
            return res.status(400).json({ error: 'Tidak ada atlet draft untuk dikirim' })
        }

        await req.prisma.athlete.updateMany({
            where: { userId: req.user.id, status: 'draft' },
            data: { status: 'pending' }
        })

        res.json({
            count: drafts.length,
            message: `${drafts.length} data atlet berhasil dikirim ke admin untuk review.`
        })
    } catch (err) {
        console.error('Submit athlete drafts error:', err)
        res.status(500).json({ error: 'Gagal mengirim data atlet' })
    }
})

// GET /api/athletes/admin/all - Get all athletes from all users (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const athletes = await req.prisma.athlete.findMany({
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        res.json({ athletes })
    } catch (err) {
        console.error('Admin get athletes error:', err)
        res.status(500).json({ error: 'Failed to fetch athletes' })
    }
})

// PATCH /api/athletes/:id/approve - Approve athlete (admin only)
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { notes } = req.body

        const athlete = await req.prisma.athlete.update({
            where: { id },
            data: {
                status: 'approved',
                adminNote: notes || 'Data atlet disetujui.',
                reviewedAt: new Date()
            }
        })

        res.json({ athlete, message: 'Atlet approved' })
    } catch (err) {
        console.error('Approve athlete error:', err)
        res.status(500).json({ error: 'Failed to approve athlete' })
    }
})

// PATCH /api/athletes/:id/reject - Reject athlete (admin only)
router.patch('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { notes } = req.body

        if (!notes) {
            return res.status(400).json({ error: 'Alasan penolakan wajib diisi' })
        }

        const athlete = await req.prisma.athlete.update({
            where: { id },
            data: {
                status: 'rejected',
                adminNote: notes,
                reviewedAt: new Date()
            }
        })

        res.json({ athlete, message: 'Atlet rejected' })
    } catch (err) {
        console.error('Reject athlete error:', err)
        res.status(500).json({ error: 'Failed to reject athlete' })
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
