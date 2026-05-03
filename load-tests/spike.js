import http  from 'k6/http'
import { check, sleep } from 'k6'

/**
 * Spike test — to'satdan trafik keldi
 * 100 VU → 5000 VU 30 sekundda → qaytib 100 VU
 *
 * Maqsad: server crash bo'lmasligi, recovery vaqti
 */

const API_URL = __ENV.API_URL || 'http://localhost:4000/api/v1'

export const options = {
  stages: [
    { duration: '2m',  target: 100  },   // baseline
    { duration: '30s', target: 5000 },   // SPIKE
    { duration: '3m',  target: 5000 },   // hold
    { duration: '30s', target: 100  },   // recover
    { duration: '2m',  target: 100  },   // recovery confirmed
  ],
  thresholds: {
    // Spike paytida ham 95% so'rov 3 sekundda javob berishi kerak
    http_req_duration: ['p(95)<3000'],
    http_req_failed:   ['rate<0.10'],   // 10% xato OK (rate limit kutilgan)
  },
}

export default function () {
  http.get(`${API_URL}/health/quick`)
  sleep(0.5)
}
