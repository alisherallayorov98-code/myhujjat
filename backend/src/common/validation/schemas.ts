import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email:     z.string().email("To'g'ri email kiriting").max(120),
  password:  z.string().min(8, "Parol kamida 8 ta belgi").max(72),
  firstName: z.string().min(1).max(50).optional(),
  lastName:  z.string().min(1).max(50).optional(),
})
export type RegisterDto = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email:    z.string().email().max(120),
  password: z.string().min(1).max(72),
  code:     z.string().min(4).max(20).optional(),  // 2FA code
})
export type LoginDto = z.infer<typeof LoginSchema>

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8, "Yangi parol kamida 8 ta belgi").max(72),
})
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>

export const ForgotPasswordSchema = z.object({
  email: z.string().email().max(120),
})

export const ResetPasswordSchema = z.object({
  token:    z.string().min(10).max(200),
  password: z.string().min(8).max(72),
})

// ─── Organizations ───────────────────────────────────────
const innRegex = /^\d{9}$/
const pinflRegex = /^\d{14}$/
const mfoRegex = /^\d{5}$/

export const OrgSchema = z.object({
  name:           z.string().min(1, "Tashkilot nomi kiritilishi shart").max(200),
  inn:            z.string().regex(innRegex, "STIR 9 ta raqamdan iborat bo'lishi kerak").optional().or(z.literal('')),
  directorName:   z.string().max(120).optional(),
  directorPinfl:  z.string().regex(pinflRegex, "JSHSHIR 14 ta raqamdan iborat").optional().or(z.literal('')),
  bankName:       z.string().max(120).optional(),
  bankAccount:    z.string().max(30).optional(),
  mfo:            z.string().regex(mfoRegex, "MFO 5 ta raqamdan iborat").optional().or(z.literal('')),
  address:        z.string().max(500).optional(),
  phone:          z.string().max(30).optional(),
  qqsReg:         z.string().max(20).optional(),
  qqsStavka:      z.string().max(5).optional(),
  chiefAccountant: z.string().max(120).optional(),
}).passthrough()

// ─── Counterparty ────────────────────────────────────────
export const CounterpartySchema = z.object({
  organizationId: z.string().min(1),
  name:           z.string().min(1).max(200),
  inn:            z.string().regex(innRegex).optional().or(z.literal('')),
  directorName:   z.string().max(120).optional(),
  bankName:       z.string().max(120).optional(),
  bankAccount:    z.string().max(30).optional(),
  mfo:            z.string().regex(mfoRegex).optional().or(z.literal('')),
  address:        z.string().max(500).optional(),
  phone:          z.string().max(30).optional(),
  qqsReg:         z.string().max(20).optional(),
}).passthrough()

// ─── Contract ────────────────────────────────────────────
export const ContractTypeEnum = z.enum([
  'OLDI_SOTDI', 'XIZMAT', 'IJARA', 'PUDRAT', 'QOSHIMCHA', 'MOLIYAVIY',
  'DAVAL', 'XALQARO', 'AGENTLIK', 'TRANSPORT', 'LIZING', 'BOSHQA',
])

export const CreateContractSchema = z.object({
  organizationId:  z.string().min(1),
  counterpartyId:  z.string().min(1).optional(),
  contractType:    ContractTypeEnum,
  contractNumber:  z.string().max(50).optional(),
  contractDate:    z.string().min(1),
  city:            z.string().max(100).optional(),
  amount:          z.number().nonnegative().max(1e15).optional(),
  content:         z.string().max(200_000).optional(),
  extraData:       z.record(z.string(), z.string()).optional(),
  productName:     z.string().max(500).optional(),
  specItems:       z.array(z.any()).max(500).optional(),
  qqsEnabled:      z.boolean().optional(),
  qqsRate:         z.number().min(0).max(100).optional(),
}).passthrough()

// ─── Invoice ─────────────────────────────────────────────
export const CreateInvoiceSchema = z.object({
  organizationId:  z.string().min(1),
  source:          z.enum(['MANUAL', 'EXCEL', 'DIDOX', 'ROAMING']).optional(),
  documentNumber:  z.string().max(50).optional(),
  documentDate:    z.string().max(20).optional(),
  contractNumber:  z.string().max(50).optional(),
  contractDate:    z.string().max(20).optional(),
  contractId:      z.string().optional(),
  sellerInn:       z.string().regex(innRegex).optional(),
  sellerName:      z.string().max(200).optional(),
  buyerInn:        z.string().regex(innRegex).optional(),
  buyerName:       z.string().max(200).optional(),
  direction:       z.enum(['INCOMING', 'OUTGOING']),
  amount:          z.number().nonnegative().max(1e15),
  vatAmount:       z.number().nonnegative().max(1e15).optional(),
  totalAmount:     z.number().nonnegative().max(1e15).optional(),
}).passthrough()

// ─── Didox ───────────────────────────────────────────────
export const DidoxConnectSchema = z.object({
  apiKey:  z.string().min(8, "API kalit juda qisqa").max(200),
  userKey: z.string().min(8).max(200),
})

// ─── Share Link ──────────────────────────────────────────
export const CreateShareLinkSchema = z.object({
  contractId:      z.string().min(1),
  recipientEmail:  z.string().email().optional().or(z.literal('')),
  recipientName:   z.string().max(120).optional(),
  recipientPhone:  z.string().max(30).optional(),
  expiresInDays:   z.number().int().min(1).max(90).optional(),
})

export const SignShareLinkSchema = z.object({
  signerName:  z.string().min(2, "Ism kiritilishi shart").max(120),
  signerEmail: z.string().email().optional().or(z.literal('')),
})

// ─── Voice ───────────────────────────────────────────────
export const VoiceCommandSchema = z.object({
  text:   z.string().max(2000).optional(),
  audio:  z.object({
    data:     z.string().max(10_000_000),  // ~7.5MB base64
    mimeType: z.string().max(50),
  }).optional(),
  orgId:  z.string().optional(),
}).refine(d => !!d.text || !!d.audio?.data, {
  message: "Matn yoki audio kerak",
})
