# 🚀 Guía de Despliegue

> **Tu Server, Tus Reglas** — Opciones flexibles para desplegar en Home Lab, VPS o Nube.

Esta guía cubre todas las opciones para desplegar Finanzas Pro en tu propio servidor.

---

## 📋 Tabla de Contenidos

- [Requisitos](#-requisitos)
- [Opción 1: Cloudflare Tunnel (Recomendada)](#-opción-1-cloudflare-tunnel-recomendada)
- [Opción 2: Self-Hosted con puertos expuestos](#-opción-2-self-hosted-con-puertos-expuestos)
- [Opción 3: Desarrollo Local](#-opción-3-desarrollo-local)
- [Variables de Entorno](#-variables-de-entorno)
- [Migraciones y Actualizaciones](#-migraciones-y-actualizaciones)
- [Troubleshooting](#-troubleshooting)

---

## 📦 Requisitos

### Hardware

| Recurso | Mínimo | Recomendado |
| ------- | ------ | ----------- |
| CPU     | 1 core | 2-4 cores   |
| RAM     | 2 GB   | 4 GB        |
| Disco   | 10 GB  | 20 GB (SSD) |

### Software

- **Sistema Operativo**: Linux (Debian, Ubuntu, Proxmox LXC)
- **Docker**: v20.10+
- **Docker Compose**: v2+

### Instalación de Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Agregar tu usuario al grupo docker (opcional, evita usar sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
docker compose version
```

---

## ☁️ Opción 1: Cloudflare Tunnel (Recomendada)

**Ideal para**: Home Lab, servidores detrás de NAT, sin exponer puertos.

### ¿Por qué Cloudflare Tunnel?

- ✅ **Sin abrir puertos** en tu router
- ✅ **SSL automático** (HTTPS gratis)
- ✅ **Protección DDoS** incluida
- ✅ **Acceso desde cualquier lugar**

### Paso 1: Configurar Cloudflare

1. Crea una cuenta en [Cloudflare](https://dash.cloudflare.com/) (gratis)
2. Agrega tu dominio (o usa uno de Cloudflare)
3. Ve a **Zero Trust** → **Networks** → **Tunnels**
4. Crea un nuevo tunnel y obtén el **Tunnel Token**

### Paso 2: Configurar la aplicación

```bash
# Clonar repositorio
git clone https://github.com/herwingx/finanzas-pro.git
cd finanzas-pro

# Configurar variables
cp .env.example .env
cp backend/.env.example backend/.env
```

Edita `.env`:
```env
POSTGRES_USER=finanzas
POSTGRES_PASSWORD=TU_PASSWORD_SEGURA
POSTGRES_DB=finanzas_pro

# Token de Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiMjk...tu_token
```

Edita `backend/.env`:
```env
DATABASE_URL="postgresql://finanzas:TU_PASSWORD_SEGURA@db:5432/finanzas_pro"
JWT_SECRET="genera-un-string-aleatorio-de-32-caracteres"
PORT=4000
NODE_ENV=production
```

### Paso 3: Configurar el Tunnel en Cloudflare

En el dashboard de Cloudflare, configura el **Public Hostname**:

| Subdomain  | Domain          | Service           |
| ---------- | --------------- | ----------------- |
| `finanzas` | `tudominio.com` | `http://nginx:80` |

### Paso 4: Iniciar

```bash
chmod +x deploy.sh
./deploy.sh start
```

### Paso 5: Verificar

```bash
./deploy.sh status
./deploy.sh logs
```

Tu aplicación estará disponible en `https://finanzas.tudominio.com`

---

## 🐳 Opción 2: Self-Hosted con puertos expuestos

**Ideal para**: VPS con IP pública, uso solo en LAN, detrás de otro reverse proxy (Traefik, Caddy).

### Paso 1: Configurar

```bash
git clone https://github.com/herwingx/finanzas-pro.git
cd finanzas-pro

cp .env.example .env
cp backend/.env.example backend/.env
# Editar variables (sin CLOUDFLARE_TUNNEL_TOKEN)
```

### Paso 2: Iniciar con el archivo selfhosted

```bash
docker compose -f docker-compose.selfhosted.yml up -d --build
```

### Paso 3: Ejecutar migraciones

```bash
docker compose -f docker-compose.selfhosted.yml exec backend npx prisma migrate deploy
```

### Puertos expuestos

| Servicio   | Puerto | Descripción    |
| ---------- | ------ | -------------- |
| Frontend   | 3000   | Aplicación web |
| Backend    | 4000   | API REST       |
| PostgreSQL | 5432   | Base de datos  |
| Nginx      | 80     | Reverse proxy  |

### Acceder

- **LAN**: `http://IP-DEL-SERVIDOR:3000` o `http://IP-DEL-SERVIDOR:80`
- **Con tu propio proxy**: Apunta a `http://localhost:80`

---

## 💻 Opción 3: Desarrollo Local

**Ideal para**: Contribuir al proyecto, probar cambios.

### Paso 1: Preparar el entorno

```bash
git clone https://github.com/herwingx/finanzas-pro.git
cd finanzas-pro

# Configurar backend
cp backend/.env.example backend/.env
# Editar backend/.env con DATABASE_URL apuntando a localhost
```

### Paso 2: Iniciar PostgreSQL (solo la base de datos)

```bash
docker run -d --name finanzas-db \
  -e POSTGRES_USER=finanzas \
  -e POSTGRES_PASSWORD=finanzas123 \
  -e POSTGRES_DB=finanzas_pro \
  -p 5432:5432 \
  postgres:16-alpine
```

### Paso 3: Instalar dependencias

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### Paso 4: Iniciar en modo desarrollo

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Acceder

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000

---

## 🔐 Variables de Entorno

### `.env` (raíz del proyecto)

| Variable                  | Descripción                 | Ejemplo           |
| ------------------------- | --------------------------- | ----------------- |
| `POSTGRES_USER`           | Usuario de PostgreSQL       | `finanzas`        |
| `POSTGRES_PASSWORD`       | Contraseña de PostgreSQL    | `password_segura` |
| `POSTGRES_DB`             | Nombre de la base de datos  | `finanzas_pro`    |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token del tunnel (opcional) | `eyJhIjo...`      |

### `backend/.env`

| Variable       | Descripción                       | Ejemplo                                       |
| -------------- | --------------------------------- | --------------------------------------------- |
| `DATABASE_URL` | URL de conexión PostgreSQL        | `postgresql://user:pass@db:5432/finanzas_pro` |
| `JWT_SECRET`   | Secreto para tokens JWT           | `string-aleatorio-largo`                      |
| `PORT`         | Puerto del backend                | `4000`                                        |
| `NODE_ENV`     | Entorno                           | `production`                                  |
| `FRONTEND_URL` | URL del frontend (CORS)           | `https://finanzas.tudominio.com`              |
| `SMTP_*`       | Configuración de email (opcional) | Ver abajo                                     |

### Configuración SMTP (opcional)

Para recuperación de contraseña por email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=app-password
SMTP_FROM="Finanzas Pro <noreply@tudominio.com>"
```

---

## 🔄 Migraciones y Actualizaciones

### Actualizar la aplicación

```bash
./deploy.sh update
```

Este comando hace:
1. `git pull origin main`
2. Rebuild de contenedores
3. Ejecutar migraciones de Prisma
4. Reiniciar servicios

### Ejecutar migraciones manualmente

```bash
./deploy.sh migrate
```

### Crear backup antes de actualizar

```bash
./deploy.sh backup
./deploy.sh update
```

---

## 🔧 Troubleshooting

### El contenedor no inicia

```bash
# Ver logs detallados
./deploy.sh logs

# Ver estado
docker compose ps -a
```

### Error de conexión a la base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker compose exec db pg_isready

# Revisar DATABASE_URL en backend/.env
# Debe usar 'db' como host (nombre del servicio en docker-compose)
```

### Error de permisos en Docker

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Cloudflare Tunnel no conecta

```bash
# Ver logs del tunnel
docker compose logs cloudflared

# Verificar token
echo $CLOUDFLARE_TUNNEL_TOKEN
```

### Limpiar y reconstruir todo

```bash
./deploy.sh stop
docker system prune -a
./deploy.sh start
```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
docker stats
```

### Espacio en disco

```bash
docker system df
```

### Logs específicos

```bash
docker compose logs frontend -f
docker compose logs backend -f
docker compose logs db -f
```
