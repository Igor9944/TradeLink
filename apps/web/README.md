# 🌐 TradeLink Web Frontend

Application web Next.js 15 pour la plateforme import-export TradeLink.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Technologies](#technologies)
- [Installation](#installation)
- [Développement](#développement)
- [Structure](#structure)
- [Composants](#composants)
- [Pages](#pages)
- [État & Cache](#état--cache)
- [Tests](#tests)

---

## 🎯 Vue d'ensemble

Frontend moderne et responsive pour TradeLink SaaS, avec :
- ✅ Authentification JWT
- ✅ Dashboard temps réel
- ✅ Design responsive mobile-first
- ✅ State management optimisé
- ✅ Cache intelligent
- ✅ Support multilingue (prévu)

**Status:** 🟢 En développement actif (25% complété)

---

## 🛠 Technologies

### Core
- **Next.js 15** - App Router + Server Components
- **React 19** - Latest version
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS

### State & Data
- **Zustand** - State management léger
- **React Query** - Server state + cache
- **Axios** - HTTP client

### UI/UX
- **Framer Motion** - Animations
- **Lucide Icons** - Icons modernes
- **Sonner** - Toast notifications

### Forms
- **React Hook Form** - Gestion de formulaires
- **Zod** - Validation de schémas

---

## 📦 Installation

```bash
# Depuis la racine du monorepo
pnpm install

# Ou depuis apps/web
cd apps/web
pnpm install
```

### Variables d'environnement

Créer `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
NEXT_PUBLIC_APP_NAME=TradeLink
NEXT_PUBLIC_DEFAULT_LOCALE=fr
```

---

## 🚀 Développement

```bash
# Démarrer le serveur de dev (port 3000)
pnpm dev

# Build production
pnpm build

# Démarrer en production
pnpm start

# Linter
pnpm lint

# Type checking
pnpm type-check
```

### URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3002/api
- **Swagger:** http://localhost:3002/api/docs

---

## 📁 Structure

```
apps/web/
├── public/              # Assets statiques
│   ├── logo.png        # Logo TradeLink (à ajouter)
│   └── ...
├── src/
│   ├── app/            # Pages & Routing (App Router)
│   │   ├── (auth)/     # Routes auth (login, register)
│   │   ├── (dashboard)/ # Routes dashboard (protégées)
│   │   ├── layout.tsx  # Layout racine
│   │   └── page.tsx    # Landing page
│   │
│   ├── components/     # Composants React
│   │   ├── ui/         # Composants UI réutilisables
│   │   └── layout/     # Composants layout (Sidebar, Header)
│   │
│   ├── lib/            # Utilitaires
│   │   ├── api.ts      # Config Axios
│   │   └── utils.ts    # Helpers
│   │
│   ├── stores/         # Zustand stores
│   │   └── authStore.ts
│   │
│   ├── services/       # Services API
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   ├── orders.service.ts
│   │   └── dashboard.service.ts
│   │
│   ├── types/          # Types TypeScript
│   │   └── index.ts
│   │
│   ├── hooks/          # Custom hooks
│   ├── config/         # Configuration
│   └── constants/      # Constantes
│
├── .env.local          # Variables d'environnement
├── next.config.js      # Config Next.js
├── tailwind.config.ts  # Config Tailwind
└── package.json
```

---

## 🧩 Composants

### UI Components (8/20)

#### 1. Button
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="md" loading={false}>
  Cliquer ici
</Button>
```

Variants : `default | outline | ghost | destructive | success`  
Sizes : `sm | md | lg`

#### 2. Input
```tsx
import { Input } from '@/components/ui/input'

<Input 
  label="Email"
  type="email"
  placeholder="vous@exemple.com"
  error="Email invalide"
  required
/>
```

#### 3. Badge
```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="success">Actif</Badge>
```

Variants : `default | success | warning | danger | info`

#### 4. Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu...
  </CardContent>
</Card>
```

#### 5. Table
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Colonne 1</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Valeur 1</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Layout Components

#### Sidebar
Menu de navigation responsive avec support mobile (menu burger).

#### Header
Barre supérieure avec recherche, notifications, profil.

---

## 📄 Pages

### Publiques
- `/` - Landing page
- `/login` - Connexion
- `/register` - Inscription

### Protégées (Dashboard)
- `/dashboard` - Vue d'ensemble ✅
- `/dashboard/products` - Produits ⏳
- `/dashboard/orders` - Commandes ⏳
- `/dashboard/invoices` - Factures ⏳
- `/dashboard/payments` - Paiements ⏳
- `/dashboard/shipments` - Expéditions ⏳
- `/dashboard/support` - Support ⏳
- `/dashboard/accounting` - Comptabilité ⏳
- `/dashboard/users` - Utilisateurs (Admin) ⏳
- `/dashboard/settings` - Paramètres ⏳

---

## 🗄 État & Cache

### Zustand (State local)
```tsx
import { useAuthStore } from '@/stores/authStore'

const { user, token, isAuthenticated, setAuth, logout } = useAuthStore()
```

### React Query (Server state)
```tsx
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'

const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: dashboardService.getStats,
  staleTime: 30000, // 30s cache
})
```

### API Services

Tous les services utilisent Axios avec interceptors :
- ✅ Auto-ajout du JWT token
- ✅ Gestion des erreurs 401
- ✅ Timeout de 10s
- ✅ Type-safe avec TypeScript

---

## 🧪 Tests

```bash
# Tests unitaires (à créer)
pnpm test

# Tests E2E (à créer)
pnpm test:e2e

# Coverage
pnpm test:coverage
```

**Status:** ⏳ 0% (Tests à créer)

---

## 🎨 Design System

### Couleurs
- **Primary:** Blue (#0ea5e9)
- **Success:** Green (#22c55e)
- **Warning:** Orange (#f59e0b)
- **Danger:** Red (#ef4444)

### Typography
- **Font:** Inter (Google Fonts)
- **Sizes:** xs, sm, base, lg, xl, 2xl, 3xl

### Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 📱 Responsive

### Mobile First
Tous les composants sont conçus mobile-first avec des breakpoints progressifs.

```tsx
// Exemple
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Content */}
</div>
```

### Menu Mobile
- Menu burger dans Header
- Sidebar avec overlay
- Touch-friendly (min 44px)

---

## 🌍 Internationalisation (Prévu)

Support multilingue avec `next-intl` :
- 🇫🇷 Français (défaut)
- 🇬🇧 Anglais
- 🇸🇦 Arabe

---

## 🔐 Authentification

### Flow
1. Login → JWT token
2. Store dans Zustand + localStorage
3. Axios interceptor ajoute le token
4. Refresh token automatique
5. Logout → Clear store + redirect

### Protection des Routes
```tsx
// Layout dashboard vérifie l'auth
if (!isAuthenticated) {
  router.replace('/login')
}
```

---

## ⚡ Performance

### Optimisations
- ✅ Next.js Image optimization
- ✅ Code splitting automatique
- ✅ React Query cache
- ✅ Lazy loading
- ✅ Skeleton loading states

### Métriques cibles
- First Load: < 2s
- Route Change: < 500ms
- Bundle Size: < 250KB gzipped

---

## 🐛 Debug

### Mode développement
```bash
# Verbose logs
DEBUG=* pnpm dev

# Build analysis
pnpm build --analyze
```

### Outils
- React DevTools
- Network tab (Chrome)
- Lighthouse
- Bundle Analyzer

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)

---

## 🤝 Contribution

1. Créer une branche feature
2. Commit avec convention (feat/fix/docs)
3. Tests passent
4. PR avec description

---

## 📝 License

Propriétaire - TradeLink © 2026

---

**Maintenu par:** Équipe TradeLink  
**Version:** 0.1.0 (Alpha)
