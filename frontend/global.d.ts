// next-intl: type-safety BARCHA namespace fayllar bo'yicha
// (uz.json'lar struktura bo'yicha referent — kalit nomlari bir xil 3 tilda)

import type common       from './messages/uz/common.json'
import type nav          from './messages/uz/nav.json'
import type auth         from './messages/uz/auth.json'
import type dashboard    from './messages/uz/dashboard.json'
import type contracts    from './messages/uz/contracts.json'
import type subscription from './messages/uz/subscription.json'
import type errors       from './messages/uz/errors.json'
import type validation   from './messages/uz/validation.json'
import type header       from './messages/uz/header.json'
import type sidebar      from './messages/uz/sidebar.json'
import type footer       from './messages/uz/footer.json'
import type mobileNav    from './messages/uz/mobileNav.json'
import type ui           from './messages/uz/ui.json'
import type landing      from './messages/uz/landing.json'

type AllMessages = {
  common:       typeof common
  nav:          typeof nav
  auth:         typeof auth
  dashboard:    typeof dashboard
  contracts:    typeof contracts
  subscription: typeof subscription
  errors:       typeof errors
  validation:   typeof validation
  header:       typeof header
  sidebar:      typeof sidebar
  footer:       typeof footer
  mobileNav:    typeof mobileNav
  ui:           typeof ui
  landing:      typeof landing
}

declare module 'next-intl' {
  interface AppConfig {
    Messages: AllMessages
  }
}
