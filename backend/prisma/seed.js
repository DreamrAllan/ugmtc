const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    // Create default admin
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@ugmtc.com' },
        update: {},
        create: {
            email: 'admin@ugmtc.com',
            password: hashedPassword,
            name: 'Admin UGMTC',
            teamName: 'Panitia UGMTC',
            phone: '081234567890',
            role: 'admin'
        }
    })

    console.log('Created default admin:', admin.email)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
