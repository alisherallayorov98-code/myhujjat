import http  from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend }  from 'k6/metrics'

/**
 * Steady-state test — login + autentifikatsiya bilan oddiy CRUD
 * 1000 VU, 30 daqiqa
 *
 * Avval test foydalanuvchilarini DB'da yarating (seed.ts),
 * yoki testlar tashkil qiluvchi (chad bo'shliq) bo'lsa avtomatik
 * register qiladi.
 */

const errorRate = new Rate('errors')
const loginTime = new Trend('login_duration')
const listTime  = new Trend('list_duration')

const API_URL = __ENV.API_URL || 'http://localhost:4000/api/v1'

export const options = {
  stages: [
    { duration: '5m',  target: 100  },   // ramp-up
    { duration: '20m', target: 1000 },   // steady state
    { duration: '5m',  target: 0    },   // cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    errors:            ['rate<0.02'],
    http_req_failed:   ['rate<0.02'],
  },
}

const TEST_USERS = JSON.parse(__ENV.TEST_USERS || '[]')  // [{email, password}]

export function setup() {
  if (TEST_USERS.length === 0) {
    console.warn('TEST_USERS env yo\'q — register avtomatik qilinadi')
  }
}

export default function () {
  const user = TEST_USERS[__VU % TEST_USERS.length] || {
    email:    `loadtest-${__VU}@e2e.uz`,
    password: 'LoadTest123!@#',
  }

  // Login
  const loginRes = http.post(`${API_URL}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  loginTime.add(loginRes.timings.duration)

  const ok = check(loginRes, { 'login 200': r => r.status === 200 })
  if (!ok) { errorRate.add(1); return }

  const token = JSON.parse(loginRes.body as string).accessToken
  const headers = { Authorization: `Bearer ${token}` }

  // List contracts
  const listRes = http.get(`${API_URL}/contracts?limit=20`, { headers })
  listTime.add(listRes.timings.duration)
  check(listRes, { 'list 200': r => r.status === 200 }) || errorRate.add(1)

  sleep(2)
}
