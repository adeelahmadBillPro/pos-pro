import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.GMAIL_USER || process.env.GMAIL_USER === 'your@gmail.com') {
    console.log('[EMAIL MOCK]', { to, subject })
    return
  }
  try {
    await transporter.sendMail({
      from: `"POS Pro" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[EMAIL_ERROR]', err)
  }
}

export async function sendWhatsApp(to: string, message: string) {
  if (!process.env.TWILIO_SID || process.env.TWILIO_SID === 'ACxxxxxxxxxxxxxxxx') {
    console.log('[WHATSAPP MOCK]', { to, message })
    return
  }
  try {
    const { Twilio } = await import('twilio')
    const client = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
    })
  } catch (err) {
    console.error('[WHATSAPP_ERROR]', err)
  }
}

export async function notifyAdminPaymentProof({
  storeName,
  ownerName,
  ownerPhone,
  planName,
  amount,
  months,
  bankName,
  txId,
}: {
  storeName: string
  ownerName: string
  ownerPhone?: string
  planName: string
  amount: number
  months: number
  bankName: string
  txId?: string
}) {
  const adminUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const msg = `*New Payment Proof*\nStore: ${storeName}\nOwner: ${ownerName} (${ownerPhone ?? ''})\nPlan: ${planName}\nAmount: Rs ${amount}\nDuration: ${months} month(s)\nBank: ${bankName} | TxID: ${txId ?? '-'}\nReview: ${adminUrl}/super-admin/payments`

  const adminEmail = process.env.ADMIN_EMAIL ?? ''
  const adminWa = process.env.ADMIN_WHATSAPP ?? ''

  await Promise.all([
    sendEmail({
      to: adminEmail,
      subject: `New Payment Proof - ${storeName}`,
      html: `<pre>${msg}</pre>`,
    }),
    sendWhatsApp(adminWa, msg),
  ])
}

export async function notifyOwnerApproved({
  ownerEmail,
  ownerPhone,
  ownerName,
  planName,
  expiryDate,
  maxStores,
  maxProducts,
}: {
  ownerEmail: string
  ownerPhone?: string
  ownerName: string
  planName: string
  expiryDate: string
  maxStores: number
  maxProducts: number
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const msg = `*Assalam o Alaikum ${ownerName}!*\nAapka POS Pro subscription activate ho gaya.\n\nPlan: ${planName}\nValid Till: ${expiryDate}\nStores: ${maxStores}\nProducts: ${maxProducts === -1 ? 'Unlimited' : maxProducts}\n\nDashboard login karein:\n${appUrl}/login\n\nKoi masla ho to reply karein.`

  await Promise.all([
    sendEmail({
      to: ownerEmail,
      subject: 'Subscription Activated - POS Pro',
      html: `<pre>${msg}</pre>`,
    }),
    ownerPhone ? sendWhatsApp(ownerPhone, msg) : Promise.resolve(),
  ])
}

export async function notifyOwnerRejected({
  ownerEmail,
  ownerPhone,
  reason,
}: {
  ownerEmail: string
  ownerPhone?: string
  reason: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const msg = `*Payment Proof Reject Hua*\nWajah: ${reason}\n\nDobara submit karein:\n${appUrl}/billing/pay\n\nYa humse contact karein.`

  await Promise.all([
    sendEmail({
      to: ownerEmail,
      subject: 'Payment Proof Rejected - POS Pro',
      html: `<pre>${msg}</pre>`,
    }),
    ownerPhone ? sendWhatsApp(ownerPhone, msg) : Promise.resolve(),
  ])
}

export async function notifyExpiryWarning({
  ownerEmail,
  ownerPhone,
  storeName,
  daysLeft,
}: {
  ownerEmail: string
  ownerPhone?: string
  storeName: string
  daysLeft: number
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const msg = `*Subscription Reminder*\n${storeName} ka plan ${daysLeft} din mein expire ho ga.\n\nRenew karein:\n${appUrl}/billing/plans\n\nRenew na karne par access band ho jayega.`

  await Promise.all([
    sendEmail({
      to: ownerEmail,
      subject: `Subscription Expiring in ${daysLeft} days - POS Pro`,
      html: `<pre>${msg}</pre>`,
    }),
    ownerPhone ? sendWhatsApp(ownerPhone, msg) : Promise.resolve(),
  ])
}
