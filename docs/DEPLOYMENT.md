# 🚀 Guía de Despliegue Avanzado

> **Tu Server, Tus Reglas** — Flexibilidad total para Home Lab, VPS o Nube.

Aunque el `README.md` principal cubre lo básico, aquí detallamos escenarios más complejos.

---

## 🏗️ Escenarios de Despliegue

### 1. Home Lab con Cloudflare Tunnel (Recomendado)
*Ideal para servidores caseros (Raspberry Pi, Mini PC) sin IP pública estática.*

Esta configuración aísla tu red doméstica de Internet.
- **Docker Compose**: Usa el archivo default `docker-compose.yml`.
- **Acceso**: Todo el tráfico entra por el túnel cifrado.
- **Config**: Requiere `CLOUDFLARE_TUNNEL_TOKEN` en `.env`.

### 2. VPS con IP Pública (Self-Hosted Standard)
*Ideal para servidores en DigitalOcean, Heterzner, AWS, etc.*

Si prefieres gestionar tus puertos y certificados manualmente o usas un proxy inverso propio (Traefik, Nginx Proxy Manager).

**Comando:**
```bash
docker compose -f docker-compose.selfhosted.yml up -d
```

**Diferencias Clave:**
- Expone el puerto `80` (o el que configures).
- Elimina el contenedor `cloudflared`.
- Tú eres responsable del SSL (a menos que uses un proxy delante).

---

## 🔧 Mantenimiento

### Actualizaciones
Para actualizar a la última versión del repositorio:

```bash
./deploy.sh update
```
*Esto hace un git pull, reconstruye las imágenes y corre migraciones.*

### Migraciones de Base de Datos
Si hay cambios en el esquema de la base de datos (Prisma):

```bash
./deploy.sh migrate
```

### Backups Manuales
Genera un dump instantáneo de la base de datos:

```bash
./deploy.sh backup
```

---

## 🛠️ Troubleshooting

### Permisos de Docker
Si tienes errores de "Permission denied", asegúrate que tu usuario está en el grupo docker:
```bash
sudo usermod -aG docker $USER
# Requiere relogin
```

### Logs en Tiempo Real
Si algo falla, lo primero es mirar los logs:
```bash
# Ver todo
./deploy.sh logs

# Ver servicio específico
docker compose logs -f backend
```
