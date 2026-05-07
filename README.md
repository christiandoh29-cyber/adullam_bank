<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs" />
</p>

<p align="center">
  <img src="https://images.unsplash.com/photo-1639762681057-408e52192e55?w=1200&h=400&fit=crop&auto=format" alt="Adullam Bank — Digital Banking Platform" width="100%" style="border-radius: 16px;" />
</p>

<h1 align="center">🏦 Adullam Bank</h1>
<p align="center">
  <strong>Votre refuge. Votre avenir.</strong><br/>
  Une plateforme bancaire numérique full-stack conçue pour le continent africain.
</p>

---

## 📖 L'Histoire

Dans la tradition ancestrale, **Adullam** était une caverne refuge — un lieu où ceux qui étaient exclus, endettés, en détresse, venaient se rassembler. Et de cette caverne sont sortis des leaders, des bâtisseurs d'empires.

Adullam Bank incarne cette philosophie. Nous construisons une banque qui ne vous juge pas sur votre passé, mais qui investit dans votre avenir.

---

## ✨ Fonctionnalités

- 🔐 **Authentification** : JWT (access + refresh tokens en cookies httpOnly), vérification email, mot de passe oublié/réinitialisé (Redis TTL), 2FA TOTP optionnelle
- 📊 **Tableau de bord** : Solde en temps réel, graphiques, historique des transactions
- 🏷️ **RIB / IBAN** : IBAN français auto-généré avec clé RIB validée par Luhn
- 💳 **Cartes virtuelles** : VISA/Mastercard, blocage/déblocage, affichage CVV, limites personnalisables
- 💸 **Virements** : Transferts internes par IBAN avec calcul des frais (0,5%, max 10 000 FCFA)
- 💰 **Dépôts** : Demande utilisateur → workflow d'approbation admin
- 🛡️ **Panneau Admin** : Statistiques, gestion des utilisateurs, traitement des dépôts, registre des transactions
- 🔒 **Sécurité** : bcrypt (12 rounds), rate limiting, CORS, helmet, gestion de session Redis

---

## 🎨 Design System

<p align="center">
  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=200&fit=crop&auto=format" alt="Adullam Design System" width="100%" style="border-radius: 12px;" />
</p>

| Élément | Valeur |
|---------|--------|
| **Police** | Poppins (Google Fonts) |
| **Primaire** | `#6C3CE1` (Adullam Purple) |
| **Accent** | `#A855F7` (Light Purple) |
| **Fond** | `#07070f` (Deep Navy) |
| **Surface** | `#0d0d1e`, `#16162a` (Cards) |
| **Succès** | `#22C55E` • **Erreur** : `#F43F5E` • **Avertissement** : `#F59E0B` |

---

## 🚀 Démarrage Rapide (Docker)

```bash
# 1. Cloner et configurer l'environnement
git clone <repo>
cd adullam-bank
cp .env.example .env

# 2. Générer des secrets JWT sécurisés
openssl rand -hex 64  # coller comme JWT_ACCESS_SECRET
openssl rand -hex 64  # coller comme JWT_REFRESH_SECRET

# 3. Lancer tous les services
docker compose up -d

# 4. Exécuter les migrations + seed (première fois seulement)
docker compose exec backend sh -c "npx prisma migrate deploy && tsx prisma/seed.ts"

# 5. Ouvrir le navigateur
open http://localhost

## 🚀 Démarrage Rapide (Docker)

```bash
# 1. Cloner et configurer l'environnement
git clone <repo>
cd adullam-bank
cp .env.example .env

# 2. Générer des secrets JWT sécurisés
openssl rand -hex 64  # coller comme JWT_ACCESS_SECRET
openssl rand -hex 64  # coller comme JWT_REFRESH_SECRET

# 3. Lancer tous les services
docker compose up -d

# 4. Exécuter les migrations + seed (première fois seulement)
docker compose exec backend sh -c "npx prisma migrate deploy && tsx prisma/seed.ts"

