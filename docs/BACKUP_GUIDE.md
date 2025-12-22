# 🔒 Guía de Backup - Finanzas Pro

Esta guía explica cómo configurar backups automáticos diarios de tu base de datos con subida opcional a la nube.

## 📋 Características

- ✅ **Backup diario automático** (horario configurable)
- ✅ **Retención de 7 días** (configurable)
- ✅ **Compresión gzip** para ahorrar espacio
- ✅ **Subida automática a la nube** (Google Drive, Dropbox, S3, etc.)
- ✅ **Limpieza automática** de backups antiguos (local y en la nube)
- ✅ **Restauración fácil** con menú interactivo
- ✅ **Detección automática** del contenedor de PostgreSQL

## 🚀 Configuración Rápida

### 1. Hacer el script ejecutable

```bash
chmod +x scripts/backup.sh
```

### 2. Probar backup local

```bash
./scripts/backup.sh --local-only
```

El script detectará automáticamente el contenedor de PostgreSQL y creará un backup en el directorio `backups/`.

### 3. Configurar la nube (opcional pero recomendado)

#### Instalar rclone

```bash
# Opción 1: Script oficial (recomendado)
curl https://rclone.org/install.sh | sudo bash

# Opción 2: Via apt (Debian/Ubuntu)
sudo apt install rclone
```

#### Configurar tu proveedor de nube

```bash
rclone config
```

**Para Google Drive:**
1. Escribe `n` para nuevo remote
2. Nombra el remote: `gdrive` (o el nombre que prefieras)
3. Selecciona `drive` (Google Drive)
4. **client_id**: déjalo vacío (enter)
5. **client_secret**: déjalo vacío (enter)
6. **scope**: selecciona `1` (full access)
7. **root_folder_id**: déjalo vacío
8. **service_account_file**: déjalo vacío
9. **Edit advanced config?**: `n`
10. **Use auto config?**: 
    - Si tienes acceso a un navegador: `y`
    - Si es un servidor sin GUI: `n` (te dará un link para autorizar desde otra máquina)
11. **Configure as team drive?**: `n`
12. Confirma con `y`

#### Verificar configuración

```bash
# Listar remotes configurados
rclone listremotes

# Probar conexión (lista archivos en tu Drive)
rclone lsd gdrive:
```

### 4. Configurar backup automático diario

```bash
./scripts/backup.sh --setup-cron
```

Te preguntará a qué hora quieres ejecutar el backup (0-23).

## 📖 Uso del Script

### Ver ayuda

```bash
./scripts/backup.sh --help
```

### Ver estado de backups

```bash
./scripts/backup.sh --status
```

Mostrará:
- Backups locales (cantidad, tamaño, últimos 5)
- Estado de la nube (si rclone está configurado)
- Estado del cron job

### Ejecutar backup manual

```bash
# Backup completo (local + nube)
./scripts/backup.sh

# Solo backup local
./scripts/backup.sh --local-only
```

### Restaurar un backup

```bash
./scripts/backup.sh --restore
```

Te mostrará un menú con todos los backups disponibles y podrás seleccionar cuál restaurar.

## ⚙️ Configuración Avanzada

### Variables de entorno

Puedes personalizar el comportamiento del script usando variables de entorno:

```bash
# Especificar contenedor de PostgreSQL manualmente
export POSTGRES_CONTAINER=mi-contenedor-db

# Cambiar usuario y base de datos
export POSTGRES_USER=mi_usuario
export POSTGRES_DB=mi_base_de_datos

# Cambiar remote de rclone
export RCLONE_REMOTE=dropbox

# Cambiar carpeta en la nube
export RCLONE_PATH=mis-backups-finanzas
```

### Cambiar retención de días

Edita `scripts/backup.sh` y modifica:

```bash
BACKUP_RETENTION_DAYS=7  # Cambiar a 14, 30, etc.
```

### Cambiar horario del backup

Edita el cron job manualmente:

```bash
crontab -e
```

