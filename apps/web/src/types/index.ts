export type UserRole =
  | 'VISITOR'
  | 'ADMIN'
  | 'CLIENT'
  | 'SUPPLIER'
  | 'TRANSPORTER'
  | 'ACCOUNTANT'
  | 'SUPPORT'

export interface User {
  id: string
  email: string | null
  role: UserRole
  status?: 'PENDING_KYC' | 'KYC_SUBMITTED' | 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  mfaEnabled?: boolean
  phone: string | null
  displayName?: string | Partial<MultilingualText> | null
  preferredLang?: 'FR' | 'EN' | 'AR'
  avatarUrl?: string | null
  createdAt: string
  firstName?: string
  lastName?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  phone?: string
  role: 'CLIENT' | 'SUPPLIER' | 'TRANSPORTER'
  preferredLang: 'FR' | 'EN' | 'AR'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  sessionId: string
  user: User
}

export interface MfaRequiredResponse {
  requiresMfa: true
  challengeToken: string
}

export type LoginResponse = AuthResponse | MfaRequiredResponse

export interface RegisterResponse {
  message: string
  userId: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  sessionId: string
}

export interface Product {
  id: string
  name: MultilingualText
  slug: string
  sku: string
  priceHT: number | string
  taxRate: number | string
  stockQuantity: number
  stockAlertLevel: number
  unit: string | null
  categoryId: string | null
  supplierId: string
  images: ProductImage[]
  isActive: boolean
  isPublic: boolean
  createdAt: string
  updatedAt: string
  category?: Category | null
  supplier?: {
    id: string
    displayName: MultilingualText | string | null
  } | null
  _count?: {
    variants: number
    images: number
  }
}

export interface MultilingualText {
  fr: string
  en: string
  ar: string
}

export interface ProductImage {
  id: string
  url: string
  altText: MultilingualText | null
  position: number
}

export interface Category {
  id: string
  name: MultilingualText
  slug: string
  parentId: string | null
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface Order {
  id: string
  orderNumber: string
  clientId: string
  supplierId: string
  status: OrderStatus
  totalAmount: number
  currency: string
  shippingAddress: string
  notes: string | null
  createdAt: string
  updatedAt: string
  client?: User
  supplier?: User
  items: OrderItem[]
}

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PREPARATION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'DISPUTED'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product?: Product
}

export interface Invoice {
  id: string
  invoiceNumber: string
  orderId: string
  issueDate: string | null
  dueDate: string | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: InvoiceStatus
  paidAt: string | null
  order?: Order
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface Payment {
  id: string
  invoiceId: string | null
  amount: number
  currency: string
  provider: string
  status: PaymentStatus
  transactionId: string | null
  paidAt: string | null
  createdAt: string
  invoice?: Pick<Invoice, 'invoiceNumber'> | null
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'MOBILE_MONEY' | 'CASH' | 'CHECK'
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'

export interface Shipment {
  id: string
  shipmentNumber: string
  orderId: string
  status: ShipmentStatus
  estimatedDelivery: string | null
  deliveredAt: string | null
  createdAt: string
  order?: { orderNumber: string } | null
  transporter?: {
    id: string
    email: string | null
    displayName: string | Partial<MultilingualText> | null
  } | null
}

export type ShipmentStatus =
  | 'ASSIGNED'
  | 'PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'

export interface Ticket {
  id: string
  ticketNumber: string
  userId: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  category: string
  assignedToId: string | null
  createdAt: string
  updatedAt: string
  user?: User
  assignedTo?: User
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED'

export interface DashboardStats {
  totalOrders: number
  totalRevenueByCurrency: { currency: string; amount: number }[]
  pendingOrders: number
  completedOrders: number
  totalProducts: number
  activeShipments: number
  adminMetrics?: {
    totalUsers: number
    activeUsers: number
    suspendedUsers: number
    pendingKyc: number
  }
  recentOrders: Order[]
  revenueByMonth: { month: string; date?: string; currency: string; revenue: number }[]
}
