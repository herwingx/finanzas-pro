# 🔒 Guía de Seguridad - Finanzas Pro

Esta guía describe las medidas de seguridad implementadas y cómo configurarlas para proteger tu instalación.

## Tabla de Contenidos

- [Resumen de Seguridad](#resumen-de-seguridad)
- [Configuración de Variables](#configuración-de-variables)
- [Protección de Autenticación](#protección-de-autenticación)
- [Rate Limiting](#rate-limiting)
- [Control de CORS](#control-de-cors)
- [Desactivar Registro Público](#desactivar-registro-público)
- [Mejores Prácticas](#mejores-prácticas)
- [Recomendaciones Adicionales](#recomendaciones-adicionales)

---

## Resumen de Seguridad

Finanzas Pro implementa múltiples capas de seguridad:

| Característica | Descripción |
|----------------|-------------|
| **Contraseñas** | Hasheadas con bcrypt (salt rounds: 10) |
| **Autenticación** | JWT con expiración de 24 horas |
| **Rate Limiting** | Protección contra fuerza bruta |
| **CORS** | Control de orígenes permitidos |
| **Helmet** | Headers de seguridad HTTP |
| **Token de Reset** | Expira en 1 hora |
| **Logs Sanitizados** | No se loguean contraseñas ni tokens |

---

## Configuración de Variables

Agrega las siguientes variables a tu archivo `backend/.env`:

```bash
# =============================================================================
# Configuración de Seguridad
# =============================================================================

# CORS: Orígenes permitidos (separados por comas)
# Producción: especifica tu dominio exacto
# Desarrollo: usa '*' o déjalo vacío
ALLOWED_ORIGINS="https://finanzas.tudominio.com"

# Rate Limiting (deshabilitar SOLO para debugging)
RATE_LIMIT_ENABLED="true"

# Control de registro de nuevos usuarios
# false = solo usuarios existentes pueden acceder
REGISTRATION_ENABLED="false"
```

---

## Protección de Autenticación

### Contraseñas
- Hasheadas con **bcrypt** (salt rounds: 10)
- Nunca almacenadas en texto plano
- Hash con salt único por usuario

### JWT (JSON Web Tokens)
- Expiración: **24 horas**
- Firmado con `JWT_SECRET` (min. 32 caracteres aleatorios)
- Genera tu secret con: `openssl rand -hex 32`

### Tokens de Reset de Contraseña
- Expiración: **1 hora**
- Uso único (se invalida después de usar)
- No se loguean por seguridad

---

## Rate Limiting

Protección contra ataques de fuerza bruta:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/*` (general) | 100 requests | 15 minutos |
| `/api/auth/login` | 5 intentos | 15 minutos |
| `/api/auth/register` | 5 intentos | 15 minutos |
| `/api/auth/request-reset` | 3 intentos | 1 hora |
| `/api/auth/reset-password` | 5 intentos | 15 minutos |

### Respuestas de Rate Limit

Cuando se excede el límite, la API responde con:

```json
{
  "message": "Too many authentication attempts, please try again after 15 minutes.",
  "retryAfter": 15
}
```

### Deshabilitar (solo desarrollo)

```bash
RATE_LIMIT_ENABLED="false"
```

> ⚠️ **Nunca deshabilites en producción**

---

## Control de CORS

### Modo Desarrollo (permisivo)
```bash
ALLOWED_ORIGINS="*"
# o dejarlo vacío
```

### Modo Producción (restrictivo)
```bash
# Un solo origen
ALLOWED_ORIGINS="https://finanzas.tudominio.com"

# Múltiples orígenes
ALLOWED_ORIGINS="https://finanzas.tudominio.com,https://tudominio.com"
```

### Qué bloquea CORS

Cuando un origen no autorizado intenta acceder a la API:
- La request es rechazada
- Se loguea el intento: `❌ CORS: Blocked request from origin: X`
- El navegador muestra error de CORS

### Requests sin origen

Por diseño, se permiten requests sin header `Origin`:
- Apps móviles nativas
- curl, Postman, herramientas CLI
- Server-to-server requests

---

## Desactivar Registro Público

**Recomendado para uso personal/familiar.**

```bash
REGISTRATION_ENABLED="false"
```

### Comportamiento
- ✅ Login funciona normalmente
- ✅ Reset de contraseña funciona
- ❌ `/api/auth/register` retorna 403:
  ```json
  {
    "message": "Registration is currently disabled. Contact the administrator."
  }
  ```

### Crear usuarios adicionales

Si necesitas agregar usuarios con registro deshabilitado:

1. **Temporalmente habilitar registro:**
   ```bash
   REGISTRATION_ENABLED="true"
   ```
   Reiniciar backend, crear usuario, volver a deshabilitar.

2. **Crear usuario directamente en la base de datos:**
   ```bash
   # Usar el script incluido
   ./reset_password.sh --create-user
   
   # O manualmente con Prisma
   docker-compose exec backend npx prisma studio
   ```

---

## Mejores Prácticas

### 1. JWT Secret Seguro

```bash
# Generar un secret fuerte
openssl rand -hex 32

# Resultado ejemplo (usa el tuyo propio):
JWT_SECRET="a7f8b2c9d4e5f6a1b3c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
```

### 2. Contraseña de Base de Datos

```bash
# No uses valores por defecto
POSTGRES_PASSWORD="usa-un-generador-de-contraseñas-aquí"
```

### 3. HTTPS Obligatorio

Si usas Cloudflare Tunnels, ya tienes HTTPS automático.

Para self-hosted, considera:
- **Traefik** con Let's Encrypt
- **Caddy** (SSL automático)
- **Nginx** con certbot

### 4. Backups Regulares

```bash
# Backup de la base de datos
docker-compose exec db pg_dump -U finanzas finanzas_pro > backup_$(date +%Y%m%d).sql

# O usa el directorio backups/ incluido
```

### 5. Actualizaciones

```bash
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

---

## Recomendaciones Adicionales

### Para Homelab / Uso Personal

1. **Deshabilita el registro** (`REGISTRATION_ENABLED="false"`)
2. **Restringe CORS** a tu dominio exacto
3. **Mantén rate limiting activo**
4. **Considera una VPN** (Tailscale, WireGuard) como capa extra

### Para Uso Público / Multi-usuario

1. **Implementa 2FA** (futuro roadmap)
2. **Considera OAuth** (Google, GitHub login)
3. **Añade captcha** en registro/login
4. **Configura WAF** (Cloudflare, fail2ban)

### Verificar Configuración

Al iniciar el backend, verás un resumen de seguridad:

```
🚀 Finanzas Pro Backend is running!
📍 Port: 4000

🔒 Security Configuration:
   • CORS: https://finanzas.tudominio.com
   • Rate Limiting: Enabled
   • Registration: Disabled
```

---

## Logs de Seguridad

Los eventos de seguridad se loguean de forma sanitizada:

```
🔐 Security: Login attempt { email: 'usuario@email.com' }
🔐 Security: Login successful { email: 'usuario@email.com' }
🔐 Security: Registration attempt blocked (registration is disabled)
❌ CORS: Blocked request from origin: https://malicious-site.com
```

**Nunca se loguean:**
- Contraseñas
- Tokens JWT
- Tokens de reset
- Secrets

---

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **No la publiques** en issues públicos
2. Contacta al mantenedor directamente
3. Proporciona detalles para reproducir el problema

---

*Última actualización: Diciembre 2024*
