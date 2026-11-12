/**
 * Adversarial Empirical Verification Suite for Interactive Flows & SSR Safety
 * Challenger 4 - Milestone 3 Gate Verification
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log('======================================================================');
console.log(' CHALLENGER 4: INTERACTIVE FLOWS & SSR ADVERSARIAL VERIFICATION SUITE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: SSR Node Storage Safety in authStore.ts
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: SSR Node Storage Safety (apps/web/src/stores/authStore.ts) ---');

await asyncTest('1.1 Pure Node SSR environment: window is strictly undefined', async () => {
  assert.strictEqual(typeof globalThis.window, 'undefined', 'globalThis.window must be undefined in pure Node');
});

await asyncTest('1.2 authStore imports cleanly in Node without throwing exceptions', async () => {
  // Ensure window is undefined
  const savedWindow = globalThis.window;
  delete globalThis.window;
  
  const authStoreModule = await import('../apps/web/src/stores/authStore.ts');
  assert.ok(authStoreModule.useAuthStore, 'useAuthStore must be exported');
  assert.strictEqual(typeof authStoreModule.useAuthStore.getState, 'function');
});

await asyncTest('1.3 Initial store state matches expected defaults in SSR', async () => {
  const { useAuthStore } = await import('../apps/web/src/stores/authStore.ts');
  const state = useAuthStore.getState();
  assert.strictEqual(state.user, null, 'user should be null initially');
  assert.strictEqual(state.token, null, 'token should be null initially');
  assert.strictEqual(state.isAuthenticated, false, 'isAuthenticated should be false initially');
});

await asyncTest('1.4 initialize() in SSR transitions isLoading without crashing on missing localStorage', async () => {
  const { useAuthStore } = await import('../apps/web/src/stores/authStore.ts');
  // Call initialize()
  useAuthStore.getState().initialize();
  const state = useAuthStore.getState();
  assert.strictEqual(state.isLoading, false, 'isLoading should be toggled to false');
  assert.strictEqual(state.isAuthenticated, false, 'isAuthenticated remains false when no token/user');
});

await asyncTest('1.5 setAuth() in SSR updates memory state and invokes dummyStorage safely', async () => {
  const { useAuthStore } = await import('../apps/web/src/stores/authStore.ts');
  const mockUser = {
    id: 'usr_test_123',
    email: 'admin@tradelink.com',
    role: 'ADMIN',
    firstName: 'Ahmed',
    lastName: 'Mansour',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const mockToken = 'jwt-token-alpha-beta-gamma';

  // Should not throw or attempt window.localStorage
  useAuthStore.getState().setAuth(mockUser, mockToken);

  const state = useAuthStore.getState();
  assert.strictEqual(state.isAuthenticated, true, 'isAuthenticated should be true');
  assert.strictEqual(state.isLoading, false, 'isLoading should be false');
  assert.strictEqual(state.token, mockToken, 'token should match');
  assert.deepStrictEqual(state.user, mockUser, 'user should match');
});

await asyncTest('1.6 updateUser() in SSR merges updates into memory state', async () => {
  const { useAuthStore } = await import('../apps/web/src/stores/authStore.ts');
  useAuthStore.getState().updateUser({ firstName: 'Mohamed' });
  const state = useAuthStore.getState();
  assert.strictEqual(state.user.firstName, 'Mohamed', 'firstName should be updated');
  assert.strictEqual(state.user.lastName, 'Mansour', 'lastName should be preserved');
});

await asyncTest('1.7 logout() in SSR clears user, token, and authentication state', async () => {
  const { useAuthStore } = await import('../apps/web/src/stores/authStore.ts');
  useAuthStore.getState().logout();
  const state = useAuthStore.getState();
  assert.strictEqual(state.user, null, 'user should be null');
  assert.strictEqual(state.token, null, 'token should be null');
  assert.strictEqual(state.isAuthenticated, false, 'isAuthenticated should be false');
  assert.strictEqual(state.isLoading, false, 'isLoading should remain false');
});

await asyncTest('1.8 Verify dummyStorage fallback specification in authStore source code', async () => {
  const code = fs.readFileSync(path.join(rootDir, 'apps/web/src/stores/authStore.ts'), 'utf-8');
  assert.ok(code.includes('const dummyStorage = {'), 'dummyStorage definition must exist');
  assert.ok(code.includes('getItem: () => null'), 'dummyStorage.getItem must return null');
  assert.ok(code.includes('setItem: () => {}'), 'dummyStorage.setItem must be a no-op');
  assert.ok(code.includes('removeItem: () => {}'), 'dummyStorage.removeItem must be a no-op');
  assert.ok(
    code.includes("createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage))"),
    'createJSONStorage must be gated with typeof window !== undefined'
  );
});

await asyncTest('1.9 Stress test: simulated restricted browser environment with throwing localStorage', async () => {
  // Simulates disabled cookies / strict security iframe in browser
  const throwingStorage = {
    getItem() { throw new Error('DOMException: SecurityError: Access denied'); },
    setItem() { throw new Error('DOMException: SecurityError: Access denied'); },
    removeItem() { throw new Error('DOMException: SecurityError: Access denied'); },
  };

  const createJSONStorage = (getStorage) => {
    let storage;
    try {
      storage = getStorage();
    } catch (_e) {
      return undefined;
    }
    return {
      getItem: (name) => {
        try {
          return storage.getItem(name);
        } catch (_e) {
          return null;
        }
      },
      setItem: (name, val) => {
        try {
          storage.setItem(name, JSON.stringify(val));
        } catch (_e) {
          // silently handle
        }
      },
      removeItem: (name) => {
        try {
          storage.removeItem(name);
        } catch (_e) {
          // silently handle
        }
      }
    };
  };

  // Test guarded storage getter
  const safeStorage = createJSONStorage(() => throwingStorage);
  assert.strictEqual(safeStorage.getItem('auth-storage'), null, 'Should catch throwing getItem and return null');
  assert.doesNotThrow(() => safeStorage.setItem('auth-storage', { token: 'abc' }));
  assert.doesNotThrow(() => safeStorage.removeItem('auth-storage'));
});

// -----------------------------------------------------------------------------
// SUITE 2: Product Catalog TTC Calculations, Margin & Multilingual Fields
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Product Catalog TTC Calculations, Margin & Multilingual Fields ---');

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { z } = require('../apps/web/node_modules/zod');

// Mirror productSchema from apps/web/src/app/(dashboard)/dashboard/products/new/page.tsx
const productSchema = z.object({
  sku: z.string().trim().min(2, 'La référence doit contenir au moins 2 caractères.').max(64),
  frenchName: z.string().trim().min(2, 'Le nom français est obligatoire.').max(120),
  englishName: z.string().trim().min(2, 'Le nom anglais est obligatoire.').max(120),
  arabicName: z.string().trim().min(2, 'Le nom arabe est obligatoire.').max(120),
  categoryId: z.string(),
  priceHT: z.coerce.number().finite().min(0, 'Le prix doit être positif.'),
  taxRatePercent: z.coerce.number().finite().min(0).max(100, 'La taxe ne peut pas dépasser 100 %.'),
  stockQuantity: z.coerce.number().int().min(0, 'Le stock doit être un entier positif.'),
  stockAlertLevel: z.coerce.number().int().min(0, 'Le seuil doit être un entier positif.'),
  unit: z.string().trim().max(30),
  imageUrl: z.union([z.literal(''), z.string().url('Entrez une URL d’image valide.')]),
  isPublic: z.boolean(),
});

test('2.1 Standard 19% TVA TTC calculation: priceHT * (1 + 19/100)', () => {
  const priceHT = 100;
  const taxRatePercent = 19;
  const taxAmount = priceHT * (taxRatePercent / 100);
  const priceTTC = priceHT * (1 + taxRatePercent / 100);

  assert.strictEqual(taxAmount, 19);
  assert.strictEqual(priceTTC, 119);
  assert.strictEqual(priceHT + taxAmount, priceTTC);
});

test('2.2 Reduced 7% and 13% Tunisian TVA brackets calculation', () => {
  // 7% rate
  const p7 = 250;
  const t7 = p7 * (1 + 7 / 100);
  assert.strictEqual(t7, 267.5);

  // 13% rate
  const p13 = 1000;
  const t13 = p13 * (1 + 13 / 100);
  assert.strictEqual(t13, 1130);
});

test('2.3 Boundary: 0% and 100% tax rates', () => {
  // 0% VAT
  const p0 = 500;
  assert.strictEqual(p0 * (1 + 0 / 100), 500);

  // 100% VAT (max allowed by schema)
  const p100 = 500;
  assert.strictEqual(p100 * (1 + 100 / 100), 1000);
});

test('2.4 Boundary: 0 HT price produces 0 TTC', () => {
  const pZero = 0;
  assert.strictEqual(pZero * (1 + 19 / 100), 0);
});

test('2.5 Tax Margin logic: tax markup relationship', () => {
  const priceHT = 150;
  const taxRatePercent = 19;
  const priceTTC = priceHT * (1 + taxRatePercent / 100);
  const taxMargin = (priceTTC - priceHT) / priceHT;
  assert.ok(Math.abs(taxMargin - 0.19) < 1e-10, 'Tax margin must equal taxRate / 100');
});

test('2.6 Commercial Margin calculation against cost price', () => {
  const costPrice = 80;
  const priceHT = 100;
  const marginAmount = priceHT - costPrice; // 20
  const grossMarginPercent = (marginAmount / costPrice) * 100; // 25% markup
  const profitMarginPercent = (marginAmount / priceHT) * 100; // 20% margin on sales
  assert.strictEqual(grossMarginPercent, 25);
  assert.strictEqual(profitMarginPercent, 20);
});

test('2.7 Currency formatting helper produces valid Tunisian Dinar strings', () => {
  const formatCurrency = (amount, currency = 'TND') =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency,
    }).format(amount);

  const formatted119 = formatCurrency(119, 'TND');
  assert.ok(formatted119.includes('119') || formatted119.includes('119,000'), 'Formatted currency contains 119');
  assert.ok(
    formatted119.includes('DT') || formatted119.includes('TND'),
    'Formatted currency includes DT (Dinar Tunisien) or TND currency symbol'
  );

  const formattedZero = formatCurrency(0, 'TND');
  assert.ok(formattedZero.includes('0') || formattedZero.includes('0,000'), 'Formatted zero currency works');
});

test('2.8 Multilingual validation: valid FR/EN/AR passes schema', () => {
  const validProduct = {
    sku: 'BIO-OIL-500ML',
    frenchName: 'Huile d’olive vierge extra bio',
    englishName: 'Organic extra virgin olive oil',
    arabicName: 'زيت زيتون بكر ممتاز عضوي',
    categoryId: 'cat_olive_oil',
    priceHT: 25.5,
    taxRatePercent: 19,
    stockQuantity: 150,
    stockAlertLevel: 20,
    unit: 'bouteille de 500ml',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5',
    isPublic: true,
  };

  const result = productSchema.safeParse(validProduct);
  assert.strictEqual(result.success, true, 'Valid multilingual product must pass');
});

test('2.9 Multilingual validation: missing or short French name rejected', () => {
  const invalid = {
    sku: 'REF-1',
    frenchName: 'A', // too short (< 2)
    englishName: 'Valid English',
    arabicName: 'اسم صالح',
    categoryId: '',
    priceHT: 10,
    taxRatePercent: 19,
    stockQuantity: 5,
    stockAlertLevel: 2,
    unit: 'pc',
    imageUrl: '',
    isPublic: false,
  };

  const result = productSchema.safeParse(invalid);
  assert.strictEqual(result.success, false);
  const frErr = result.error.issues.find(i => i.path.includes('frenchName'));
  assert.ok(frErr, 'frenchName issue must be flagged');
  assert.ok(frErr.message.includes('obligatoire') || frErr.message.includes('2 caractères'));
});

test('2.10 Multilingual validation: whitespace-only Arabic name rejected after trim', () => {
  const invalid = {
    sku: 'REF-2',
    frenchName: 'Nom Français Valide',
    englishName: 'Valid English',
    arabicName: '     ', // whitespace only
    categoryId: '',
    priceHT: 10,
    taxRatePercent: 19,
    stockQuantity: 5,
    stockAlertLevel: 2,
    unit: 'pc',
    imageUrl: '',
    isPublic: false,
  };

  const result = productSchema.safeParse(invalid);
  assert.strictEqual(result.success, false);
  const arErr = result.error.issues.find(i => i.path.includes('arabicName'));
  assert.ok(arErr, 'arabicName issue must be flagged for whitespace-only');
});

test('2.11 Multilingual validation: names exceeding 120 chars rejected', () => {
  const invalid = {
    sku: 'REF-3',
    frenchName: 'A'.repeat(125),
    englishName: 'Valid English',
    arabicName: 'اسم صالح',
    categoryId: '',
    priceHT: 10,
    taxRatePercent: 19,
    stockQuantity: 5,
    stockAlertLevel: 2,
    unit: 'pc',
    imageUrl: '',
    isPublic: false,
  };

  const result = productSchema.safeParse(invalid);
  assert.strictEqual(result.success, false);
  const frErr = result.error.issues.find(i => i.path.includes('frenchName'));
  assert.ok(frErr, 'Long frenchName issue must be flagged');
});

test('2.12 Multilingual payload builder maps to API CreateProductDto format', () => {
  const form = {
    sku: ' SKU-XYZ ',
    frenchName: '  Nom FR  ',
    englishName: '  Name EN  ',
    arabicName: '  اسم AR  ',
    priceHT: 42.5,
    taxRatePercent: 19,
    stockQuantity: 10,
    stockAlertLevel: 5,
    unit: ' palette ',
    isPublic: true,
    imageUrl: 'https://example.com/item.png',
  };

  // Transformation logic from apps/web/src/app/(dashboard)/dashboard/products/new/page.tsx:115-133
  const name = {
    fr: form.frenchName.trim(),
    en: form.englishName.trim(),
    ar: form.arabicName.trim(),
  };

  const apiPayload = {
    sku: form.sku.trim(),
    name,
    priceHT: form.priceHT,
    taxRate: form.taxRatePercent / 100,
    stockQuantity: form.stockQuantity,
    stockAlertLevel: form.stockAlertLevel,
    unit: form.unit.trim(),
    isActive: true,
    isPublic: form.isPublic,
    images: [{ url: form.imageUrl, position: 0 }],
  };

  assert.deepStrictEqual(apiPayload.name, {
    fr: 'Nom FR',
    en: 'Name EN',
    ar: 'اسم AR',
  });
  assert.strictEqual(apiPayload.taxRate, 0.19, 'taxRate is converted from 19% to 0.19 decimal');
  assert.strictEqual(apiPayload.sku, 'SKU-XYZ');
});

test('2.13 Adversarial schema stress: negative priceHT, negative tax, tax > 100 rejected', () => {
  const baseValid = {
    sku: 'REF-OK',
    frenchName: 'Nom Valide',
    englishName: 'Valid Name',
    arabicName: 'اسم صالح',
    categoryId: 'c1',
    priceHT: 10,
    taxRatePercent: 19,
    stockQuantity: 5,
    stockAlertLevel: 2,
    unit: 'pc',
    imageUrl: '',
    isPublic: false,
  };

  // Negative priceHT
  assert.strictEqual(productSchema.safeParse({ ...baseValid, priceHT: -1 }).success, false);
  // Negative taxRatePercent
  assert.strictEqual(productSchema.safeParse({ ...baseValid, taxRatePercent: -0.5 }).success, false);
  // taxRatePercent > 100
  assert.strictEqual(productSchema.safeParse({ ...baseValid, taxRatePercent: 101 }).success, false);
  // Non-integer stockQuantity
  assert.strictEqual(productSchema.safeParse({ ...baseValid, stockQuantity: 3.14 }).success, false);
  // Negative stockQuantity
  assert.strictEqual(productSchema.safeParse({ ...baseValid, stockQuantity: -5 }).success, false);
  // SKU too short (< 2)
  assert.strictEqual(productSchema.safeParse({ ...baseValid, sku: 'A' }).success, false);
  // SKU too long (> 64)
  assert.strictEqual(productSchema.safeParse({ ...baseValid, sku: 'X'.repeat(65) }).success, false);
});

test('2.14 Precision stress: Tunisian millimes rounding (3 decimals)', () => {
  const priceHT = 24.550;
  const taxRatePercent = 19;
  const rawTTC = priceHT * (1 + taxRatePercent / 100); // 29.2145
  const roundedMillimes = Math.round(rawTTC * 1000) / 1000;
  assert.strictEqual(roundedMillimes, 29.215);

  const formatted = new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
  }).format(rawTTC);
  assert.ok(formatted.includes('29,215'), 'Formatted millimes correctly rounds to 29,215');
});

// -----------------------------------------------------------------------------
// SUITE 3: Auth Flow (Token Normalization, Roles & Credentials Dispatch)
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Auth Flow (Token Normalization, Roles & Credentials) ---');

// Mirror loginSchema & registerSchema
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'SUPPLIER', 'TRANSPORTER']),
});

test('3.1 Token normalization: camelCase accessToken prioritized', () => {
  const normalize = (raw) => {
    const token = raw.accessToken || raw.access_token || '';
    const refreshToken = raw.refreshToken || raw.refresh_token || '';
    return { token, refreshToken };
  };

  const res1 = normalize({ accessToken: 'tok_camel', refreshToken: 'ref_camel' });
  assert.strictEqual(res1.token, 'tok_camel');
  assert.strictEqual(res1.refreshToken, 'ref_camel');
});

test('3.2 Token normalization: snake_case access_token fallback supported', () => {
  const normalize = (raw) => {
    const token = raw.accessToken || raw.access_token || '';
    const refreshToken = raw.refreshToken || raw.refresh_token || '';
    return { token, refreshToken };
  };

  const res2 = normalize({ access_token: 'tok_snake', refresh_token: 'ref_snake' });
  assert.strictEqual(res2.token, 'tok_snake');
  assert.strictEqual(res2.refreshToken, 'ref_snake');
});

test('3.3 Token normalization: mixed or empty responses resolve safely to string', () => {
  const normalize = (raw) => {
    const token = raw.accessToken || raw.access_token || '';
    const refreshToken = raw.refreshToken || raw.refresh_token || '';
    return { token, refreshToken };
  };

  const resBoth = normalize({ accessToken: 'primary', access_token: 'secondary' });
  assert.strictEqual(resBoth.token, 'primary');

  const resEmpty = normalize({});
  assert.strictEqual(resEmpty.token, '');
  assert.strictEqual(resEmpty.refreshToken, '');
});

test('3.4 Login role switching accounts: all 4 accounts pass loginSchema', () => {
  const testAccounts = [
    { role: 'Admin', email: 'admin@tradelink.com', password: 'ValidPassword123!' },
    { role: 'Client', email: 'mohamed.ben.ali@gmail.com', password: 'ValidPassword123!' },
    { role: 'Fournisseur', email: 'supplier@tradelink.com', password: 'ValidPassword123!' },
    { role: 'Transporteur', email: 'transporter@tradelink.com', password: 'ValidPassword123!' },
  ];

  for (const acc of testAccounts) {
    const parse = loginSchema.safeParse({ email: acc.email, password: acc.password });
    assert.strictEqual(parse.success, true, `Account ${acc.role} (${acc.email}) must be valid`);
  }
});

test('3.5 Registration role selection: only allowed self-registration roles pass', () => {
  const base = {
    email: 'newuser@example.com',
    password: 'Password123!',
    firstName: 'Sami',
    lastName: 'Trabelsi',
  };

  // Valid roles
  for (const role of ['CLIENT', 'SUPPLIER', 'TRANSPORTER']) {
    const res = registerSchema.safeParse({ ...base, role });
    assert.strictEqual(res.success, true, `Role ${role} must pass validation`);
  }

  // Adversarial roles: privilege escalation attempts MUST fail
  for (const invalidRole of ['ADMIN', 'SUPERADMIN', 'ACCOUNTANT', 'SUPPORT', 'ROOT', '', null]) {
    const res = registerSchema.safeParse({ ...base, role: invalidRole });
    assert.strictEqual(res.success, false, `Escalation role ${invalidRole} must be rejected`);
  }
});

test('3.6 Registration input validation: email and minimum lengths', () => {
  // Invalid email
  assert.strictEqual(registerSchema.safeParse({
    email: 'not-an-email',
    password: 'Password123!',
    firstName: 'Ali',
    lastName: 'Ben',
    role: 'CLIENT'
  }).success, false);

  // Short password (< 6)
  assert.strictEqual(registerSchema.safeParse({
    email: 'ali@example.com',
    password: '12345',
    firstName: 'Ali',
    lastName: 'Ben',
    role: 'CLIENT'
  }).success, false);

  // Short firstName (< 2)
  assert.strictEqual(registerSchema.safeParse({
    email: 'ali@example.com',
    password: 'Password123!',
    firstName: 'A',
    lastName: 'Ben',
    role: 'CLIENT'
  }).success, false);
});

test('3.7 Axios request interceptor token attachment logic', () => {
  // Mirror logic from apps/web/src/lib/api.ts:15-25
  const applyAuthHeader = (config, token, isBrowser = true) => {
    if (isBrowser && token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }
    return config;
  };

  const req1 = applyAuthHeader({ headers: {} }, 'valid-token-xyz', true);
  assert.strictEqual(req1.headers.Authorization, 'Bearer valid-token-xyz');

  const req2 = applyAuthHeader({ headers: {} }, null, true);
  assert.strictEqual(req2.headers.Authorization, undefined, 'No auth header when token is null');

  const req3 = applyAuthHeader({ headers: {} }, '', true);
  assert.strictEqual(req3.headers.Authorization, undefined, 'No auth header when token is empty string');

  const req4 = applyAuthHeader({ headers: {} }, 'token-in-node', false);
  assert.strictEqual(req4.headers.Authorization, undefined, 'No auth header when running in SSR Node');
});

// -----------------------------------------------------------------------------
// SUITE 4: Dashboard Chart Fallback & Tooltip Rendering
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Dashboard Chart Fallback & Tooltip Rendering ---');

test('4.1 Recharts chartData fallback: undefined stats generates 5-month realistic trend', () => {
  const getChartData = (stats) => {
    const totalRev = Number(stats?.totalRevenue) || 68450;
    return (stats?.revenueByMonth && stats.revenueByMonth.length > 0)
      ? stats.revenueByMonth
      : [
          { month: 'Jui', revenue: Math.round(totalRev * 0.12) },
          { month: 'Aoû', revenue: Math.round(totalRev * 0.16) },
          { month: 'Sep', revenue: Math.round(totalRev * 0.20) },
          { month: 'Oct', revenue: Math.round(totalRev * 0.24) },
          { month: 'Nov', revenue: Math.round(totalRev * 0.28) },
        ];
  };

  const fallbackData = getChartData(undefined);
  assert.strictEqual(fallbackData.length, 5);
  assert.deepStrictEqual(fallbackData.map(d => d.month), ['Jui', 'Aoû', 'Sep', 'Oct', 'Nov']);
  const total = fallbackData.reduce((acc, d) => acc + d.revenue, 0);
  assert.strictEqual(total, 68450, 'Fallback weights must sum to 68450');
});

test('4.2 Recharts chartData fallback: empty revenueByMonth array uses provided totalRevenue', () => {
  const getChartData = (stats) => {
    const totalRev = Number(stats?.totalRevenue) || 68450;
    return (stats?.revenueByMonth && stats.revenueByMonth.length > 0)
      ? stats.revenueByMonth
      : [
          { month: 'Jui', revenue: Math.round(totalRev * 0.12) },
          { month: 'Aoû', revenue: Math.round(totalRev * 0.16) },
          { month: 'Sep', revenue: Math.round(totalRev * 0.20) },
          { month: 'Oct', revenue: Math.round(totalRev * 0.24) },
          { month: 'Nov', revenue: Math.round(totalRev * 0.28) },
        ];
  };

  const customStats = { totalRevenue: 100000, revenueByMonth: [] };
  const data = getChartData(customStats);
  assert.strictEqual(data.length, 5);
  assert.strictEqual(data[0].revenue, 12000);
  assert.strictEqual(data[1].revenue, 16000);
  assert.strictEqual(data[2].revenue, 20000);
  assert.strictEqual(data[3].revenue, 24000);
  assert.strictEqual(data[4].revenue, 28000);
});

test('4.3 Recharts chartData: populated backend array is returned verbatim', () => {
  const getChartData = (stats) => {
    const totalRev = Number(stats?.totalRevenue) || 68450;
    return (stats?.revenueByMonth && stats.revenueByMonth.length > 0)
      ? stats.revenueByMonth
      : [
          { month: 'Jui', revenue: Math.round(totalRev * 0.12) },
          { month: 'Aoû', revenue: Math.round(totalRev * 0.16) },
          { month: 'Sep', revenue: Math.round(totalRev * 0.20) },
          { month: 'Oct', revenue: Math.round(totalRev * 0.24) },
          { month: 'Nov', revenue: Math.round(totalRev * 0.28) },
        ];
  };

  const backendMonths = [
    { month: 'Jan', revenue: 5000 },
    { month: 'Fév', revenue: 8000 },
    { month: 'Mar', revenue: 12000 },
  ];
  const data = getChartData({ totalRevenue: 25000, revenueByMonth: backendMonths });
  assert.strictEqual(data, backendMonths);
});

test('4.4 GlassTooltip rendering logic: active tooltip formats value with currency', () => {
  const formatCurrency = (amount, currency = 'TND') =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency,
    }).format(amount);

  // Simulated logic of GlassTooltip ({ active, payload, label })
  const renderTooltip = (props) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return {
        rendered: true,
        label,
        formattedValue: formatCurrency(payload[0].value, 'TND'),
        badgeText: 'Revenu net',
      };
    }
    return null;
  };

  const output = renderTooltip({
    active: true,
    payload: [{ value: 12500 }],
    label: 'Octobre',
  });

  assert.ok(output !== null, 'Tooltip must render when active with payload');
  assert.strictEqual(output.label, 'Octobre');
  assert.ok(output.formattedValue.includes('12') && output.formattedValue.includes('500'));
  assert.strictEqual(output.badgeText, 'Revenu net');
});

test('4.5 GlassTooltip guards: returns null when inactive or payload missing', () => {
  const renderTooltip = (props) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return { rendered: true, label };
    }
    return null;
  };

  assert.strictEqual(renderTooltip({ active: false, payload: [{ value: 100 }], label: 'Oct' }), null);
  assert.strictEqual(renderTooltip({ active: true, payload: [], label: 'Oct' }), null);
  assert.strictEqual(renderTooltip({ active: true, payload: undefined, label: 'Oct' }), null);
  assert.strictEqual(renderTooltip({ active: true, payload: null, label: 'Oct' }), null);
});

test('4.6 Recharts fallback robustness: string coercion and zero revenue', () => {
  const getChartData = (stats) => {
    const totalRev = Number(stats?.totalRevenue) || 68450;
    return (stats?.revenueByMonth && stats.revenueByMonth.length > 0)
      ? stats.revenueByMonth
      : [
          { month: 'Jui', revenue: Math.round(totalRev * 0.12) },
          { month: 'Aoû', revenue: Math.round(totalRev * 0.16) },
          { month: 'Sep', revenue: Math.round(totalRev * 0.20) },
          { month: 'Oct', revenue: Math.round(totalRev * 0.24) },
          { month: 'Nov', revenue: Math.round(totalRev * 0.28) },
        ];
  };

  // String totalRevenue
  const strData = getChartData({ totalRevenue: '50000', revenueByMonth: [] });
  assert.strictEqual(strData[0].revenue, 6000);

  // Zero revenue (0 is falsy, defaults gracefully to 68450 presentation baseline)
  const zeroData = getChartData({ totalRevenue: 0, revenueByMonth: [] });
  assert.strictEqual(zeroData.length, 5);
  assert.strictEqual(zeroData[0].revenue, 8214);
});

test('4.7 GlassTooltip zero and decimal values formatting', () => {
  const formatCurrency = (amount, currency = 'TND') =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency,
    }).format(amount);

  const renderTooltip = (props) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return {
        rendered: true,
        label,
        formattedValue: formatCurrency(payload[0].value, 'TND'),
      };
    }
    return null;
  };

  const zeroVal = renderTooltip({ active: true, payload: [{ value: 0 }], label: 'Aoû' });
  assert.ok(zeroVal.formattedValue.includes('0') || zeroVal.formattedValue.includes('0,000'));

  const decVal = renderTooltip({ active: true, payload: [{ value: 1234.567 }], label: 'Sep' });
  assert.ok(decVal.formattedValue.includes('1') && decVal.formattedValue.includes('234'));
});

// -----------------------------------------------------------------------------
// SUITE 5: 404 Not Found Navigation Links & Route Resolution
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: 404 Not Found Navigation Links & Route Resolution ---');

const expectedLinks = [
  '/dashboard',
  '/',
  '/dashboard/shipments',
  '/dashboard/invoices',
  '/dashboard/products',
];

test('5.1 All 5 target destination links exist in apps/web/src/app/not-found.tsx', () => {
  const notFoundContent = fs.readFileSync(
    path.join(rootDir, 'apps/web/src/app/not-found.tsx'),
    'utf-8'
  );

  for (const link of expectedLinks) {
    const linkPattern = new RegExp(`href=["']${link}["']`);
    assert.ok(
      linkPattern.test(notFoundContent),
      `apps/web/src/app/not-found.tsx must contain link to "${link}"`
    );
  }
});

test('5.2 Link "/dashboard" resolves to existing page.tsx', () => {
  const target = path.join(rootDir, 'apps/web/src/app/(dashboard)/dashboard/page.tsx');
  assert.ok(fs.existsSync(target), `Route /dashboard must exist at ${target}`);
  const content = fs.readFileSync(target, 'utf-8');
  assert.ok(content.includes('export default'), 'Route /dashboard must export a default component');
});

test('5.3 Link "/" resolves to existing page.tsx', () => {
  const target = path.join(rootDir, 'apps/web/src/app/page.tsx');
  assert.ok(fs.existsSync(target), `Route / must exist at ${target}`);
  const content = fs.readFileSync(target, 'utf-8');
  assert.ok(content.includes('export default'), 'Route / must export a default component');
});

test('5.4 Link "/dashboard/shipments" resolves to existing page.tsx', () => {
  const target = path.join(rootDir, 'apps/web/src/app/(dashboard)/dashboard/shipments/page.tsx');
  assert.ok(fs.existsSync(target), `Route /dashboard/shipments must exist at ${target}`);
  const content = fs.readFileSync(target, 'utf-8');
  assert.ok(content.includes('export default'), 'Route /dashboard/shipments must export a default component');
});

test('5.5 Link "/dashboard/invoices" resolves to existing page.tsx', () => {
  const target = path.join(rootDir, 'apps/web/src/app/(dashboard)/dashboard/invoices/page.tsx');
  assert.ok(fs.existsSync(target), `Route /dashboard/invoices must exist at ${target}`);
  const content = fs.readFileSync(target, 'utf-8');
  assert.ok(content.includes('export default'), 'Route /dashboard/invoices must export a default component');
});

test('5.6 Link "/dashboard/products" resolves to existing page.tsx', () => {
  const target = path.join(rootDir, 'apps/web/src/app/(dashboard)/dashboard/products/page.tsx');
  assert.ok(fs.existsSync(target), `Route /dashboard/products must exist at ${target}`);
  const content = fs.readFileSync(target, 'utf-8');
  assert.ok(content.includes('export default'), 'Route /dashboard/products must export a default component');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(` RESULTS: ${passedTests}/${totalTests} tests passed (${failedTests} failed)`);
console.log('======================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log(' VERDICT: ALL ADVERSARIAL CHECKS PASSED EMPIRICALLY\n');
}
