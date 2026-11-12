import type { Category, DashboardStats, Invoice, PaginatedResponse, Payment, Product, Shipment, Ticket, User } from '@/types'

export type MockActivityPeriod = '7d' | '30d' | '12m'

export interface MockActivityPoint {
  label: string
  date?: string
  orders: number
  shipments: number
  payments: number
}

export interface MockDashboardActivity {
  period: MockActivityPeriod
  points: MockActivityPoint[]
}

export const mockCategories: Category[] = [
  {
    id: 'cat-agri',
    name: { fr: 'Agriculture & alimentation', en: 'Agriculture & food', ar: 'الزراعة والأغذية' },
    slug: 'agriculture-food',
    parentId: null,
    createdAt: '2025-01-08T09:00:00.000Z',
  },
  {
    id: 'cat-logistics',
    name: { fr: 'Logistique', en: 'Logistics', ar: 'اللوجستيات' },
    slug: 'logistics',
    parentId: null,
    createdAt: '2025-02-16T10:30:00.000Z',
  },
  {
    id: 'cat-textile',
    name: { fr: 'Textile & mode', en: 'Textile & fashion', ar: 'المنسوجات والموضة' },
    slug: 'textile-fashion',
    parentId: null,
    createdAt: '2025-03-11T12:00:00.000Z',
  },
]

export const mockProducts: Product[] = [
  {
    id: 'prod-1001',
    name: { fr: 'Huile d’olive extra vierge', en: 'Extra virgin olive oil', ar: 'زيت زيتون بكر ممتاز' },
    slug: 'extra-virgin-olive-oil',
    sku: 'TRD-OL-001',
    priceHT: 18.5,
    taxRate: 19,
    stockQuantity: 120,
    stockAlertLevel: 25,
    unit: 'litres',
    categoryId: 'cat-agri',
    supplierId: 'u-1003',
    images: [],
    isActive: true,
    isPublic: true,
    createdAt: '2026-10-27T08:00:00.000Z',
    updatedAt: '2026-11-04T08:00:00.000Z',
    category: mockCategories[0],
    supplier: { id: 'u-1003', displayName: { fr: 'Noura Essid', en: 'Noura Essid', ar: 'نورة السعيد' } },
  },
  {
    id: 'prod-1002',
    name: { fr: 'Boîtes de fruits premium', en: 'Premium fruit boxes', ar: 'صناديق فاكهة مميزة' },
    slug: 'premium-fruit-boxes',
    sku: 'TRD-FR-220',
    priceHT: 42,
    taxRate: 19,
    stockQuantity: 8,
    stockAlertLevel: 12,
    unit: 'unités',
    categoryId: 'cat-agri',
    supplierId: 'u-1007',
    images: [],
    isActive: true,
    isPublic: true,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
    category: mockCategories[0],
    supplier: { id: 'u-1007', displayName: { fr: 'Hassan Mohamed', en: 'Hassan Mohamed', ar: 'حسن محمد' } },
  },
  {
    id: 'prod-1003',
    name: { fr: 'Palette de transport standard', en: 'Standard shipping pallet', ar: 'رافعة شحن قياسية' },
    slug: 'standard-shipping-pallet',
    sku: 'TRD-LOG-310',
    priceHT: 75,
    taxRate: 19,
    stockQuantity: 64,
    stockAlertLevel: 20,
    unit: 'pallets',
    categoryId: 'cat-logistics',
    supplierId: 'u-1012',
    images: [],
    isActive: true,
    isPublic: true,
    createdAt: '2026-09-15T14:00:00.000Z',
    updatedAt: '2026-11-07T14:00:00.000Z',
    category: mockCategories[1],
    supplier: { id: 'u-1012', displayName: { fr: 'Fatima Mansouri', en: 'Fatima Mansouri', ar: 'فاطمة منصوري' } },
  },
  {
    id: 'prod-1004',
    name: { fr: 'Sac de transport textile', en: 'Textile shipping bag', ar: 'كيس شحن للنسيج' },
    slug: 'textile-shipping-bag',
    sku: 'TRD-TXT-420',
    priceHT: 28,
    taxRate: 19,
    stockQuantity: 240,
    stockAlertLevel: 35,
    unit: 'unités',
    categoryId: 'cat-textile',
    supplierId: 'u-1003',
    images: [],
    isActive: true,
    isPublic: false,
    createdAt: '2026-11-01T11:15:00.000Z',
    updatedAt: '2026-11-05T11:15:00.000Z',
    category: mockCategories[2],
    supplier: { id: 'u-1003', displayName: { fr: 'Noura Essid', en: 'Noura Essid', ar: 'نورة السعيد' } },
  },
  {
    id: 'prod-1005',
    name: { fr: 'Pack d’échantillons export', en: 'Export sample pack', ar: 'مجموعة عينات للتصدير' },
    slug: 'export-sample-pack',
    sku: 'TRD-EXP-550',
    priceHT: 12.2,
    taxRate: 19,
    stockQuantity: 0,
    stockAlertLevel: 8,
    unit: 'packs',
    categoryId: 'cat-agri',
    supplierId: 'u-1007',
    images: [],
    isActive: true,
    isPublic: true,
    createdAt: '2026-08-30T09:30:00.000Z',
    updatedAt: '2026-11-03T09:30:00.000Z',
    category: mockCategories[0],
    supplier: { id: 'u-1007', displayName: { fr: 'Hassan Mohamed', en: 'Hassan Mohamed', ar: 'حسن محمد' } },
  },
  {
    id: 'prod-1006',
    name: { fr: 'Conteneur réfrigéré', en: 'Refrigerated container', ar: 'حاوية مبردة' },
    slug: 'refrigerated-container',
    sku: 'TRD-REF-620',
    priceHT: 420,
    taxRate: 19,
    stockQuantity: 18,
    stockAlertLevel: 6,
    unit: 'unités',
    categoryId: 'cat-logistics',
    supplierId: 'u-1012',
    images: [],
    isActive: false,
    isPublic: true,
    createdAt: '2026-07-08T16:00:00.000Z',
    updatedAt: '2026-10-10T16:00:00.000Z',
    category: mockCategories[1],
    supplier: { id: 'u-1012', displayName: { fr: 'Fatima Mansouri', en: 'Fatima Mansouri', ar: 'فاطمة منصوري' } },
  },
]

