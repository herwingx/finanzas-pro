# 🛡️ Seguridad

> **Protección Blindada** — Medidas proactivas para asegurar tus datos financieros.

Finanzas Pro ha sido diseñado priorizando la privacidad y la seguridad. Como aplicación financiera, tratamos tus datos con el máximo cuidado.

---

## 📋 Resumen de Medidas

| Capa | Implementación |
| :--- | :--- |
| **Base de Datos** | Contraseñas hasheadas con `bcrypt`. Datos aislados en Docker. |
| **API** | Rate Limiting, CORS estricto, Headers de seguridad (Helmet). |
| **Sesión** | JWT con expiración automática (24h). |
| **Red** | Diseñado para funcionar tras Cloudflare Tunnel (sin puertos abiertos). |

---

## 🔧 Configuración Recomendada

Para un entorno de producción seguro, verifica estas variables en tu `.env`.

### 1. Autenticación
```ini
# Genera un string largo y aleatorio. NUNCA uses "secret" o valores por defecto.
JWT_SECRET=tu_string_aleatorio_super_largo_y_seguro_123456
```

### 2. Registro de Usuarios
Si es una instalación solo para ti, **desactiva el registro** una vez hayas creado tu cuenta.

```ini
# En backend/.env
REGISTRATION_ENABLED=false
```

### 3. CORS (Cross-Origin Resource Sharing)
Restringe el acceso solo a tu dominio para evitar peticiones desde sitios maliciosos.

```ini
# En backend/.env
ALLOWED_ORIGINS=https://tus-finanzas.com
```

---

## 🚨 Política de Rate Limiting

Para prevenir ataques de fuerza bruta, la API limita los intentos de conexión:

- **Login/Registro**: 5 intentos por cada 15 minutos.
- **API General**: 100 peticiones por cada 15 minutos.

*Si eres bloqueado, espera 15 minutos o contacta al administrador del servidor para limpiar la caché de Redis/Memoria.*

---

## 🐛 Reporte de Vulnerabilidades

Si encuentras un fallo de seguridad, por favor **NO abras un Issue público**.

1. Envía un correo a `security@tudominio.com` (o contacta al mantenedor directamente).
2. Describe el vector de ataque.
3. Espera confirmación antes de divulgarlo.

Nos tomamos muy en serio la seguridad y agradeceremos tu "divulgación responsable".

---

## 📝 Auditoría y Logs

El sistema mantiene logs de seguridad (sin exponer credenciales) que puedes revisar:

```bash
./deploy.sh logs backend | grep "Security"
```

Esto mostrará intentos de login fallidos, bloqueos de IP y otras alertas de seguridad.