# 5. Ouvrir le navigateur
open http://localhost
```

**Identifiants de démo :**
- Utilisateur : `demo@adullam.bank` / `Demo@123!`
- Admin : `admin@adullam.bank` / `Admin@123!`

---

## 🛠️ Développement Local

### Prérequis
- Node.js 20+
- Docker (pour PostgreSQL + Redis)

### Backend

```bash
cd backend
cp ../.env.example .env  # ajuster DATABASE_URL et REDIS_URL pour le local
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
# → http://localhost:3998
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3998" > .env.local
npm run dev
# → http://localhost:5173
```

---

## 📁 Structure du Projet

```
adullam-bank/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Point d'entrée Express
│   │   ├── routes/           # auth, account, card, transaction, admin, user
│   │   ├── middleware/        # auth (JWT), gestionnaire d'erreurs, rate limiter
│   │   └── lib/              # prisma, redis, jwt, mailer, utilitaires bancaires
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Routeur + routes protégées
│   │   ├── pages/            # auth/, dashboard/, admin/
│   │   ├── components/       # layout (sidebar, topbar)
│   │   ├── lib/              # client api (axios), utils, cn
│   │   └── store/            # Store Zustand auth
│   ├── nginx.conf
│   └── Dockerfile
├── prisma/
│   ├── schema.prisma         # Schéma de base de données
│   └── seed.ts               # Admin par défaut + utilisateur démo
├── docker-compose.yml
└── .env.example
```

---

## 🔌 Référence API

| Méthode | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | — | Inscription + création compte + carte |
| POST | /api/auth/login | — | Connexion → définit cookies httpOnly |
| POST | /api/auth/logout | ✓ | Invalider le refresh token |
| POST | /api/auth/refresh-token | — | Rotation des tokens |
| GET | /api/auth/me | ✓ | Utilisateur actuel |
| POST | /api/auth/forgot-password | — | Envoyer email de réinitialisation |
| POST | /api/auth/reset-password/:token | — | Réinitialiser mot de passe (TTL 15 min) |
| GET | /api/accounts | ✓ | Mes comptes |
| GET | /api/accounts/rib | ✓ | Mes détails IBAN/RIB |
| GET | /api/cards | ✓ | Mes cartes |
| POST | /api/cards/create | ✓ | Créer nouvelle carte virtuelle |
| PUT | /api/cards/:id/block | ✓ | Bloquer une carte |
| GET | /api/transactions | ✓ | Historique des transactions (paginé) |
| POST | /api/transactions/transfer | ✓ | Envoyer de l'argent par IBAN |
| POST | /api/transactions/deposit-request | ✓ | Demander un dépôt |
| GET | /api/admin/stats | Admin | Statistiques plateforme |
| GET | /api/admin/users | Admin | Tous les utilisateurs |
| PUT | /api/admin/users/:id/suspend | Admin | Suspendre un utilisateur |
| GET | /api/admin/deposits | Admin | Demandes de dépôt |
| POST | /api/admin/deposits/:id/approve | Admin | Approuver + créditer le compte |
| POST | /api/admin/deposits/:id/reject | Admin | Rejeter la demande |

---

## 🔒 Détails de Sécurité

<p align="center">
  <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=200&fit=crop&auto=format" alt="Security" width="100%" style="border-radius: 12px;" />
</p>

| Mécanisme | Implémentation |
|-----------|----------------|
| Mots de passe | bcrypt 12 rounds |
| JWT | Cookies httpOnly Secure, 15min access / 7j refresh |
| Rate limiting | 10 req/15min sur auth, 5/h sur opérations sensibles |
| CORS | Liste blanche stricte des origines |
| Headers | Helmet.js |
| Validation des entrées | Zod sur toutes les routes |
| Stockage de session | Redis avec TTL |
| Atomicité des transferts | `$transaction` Prisma |

---

## 🏭 Déploiement en Production

```bash
# Générer des secrets
JWT_ACCESS_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)

# Construire et déployer
docker compose -f docker-compose.yml up -d --build

# Derrière un proxy inverse (nginx/Caddy), définir :
APP_URL=https://app.votredomaine.com
API_URL=https://api.votredomaine.com
NODE_ENV=production
```

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

---

<p align="center">
  <strong>Adullam Bank</strong><br/>
  <em>La caverne est ouverte. Et de cette caverne, ensemble, nous ferons sortir des géants.</em><br/><br/>
  Construit avec ❤️ pour l'avenir bancaire numérique de l'Afrique.
</p>

<p align="center">
  <img src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=200&fit=crop&auto=format" alt="Africa Finance" style="border-radius: 12px;" />
</p>
```

# adullam_bank
