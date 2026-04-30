export type Lang = 'uz' | 'oz' | 'ru'

export interface User {
  id:           string
  email:        string
  firstName?:   string
  lastName?:    string
  phone?:       string
  avatarUrl?:   string
  language:     Lang
  role:         'USER' | 'ADMIN' | 'SUPER_ADMIN'
  subscription?: Subscription
}

export interface Organization {
  id:               string
  userId:           string
  name:             string
  fullName?:        string
  inn?:             string
  directorName?:    string
  directorPinfl?:   string
  bankName?:        string
  bankAccount?:     string
  mfo?:             string
  address?:         string
  phone?:           string
  oked?:            string
  qqsReg?:          string
  qqsStavka?:       string
  chiefAccountant?: string
  stampUrl?:        string
  signatureUrl?:    string
  status?:          string
  soliqSyncedAt?:   string
  isDefault:        boolean
  createdAt:        string
}

export interface Counterparty {
  id:             string
  organizationId: string
  name:           string
  inn?:           string
  directorName?:  string
  bankName?:      string
  bankAccount?:   string
  mfo?:           string
  address?:       string
  phone?:         string
  stirStatus?:    'active' | 'inactive' | 'unknown'
  stirCheckedAt?: string
}

export interface SpecItem {
  nomi:            string
  izoh?:           string
  shtrixKodi?:     string
  birlik:          string
  miqdori:         number
  narxi:           number
  yetkazibNarxi?:  number
  qqsFoiz:         'siz' | '0' | '12' | '15'
  qqsSumma:        number
  summa:           number
}

export interface Contract {
  id:              string
  organizationId:  string
  counterpartyId?: string
  contractNumber:  string
  contractDate:    string
  contractType:    ContractType
  city?:           string
  amount:          number
  status:          'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  content?:        string
  extraData?:      Record<string, string>
  productName?:    string
  specItems?:      SpecItem[]
  qqsEnabled?:     boolean
  qqsRate?:        number
  signedUs?:       boolean
  signedCp?:       boolean
  organization?:   Organization
  counterparty?:   Counterparty
  createdAt:       string
}

export type ContractType =
  | 'OLDI_SOTDI' | 'XIZMAT'    | 'IJARA'   | 'PUDRAT'
  | 'QOSHIMCHA'  | 'MOLIYAVIY' | 'DAVAL'   | 'XALQARO'
  | 'AGENTLIK'   | 'TRANSPORT' | 'LIZING'  | 'BOSHQA'

export interface Subscription {
  id:             string
  plan:           'FREE' | 'STANDARD' | 'PRO' | 'DEMO'
  status:         'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  expiresAt?:     string
  contractCount:  number
}

export interface Employee {
  id:             string
  organizationId: string
  ism:            string
  jshshir?:       string
  lavozim?:       string
  bolim?:         string
  maosh?:         string
  ishBoshi?:      string
  status?:        string
  tel?:           string
  createdAt:      string
}
