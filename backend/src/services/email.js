const nodemailer = require('nodemailer')

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })
}

// Send email helper
const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = createTransporter()

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'UGMTC <noreply@ugmtc.com>',
            to,
            subject,
            html
        })

        console.log('Email sent:', info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('Email error:', error)
        return { success: false, error: error.message }
    }
}

// Email templates
const emailTemplates = {
    // Email verification
    verification: (name, verifyUrl) => ({
        subject: 'Verifikasi Email - UGMTC',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">UGMTC</h1>
          <p style="color: #e0e7ff; margin: 5px 0 0;">UGM Taekwondo Championship</p>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Halo, ${name}! 👋</h2>
          <p style="color: #475569; line-height: 1.6;">
            Terima kasih telah mendaftar di UGMTC. Silakan verifikasi email Anda dengan mengklik tombol di bawah ini:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background: #2563eb; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verifikasi Email
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Link ini akan kadaluarsa dalam 24 jam. Jika Anda tidak mendaftar, abaikan email ini.
          </p>
        </div>
        <div style="padding: 20px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 UGMTC. All rights reserved.</p>
        </div>
      </div>
    `
    }),

    // Password reset
    passwordReset: (name, resetUrl) => ({
        subject: 'Reset Password - UGMTC',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">UGMTC</h1>
          <p style="color: #fecaca; margin: 5px 0 0;">Reset Password</p>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Halo, ${name}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Kami menerima permintaan untuk mereset password Anda. Klik tombol di bawah untuk membuat password baru:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc2626; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Link ini akan kadaluarsa dalam 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.
          </p>
        </div>
        <div style="padding: 20px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 UGMTC. All rights reserved.</p>
        </div>
      </div>
    `
    }),

    // Entry submitted notification
    entrySubmitted: (name, teamName, athleteName, category) => ({
        subject: 'Entry Berhasil Dikirim - UGMTC',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">UGMTC</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Entry Berhasil Dikirim! 🎉</h2>
          <p style="color: #475569; line-height: 1.6;">Halo ${name},</p>
          <p style="color: #475569; line-height: 1.6;">
            Entry atlet Anda telah berhasil dikirim dan sedang menunggu persetujuan panitia.
          </p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0;"><strong>Tim:</strong> ${teamName}</p>
            <p style="margin: 5px 0;"><strong>Atlet:</strong> ${athleteName}</p>
            <p style="margin: 5px 0;"><strong>Kategori:</strong> ${category}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #f59e0b;">Pending</span></p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Anda akan menerima notifikasi email setelah entry Anda diproses oleh panitia.
          </p>
        </div>
        <div style="padding: 20px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 UGMTC. All rights reserved.</p>
        </div>
      </div>
    `
    }),

    // Entry approved notification
    entryApproved: (name, athleteName, category, notes) => ({
        subject: '✅ Entry Disetujui - UGMTC',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">UGMTC</h1>
          <p style="color: #a7f3d0; margin: 5px 0 0;">Entry Approved</p>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Selamat! Entry Disetujui 🎊</h2>
          <p style="color: #475569; line-height: 1.6;">Halo ${name},</p>
          <p style="color: #475569; line-height: 1.6;">
            Entry atlet Anda telah disetujui oleh panitia UGMTC!
          </p>
          <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0;"><strong>Atlet:</strong> ${athleteName}</p>
            <p style="margin: 5px 0;"><strong>Kategori:</strong> ${category}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Approved ✓</span></p>
            ${notes ? `<p style="margin: 10px 0 5px;"><strong>Catatan:</strong> ${notes}</p>` : ''}
          </div>
          <p style="color: #475569; line-height: 1.6;">
            Pastikan atlet Anda sudah mempersiapkan diri untuk pertandingan. Informasi lebih lanjut akan diumumkan melalui website.
          </p>
        </div>
        <div style="padding: 20px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 UGMTC. All rights reserved.</p>
        </div>
      </div>
    `
    }),

    // Entry rejected notification
    entryRejected: (name, athleteName, category, notes) => ({
        subject: '❌ Entry Ditolak - UGMTC',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">UGMTC</h1>
          <p style="color: #fecaca; margin: 5px 0 0;">Entry Rejected</p>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Entry Ditolak</h2>
          <p style="color: #475569; line-height: 1.6;">Halo ${name},</p>
          <p style="color: #475569; line-height: 1.6;">
            Mohon maaf, entry atlet Anda tidak dapat disetujui oleh panitia.
          </p>
          <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0;"><strong>Atlet:</strong> ${athleteName}</p>
            <p style="margin: 5px 0;"><strong>Kategori:</strong> ${category}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">Rejected ✗</span></p>
            ${notes ? `<p style="margin: 10px 0 5px;"><strong>Alasan:</strong> ${notes}</p>` : ''}
          </div>
          <p style="color: #475569; line-height: 1.6;">
            Silakan hubungi panitia jika Anda memiliki pertanyaan atau ingin mengajukan entry baru dengan perbaikan.
          </p>
        </div>
        <div style="padding: 20px; background: #1e293b; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 UGMTC. All rights reserved.</p>
        </div>
      </div>
    `
    })
}

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
    const { subject, html } = emailTemplates.verification(name, verifyUrl)
    return sendEmail({ to: email, subject, html })
}

// Send password reset email
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
    const { subject, html } = emailTemplates.passwordReset(name, resetUrl)
    return sendEmail({ to: email, subject, html })
}

// Send entry submitted notification
const sendEntrySubmittedEmail = async (email, name, teamName, athleteName, category) => {
    const { subject, html } = emailTemplates.entrySubmitted(name, teamName, athleteName, category)
    return sendEmail({ to: email, subject, html })
}

// Send entry approved notification
const sendEntryApprovedEmail = async (email, name, athleteName, category, notes) => {
    const { subject, html } = emailTemplates.entryApproved(name, athleteName, category, notes)
    return sendEmail({ to: email, subject, html })
}

// Send entry rejected notification
const sendEntryRejectedEmail = async (email, name, athleteName, category, notes) => {
    const { subject, html } = emailTemplates.entryRejected(name, athleteName, category, notes)
    return sendEmail({ to: email, subject, html })
}

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEntrySubmittedEmail,
    sendEntryApprovedEmail,
    sendEntryRejectedEmail
}
