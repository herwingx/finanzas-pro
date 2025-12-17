# 🚀 Plan de Despliegue: FinanzasPro en Cloudflare Tunnels

> **Objetivo**: Desplegar la aplicación en `tu-app.tu-dominio.com` usando Cloudflare Tunnels para evadir el bloqueo de puertos 80/443 del ISP.

---

## 📋 Índice

1. [Arquitectura de Despliegue](#-arquitectura-de-despliegue)
2. [Especificaciones del LXC](#-especificaciones-del-lxc)
3. [Configuración de Cloudflare](#-configuración-de-cloudflare)
4. [Instalación del Servidor](#-instalación-del-servidor)
5. [Flujo de Desarrollo y Deployment](#-flujo-de-desarrollo-y-deployment)
6. [Configuración de SSL](#-configuración-de-ssl)
7. [Scripts de Automatización](#-scripts-de-automatización)

---

## 🏗 Arquitectura de Despliegue

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
│                                                                              │
│    Usuario → tu-app.tu-dominio.com → Cloudflare Edge (SSL terminado)     │
│                                              │                               │
└──────────────────────────────────────────────┼───────────────────────────────┘
                                               │
                                    (Cloudflare Tunnel)
                                    (Conexión encriptada)
                                               │
┌──────────────────────────────────────────────┼───────────────────────────────┐
│                           TU RED LOCAL                                       │
│                                              │                               │
│  ┌───────────────────────────────────────────▼──────────────────────────┐   │
│  │                     LXC: finanzas-pro                                 │   │
│  │                     IP: 192.168.1.XX                                  │   │
│  │                                                                       │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │   │ cloudflared │    │   Docker    │    │       PostgreSQL        │  │   │
│  │   │  (daemon)   │────│   Compose   │────│     (puerto 5432)       │  │   │
│  │   │             │    │             │    │                         │  │   │
│  │   └──────┬──────┘    └──────┬──────┘    └─────────────────────────┘  │   │
│  │          │                  │                                        │   │
│  │          │           ┌──────┴──────┐                                 │   │
│  │          │           │             │                                 │   │
│  │          ▼           ▼             ▼                                 │   │
│  │   ┌─────────────────────┐   ┌─────────────────┐                     │   │
│  │   │      Frontend       │   │     Backend     │                     │   │
│  │   │   (Vite/React)      │   │   (Express)     │                     │   │
│  │   │    Puerto: 3000     │   │   Puerto: 4000  │                     │   │
│  │   └─────────────────────┘   └─────────────────┘                     │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### ¿Por qué Cloudflare Tunnels?

| Ventaja | Descripción |
|---------|-------------|
| **Sin port forwarding** | No necesitas abrir puertos en tu router |
| **ISP bloqueado** | Funciona aunque tu ISP bloquee 80/443 |
| **SSL gratuito** | Cloudflare maneja automáticamente los certificados |
| **DDoS Protection** | Protección integrada de Cloudflare |
| **IP oculta** | Tu IP real no queda expuesta |

---

## 💻 Requisitos del Servidor

Esta guía funciona en cualquier entorno Linux basado en Debian/Ubuntu, ya sea un **VPS** (DigitalOcean, Hetzner, AWS), una **Máquina Virtual** (Proxmox, ESXi), o hardware físico (Raspberry Pi, Mini PC).

### Recursos Mínimos
Para ejecutar el stack completo (Frontend + Backend + DB + Cloudflared):

| Recurso | Mínimo | Recomendado | Notas |
|---------|--------|-------------|-------|
| **CPU** | 1 Core | 2 Cores | Build de React consume CPU momentáneamente |
| **RAM** | 2 GB | 4 GB | Postgres y Node.js necesitan memoria |
| **Disco** | 10 GB | 20 GB SSD | Logs y backups ocupan espacio con el tiempo |
| **OS** | Debian 11+ / Ubuntu 20.04+ | Debian 12 / Ubuntu 22.04 | Compatible con Docker Engine |

### Opcional: Notas para Proxmox (LXC)
Si despliegas en un contenedor LXC en Proxmox, asegúrate de habilitar **nesting** y **keyctl** para que Docker funcione correctamente.

```bash
# Ejemplo de creación (solo referencia)
pct create 200 local:vztmpl/debian-12-standard... \
  --cores 2 --memory 4096 --swap 1024 \
  --features nesting=1  # <--- CRÍTICO
```

---

### Distribución de Recursos (Estimado)

```
┌─────────────────────────────────────────────────┐
│              RAM Distribution (4GB)             │
├─────────────────────────────────────────────────┤
│ PostgreSQL:        ~500MB - 1GB                 │
│ Backend (Node):    ~200MB - 400MB               │
│ Frontend (Nginx):  ~50MB                    	  │
│ cloudflared:       ~50MB                        │
│ Sistema/Docker:    ~500MB                       │
│ Disponible:        ~2GB (Buffer y Cache)        │
└─────────────────────────────────────────────────┘
```

---

## ☁️ Configuración de Cloudflare

### Paso 1: Configurar DNS

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com) → `tu-dominio.com`
2. DNS → Add record:

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | tu-subdominio | (se creará automáticamente con el tunnel) | Proxied | Auto |

### Paso 2: Crear el Tunnel

1. Ve a **Zero Trust** → **Networks** → **Tunnels**
2. Click **Create a tunnel**
3. Selecciona **Cloudflared** como tipo
4. Nombre: `finanzas-pro-tunnel`
5. **GUARDA EL TOKEN** que te da (es largo, tipo `eyJh...`)

### Paso 3: Configurar Public Hostname

En el mismo wizard de creación del tunnel:

| Campo | Valor |
|-------|-------|
| **Subdomain** | tu-subdominio |
| **Domain** | tu-dominio.com |
| **Service Type** | HTTP |
| **URL** | localhost:3000 |

Y agregar otro hostname para la API:

| Campo | Valor |
|-------|-------|
| **Subdomain** | tu-subdominio |
| **Domain** | tu-dominio.com |
| **Path** | /api/* |
| **Service Type** | HTTP |
| **URL** | localhost:4000 |

### Paso 4: Configuración de SSL/TLS

1. Ve a **SSL/TLS** → **Overview**
2. Modo: **Full** (no Full Strict ya que Cloudflare termina SSL)
3. Edge Certificates → **Always Use HTTPS**: ON
4. Edge Certificates → **Automatic HTTPS Rewrites**: ON

---

## 🔧 Instalación del Servidor

### Script de Setup Inicial

Ejecuta esto en tu servidor (como `root` o con acceso `sudo`):

```bash
#!/bin/bash
# install-server.sh

echo "🔧 Actualizando sistema..."
apt update && apt upgrade -y

echo "📦 Instalando dependencias..."
apt install -y \
    curl \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    vim \
    unzip

echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com | sh

echo "🔌 Instalando Docker Compose plugin..."
apt install -y docker-compose-plugin

echo "☁️ Instalando cloudflared..."
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared.deb
rm cloudflared.deb

echo "👤 Creando usuario para la app..."
useradd -m -s /bin/bash finanzas
usermod -aG docker finanzas

echo "✅ Instalación completada!"
echo "Ahora configura cloudflared con tu token"
```

### Configurar cloudflared como Servicio

```bash
# Reemplaza TU_TOKEN con el token del dashboard
cloudflared service install eyJhTU_TOKEN_AQUI...

# Verificar que está corriendo
systemctl status cloudflared
systemctl enable cloudflared
```

---

## 🔁 Flujo de Desarrollo y Deployment

### Estructura de Branches

```
main (producción)
  │
  └── develop (desarrollo)
        │
        ├── feature/nueva-funcionalidad
        ├── fix/arreglo-bug
        └── hotfix/fix-critico
```

### Desarrollo Local

```bash
# 1. Clonar y configurar
git clone git@github.com:TU_USUARIO/finanzas-pro.git
cd finanzas-pro

# 2. Instalar dependencias
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 3. Configurar env local
cp backend/.env.example backend/.env
# Editar con credenciales locales de PostgreSQL

# 4. Levantar base de datos (opcional: usar Docker solo para DB)
docker compose up db -d

# 5. Correr migraciones
cd backend && npx prisma migrate dev && cd ..

# 6. Iniciar en modo desarrollo
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

### Deploy a Producción

#### Opción A: Manual (SSH + Git Pull)

```bash
# En tu máquina local, después de commits:
git push origin main

# En el servidor (vía SSH):
ssh finanzas@192.168.1.XX

cd /home/finanzas/finanzas-pro
git pull origin main

# Rebuil y restart
docker compose down
docker compose up -d --build

# Correr migraciones si hay cambios en el schema
docker compose exec backend npx prisma migrate deploy
```

#### Opción B: Automatizado con Script

```bash
#!/bin/bash
# deploy.sh - Ejecutar desde tu máquina local

SERVER="finanzas@192.168.1.XX"
APP_DIR="/home/finanzas/finanzas-pro"

echo "📤 Pushing cambios a GitHub..."
git push origin main

echo "🚀 Desplegando en servidor..."
ssh $SERVER << 'ENDSSH'
cd /home/finanzas/finanzas-pro
git pull origin main
docker compose down
docker compose up -d --build
docker compose exec -T backend npx prisma migrate deploy
echo "✅ Deploy completado!"
ENDSSH

echo "🎉 Aplicación desplegada en https://tu-app.tu-dominio.com"
```

#### Opción C: GitHub Actions (CI/CD)

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/finanzas/finanzas-pro
            git pull origin main
            docker compose down
            docker compose up -d --build
            docker compose exec -T backend npx prisma migrate deploy
```

> **Nota**: Para GitHub Actions necesitas configurar un servicio como Tailscale o Cloudflare Access para que GitHub pueda acceder a tu servidor.

---

## 🔒 Configuración de SSL

### ¿Cómo funciona con Cloudflare Tunnels?

```
Usuario ──HTTPS──▶ Cloudflare Edge ──Tunnel (encriptado)──▶ Tu Servidor ──HTTP──▶ Containers
         (SSL terminado aquí)        (ya es seguro)          (localhost, no expuesto)
```

**Ventajas:**
- ✅ NO necesitas generar certificados SSL manualmente
- ✅ NO necesitas Let's Encrypt ni renovaciones
- ✅ Cloudflare renueva automáticamente
- ✅ Soporte para SSL estricto con origen certificate (opcional)

### Configuración Recomendada en Cloudflare

1. **SSL/TLS → Overview**: `Full`
2. **SSL/TLS → Edge Certificates**:
   - Always Use HTTPS: ✅ ON
   - HTTP Strict Transport Security (HSTS): ✅ Enable
   - Minimum TLS Version: TLS 1.2
   - Automatic HTTPS Rewrites: ✅ ON

### Opcional: Origin Certificate (para SSL end-to-end)

Si quieres encriptación completa hasta tu origen:

1. SSL/TLS → Origin Server → Create Certificate
2. Descargar certificado (.pem) y key
3. Configurar en tu servidor/nginx

Pero para tu caso, **NO ES NECESARIO** ya que cloudflared establece un túnel seguro.

---

## 📜 Scripts de Automatización

### Script: Backup de Base de Datos

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/home/finanzas/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="finanzas-pro-db-1"

mkdir -p $BACKUP_DIR

docker exec $DB_CONTAINER pg_dump -U $POSTGRES_USER finanzas_pro > "$BACKUP_DIR/backup_$DATE.sql"

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "✅ Backup creado: backup_$DATE.sql"
```

### Script: Health Check

```bash
#!/bin/bash
# health-check.sh

URL="https://tu-app.tu-dominio.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Servidor OK"
else
    echo "❌ Servidor DOWN (código: $RESPONSE)"
    # Opcional: enviar notificación
    # curl -X POST "https://api.telegram.org/bot.../sendMessage" ...
fi
```

### Cron Jobs Recomendados

```bash
# Editar crontab
crontab -e

# Agregar:
# Backup diario a las 3am
0 3 * * * /home/finanzas/scripts/backup-db.sh >> /var/log/backup.log 2>&1

# Health check cada 5 minutos
*/5 * * * * /home/finanzas/scripts/health-check.sh >> /var/log/health.log 2>&1

# Limpiar logs viejos de Docker semanalmente
0 4 * * 0 docker system prune -f >> /var/log/docker-prune.log 2>&1
```

---

## 📋 Checklist de Despliegue

### Antes de empezar:
- [ ] Dominio configurado en Cloudflare
- [ ] LXC creado con recursos especificados
- [ ] Acceso SSH al LXC configurado

### En el servidor (LXC):
- [ ] Docker instalado
- [ ] cloudflared instalado y configurado con token
- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas
- [ ] Docker Compose ejecutándose
- [ ] Migraciones de Prisma ejecutadas

### En Cloudflare:
- [ ] Tunnel creado y activo
- [ ] Public hostname configurado
- [ ] SSL/TLS en modo Full
- [ ] Always Use HTTPS habilitado

### Pruebas finales:
- [ ] https://tu-app.tu-dominio.com carga correctamente
- [ ] Login funciona
- [ ] API responde en /api/*
- [ ] Transacciones se guardan
- [ ] No hay errores en logs

---

## 🆘 Troubleshooting

### Tunnel no conecta
```bash
# Ver logs de cloudflared
journalctl -u cloudflared -f

# Reiniciar servicio
systemctl restart cloudflared
```

### Containers no inician
```bash
# Ver logs de todos los containers
docker compose logs -f

# Ver logs de un container específico
docker compose logs backend -f
```

### Base de datos no accesible
```bash
# Verificar que el container está corriendo
docker ps

# Probar conexión directa
docker exec -it finanzas-pro-db-1 psql -U $POSTGRES_USER -d finanzas_pro
```

### Frontend no carga
```bash
# Verificar build del frontend
docker compose logs frontend

# Rebuild si hay problemas
docker compose up frontend --build -d
```

---

## 📞 Próximos Pasos

1. **Crear el LXC** con las especificaciones indicadas
2. **Ejecutar script de instalación** del servidor
3. **Crear tunnel en Cloudflare** y obtener token
4. **Configurar cloudflared** con el token
5. **Clonar repo y configurar** variables de entorno
6. **Ejecutar docker compose** y migraciones
7. **Probar la aplicación** en el dominio

¿Necesitas ayuda con algún paso específico? 🚀
