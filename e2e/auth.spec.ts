/**
 * Auth tests run in a fresh browser context (no saved storage state).
 * Each test starts unauthenticated at the login page.
 */
import { test, expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD } from './support/global-setup'
import { resetSignupUser } from './support/helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.locator('[type=email]').waitFor()
})

// ── Wrong credentials ────────────────────────────────────────────────────────

test('wrong password shows invalid credentials error', async ({ page }) => {
  await page.fill('[type=email]', TEST_EMAIL)
  await page.fill('[type=password]', 'wrongpassword')
  await page.click('[type=submit]')
  await expect(page.getByText('Ongeldig e-mailadres of wachtwoord.')).toBeVisible()
})

test('unregistered email shows invalid credentials error', async ({ page }) => {
  await page.fill('[type=email]', 'nobody@loveybites.test')
  await page.fill('[type=password]', TEST_PASSWORD)
  await page.click('[type=submit]')
  await expect(page.getByText('Ongeldig e-mailadres of wachtwoord.')).toBeVisible()
})

// ── Allow-list rejection ─────────────────────────────────────────────────────

test('user not in allow-list is signed out and shown access denied error', async ({ page }) => {
  await page.fill('[type=email]', 'unauthorized@example.com')
  await page.fill('[type=password]', TEST_PASSWORD)
  await page.click('[type=submit]')
  await expect(page.getByText('Dit account heeft geen toegang tot LoveyBites.')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

// ── Successful login ─────────────────────────────────────────────────────────

test('valid credentials log in and redirect to recipe list', async ({ page }) => {
  await page.fill('[type=email]', TEST_EMAIL)
  await page.fill('[type=password]', TEST_PASSWORD)
  await page.click('[type=submit]')
  await page.waitForURL('/')
  await expect(page.getByText('kookboek')).toBeVisible()
})

// ── Sign-up flow ─────────────────────────────────────────────────────────────

test('sign-up with existing email shows "already in use" error', async ({ page }) => {
  await page.click('button:has-text("Registreren")')
  await page.fill('[type=email]', TEST_EMAIL)
  await page.fill('[type=password]', TEST_PASSWORD)
  await page.click('[type=submit]')
  await expect(page.getByText('Dit e-mailadres is al in gebruik.')).toBeVisible()
})

test('sign-up with weak password shows error', async ({ page }) => {
  await page.click('button:has-text("Registreren")')
  await page.fill('[type=email]', 'newuser@loveybites.test')
  await page.fill('[type=password]', '123')
  await page.click('[type=submit]')
  await expect(page.getByText('Wachtwoord moet minimaal 6 tekens zijn.')).toBeVisible()
})

// ── Successful sign-up ───────────────────────────────────────────────────────

test('successful sign-up with allowed email redirects to recipe list', async ({ page }) => {
  await resetSignupUser()
  await page.click('button:has-text("Registreren")')
  await page.fill('[type=email]', 'signup@loveybites.test')
  await page.fill('[type=password]', TEST_PASSWORD)
  await page.click('[type=submit]')
  await page.waitForURL('/')
  await expect(page.getByText('kookboek')).toBeVisible()
})
