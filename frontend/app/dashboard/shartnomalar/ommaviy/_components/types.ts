export type ItemStatus =
  | 'pending'   // STIR qo'shilgan, soliqdan tortilmagan
  | 'fetching'  // soliqdan tortilmoqda
  | 'ready'     // ma'lumotlar tayyor
  | 'error'     // STIR topilmadi yoki xato
  | 'created'   // shartnoma yaratildi (backend)
  | 'signed'    // imzolandi (browser eimzo)
  | 'sent'      // Didox'ga yuborildi

export interface BulkItem {
  stir:           string
  name?:          string
  directorName?:  string
  address?:       string
  bankName?:      string
  bankAccount?:   string
  mfo?:           string
  contractNumber?: string
  amount?:        number
  productName?:   string
  status:         ItemStatus
  errorMessage?:  string
  contractId?:    string
}

export interface BulkDraft {
  id:                 string
  currentStep:        number
  templateId:         string | null
  customContent:      string | null
  contractType:       string
  defaultAmount:      string | number
  defaultProductName: string | null
  city:               string
  numberingMode:      'manual' | 'sequential'
  startNumber:        string | null
  items:              BulkItem[]
  status:             'draft' | 'executing' | 'completed' | 'cancelled'
  totalCount:         number
  successCount:       number
  errorCount:         number
}
