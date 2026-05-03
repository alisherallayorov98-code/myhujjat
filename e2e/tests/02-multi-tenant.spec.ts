/**
 * KRITIK: Multi-tenant security — bir foydalanuvchi boshqasiga kira olmasligi
 *
 * Strategy: 2 ta foydalanuvchi yaratamiz, har biriga 1 organizatsiya.
 * User A boshqa foydalanuvchining orgId/contractId ni so'rovga qo'shsa,
 * 403/404 javob kelishi kerak.
 */

import { test, expect, request } from '@playwright/test'
import { API_URL } from '../playwright.config'

interface TestUser {
  email:    string
  password: string
  token?:   string
  orgId?:   string
}

async function registerAndLogin(api: any, user: TestUser): Promise<string> {
  await api.post(`${API_URL}/auth/register`, {
    data: { ...user, firstName: 'A', lastName: 'B' },
  })
  const loginRes = await api.post(`${API_URL}/auth/login`, { data: user })
  const json = await loginRes.json()
  return json.accessToken || json.token
}

async function createOrg(api: any, token: string): Promise<string> {
  const res = await api.post(`${API_URL}/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
    data:    { name: `Test Org ${Date.now()}`, inn: '301234567' },
  })
  const json = await res.json()
  return json.id
}

test.describe('Multi-tenant security', () => {
  test('User A user B'ning kontragentlarini ko\'ra olmaydi', async () => {
    const api = await request.newContext()

    const userA: TestUser = { email: `a-${Date.now()}@e2e.uz`, password: 'Test123!@#' }
    const userB: TestUser = { email: `b-${Date.now()}@e2e.uz`, password: 'Test123!@#' }

    userA.token = await registerAndLogin(api, userA)
    userB.token = await registerAndLogin(api, userB)
    userA.orgId = await createOrg(api, userA.token)
    userB.orgId = await createOrg(api, userB.token)

    // User A try to access B's org
    const res = await api.get(`${API_URL}/counterparties?orgId=${userB.orgId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    })

    // 403 yoki 404 javob kelishi kerak
    expect([403, 404]).toContain(res.status())
  })

  test('User A user B'ning AI tarixiga kira olmaydi', async () => {
    const api = await request.newContext()

    const userA: TestUser = { email: `a2-${Date.now()}@e2e.uz`, password: 'Test123!@#' }
    const userB: TestUser = { email: `b2-${Date.now()}@e2e.uz`, password: 'Test123!@#' }

    userA.token = await registerAndLogin(api, userA)
    userB.token = await registerAndLogin(api, userB)
    userB.orgId = await createOrg(api, userB.token)

    const res = await api.get(`${API_URL}/ai/history?orgId=${userB.orgId}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    })

    expect([403, 404]).toContain(res.status())
  })

  test('User A user B'ning shartnomasini imzolay olmaydi', async () => {
    const api = await request.newContext()

    const userA: TestUser = { email: `a3-${Date.now()}@e2e.uz`, password: 'Test123!@#' }
    const userB: TestUser = { email: `b3-${Date.now()}@e2e.uz`, password: 'Test123!@#' }

    userA.token = await registerAndLogin(api, userA)
    userB.token = await registerAndLogin(api, userB)
    userB.orgId = await createOrg(api, userB.token)

    // User B shartnoma yaratadi
    const cRes = await api.post(`${API_URL}/contracts`, {
      headers: { Authorization: `Bearer ${userB.token}` },
      data: {
        organizationId: userB.orgId,
        contractType:   'OLDI_SOTDI',
        contractDate:   '2026-05-04',
        amount:         1_000_000,
      },
    })
    const contract = await cRes.json()

    // User A B'ning shartnomasini imzolashga harakat qiladi
    const challRes = await api.get(`${API_URL}/eimzo/challenge`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    })
    const { id: challengeId } = await challRes.json()

    const verifyRes = await api.post(`${API_URL}/eimzo/verify/${contract.id}`, {
      headers: { Authorization: `Bearer ${userA.token}` },
      data: { challengeId, signature: 'fake', certificate: 'fake', signerType: 'us' },
    })

    // CRITICAL: User A can't sign B's contract
    expect([403, 404]).toContain(verifyRes.status())
  })

  test('User A boshqasining tashkilot a\'zolarini boshqara olmaydi', async () => {
    const api = await request.newContext()

    const userA: TestUser = { email: `a4-${Date.now()}@e2e.uz`, password: 'Test123!@#' }
    const userB: TestUser = { email: `b4-${Date.now()}@e2e.uz`, password: 'Test123!@#' }

    userA.token = await registerAndLogin(api, userA)
    userB.token = await registerAndLogin(api, userB)
    userB.orgId = await createOrg(api, userB.token)

    // User A try to invite to B's org as OWNER
    const res = await api.post(`${API_URL}/orgs/${userB.orgId}/members/invite`, {
      headers: { Authorization: `Bearer ${userA.token}` },
      data:    { role: 'OWNER' },
    })

    expect([403, 404]).toContain(res.status())
  })
})