El formato es: `minuto hora día-del-mes mes día-de-semana`

Ejemplos:
```bash
# A las 3:00 AM todos los días
0 3 * * * /ruta/a/backup.sh

# A las 2:30 AM todos los días
30 2 * * * /ruta/a/backup.sh

# A la medianoche solo los domingos
0 0 * * 0 /ruta/a/backup.sh

# Dos veces al día (3 AM y 3 PM)
0 3,15 * * * /ruta/a/backup.sh
```

## 🔄 Proveedores de Nube Soportados

El script usa [rclone](https://rclone.org/), que soporta más de 40 proveedores de almacenamiento:

### Google Drive

```bash
rclone config
# Selecciona: drive
# Nombra el remote: gdrive
```

### Dropbox

```bash
rclone config
# Selecciona: dropbox
# Nombra el remote: dropbox
```

Luego: `export RCLONE_REMOTE=dropbox`

### Amazon S3 / Backblaze B2

```bash
rclone config
# Selecciona: s3 (para AWS) o b2 (para Backblaze)
# Configura las credenciales
```

### Servidor via SSH/SFTP

```bash
rclone config
# Selecciona: sftp
# Configura host, user, etc.
```

### NAS local (Synology, TrueNAS, etc.)

```bash
rclone config
# Selecciona: sftp o webdav según tu NAS
```

## 🛡️ Recomendaciones de Seguridad

1. **Múltiples destinos**: Considera subir a 2 lugares (ej: Google Drive + NAS local)
2. **Monitoreo**: Revisa los logs periódicamente en `backups/backup.log`
3. **Pruebas de restauración**: Prueba restaurar un backup al menos una vez al mes
4. **Permisos**: Asegúrate de que solo tu usuario tenga acceso al directorio de backups

### Agregar notificaciones por Telegram (opcional)

1. Crea un bot con @BotFather en Telegram
2. Obtén tu chat_id
3. Agrega al final del script `backup.sh`:

```bash
send_telegram_notification() {
    local message="$1"
    local bot_token="TU_BOT_TOKEN"
    local chat_id="TU_CHAT_ID"
    curl -s -X POST "https://api.telegram.org/bot${bot_token}/sendMessage" \
        -d chat_id="${chat_id}" \
        -d text="${message}" \
        -d parse_mode="HTML" > /dev/null
}

# Llamar al final del main:
send_telegram_notification "✅ Backup completado: $(basename $backup_file)"
```

## 📊 Estructura de Archivos

```
finanzas-pro/
├── backups/
│   ├── backup_20251222_030000.sql.gz
│   ├── backup_20251221_030000.sql.gz
│   ├── ...
│   └── backup.log              # Logs del cron
├── scripts/
│   └── backup.sh               # Script principal
└── docs/
    └── BACKUP_GUIDE.md         # Esta guía
```

## 🆘 Troubleshooting

### El backup falla con "contenedor no encontrado"

El script intenta detectar automáticamente el contenedor. Si falla, especifícalo manualmente:

```bash
# Ver contenedores disponibles
docker ps --format 'table {{.Names}}\t{{.Image}}'

# Especificar el contenedor
export POSTGRES_CONTAINER=nombre_del_contenedor
./scripts/backup.sh
```

### rclone dice "failed to authorize"

El token ha expirado. Re-autoriza:

```bash
rclone config reconnect gdrive:
```

### El cron no se ejecuta

1. Verifica que el cron esté activo:
```bash
crontab -l
```

2. Revisa los logs:
```bash
tail -f backups/backup.log
```

3. Verifica permisos:
```bash
chmod +x scripts/backup.sh
```

### El backup está muy grande

Considera:
- Aumentar la compresión (cambiar `gzip` por `gzip -9` en el script)
- Hacer backup solo de ciertas tablas
- Usar backup incremental

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en `backups/backup.log`
2. Ejecuta `./scripts/backup.sh --status` para ver el estado
3. Verifica permisos del script y directorio
4. Abre un issue en el repositorio del proyecto
