# 💰 Finanzas Pro

> **Sistema integral de gestión financiera personal** con arquitectura fullstack moderna, diseño responsivo premium y funcionalidades avanzadas de planificación financiera.

![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-007ACC?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Stack Tecnológico](#-stack-tecnológico)
- [Modelo de Datos](#-modelo-de-datos)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Configuración y Despliegue](#-configuración-y-despliegue)
- [🔒 Seguridad](#-seguridad)
- [Flujos de Usuario](#-flujos-de-usuario)

---

## 🎯 Descripción General

**Finanzas Pro** es una aplicación web progresiva (PWA) diseñada para el control completo de finanzas personales. Permite a los usuarios gestionar múltiples cuentas bancarias, registrar transacciones, crear presupuestos, manejar gastos recurrentes, compras a meses sin intereses (MSI), préstamos, y obtener análisis financieros detallados basados en la regla 50/30/20.

### Características Destacadas

- 🏦 **Multi-cuenta**: Soporte para cuentas de débito, crédito y efectivo
- 💳 **Compras MSI**: Gestión completa de compras a meses sin intereses
- 🔄 **Gastos Recurrentes**: Automatización de ingresos y gastos fijos
- 💸 **Préstamos**: Control de dinero prestado y debido
- 📊 **Análisis 50/30/20**: Reportes basados en la regla de presupuesto
- 📈 **Planificación Financiera**: Proyecciones por período (semanal, quincenal, mensual)
- 🌓 **Tema Oscuro/Claro**: Diseño premium adaptativo
- 📱 **Mobile-First**: Interfaz optimizada para dispositivos móviles con gestos swipe

---

## 🏗 Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
│    Usuario → tu-dominio.com → Reverse Proxy (Nginx/Cloudflare/Traefik)      │
└──────────────────────────────────────────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────┼───────────────────────────────┐
│                           DOCKER NETWORK                                     │
│                                              │                               │
│   ┌─────────────────────┐    ┌─────────────────┐    ┌─────────────────────┐ │
│   │      Frontend       │    │     Backend     │    │     PostgreSQL      │ │
│   │   (Vite + React)    │◄──►│  (Express API)  │◄──►│        (DB)         │ │
│   │    Puerto: 3000     │    │   Puerto: 4000  │    │    Puerto: 5432     │ │
│   └─────────────────────┘    └─────────────────┘    └─────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Comunicación

1. **Cliente → Reverse Proxy**: Peticiones HTTPS (SSL terminado aquí)
2. **Proxy → Frontend**: Sirve assets estáticos (SPA)
3. **Proxy → Backend**: Redirige peticiones `/api/*`
4. **Backend → PostgreSQL**: Queries via Prisma ORM
5. **Auth**: JWT tokens almacenados en localStorage

---

## 🛠 Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.3 | Framework UI con Hooks |
| **TypeScript** | 5.2 | Tipado estático |
| **Vite** | 7.2 | Build tool y dev server |
| **TailwindCSS** | 3.4 | Sistema de estilos utility-first |
| **React Router** | 6.30 | Navegación SPA |
| **TanStack Query** | 5.90 | Cache y estado de servidor |
| **Recharts** | 2.15 | Gráficos y visualizaciones |
| **React Spring** | 10.0 | Animaciones fluidas |
| **date-fns** | 4.1 | Manipulación de fechas |
| **Sonner** | 2.0 | Sistema de notificaciones toast |
| **Radix UI** | Latest | Componentes accesibles headless |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js + Express** | 5.1 | API REST |
| **TypeScript** | 5.9 | Tipado estático |
| **Prisma** | 7.1 | ORM y migraciones |
| **PostgreSQL** | 16 | Base de datos relacional |
| **bcrypt** | 6.0 | Hash de contraseñas |
| **jsonwebtoken** | 9.0 | Autenticación JWT |
| **helmet** | 8.0 | Headers de seguridad HTTP |
| **express-rate-limit** | 7.5 | Protección contra fuerza bruta |
| **Nodemailer** | 6.9 | Envío de emails (SMTP) |
| **multer** | 2.0 | Upload de archivos |
| **date-fns-tz** | 3.2 | Manejo de zonas horarias |

### DevOps / Infraestructura

| Tecnología | Propósito |
|------------|-----------|
| **Docker + Compose** | Containerización |
| **Nginx** | Reverse proxy interno |
| **Cloudflare Tunnels** | Exposición segura sin abrir puertos (opcional) |
| **Traefik / Caddy** | Alternativas con SSL automático (opcional) |

---

## 📊 Modelo de Datos

### Diagrama de Entidades

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│     USER     │───1:N─│    ACCOUNT       │───1:N─│ TRANSACTION  │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (UUID)    │       │ id (UUID)        │       │ id (UUID)    │
│ email        │       │ name             │       │ amount       │
│ password     │       │ type (DEBIT/     │       │ description  │
│ name         │       │   CREDIT/CASH)   │       │ date         │
│ currency     │       │ balance          │       │ type (income/│
│ timezone     │       │ creditLimit?     │       │   expense/   │
│ avatar?      │       │ cutoffDay?       │       │   transfer)  │
│ resetToken?  │       │ paymentDay?      │       │ categoryId?  │
└──────────────┘       └──────────────────┘       │ accountId?   │
       │                        │                  │ deletedAt?   │
       │                        │                  └──────────────┘
       │                        │                         │
       │                        │                         │
       ▼                        ▼                         ▼
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   CATEGORY   │       │ INSTALLMENT      │       │    LOAN      │
├──────────────┤       │   PURCHASE       │       ├──────────────┤
│ id (UUID)    │       ├──────────────────┤       │ id (UUID)    │
│ name         │       │ id (UUID)        │       │ borrowerName │
│ icon         │       │ description      │       │ loanType     │
│ color        │       │ totalAmount      │       │ (lent/       │
│ type         │       │ installments     │       │  borrowed)   │
│ budgetType?  │       │ monthlyPayment   │       │ originalAmt  │
│ (need/want/  │       │ paidInstallments │       │ remainingAmt │
│  savings)    │       │ paidAmount       │       │ status       │
└──────────────┘       └──────────────────┘       └──────────────┘
                                                         │
       ┌───────────────────────────────────────────────┘
       ▼
┌──────────────────────┐
│ RECURRING            │
│   TRANSACTION        │
├──────────────────────┤
│ id (UUID)            │
│ amount               │
│ description          │
│ frequency (daily/    │
│   weekly/biweekly/   │
│   monthly/yearly/    │
│   biweekly_15_30)    │
│ nextDueDate          │
│ active               │
└──────────────────────┘
```

### Tipos de Cuenta (`AccountType`)

| Tipo | Descripción | Campos Especiales |
|------|-------------|-------------------|
| `DEBIT` | Cuenta de débito | balance |
| `CREDIT` | Tarjeta de crédito | creditLimit, cutoffDay, paymentDay |
| `CASH` | Efectivo | balance |

### Tipos de Transacción (`TransactionType`)

| Tipo | Descripción | Comportamiento |
|------|-------------|----------------|
| `income` | Ingreso | Suma al balance de cuenta |
| `expense` | Gasto | Resta del balance / Suma a deuda (crédito) |
| `transfer` | Transferencia | Mueve entre cuentas |

### Tipos de Categoría (`budgetType`)

| Tipo | Descripción | Regla 50/30/20 |
|------|-------------|----------------|
| `need` | Necesidad | 50% del ingreso |
| `want` | Deseo | 30% del ingreso |
| `savings` | Ahorro | 20% del ingreso |

### Tipos de Préstamo (`LoanType`)

| Tipo | Descripción |
|------|-------------|
| `lent` | Dinero que PRESTÉ (me deben) |
| `borrowed` | Dinero que me PRESTARON (debo) |

### Frecuencias Recurrentes (`FrequencyType`)

| Frecuencia | Descripción |
|------------|-------------|
| `daily` | Diario |
| `weekly` | Semanal |
| `biweekly` | Cada 2 semanas |
| `biweekly_15_30` | Días 15 y 30 (quincenal mexicano) |
| `monthly` | Mensual |
| `yearly` | Anual |

---

## ⚡ Funcionalidades Principales

### 1. Dashboard (`/`)

- **Resumen de saldos**: Balance total, valor neto, deuda en tarjetas
- **Gráfico de categorías**: Donut chart con top categorías de gasto
- **Widget de planificación financiera**: Estado del período actual
- **Transacciones recientes**: Últimos 5 movimientos
- **Gastos recurrentes pendientes**: Próximos a vencer

### 2. Historial de Transacciones (`/history`)

- **Lista completa** de todas las transacciones
- **Filtros**: Por tipo, categoría, cuenta, rango de fechas
- **Agrupación**: Por día con totales
- **Acciones swipe**: Editar/Eliminar con gesto
- **Detail sheet**: Vista detallada de cada transacción

### 3. Gestión de Cuentas (`/accounts`)

- **CRUD completo** de cuentas
- **Tipos soportados**: Débito, Crédito, Efectivo
- **Para crédito**: Día de corte, día de pago, límite
- **Balance actualizado** automáticamente con transacciones

### 4. Categorías (`/categories`)

- **CRUD completo** con selector de iconos y colores
- **Clasificación** por tipo: Ingreso, Gasto, Transferencia
- **BudgetType** para regla 50/30/20
- **Iconos Material Symbols** integrados

### 5. Compras MSI (`/installments`)

- **Registro de compras** a meses sin intereses
- **Tracking automático** de pagos mensuales
- **Generación de transacciones** por cada mensualidad
- **Vista de progreso** con instalments pagados vs totales

### 6. Gastos Recurrentes (`/recurring`)

- **Configuración** de ingresos/gastos fijos
- **Múltiples frecuencias**: Diario a anual
- **Auto-cálculo** de próxima fecha
- **Marcar como recibido/pagado**: Genera transacción real

### 7. Préstamos (`/loans`)

- **Registro de préstamos** dados o recibidos
- **Tracking de pagos** parciales
- **Estado automático**: Active, Partial, Paid
- **Fecha esperada** de pago

### 8. Análisis Financiero (`/analysis`)

- **Tendencias** de ingresos vs gastos
- **Gráficos de barras** por período
- **Desglose por categoría**
- **Comparativas** mes a mes

### 9. Reportes 50/30/20 (`/reports`)

- **Análisis de cumplimiento** de la regla
- **Gráfico radial** de distribución
- **Proyecciones** vs gastos reales
- **Alertas** de exceso en categorías

### 10. Planificación Financiera (Widget)

- **Períodos configurables**: Semanal, Quincenal, Mensual
- **Proyecciones de ingreso** basadas en recurrentes
- **Gastos programados** del período
- **Capacidad de ahorro estimada**
- **Alertas de déficit**

### 11. Sistema de Autenticación

- **Registro** con validación de email
- **Login** con JWT
- **Forgot Password** con token de reset
- **Perfil editable** con avatar

### 12. Papelera (`/trash`)

- **Soft delete** de transacciones
- **Restaurar** transacciones eliminadas
- **Eliminación permanente** opcional

---

## 📁 Estructura del Proyecto

```
finanzas-pro/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── BottomNav.tsx    # Navegación móvil
│   │   │   ├── Charts.tsx       # Componentes de gráficos
│   │   │   ├── DatePicker.tsx   # Selector de fecha custom
│   │   │   ├── DesktopFAB.tsx   # Floating Action Button desktop
│   │   │   ├── MobileFAB.tsx    # Floating Action Button móvil
│   │   │   ├── FinancialPlanningWidget.tsx  # Widget principal
│   │   │   ├── Skeleton.tsx     # Estados de carga
│   │   │   ├── SwipeableItem.tsx # Componente con gestos
│   │   │   ├── SwipeableBottomSheet.tsx # Modal deslizable
│   │   │   └── ...
│   │   │
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useApi.ts        # React Query hooks
│   │   │   ├── useFinancialPlanning.ts
│   │   │   └── useTheme.ts      # Tema claro/oscuro
│   │   │
│   │   ├── layouts/             # Layouts de página
│   │   │   ├── MainApp.tsx      # Layout principal con sidebar
│   │   │   └── ProtectedRoute.tsx # Guard de autenticación
│   │   │
│   │   ├── pages/               # Páginas/Vistas
│   │   │   ├── Auth/            # Login, Register, Reset
│   │   │   ├── Dashboard.tsx    # Página principal
│   │   │   ├── History.tsx      # Historial
│   │   │   ├── AccountsPage.tsx # Cuentas
│   │   │   ├── Categories.tsx   # Categorías
│   │   │   ├── InstallmentsPage.tsx # MSI
│   │   │   ├── Recurring.tsx    # Recurrentes
│   │   │   ├── LoansPage.tsx    # Préstamos
│   │   │   ├── Reports.tsx      # Reportes 50/30/20
│   │   │   ├── FinancialAnalysis.tsx # Análisis
│   │   │   └── ...
│   │   │
│   │   ├── services/            # Servicios de API
│   │   │   └── apiService.ts    # Cliente HTTP centralizado
│   │   │
│   │   ├── utils/               # Utilidades
│   │   │   └── toast.tsx        # Sistema de notificaciones
│   │   │
│   │   ├── types.ts             # Tipos TypeScript compartidos
│   │   ├── App.tsx              # Componente raíz
│   │   ├── index.tsx            # Entry point
│   │   └── index.css            # Estilos globales + Tailwind
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # API Express
│   ├── src/
│   │   ├── routes/              # Endpoints de API
│   │   │   ├── auth.ts          # /api/auth/*
│   │   │   ├── transactions.ts  # /api/transactions/*
│   │   │   ├── categories.ts    # /api/categories/*
│   │   │   ├── accounts.ts      # /api/accounts/*
│   │   │   ├── recurring.ts     # /api/recurring/*
│   │   │   ├── installments.ts  # /api/installments/*
│   │   │   ├── loans.ts         # /api/loans/*
│   │   │   ├── profile.ts       # /api/profile/*
│   │   │   └── financialPlanningRoutes.ts
│   │   │
│   │   ├── controllers/         # Lógica de negocio
│   │   ├── middleware/          # Auth middleware
│   │   └── server.ts            # Entry point Express
│   │
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo de datos
│   │   └── migrations/          # Historial de migraciones
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── nginx/                       # Configuración Nginx
│   ├── nginx.conf
│   └── ssl/                     # Certificados
│
├── docker-compose.yml           # Orquestación de servicios
├── install_ssl.sh               # Script para SSL
├── reset_password.sh            # Script de utilidad
└── .env                         # Variables de entorno (DuckDNS)
```

---

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Crear nueva cuenta |
| POST | `/login` | Iniciar sesión |
| POST | `/forgot-password` | Solicitar reset |
| POST | `/reset-password` | Cambiar contraseña |

### Transacciones (`/api/transactions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar transacciones |
| GET | `/:id` | Obtener una transacción |
| POST | `/` | Crear transacción |
| PUT | `/:id` | Actualizar transacción |
| DELETE | `/:id` | Soft delete |
| GET | `/deleted` | Listar eliminadas |
| POST | `/:id/restore` | Restaurar eliminada |

### Cuentas (`/api/accounts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar cuentas |
| POST | `/` | Crear cuenta |
| PUT | `/:id` | Actualizar cuenta |
| DELETE | `/:id` | Eliminar cuenta |

### Categorías (`/api/categories`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar categorías |
| POST | `/` | Crear categoría |
| PUT | `/:id` | Actualizar categoría |
| DELETE | `/:id` | Eliminar (con migración opcional) |

### MSI / Installments (`/api/installments`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar compras MSI |
| GET | `/:id` | Detalle de compra |
| POST | `/` | Crear compra MSI |
| PUT | `/:id` | Actualizar compra |
| DELETE | `/:id` | Eliminar compra |
| POST | `/:id/pay` | Registrar pago |

### Recurrentes (`/api/recurring`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar recurrentes |
| GET | `/:id` | Detalle |
| POST | `/` | Crear recurrente |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |
| POST | `/:id/mark-received` | Marcar como recibido |

### Préstamos (`/api/loans`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar préstamos |
| GET | `/summary` | Resumen de préstamos |
| GET | `/:id` | Detalle |
| POST | `/` | Crear préstamo |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |
| POST | `/:id/payment` | Registrar pago |

### Planificación Financiera (`/api/financial-planning`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/summary` | Resumen del período |

### Perfil (`/api/profile`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener perfil |
| PUT | `/` | Actualizar perfil |
| POST | `/avatar` | Subir avatar |

---

## 🚀 Configuración y Despliegue

### Requisitos Previos

- Docker y Docker Compose v2+
- Node.js 18+ (solo para desarrollo local)
- Git

### 📦 Estrategias de Despliegue

Elige la estrategia que mejor se adapte a tus necesidades:

| Opción | Uso ideal | Docker Compose File | SSL / Puertos |
|--------|-----------|---------------------|---------------|
| **1. Desarrollo Local** | Contribuciones al código | _No usa Docker_ | Localhost (3000/4000) |
| **2. Self-Hosted** | Red local (LAN) o tras Proxy propio | `docker-compose.selfhosted.yml` | HTTP (Puertos expuestos) |
| **3. Cloudflare** | Producción en Internet (Home Lab) | `docker-compose.yml` | HTTPS (Tunnel seguro) |

---

### 🔧 Opción 1: Desarrollo Local (sin Docker)

Ideal para desarrollo y contribuciones.

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/finanzas-pro.git
cd finanzas-pro

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales de PostgreSQL local

# Instalar dependencias
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Iniciar PostgreSQL (si no lo tienes, puedes usar Docker solo para la DB)
docker run -d --name finanzas-db \
  -e POSTGRES_USER=finanzas \
  -e POSTGRES_PASSWORD=finanzas123 \
  -e POSTGRES_DB=finanzas_pro \
  -p 5432:5432 \
  postgres:16-alpine

# Ejecutar migraciones
cd backend && npx prisma migrate dev && cd ..

# Iniciar backend (terminal 1)
cd backend && npm run dev

# Iniciar frontend (terminal 2)
cd frontend && npm run dev
```

Accede a `http://localhost:5173` (frontend) y `http://localhost:4000` (API).

---

### 🚀 Despliegue en Servidor

Para despliegues en producción (VPS, Proxmox, Raspberry Pi), consulta nuestras guías detalladas:

- ☁️ **Opción Recomendada (Cloudflare):** Ver [docs/GUIA_CLOUDFLARE.md](./docs/GUIA_CLOUDFLARE.md)
    *   *Seguro (HTTPS), sin abrir puertos, ideal para Home Lab.*
- 🐳 **Opción Tradicional (Self-Hosted):** Ver [docs/GUIA_SELFHOSTED.md](./docs/GUIA_SELFHOSTED.md)
    *   *Puertos expuestos, proxy inverso propio, ideal para VPS o LAN.*

> 📘 **Workflow:** Consulta [docs/FLUJO_TRABAJO.md](./docs/FLUJO_TRABAJO.md) para ver cómo desarrollar features nuevas y desplegarlas sin romper nada.

---

### 📧 Variables de Entorno

**`.env` (raíz) - Para Docker:**
```env
# PostgreSQL
POSTGRES_USER=finanzas
POSTGRES_PASSWORD=tu_password_segura
POSTGRES_DB=finanzas_pro

# Cloudflare (solo si usas docker-compose.cloudflare.yml)
CLOUDFLARE_TUNNEL_TOKEN=eyJ...
```

**`backend/.env` - Para el Backend:**
```env
# Base de datos (usar 'db' para Docker, 'localhost' para desarrollo local)
DATABASE_URL="postgresql://finanzas:tu_password@db:5432/finanzas_pro"

# Autenticación
JWT_SECRET="genera-un-string-aleatorio-largo-aqui"
PORT=4000

# URL de la aplicación (para emails de recuperación)
APP_URL="https://tu-dominio.com"

# Email SMTP (opcional - sin esto, los links de reset se muestran en logs)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
SMTP_FROM="Finanzas Pro <noreply@tu-dominio.com>"
```

**`frontend/.env` - Para el Frontend:**
```env
# API URL (ajustar según tu configuración)
VITE_API_URL=http://localhost:4000
```

#### Configuración de SMTP por Proveedor

| Proveedor | SMTP_HOST | SMTP_PORT | Notas |
|-----------|-----------|-----------|-------|
| **Gmail** | smtp.gmail.com | 587 | Requiere [App Password](https://myaccount.google.com/apppasswords) |
| **Outlook** | smtp-mail.outlook.com | 587 | Usa credenciales normales |
| **Mailgun** | smtp.mailgun.org | 587 | Usa API key como password |
| **Propio** | mail.tu-dominio.com | 587 | Postfix, Mailcow, etc. |

---

### 🔧 Comandos Útiles

#### Script de Deploy (`deploy.sh`)

Script de automatización para gestionar la aplicación en producción:

```bash
./deploy.sh start     # Inicia todos los servicios
./deploy.sh stop      # Detiene todos los servicios
./deploy.sh restart   # Reinicia todos los servicios
./deploy.sh update    # Pull de Git + rebuild + migraciones
./deploy.sh logs      # Muestra logs en tiempo real (Ctrl+C para salir)
./deploy.sh status    # Muestra estado de los contenedores
./deploy.sh backup    # Crea backup de la BD (guardado en ./backups/)
./deploy.sh migrate   # Ejecuta migraciones de Prisma
./deploy.sh shell     # Abre shell en el container backend
./deploy.sh db        # Conecta a PostgreSQL CLI
./deploy.sh help      # Muestra ayuda
```

#### Script de Reset de Contraseña (`reset_password.sh`)

Utilidad para resetear contraseñas de usuarios directamente en la BD:

```bash
./reset_password.sh <email> <nueva_contraseña>

# Ejemplos:
./reset_password.sh usuario@email.com NuevaPassword123
./reset_password.sh admin@finanzas.com MiClaveSegura!
```

> **Nota**: Requiere que los contenedores estén corriendo (`docker compose up`).

#### Docker Compose Directo

Si prefieres no usar el script de deploy:

```bash
docker compose up -d --build     # Iniciar
docker compose down              # Detener
docker compose logs -f           # Ver logs
docker compose exec backend sh   # Shell en el backend
docker compose exec db psql -U finanzas -d finanzas_pro  # PostgreSQL CLI
```

---

## 🔒 Seguridad

Finanzas Pro implementa múltiples capas de seguridad para proteger tus datos:

| Característica | Descripción |
|----------------|-------------|
| **Contraseñas** | Hasheadas con bcrypt (salt rounds: 10) |
| **Autenticación** | JWT con expiración de 24 horas |
| **Rate Limiting** | Protección contra fuerza bruta en login/registro |
| **CORS** | Control de orígenes permitidos |
| **Helmet** | Headers de seguridad HTTP |
| **Logs Sanitizados** | Nunca se loguean contraseñas ni tokens |

### Configuración Rápida

```bash
# En backend/.env

# Restringir orígenes (producción)
ALLOWED_ORIGINS="https://finanzas.tudominio.com"

# Deshabilitar registro público (recomendado para uso personal)
REGISTRATION_ENABLED="false"

# Rate limiting (siempre habilitado en producción)
RATE_LIMIT_ENABLED="true"
```

### Rate Limits por Endpoint

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/*` (general) | 100 req | 15 min |
| `/api/auth/login` | 5 intentos | 15 min |
| `/api/auth/register` | 5 intentos | 15 min |
| `/api/auth/request-reset` | 3 intentos | 1 hora |

📘 **Guía completa:** Ver [docs/SEGURIDAD.md](./docs/SEGURIDAD.md) para configuración detallada, mejores prácticas y recomendaciones para homelab.

---

## 🔄 Flujos de Usuario

### Flujo: Registrar un Gasto

```
1. Usuario toca FAB (+) → Selecciona "Gasto"
2. Rellena formulario:
   - Monto
   - Descripción
   - Categoría (con budgetType: need/want/savings)
   - Cuenta origen
   - Fecha
3. POST /api/transactions
4. Backend:
   - Crea Transaction
   - Actualiza Account.balance (resta para débito, suma deuda para crédito)
5. Frontend:
   - Invalida cache de transactions, accounts
   - Muestra toast de éxito
```

### Flujo: Crear Compra MSI

```
1. Usuario navega a /installments → "Nueva Compra"
2. Rellena:
   - Descripción
   - Monto total
   - Número de meses
   - Cuenta (tarjeta de crédito)
   - Categoría
3. POST /api/installments
4. Backend:
   - Crea InstallmentPurchase
   - Calcula monthlyPayment = totalAmount / installments
   - NO genera transacciones automáticamente (se generan al pagar)
5. Cada mes, usuario marca pago:
   - POST /api/installments/:id/pay
   - Crea Transaction
   - Incrementa paidInstallments
```

### Flujo: Planificación Quincenal

```
1. Widget detecta período actual (1-15 o 16-fin)
2. GET /api/financial-planning/summary?periodType=quincenal
3. Backend calcula:
   - Ingresos recurrentes del período
   - Gastos recurrentes del período
   - MSI pendientes
   - Préstamos por pagar
4. Frontend muestra:
   - Ingreso esperado
   - Gastos programados
   - Disponible para gastar
   - Porcentaje de la regla 50/30/20
```

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.

---

## 👨‍💻 Notas para Documentación por IA

Esta aplicación está diseñada con los siguientes principios:

1. **Mobile-First**: La interfaz prioriza la experiencia móvil con gestos swipe, bottom sheets, y FAB
2. **Offline-Ready**: Estructura preparada para PWA con service workers
3. **Real-time Updates**: React Query maneja cache y sincronización automática
4. **Type-Safe**: TypeScript end-to-end con tipos compartidos
5. **Soft Delete**: Las transacciones van a papelera antes de eliminación permanente
6. **Multi-currency**: Soporte para USD, EUR, GBP, MXN
7. **Timezone-aware**: Manejo correcto de zonas horarias para períodos financieros

Para documentar funcionalidades específicas, revisar:
- `frontend/src/services/apiService.ts` - Todas las llamadas API
- `frontend/src/hooks/useApi.ts` - React Query hooks con lógica de negocio
- `backend/src/routes/*.ts` - Implementación de endpoints
- `backend/prisma/schema.prisma` - Modelo de datos completo
