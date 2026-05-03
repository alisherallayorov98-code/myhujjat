# Load Tests — k6

Backend yuklanish testlari. k6 o'rnatish: https://k6.io/docs/get-started/installation/

## Ishga tushirish

```bash
# 100 paralel foydalanuvchi, 5 daqiqa
k6 run --vus 100 --duration 5m smoke.js

# Steady-state — 1000 foydalanuvchi, 30 daqiqa
k6 run steady-state.js

# Spike test — 100 → 5000 → 100
k6 run spike.js
```

## API URL

```bash
export API_URL=https://api.myhujjat.uz/api/v1
```

## Test scenariylari

| Fayl | Maqsad | Qaytariladigan sigʻim |
|---|---|---|
| `smoke.js` | Asosiy endpointlar ishlaydimi | 100 VU, 5 min |
| `steady-state.js` | Yuqori barqaror yuklanish | 1000 VU, 30 min |
| `spike.js` | To'satdan ko'p so'rov | 100→5000→100, 10 min |
| `race-conditions.js` | Bulk-send paralel klik | 50 VU, 2 min |

## Threshold'lar

- p95 < 500ms
- p99 < 1500ms
- Error rate < 1%
- Throughput > 100 RPS
