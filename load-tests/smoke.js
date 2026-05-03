import http  from 'k6/http'
import { check, sleep } from 'k6'
import { Rate }         from 'k6/metrics'

// Asosiy public endpoint'lar smoke testi — 100 VU, 5 min
// Maqsad: tizim oddiy yuklanish ostida ishlaydimi

const errorRate = new Rate('errors')

const API_URL = __ENV.API_URL || 'http://localhost:4000/api/v1'

export const options = {
  vus:      100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    errors:            ['rate<0.01'],
    http_req_failed:   ['rate<0.01'],
  },
}

export default function () {
  // 1. Health check
  const health = http.get(`${API_URL}/health/quick`)
  check(health, {
    'health 200': (r) => r.status === 200,
  }) || errorRate.add(1)

  // 2. Public STIR lookup (rate-limited)
  // Bu endpoint authsiz emas, lekin haqiqiy STIR'lar ko'rsatilgan
  // Skip — auth kerak

  sleep(1)
}
