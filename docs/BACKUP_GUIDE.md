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

Elige la opción que mejor se adapte a tu sistema operativo:

**Linux (Debian/Ubuntu):**
```bash
# Opción 1: Script oficial (recomendado, siempre última versión)
curl https://rclone.org/install.sh | sudo bash

# Opción 2: Via apt (puede no ser la última versión)
sudo apt install rclone
```

**Linux (Fedora/RHEL/CentOS):**
```bash
sudo dnf install rclone
```

**Linux (Arch):**
```bash
sudo pacman -S rclone
```

**macOS:**
```bash
# Con Homebrew
brew install rclone

# O con el script oficial
curl https://rclone.org/install.sh | sudo bash
```

**Windows:**
```powershell
# Con winget
winget install Rclone.Rclone

# Con Chocolatey
choco install rclone

# O descarga el ejecutable desde: https://rclone.org/downloads/
```

**Raspberry Pi / ARM:**
```bash
# El script oficial detecta la arquitectura automáticamente
curl https://rclone.org/install.sh | sudo bash
```

> 📥 **Descarga directa:** También puedes descargar el ejecutable para tu sistema desde [rclone.org/downloads](https://rclone.org/downloads/)

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

### 🖥️ Configurar rclone en servidor SIN navegador (LXC, VPS, Docker, etc.)

Si la app está instalada en un servidor sin interfaz gráfica, necesitarás autenticarte desde otra máquina y luego transferir la configuración.

#### Opción A: Usando el ejecutable de rclone (recomendado)

**Paso 1: En tu PC/laptop con navegador**

Instala rclone en tu máquina local según tu sistema operativo (ver sección anterior) y configúralo:

```bash
# Crear directorio para la configuración
mkdir -p ~/.config/rclone

# Ejecutar configuración
rclone config
```

Sigue los pasos para Google Drive (o el proveedor que prefieras). Al terminar, tendrás el archivo `~/.config/rclone/rclone.conf`.

**Paso 2: Copiar la configuración al servidor**

```bash
# Crear directorio en el servidor
ssh usuario@tu-servidor "mkdir -p ~/.config/rclone"

# Copiar archivo de configuración
scp ~/.config/rclone/rclone.conf usuario@tu-servidor:~/.config/rclone/

# Si usas Proxmox LXC:
pct exec <CTID> -- mkdir -p /root/.config/rclone
pct push <CTID> ~/.config/rclone/rclone.conf /root/.config/rclone/rclone.conf
```

**Paso 3: Instalar rclone en el servidor y verificar**

```bash
# En el servidor
ssh usuario@tu-servidor

# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Verificar que funciona
rclone listremotes
rclone lsd gdrive:
```

#### Opción B: Usando Docker para configurar

Si no quieres instalar rclone en tu máquina local, puedes usar Docker:

**Paso 1: En tu PC/laptop con navegador**

```bash
mkdir -p ~/.config/rclone

docker run -it --rm \
  -v ~/.config/rclone:/config/rclone \
  rclone/rclone:latest \
  config
```

**Paso 2: Copiar al servidor** (igual que arriba)

```bash
scp ~/.config/rclone/rclone.conf usuario@tu-servidor:~/.config/rclone/
```

**Paso 3: En el servidor, instalar rclone**

```bash
curl https://rclone.org/install.sh | sudo bash
rclone listremotes
```

#### Opción C: Usar rclone via Docker en el servidor (sin instalar)

Si prefieres no instalar nada en el servidor:

```bash
# Agregar alias a ~/.bashrc
echo "alias rclone='docker run --rm -v ~/.config/rclone:/config/rclone -v \$(pwd):/data rclone/rclone:latest'" >> ~/.bashrc
source ~/.bashrc

# Verificar
rclone listremotes
```

> ⚠️ **Nota:** El script de backup espera que `rclone` sea un comando del sistema. Si usas Docker, necesitarás modificar el script o instalar rclone con el método tradicional.

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

### 📱 Notificaciones por Telegram

El script incluye soporte para notificaciones por Telegram. Recibirás un mensaje cada vez que se complete un backup.

**Paso 1: Crear un bot en Telegram**

1. Abre Telegram y busca `@BotFather`
2. Envía `/newbot` y sigue las instrucciones
3. Copia el **token** que te da (algo como `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Paso 2: Obtener tu Chat ID**

1. Busca `@userinfobot` en Telegram
2. Envíale cualquier mensaje
3. Te responderá con tu **ID** (un número como `123456789`)

**Paso 3: Configurar las variables**

Agrega estas variables a tu archivo `.env` o expórtalas antes de ejecutar el backup:

```bash
# En tu .env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

O expórtalas directamente:

```bash
export TELEGRAM_ENABLED=true
export TELEGRAM_BOT_TOKEN=tu_token
export TELEGRAM_CHAT_ID=tu_chat_id
./scripts/backup.sh
```

**Mensaje de ejemplo:**

```
✅ Backup Finanzas Pro

📦 Archivo: backup_20251222_110000.sql.gz
📊 Tamaño: 1.2M
☁️ Destino: + gdrive
🕐 Fecha: 2025-12-22 11:00
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