export const mockDashboardStats: DashboardStats = {
  totalOrders: 2864,
  totalRevenueByCurrency: [
    { currency: 'TND', amount: 1843500 },
    { currency: 'EUR', amount: 428500 },
    { currency: 'USD', amount: 335000 },
  ],
  pendingOrders: 118,
  completedOrders: 2147,
  totalProducts: 1864,
  activeShipments: 432,
  adminMetrics: {
    totalUsers: 1284,
    activeUsers: 932,
    suspendedUsers: 29,
    pendingKyc: 16,
  },
  recentOrders: [
    {
      id: 'ord-2018',
      orderNumber: 'TRD-2018',
      clientId: 'user-1',
      supplierId: 'user-7',
      status: 'SHIPPED',
      totalAmount: 8200,
      currency: 'TND',
      shippingAddress: 'Tunis, Tunisia',
      notes: 'Urgent export for retail chain',
      createdAt: '2026-11-02T09:15:00.000Z',
      updatedAt: '2026-11-03T12:00:00.000Z',
      items: [],
    },
    {
      id: 'ord-2019',
      orderNumber: 'TRD-2019',
      clientId: 'user-2',
      supplierId: 'user-8',
      status: 'IN_PREPARATION',
      totalAmount: 12650,
      currency: 'EUR',
      shippingAddress: 'Cairo, Egypt',
      notes: 'Packaging for food export',
      createdAt: '2026-11-03T15:10:00.000Z',
      updatedAt: '2026-11-04T10:00:00.000Z',
      items: [],
    },
    {
      id: 'ord-2020',
      orderNumber: 'TRD-2020',
      clientId: 'user-3',
      supplierId: 'user-9',
      status: 'DELIVERED',
      totalAmount: 9400,
      currency: 'USD',
      shippingAddress: 'Casablanca, Morocco',
      notes: 'Delivered with customs clearance',
      createdAt: '2026-11-04T08:20:00.000Z',
      updatedAt: '2026-11-05T18:45:00.000Z',
      items: [],
    },
  ],
  revenueByMonth: [
    { month: 'Jan', date: '2026-01-01', currency: 'TND', revenue: 180000 },
    { month: 'Feb', date: '2026-02-01', currency: 'TND', revenue: 210000 },
    { month: 'Mar', date: '2026-03-01', currency: 'TND', revenue: 245000 },
    { month: 'Apr', date: '2026-04-01', currency: 'TND', revenue: 288000 },
    { month: 'May', date: '2026-05-01', currency: 'TND', revenue: 312000 },
    { month: 'Jun', date: '2026-06-01', currency: 'TND', revenue: 355000 },
  ],
}

