// next-intl: type-safety BARCHA namespace fayllar bo'yicha
// (uz.json'lar struktura bo'yicha referent — kalit nomlari bir xil 3 tilda)

import type common            from './messages/uz/common.json'
import type nav               from './messages/uz/nav.json'
import type auth              from './messages/uz/auth.json'
import type dashboard         from './messages/uz/dashboard.json'
import type contracts         from './messages/uz/contracts.json'
import type subscription      from './messages/uz/subscription.json'
import type errors            from './messages/uz/errors.json'
import type validation        from './messages/uz/validation.json'
import type header            from './messages/uz/header.json'
import type sidebar           from './messages/uz/sidebar.json'
import type footer            from './messages/uz/footer.json'
import type mobileNav         from './messages/uz/mobileNav.json'
import type ui                from './messages/uz/ui.json'
import type landing           from './messages/uz/landing.json'
import type organizations     from './messages/uz/organizations.json'
import type counterparties    from './messages/uz/counterparties.json'
import type specifications    from './messages/uz/specifications.json'
import type invoices          from './messages/uz/invoices.json'
import type secretary         from './messages/uz/secretary.json'
import type hr                from './messages/uz/hr.json'
import type accountant        from './messages/uz/accountant.json'
import type lawyer            from './messages/uz/lawyer.json'
import type vault             from './messages/uz/vault.json'
import type settings          from './messages/uz/settings.json'
import type profile           from './messages/uz/profile.json'
import type security          from './messages/uz/security.json'
import type notifications     from './messages/uz/notifications.json'
import type useCases          from './messages/uz/useCases.json'
import type pricing           from './messages/uz/pricing.json'
import type about             from './messages/uz/about.json'
import type help              from './messages/uz/help.json'
import type sign              from './messages/uz/sign.json'
import type offline           from './messages/uz/offline.json'
import type voiceAssistant    from './messages/uz/voiceAssistant.json'
import type notificationsBell from './messages/uz/notificationsBell.json'
import type onboardingTour    from './messages/uz/onboardingTour.json'
import type supportChat       from './messages/uz/supportChat.json'
import type pwaPrompt         from './messages/uz/pwaPrompt.json'
import type healthIndicator   from './messages/uz/healthIndicator.json'
import type globalSearch      from './messages/uz/globalSearch.json'
import type errorBoundary     from './messages/uz/errorBoundary.json'
import type cookieConsent     from './messages/uz/cookieConsent.json'

type AllMessages = {
  common:            typeof common
  nav:               typeof nav
  auth:              typeof auth
  dashboard:         typeof dashboard
  contracts:         typeof contracts
  subscription:      typeof subscription
  errors:            typeof errors
  validation:        typeof validation
  header:            typeof header
  sidebar:           typeof sidebar
  footer:            typeof footer
  mobileNav:         typeof mobileNav
  ui:                typeof ui
  landing:           typeof landing
  organizations:     typeof organizations
  counterparties:    typeof counterparties
  specifications:    typeof specifications
  invoices:          typeof invoices
  secretary:         typeof secretary
  hr:                typeof hr
  accountant:        typeof accountant
  lawyer:            typeof lawyer
  vault:             typeof vault
  settings:          typeof settings
  profile:           typeof profile
  security:          typeof security
  notifications:     typeof notifications
  useCases:          typeof useCases
  pricing:           typeof pricing
  about:             typeof about
  help:              typeof help
  sign:              typeof sign
  offline:           typeof offline
  voiceAssistant:    typeof voiceAssistant
  notificationsBell: typeof notificationsBell
  onboardingTour:    typeof onboardingTour
  supportChat:       typeof supportChat
  pwaPrompt:         typeof pwaPrompt
  healthIndicator:   typeof healthIndicator
  globalSearch:      typeof globalSearch
  errorBoundary:     typeof errorBoundary
  cookieConsent:     typeof cookieConsent
}

declare module 'next-intl' {
  interface AppConfig {
    Messages: AllMessages
  }
}
