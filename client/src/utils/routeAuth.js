/**
 * Route auth: read/clear stored auth from localStorage.
 * Admin uses 'token' + 'user', student/counsellor may use 'Mann-Mitra_token' + 'user'.
 * Use this for route protection so all roles are validated the same way.
 */

const TOKEN_KEYS = ['Mann-Mitra_token', 'token']
const USER_KEYS = ['Mann-Mitra_user', 'user']

export function getStoredAuth() {
  let token = null
  for (const key of TOKEN_KEYS) {
    try {
      token = localStorage.getItem(key)
      if (token) break
    } catch (_) {}
  }
  let user = null
  for (const key of USER_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        user = JSON.parse(raw)
        if (user && typeof user === 'object') break
      }
    } catch (_) {}
  }
  return { token, user }
}

export function clearStoredAuth() {
  TOKEN_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (_) {}
  })
  USER_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (_) {}
  })
}

export const ROLE_LOGIN = {
  admin: '/admin/login',
  counsellor: '/counsellor/login',
  student: '/login'
}

export const ROLE_DASHBOARD = {
  admin: '/admin/dashboard',
  counsellor: '/counsellor/dashboard',
  student: '/dashboard'
}