export const mockAdminUser: User = {
  id: 'admin-demo',
  email: 'admin@tradelink.local',
  role: 'ADMIN',
  status: 'ACTIVE',
  mfaEnabled: true,
  phone: '+216 20 000 001',
  displayName: { fr: 'Admin TradeLink', en: 'TradeLink Admin', ar: 'مسؤول TradeLink' },
  preferredLang: 'FR',
  createdAt: '2024-01-01T00:00:00.000Z',
  firstName: 'Admin',
  lastName: 'TradeLink',
}

export const mockUsers: User[] = [
  {
    id: 'u-1001',
    email: 'amina.benali@tradelink.tn',
    role: 'ADMIN',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+216 20 111 000',
    displayName: { fr: 'Amina Ben Ali', en: 'Amina Ben Ali', ar: 'أمينة بن علي' },
    preferredLang: 'FR',
    createdAt: '2025-02-14T10:00:00.000Z',
    firstName: 'Amina',
    lastName: 'Ben Ali',
  },
  {
    id: 'u-1002',
    email: 'youssef.karim@northfood.ma',
    role: 'CLIENT',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+212 612 000 101',
    displayName: { fr: 'Youssef Karim', en: 'Youssef Karim', ar: 'يوسف كريم' },
    preferredLang: 'FR',
    createdAt: '2025-03-12T08:30:00.000Z',
    firstName: 'Youssef',
    lastName: 'Karim',
  },
  {
    id: 'u-1003',
    email: 'noura.essid@afribio.com',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    mfaEnabled: false,
    phone: '+216 50 222 334',
    displayName: { fr: 'Noura Essid', en: 'Noura Essid', ar: 'نورة السعيد' },
    preferredLang: 'AR',
    createdAt: '2025-04-11T09:00:00.000Z',
    firstName: 'Noura',
    lastName: 'Essid',
  },
  {
    id: 'u-1004',
    email: 'sami.mansour@union-logistics.eg',
    role: 'TRANSPORTER',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+966 55 880 112',
    displayName: { fr: 'Sami Mansour', en: 'Sami Mansour', ar: 'سامي منصور' },
    preferredLang: 'EN',
    createdAt: '2025-05-07T13:45:00.000Z',
    firstName: 'Sami',
    lastName: 'Mansour',
  },
  {
    id: 'u-1005',
    email: 'lucie.garcia@tradelink.ai',
    role: 'SUPPORT',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+33 6 41 990 120',
    displayName: { fr: 'Lucie Garcia', en: 'Lucie Garcia', ar: 'لوسي غارسيا' },
    preferredLang: 'EN',
    createdAt: '2025-06-18T11:20:00.000Z',
    firstName: 'Lucie',
    lastName: 'Garcia',
  },
  {
    id: 'u-1006',
    email: 'zakaria.ait@medtrade.tn',
    role: 'CLIENT',
    status: 'PENDING_KYC',
    mfaEnabled: false,
    phone: '+216 98 432 119',
    displayName: { fr: 'Zakaria Aït', en: 'Zakaria Ait', ar: 'زكريا عيّط' },
    preferredLang: 'FR',
    createdAt: '2026-08-15T16:05:00.000Z',
    firstName: 'Zakaria',
    lastName: 'Aït',
  },
  {
    id: 'u-1007',
    email: 'hassan.mohamed@globalport.ma',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+212 660 765 243',
    displayName: { fr: 'Hassan Mohamed', en: 'Hassan Mohamed', ar: 'حسن محمد' },
    preferredLang: 'AR',
    createdAt: '2025-08-30T07:15:00.000Z',
    firstName: 'Hassan',
    lastName: 'Mohamed',
  },
  {
    id: 'u-1008',
    email: 'maria.fernandez@bluewave.es',
    role: 'CLIENT',
    status: 'SUSPENDED',
    mfaEnabled: true,
    phone: '+34 600 118 953',
    displayName: { fr: 'Maria Fernandez', en: 'Maria Fernandez', ar: 'ماريا فرنانديز' },
    preferredLang: 'EN',
    createdAt: '2024-11-02T10:10:00.000Z',
    firstName: 'Maria',
    lastName: 'Fernandez',
  },
  {
    id: 'u-1009',
    email: 'omar.hadid@accounts.tn',
    role: 'ACCOUNTANT',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+216 21 555 876',
    displayName: { fr: 'Omar Hadid', en: 'Omar Hadid', ar: 'عمر حديد' },
    preferredLang: 'FR',
    createdAt: '2025-09-21T14:00:00.000Z',
    firstName: 'Omar',
    lastName: 'Hadid',
  },
  {
    id: 'u-1010',
    email: 'lauren.dupont@comply.africa',
    role: 'CLIENT',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+221 77 135 6099',
    displayName: { fr: 'Lauren Dupont', en: 'Lauren Dupont', ar: 'لوران دوپون' },
    preferredLang: 'FR',
    createdAt: '2026-10-18T09:00:00.000Z',
    firstName: 'Lauren',
    lastName: 'Dupont',
  },
  {
    id: 'u-1011',
    email: 'nabil.tayeb@cargohub.ma',
    role: 'TRANSPORTER',
    status: 'KYC_SUBMITTED',
    mfaEnabled: false,
    phone: '+212 669 441 220',
    displayName: { fr: 'Nabil Tayeb', en: 'Nabil Tayeb', ar: 'نبيل طيب' },
    preferredLang: 'AR',
    createdAt: '2026-11-05T12:30:00.000Z',
    firstName: 'Nabil',
    lastName: 'Tayeb',
  },
  {
    id: 'u-1012',
    email: 'fatima.mansouri@helia.com',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    mfaEnabled: true,
    phone: '+213 550 883 209',
    displayName: { fr: 'Fatima Mansouri', en: 'Fatima Mansouri', ar: 'فاطمة منصوري' },
    preferredLang: 'AR',
    createdAt: '2025-01-08T08:45:00.000Z',
    firstName: 'Fatima',
    lastName: 'Mansouri',
  },
]

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-2001',
    invoiceNumber: 'INV-2001',
    orderId: 'ord-2018',
    issueDate: '2026-11-03T09:00:00.000Z',
    dueDate: '2026-11-20T00:00:00.000Z',
    subtotal: 22000,
    taxAmount: 2860,
    totalAmount: 24860,
    currency: 'TND',
    status: 'PAID',
    paidAt: '2026-11-08T10:12:00.000Z',
  },
  {
    id: 'inv-2002',
    invoiceNumber: 'INV-2002',
    orderId: 'ord-2019',
    issueDate: '2026-11-04T11:30:00.000Z',
    dueDate: '2026-11-18T00:00:00.000Z',
    subtotal: 10400,
    taxAmount: 2200,
    totalAmount: 12600,
    currency: 'EUR',
    status: 'PAID',
    paidAt: '2026-11-07T16:25:00.000Z',
  },
  {
    id: 'inv-2003',
    invoiceNumber: 'INV-2003',
    orderId: 'ord-2020',
    issueDate: '2026-11-05T15:40:00.000Z',
    dueDate: '2026-11-22T00:00:00.000Z',
    subtotal: 15400,
    taxAmount: 3100,
    totalAmount: 18500,
    currency: 'USD',
    status: 'SENT',
    paidAt: null,
  },
  {
    id: 'inv-2004',
    invoiceNumber: 'INV-2004',
    orderId: 'ord-2021',
    issueDate: '2026-11-06T10:00:00.000Z',
    dueDate: '2026-11-21T00:00:00.000Z',
    subtotal: 26800,
    taxAmount: 5600,
    totalAmount: 32400,
    currency: 'TND',
    status: 'PAID',
    paidAt: '2026-11-05T17:05:00.000Z',
  },
  {
    id: 'inv-2005',
    invoiceNumber: 'INV-2005',
    orderId: 'ord-2022',
    issueDate: '2026-11-01T12:00:00.000Z',
    dueDate: '2026-11-13T00:00:00.000Z',
    subtotal: 6400,
    taxAmount: 1200,
    totalAmount: 7600,
    currency: 'EUR',
    status: 'OVERDUE',
    paidAt: null,
  },
  {
    id: 'inv-2006',
    invoiceNumber: 'INV-2006',
    orderId: 'ord-2023',
    issueDate: '2026-10-30T14:15:00.000Z',
    dueDate: '2026-11-15T00:00:00.000Z',
    subtotal: 40400,
    taxAmount: 8800,
    totalAmount: 49200,
    currency: 'TND',
    status: 'PAID',
    paidAt: '2026-11-01T14:10:00.000Z',
  },
  {
    id: 'inv-2007',
    invoiceNumber: 'INV-2007',
    orderId: 'ord-2024',
    issueDate: '2026-11-08T08:20:00.000Z',
    dueDate: '2026-11-29T00:00:00.000Z',
    subtotal: 9300,
    taxAmount: 1900,
    totalAmount: 11200,
    currency: 'USD',
    status: 'SENT',
    paidAt: null,
  },
  {
    id: 'inv-2008',
    invoiceNumber: 'INV-2008',
    orderId: 'ord-2025',
    issueDate: '2026-10-24T09:30:00.000Z',
    dueDate: '2026-11-11T00:00:00.000Z',
    subtotal: 17200,
    taxAmount: 3300,
    totalAmount: 20500,
    currency: 'EUR',
    status: 'CANCELLED',
    paidAt: null,
  },
]

