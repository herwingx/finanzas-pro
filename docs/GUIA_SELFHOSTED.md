# 🐳 Guía de Despliegue: Self-Hosted (VPS / Docker Tradicional)

Esta guía es para usuarios que prefieren desplegar la aplicación exponiendo puertos directamente o usando su propio Reverse Proxy (Nginx, Traefik, Caddy), sin depender de Cloudflare Tunnels.

---

## 📋 Requisitos

- Acceso a un servidor Linux (VPS, VM, Raspberry Pi).
- Docker y Docker Compose instalados.
- **Puertos libres**: 3000 (Frontend), 4000 (API), 5432 (Postgres).
- (Opcional) Un dominio apuntando a la IP de tu servidor.

---

## 🚀 Pasos de Instalación

### 1. Clonar y Configurar

```bash
git clone https://github.com/tu-usuario/finanzas-pro.git
cd finanzas-pro

# Configurar variables
cp backend/.env.example backend/.env
# Edita backend/.env:
# DATABASE_URL="postgresql://finanzas:password@db:5432/finanzas_pro"
```

### 2. Configurar Variables de Docker (Raíz)

Crea un archivo `.env` en la raíz del proyecto:

```bash
POSTGRES_USER=finanzas
POSTGRES_PASSWORD=tu_password_segura
POSTGRES_DB=finanzas_pro
```

### 3. Iniciar Servicios

Usaremos el archivo `docker-compose.selfhosted.yml` que expone los puertos.

```bash
# Iniciar servicios
docker compose -f docker-compose.selfhosted.yml up -d --build

# Ejecutar migraciones
docker compose -f docker-compose.selfhosted.yml exec backend npx prisma migrate deploy
```

---

## 🌐 Configuración de Proxy Inverso (Opcional pero Recomendado)

Aunque la app ya es accesible en `http://tu-ip:3000`, para producción deberías usar un Proxy Inverso para tener SSL (HTTPS).

### Ejemplo con Nginx Proxy Manager / Traefik:

Apunta tu proxy a:
- **Frontend**: `http://host.docker.internal:3000`
- **Backend/API**: `http://host.docker.internal:4000`

### Ejemplo manual con Nginx:

```nginx
server {
    server_name mis-finanzas.com;

    location / {
        proxy_pass http://localhost:3000;
        # ...headers estándar...
    }

    location /api {
        proxy_pass http://localhost:4000;
        # ...headers estándar...
    }
}
```

---

## 🛠️ Comandos de Mantenimiento

Para este método, debes especificar siempre el archivo `-f`.

```bash
# Ver logs
docker compose -f docker-compose.selfhosted.yml logs -f

# Detener
docker compose -f docker-compose.selfhosted.yml down

# Actualizar
git pull
docker compose -f docker-compose.selfhosted.yml up -d --build
```