export function getMockInvoicesResponse(params?: { page?: number; limit?: number; status?: string }): PaginatedResponse<Invoice> {
  const page = Math.max(1, Number(params?.page ?? 1))
  const limit = Math.max(1, Number(params?.limit ?? 10))
  const status = params?.status
  const filtered = mockInvoices.filter((invoice) => !status || status === 'ALL' || invoice.status === status)
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * limit

  return {
    data: filtered.slice(start, start + limit),
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  }
}

export function getMockUsersResponse(params?: {
  page?: number
  limit?: number
  role?: string
  status?: string
  search?: string
}): PaginatedResponse<User> {
  const page = Math.max(1, Number(params?.page ?? 1))
  const limit = Math.max(1, Number(params?.limit ?? 10))
  const role = params?.role
  const status = params?.status
  const search = params?.search?.trim().toLowerCase() || ''

  const filtered = mockUsers.filter((user) => {
    const matchesRole = !role || role === 'ALL' || user.role === role
    const matchesStatus = !status || status === 'ALL' || user.status === status
    const searchText = [user.email, user.firstName, user.lastName, user.phone, user.displayName ?? '']
      .join(' ')
      .toLowerCase()
    const matchesSearch = !search || searchText.includes(search)
    return matchesRole && matchesStatus && matchesSearch
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * limit
  const data = filtered.slice(start, start + limit)

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  }
}

export const mockTickets: Ticket[] = [
  {
    id: 'ticket-1001',
    ticketNumber: 'TRD-TKT-1001',
    userId: 'u-1002',
    subject: 'Demande de suivi de commande',
    description: 'Nous voulons vérifier le statut de notre commande en cours et la date de livraison estimée.',
    priority: 'HIGH',
    status: 'OPEN',
    category: 'ORDER',
    assignedToId: 'u-1005',
    createdAt: '2026-11-06T09:00:00.000Z',
    updatedAt: '2026-11-06T11:30:00.000Z',
  },
  {
    id: 'ticket-1002',
    ticketNumber: 'TRD-TKT-1002',
    userId: 'u-1006',
    subject: 'Paiement refusé',
    description: 'Le paiement a été refusé malgré la validation de la carte. Nous avons besoin d’assistance.',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    category: 'PAYMENT',
    assignedToId: 'u-1009',
    createdAt: '2026-11-08T13:45:00.000Z',
    updatedAt: '2026-11-09T08:20:00.000Z',
  },
  {
    id: 'ticket-1003',
    ticketNumber: 'TRD-TKT-1003',
    userId: 'u-1011',
    subject: 'Documentation de fournisseur',
    description: 'Je dois mettre à jour les pièces justificatives pour valider mon profil fournisseur.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    category: 'KYC',
    assignedToId: 'u-1001',
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-05T14:00:00.000Z',
  },
]

export function getMockTicketsResponse(): Ticket[] {
  return mockTickets
}

export const mockAuditLogs = [
  {
    id: 'audit-1001',
    action: 'LOGIN',
    targetType: 'USER',
    targetId: 'u-1001',
    metadata: { ip: '10.0.0.12', region: 'TN' },
    ipAddress: '10.0.0.12',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: '2026-11-09T08:00:00.000Z',
    actor: { id: 'u-1001', displayName: { fr: 'Amina Ben Ali', en: 'Amina Ben Ali', ar: 'أمينة بن علي' } },
  },
  {
    id: 'audit-1002',
    action: 'KYC_APPROVED',
    targetType: 'KYC',
    targetId: 'kyc-202',
    metadata: { reviewer: 'u-1001', decision: 'approved' },
    ipAddress: '10.0.0.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: '2026-11-09T08:45:00.000Z',
    actor: { id: 'u-1001', displayName: { fr: 'Amina Ben Ali', en: 'Amina Ben Ali', ar: 'أمينة بن علي' } },
  },
  {
    id: 'audit-1003',
    action: 'PAYMENT_PROCESSED',
    targetType: 'PAYMENT',
    targetId: 'pay-1004',
    metadata: { amount: 32400, currency: 'TND', provider: 'STRIPE' },
    ipAddress: '10.0.0.23',
    userAgent: 'TradeLink Backend/1.0',
    createdAt: '2026-11-09T09:10:00.000Z',
    actor: { id: 'system', displayName: 'System' },
  },
  {
    id: 'audit-1004',
    action: 'ACCOUNT_SUSPENDED',
    targetType: 'USER',
    targetId: 'u-1008',
    metadata: { reason: 'policy_violation', review: 'manual' },
    ipAddress: '10.0.0.43',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    createdAt: '2026-11-08T17:00:00.000Z',
    actor: { id: 'u-1001', displayName: { fr: 'Amina Ben Ali', en: 'Amina Ben Ali', ar: 'أمينة بن علي' } },
  },
]

export function getMockAuditLogsResponse(params?: { page?: number; limit?: number; action?: string; targetType?: string }) {
  const page = Math.max(1, Number(params?.page ?? 1))
  const limit = Math.max(1, Number(params?.limit ?? 25))
  const action = params?.action
  const targetType = params?.targetType

  const filtered = mockAuditLogs.filter((log) => {
    const matchesAction = !action || log.action === action
    const matchesTargetType = !targetType || !log.targetType || log.targetType.toLowerCase() === targetType.toLowerCase()
    return matchesAction && matchesTargetType
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * limit

  return {
    data: filtered.slice(start, start + limit),
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  }
}

export function getMockCategoriesResponse(): Category[] {
  return mockCategories
}

export function getMockProductsResponse(params?: {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  isActive?: boolean
  isPublic?: boolean
  inStock?: boolean
  lowStock?: boolean
}): PaginatedResponse<Product> {
  const page = Math.max(1, Number(params?.page ?? 1))
  const limit = Math.max(1, Number(params?.limit ?? 12))
  const search = params?.search?.trim().toLowerCase() || ''
  const categoryId = params?.categoryId
  const isActive = params?.isActive
  const isPublic = params?.isPublic
  const inStock = params?.inStock
  const lowStock = params?.lowStock

  const filtered = mockProducts.filter((product) => {
    const matchesSearch = !search || [product.name.fr, product.name.en, product.name.ar, product.sku].join(' ').toLowerCase().includes(search)
    const matchesCategory = !categoryId || categoryId === 'ALL' || product.categoryId === categoryId
    const matchesActive = isActive === undefined || product.isActive === isActive
    const matchesPublic = isPublic === undefined || product.isPublic === isPublic
    const matchesInStock = !inStock || product.stockQuantity > 0
    const matchesLowStock = !lowStock || (product.stockQuantity > 0 && product.stockQuantity <= product.stockAlertLevel)
    return matchesSearch && matchesCategory && matchesActive && matchesPublic && matchesInStock && matchesLowStock
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * limit

  return {
    data: filtered.slice(start, start + limit),
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  }
}

export const mockShipments: Shipment[] = [
  {
    id: 'ship-1001',
    shipmentNumber: 'TRD-SHP-1001',
    orderId: 'ord-2018',
    status: 'IN_TRANSIT',
    estimatedDelivery: '2026-11-20T00:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-11-10T09:15:00.000Z',
    order: { orderNumber: 'TRD-2018' },
    transporter: { id: 'u-1004', email: 'sami.mansour@union-logistics.eg', displayName: 'Sami Mansour' },
  },
  {
    id: 'ship-1002',
    shipmentNumber: 'TRD-SHP-1002',
    orderId: 'ord-2017',
    status: 'OUT_FOR_DELIVERY',
    estimatedDelivery: '2026-11-12T00:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-11-05T14:30:00.000Z',
    order: { orderNumber: 'TRD-2017' },
    transporter: { id: 'u-1011', email: 'nabil.tayeb@cargohub.ma', displayName: 'Nabil Tayeb' },
  },
  {
    id: 'ship-1003',
    shipmentNumber: 'TRD-SHP-1003',
    orderId: 'ord-2021',
    status: 'DELIVERED',
    estimatedDelivery: '2026-11-08T00:00:00.000Z',
    deliveredAt: '2026-11-08T16:40:00.000Z',
    createdAt: '2026-11-02T10:00:00.000Z',
    order: { orderNumber: 'TRD-2021' },
    transporter: { id: 'u-1004', email: 'sami.mansour@union-logistics.eg', displayName: 'Sami Mansour' },
  },
  {
    id: 'ship-1004',
    shipmentNumber: 'TRD-SHP-1004',
    orderId: 'ord-2023',
    status: 'ASSIGNED',
    estimatedDelivery: '2026-11-18T00:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-11-09T07:45:00.000Z',
    order: { orderNumber: 'TRD-2023' },
    transporter: { id: 'u-1013', email: 'faycal.hammou@transafrica.tn', displayName: 'Fayçal Hammou' },
  },
  {
    id: 'ship-1005',
    shipmentNumber: 'TRD-SHP-1005',
    orderId: 'ord-2024',
    status: 'PICKUP',
    estimatedDelivery: '2026-11-17T00:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-11-06T11:20:00.000Z',
    order: { orderNumber: 'TRD-2024' },
    transporter: { id: 'u-1012', email: 'fatima.mansouri@helia.com', displayName: 'Fatima Mansouri' },
  },
  {
    id: 'ship-1006',
    shipmentNumber: 'TRD-SHP-1006',
    orderId: 'ord-2026',
    status: 'FAILED',
    estimatedDelivery: '2026-11-14T00:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-11-04T13:00:00.000Z',
    order: { orderNumber: 'TRD-2026' },
    transporter: { id: 'u-1004', email: 'sami.mansour@union-logistics.eg', displayName: 'Sami Mansour' },
  },
  {
    id: 'ship-1007',
    shipmentNumber: 'TRD-SHP-1007',
    orderId: 'ord-2027',
    status: 'RETURNED',
    estimatedDelivery: '2026-11-11T00:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-11-01T09:05:00.000Z',
    order: { orderNumber: 'TRD-2027' },
    transporter: { id: 'u-1011', email: 'nabil.tayeb@cargohub.ma', displayName: 'Nabil Tayeb' },
  },
  {
    id: 'ship-1008',
    shipmentNumber: 'TRD-SHP-1008',
    orderId: 'ord-2029',
    status: 'PICKED_UP',
    estimatedDelivery: '2026-11-15T00:00:00.000Z',
    deliveredAt: null,
    createdAt: '2026-11-07T08:10:00.000Z',
    order: { orderNumber: 'TRD-2029' },
    transporter: { id: 'u-1004', email: 'sami.mansour@union-logistics.eg', displayName: 'Sami Mansour' },
  },
]

export const mockPayments: Payment[] = [
  {
    id: 'pay-1001',
    invoiceId: 'inv-2001',
    amount: 24850,
    currency: 'TND',
    provider: 'STRIPE',
    status: 'SUCCEEDED',
    transactionId: 'pi_3Q7Kx7VfQLx4kA8N1',
    paidAt: '2026-11-08T10:12:00.000Z',
    createdAt: '2026-11-08T10:10:00.000Z',
    invoice: { invoiceNumber: 'INV-2001' },
  },
  {
    id: 'pay-1002',
    invoiceId: 'inv-2002',
    amount: 12600,
    currency: 'EUR',
    provider: 'CINETPAY',
    status: 'SUCCEEDED',
    transactionId: 'CP-248910',
    paidAt: '2026-11-07T16:25:00.000Z',
    createdAt: '2026-11-07T16:21:00.000Z',
    invoice: { invoiceNumber: 'INV-2002' },
  },
  {
    id: 'pay-1003',
    invoiceId: 'inv-2003',
    amount: 18500,
    currency: 'USD',
    provider: 'FEDAPAY',
    status: 'PENDING',
    transactionId: 'FD-4491',
    paidAt: null,
    createdAt: '2026-11-09T09:00:00.000Z',
    invoice: { invoiceNumber: 'INV-2003' },
  },
  {
    id: 'pay-1004',
    invoiceId: 'inv-2004',
    amount: 32400,
    currency: 'TND',
    provider: 'STRIPE',
    status: 'SUCCEEDED',
    transactionId: 'pi_3Q7MqwFx0FZq7M1S3',
    paidAt: '2026-11-05T17:05:00.000Z',
    createdAt: '2026-11-05T17:02:00.000Z',
    invoice: { invoiceNumber: 'INV-2004' },
  },
  {
    id: 'pay-1005',
    invoiceId: 'inv-2005',
    amount: 7600,
    currency: 'EUR',
    provider: 'CINETPAY',
    status: 'FAILED',
    transactionId: 'CP-248970',
    paidAt: null,
    createdAt: '2026-11-02T12:00:00.000Z',
    invoice: { invoiceNumber: 'INV-2005' },
  },
  {
    id: 'pay-1006',
    invoiceId: 'inv-2006',
    amount: 49200,
    currency: 'TND',
    provider: 'STRIPE',
    status: 'SUCCEEDED',
    transactionId: 'pi_3Q7N0vFq44KDzY3Tf',
    paidAt: '2026-11-01T14:10:00.000Z',
    createdAt: '2026-11-01T14:08:00.000Z',
    invoice: { invoiceNumber: 'INV-2006' },
  },
  {
    id: 'pay-1007',
    invoiceId: 'inv-2007',
    amount: 11200,
    currency: 'USD',
    provider: 'FEDAPAY',
    status: 'SUCCEEDED',
    transactionId: 'FD-4512',
    paidAt: '2026-11-10T08:50:00.000Z',
    createdAt: '2026-11-10T08:46:00.000Z',
    invoice: { invoiceNumber: 'INV-2007' },
  },
  {
    id: 'pay-1008',
    invoiceId: 'inv-2008',
    amount: 20500,
    currency: 'EUR',
    provider: 'STRIPE',
    status: 'REFUNDED',
    transactionId: 'pi_3Q7N8eD6ftI0qg2M7',
    paidAt: '2026-10-28T11:15:00.000Z',
    createdAt: '2026-10-28T11:10:00.000Z',
    invoice: { invoiceNumber: 'INV-2008' },
  },
]

export function getMockShipmentsResponse(): Shipment[] {
  return mockShipments
}

export function getMockPaymentsResponse(params?: { page?: number; limit?: number }): PaginatedResponse<Payment> {
  const page = Math.max(1, Number(params?.page ?? 1))
  const limit = Math.max(1, Number(params?.limit ?? 10))
  const total = mockPayments.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * limit

  return {
    data: mockPayments.slice(start, start + limit),
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
    },
  }
}

export const mockActivitiesByPeriod: Record<MockActivityPeriod, MockDashboardActivity> = {
  '7d': {
    period: '7d',
    points: [
      { label: 'Lun', orders: 48, shipments: 33, payments: 28 },
      { label: 'Mar', orders: 52, shipments: 36, payments: 31 },
      { label: 'Mer', orders: 59, shipments: 39, payments: 34 },
      { label: 'Jeu', orders: 65, shipments: 42, payments: 38 },
      { label: 'Ven', orders: 70, shipments: 44, payments: 41 },
      { label: 'Sam', orders: 63, shipments: 41, payments: 36 },
      { label: 'Dim', orders: 58, shipments: 37, payments: 32 },
    ],
  },
  '30d': {
    period: '30d',
    points: [
      { label: 'S1', orders: 160, shipments: 120, payments: 101 },
      { label: 'S2', orders: 175, shipments: 128, payments: 109 },
      { label: 'S3', orders: 188, shipments: 134, payments: 116 },
      { label: 'S4', orders: 210, shipments: 152, payments: 124 },
      { label: 'S5', orders: 226, shipments: 165, payments: 132 },
      { label: 'S6', orders: 242, shipments: 178, payments: 141 },
    ],
  },
  '12m': {
    period: '12m',
    points: [
      { label: 'Jan', orders: 210, shipments: 160, payments: 130 },
      { label: 'Fév', orders: 236, shipments: 172, payments: 142 },
      { label: 'Mar', orders: 248, shipments: 180, payments: 149 },
      { label: 'Avr', orders: 274, shipments: 191, payments: 156 },
      { label: 'Mai', orders: 296, shipments: 205, payments: 168 },
      { label: 'Jui', orders: 315, shipments: 216, payments: 178 },
      { label: 'Juil', orders: 332, shipments: 224, payments: 184 },
      { label: 'Aoû', orders: 346, shipments: 233, payments: 190 },
      { label: 'Sep', orders: 360, shipments: 241, payments: 203 },
      { label: 'Oct', orders: 378, shipments: 252, payments: 212 },
      { label: 'Nov', orders: 389, shipments: 260, payments: 228 },
      { label: 'Déc', orders: 410, shipments: 271, payments: 244 },
    ],
  },
}
