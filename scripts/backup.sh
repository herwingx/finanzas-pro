#!/bin/bash
# ============================================================================
# Finanzas Pro - Script de Backup Automatizado
# ============================================================================
# Este script realiza backups diarios de PostgreSQL y los sube a la nube
# Retención: 7 días (configurable)
# 
# Uso:
#   ./backup.sh              # Backup completo (local + cloud)
#   ./backup.sh --local-only # Solo backup local
#   ./backup.sh --restore    # Restaurar último backup
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURACIÓN - Detectar automáticamente el directorio del proyecto
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Cargar variables de entorno desde .env si existe
if [ -f "${PROJECT_DIR}/.env" ]; then
    # Exportar solo las líneas válidas (ignorar comentarios y líneas vacías)
    set -a
    source <(grep -v '^#' "${PROJECT_DIR}/.env" | grep -v '^$' | sed 's/\r$//')
    set +a
fi

# Configuración de retención
BACKUP_RETENTION_DAYS=7

# Configuración de rclone (opcional)
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"  # Nombre del remote en rclone
RCLONE_PATH="${RCLONE_PATH:-Backup Finanzas Pro}"  # Carpeta en la nube

# Configuración de PostgreSQL (desde el docker-compose o variables de entorno)
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-}"  # Se detectará automáticamente si está vacío
POSTGRES_USER="${POSTGRES_USER:-finanzas}"
POSTGRES_DB="${POSTGRES_DB:-finanzas_pro}"

# Configuración de Telegram (opcional)
# Obtén tu bot token de @BotFather y tu chat_id de @userinfobot
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
TELEGRAM_ENABLED="${TELEGRAM_ENABLED:-false}"  # Cambiar a true para activar

# ============================================================================
# COLORES Y UTILIDADES
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[OK]${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# Función para enviar notificaciones por Telegram
send_telegram() {
    local message="$1"
    local parse_mode="${2:-HTML}"
    
    # Verificar si Telegram está habilitado
    if [ "$TELEGRAM_ENABLED" != "true" ]; then
        return 0
    fi
    
    # Verificar que las credenciales estén configuradas
    if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
        log_warning "Telegram habilitado pero faltan credenciales (TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID)"
        return 1
    fi
    
    # Enviar mensaje
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="${message}" \
        -d parse_mode="${parse_mode}" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_info "Notificación enviada a Telegram"
    else
        log_warning "Error al enviar notificación a Telegram"
    fi
}

# ============================================================================
# FUNCIONES PRINCIPALES
# ============================================================================

detect_postgres_container() {
    # Si ya está configurado, verificar que exista
    if [ -n "$POSTGRES_CONTAINER" ]; then
        if docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
            return 0
        fi
        log_warning "Contenedor configurado '$POSTGRES_CONTAINER' no encontrado, buscando automáticamente..."
    fi
    
    # Intentar detectar por nombre del proyecto
    local project_name=$(basename "$PROJECT_DIR")
    local detected=""
    
    # Buscar contenedor con el nombre del proyecto
    detected=$(docker ps --format '{{.Names}}' | grep -E "^${project_name}.*(-db-|-postgres)" | head -1)
    
    # Si no se encuentra, buscar cualquier contenedor de postgres/db
    if [ -z "$detected" ]; then
        detected=$(docker ps --format '{{.Names}}' | grep -E "(db|postgres)" | head -1)
    fi
    
    if [ -n "$detected" ]; then
        POSTGRES_CONTAINER="$detected"
        log_info "Contenedor detectado automáticamente: $POSTGRES_CONTAINER"
        return 0
    fi
    
    return 1
}

check_dependencies() {
    log_info "Verificando dependencias..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    
    # Detectar contenedor de PostgreSQL
    if ! detect_postgres_container; then
        log_error "No se encontró el contenedor de PostgreSQL"
        log_info "Contenedores disponibles:"
        docker ps --format 'table {{.Names}}\t{{.Image}}'
        echo ""
        log_info "Puedes especificar el contenedor manualmente:"
        echo "   export POSTGRES_CONTAINER=nombre_del_contenedor"
        echo "   ./backup.sh"
        exit 1
    fi
    
    log_success "Dependencias verificadas"
}

create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Directorio de backups creado: $BACKUP_DIR"
    fi
}

perform_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"
    local backup_path="${BACKUP_DIR}/${backup_file}"
    local compressed_path="${backup_path}.gz"
    
    log_info "Iniciando backup de base de datos..."
    log_info "Timestamp: $timestamp"
    
    # Realizar el dump de PostgreSQL
    docker exec "$POSTGRES_CONTAINER" pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        > "$backup_path" 2>/dev/null
    
    if [ $? -ne 0 ] || [ ! -s "$backup_path" ]; then
        log_error "Error al crear el backup"
        rm -f "$backup_path"
        exit 1
    fi
    
    # Comprimir el backup
    gzip "$backup_path"
    
    local size=$(du -h "$compressed_path" | cut -f1)
    log_success "Backup creado: $(basename $compressed_path) ($size)"
    
    echo "$compressed_path"
}

cleanup_old_backups() {
    log_info "Limpiando backups antiguos (>$BACKUP_RETENTION_DAYS días)..."
    
    local count=0
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            rm -f "$file"
            log_info "  Eliminado: $(basename $file)"
            ((count++)) || true
        fi
    done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS 2>/dev/null)
    
    if [ $count -eq 0 ]; then
        log_success "No hay backups antiguos para eliminar"
    else
        log_success "Eliminados $count backups antiguos"
    fi
}

upload_to_cloud() {
    local backup_file="$1"
    
    # Verificar si rclone está instalado
    if ! command -v rclone &> /dev/null; then
        log_warning "rclone no está instalado. Saltando subida a la nube."
        log_info "Para habilitar backups en la nube, instala y configura rclone:"
        echo ""
        echo "  1. Instalar rclone:"
        echo "     curl https://rclone.org/install.sh | sudo bash"
        echo ""
        echo "  2. Configurar tu proveedor de nube:"
        echo "     rclone config"
        echo ""
        echo "  3. Exportar variables (opcional):"
        echo "     export RCLONE_REMOTE=gdrive"
        echo "     export RCLONE_PATH=mis-backups"
        echo ""
        return 0
    fi
    
    # Verificar si el remote está configurado
    if ! rclone listremotes | grep -q "^${RCLONE_REMOTE}:"; then
        log_warning "Remote '$RCLONE_REMOTE' no configurado en rclone"
        log_info "Ejecuta: rclone config"
        log_info "O especifica otro remote: export RCLONE_REMOTE=nombre_del_remote"
        return 0
    fi
    
    log_info "Subiendo backup a la nube ($RCLONE_REMOTE)..."
    
    # Crear directorio en la nube si no existe
    rclone mkdir "${RCLONE_REMOTE}:${RCLONE_PATH}" 2>/dev/null || true
    
    # Subir el archivo
    if rclone copy "$backup_file" "${RCLONE_REMOTE}:${RCLONE_PATH}/" --progress; then
        log_success "Backup subido a: ${RCLONE_REMOTE}:${RCLONE_PATH}/$(basename $backup_file)"
    else
        log_error "Error al subir backup a la nube"
        return 1
    fi
    
    # Limpiar backups antiguos en la nube
    cleanup_cloud_backups
}

cleanup_cloud_backups() {
    log_info "Limpiando backups antiguos en la nube..."
    
    # Listar archivos y eliminar los más antiguos del período de retención
    local cutoff_date=$(date -d "-${BACKUP_RETENTION_DAYS} days" +%Y%m%d)
    
    rclone lsf "${RCLONE_REMOTE}:${RCLONE_PATH}/" 2>/dev/null | while read file; do
        # Extraer fecha del nombre del archivo (backup_YYYYMMDD_HHMMSS.sql.gz)
        local file_date=$(echo "$file" | grep -oP 'backup_\K[0-9]{8}' || echo "")
        if [ -n "$file_date" ] && [ "$file_date" -lt "$cutoff_date" ]; then
            log_info "  Eliminando de la nube: $file"
            rclone delete "${RCLONE_REMOTE}:${RCLONE_PATH}/$file" 2>/dev/null || true
        fi
    done
    
    log_success "Limpieza en la nube completada"
}

restore_backup() {
    log_info "=== Restaurar Backup ==="
    
    # Listar backups disponibles
    echo ""
    echo "Backups disponibles:"
    echo "===================="
    
    local i=1
    local backups=()
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" | cut -d'.' -f1)
            echo "  $i) $(basename $file) - $size - $date"
            backups+=("$file")
            ((i++))
        fi
    done < <(ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null)
    
    if [ ${#backups[@]} -eq 0 ]; then
        log_error "No hay backups disponibles"
        exit 1
    fi
    
    echo ""
    read -p "Selecciona el número del backup a restaurar (1-${#backups[@]}): " selection
    
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
        log_error "Selección inválida"
        exit 1
    fi
    
    local selected_backup="${backups[$((selection-1))]}"
    
    echo ""
    log_warning "¡ADVERTENCIA! Esto sobrescribirá todos los datos actuales."
    read -p "¿Estás seguro? (escribe 'SI' para confirmar): " confirm
    
    if [ "$confirm" != "SI" ]; then
        log_info "Restauración cancelada"
        exit 0
    fi
    
    log_info "Restaurando: $(basename $selected_backup)"
    
    # Descomprimir y restaurar
    gunzip -c "$selected_backup" | docker exec -i "$POSTGRES_CONTAINER" psql \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "¡Backup restaurado exitosamente!"
    else
        log_error "Error durante la restauración"
        exit 1
    fi
}

show_status() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}           📊 Estado de Backups - Finanzas Pro              ${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Información del proyecto
    echo -e "${BLUE}📂 Proyecto:${NC}"
    echo "   Directorio: $PROJECT_DIR"
    echo ""
    
    # Backups locales
    echo -e "${BLUE}📁 Backups Locales:${NC}"
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
    local backup_count=$(ls "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l || echo "0")
    echo "   Ubicación: $BACKUP_DIR"
    echo "   Total: $backup_count backups ($total_size)"
    echo ""
    
    if [ $backup_count -gt 0 ]; then
        echo "   Últimos 5 backups:"
        ls -lt "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -5 | while read line; do
            local file=$(echo $line | awk '{print $NF}')
            local size=$(echo $line | awk '{print $5}')
            local date=$(echo $line | awk '{print $6, $7, $8}')
            echo "   • $(basename $file) - $(numfmt --to=iec $size) - $date"
        done
    fi
    
    echo ""
    
    # Estado de rclone/cloud
    echo -e "${BLUE}☁️  Estado de la Nube:${NC}"
    if command -v rclone &> /dev/null; then
        if rclone listremotes | grep -q "^${RCLONE_REMOTE}:"; then
            echo "   ✅ rclone configurado con remote: $RCLONE_REMOTE"
            local cloud_count=$(rclone lsf "${RCLONE_REMOTE}:${RCLONE_PATH}/" 2>/dev/null | wc -l || echo "0")
            echo "   📤 Backups en la nube: $cloud_count"
        else
            echo "   ⚠️  rclone instalado pero remote '$RCLONE_REMOTE' no configurado"
        fi
    else
        echo "   ❌ rclone no instalado"
        echo "   Ejecuta: curl https://rclone.org/install.sh | sudo bash"
    fi
    
    echo ""
    
    # Estado del cron
    echo -e "${BLUE}⏰ Programación (Cron):${NC}"
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        echo "   ✅ Backup automático configurado"
        crontab -l 2>/dev/null | grep "backup.sh" | while read line; do
            echo "   📅 $line"
        done
    else
        echo "   ❌ Backup automático NO configurado"
        echo "   Ejecuta: ./backup.sh --setup-cron"
    fi
    
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
}

setup_cron() {
    local script_path="${SCRIPT_DIR}/backup.sh"
    local log_path="${BACKUP_DIR}/backup.log"
    
    echo ""
    echo "Configuración del horario de backup:"
    echo "====================================="
    echo ""
    read -p "¿A qué hora quieres ejecutar el backup? (0-23, default: 3): " hour
    hour=${hour:-3}
    
    if ! [[ "$hour" =~ ^[0-9]+$ ]] || [ "$hour" -lt 0 ] || [ "$hour" -gt 23 ]; then
        log_error "Hora inválida. Usa un número entre 0 y 23."
        exit 1
    fi
    
    # Crear directorio de backups si no existe
    mkdir -p "$BACKUP_DIR"
    
    # Cron job para la hora especificada
    local cron_entry="0 $hour * * * $script_path >> $log_path 2>&1"
    
    log_info "Configurando backup automático diario a las ${hour}:00..."
    
    # Verificar si ya existe
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        log_warning "Ya existe una entrada de cron para backups"
        read -p "¿Deseas reemplazarla? (s/n): " confirm
        if [ "$confirm" != "s" ]; then
            log_info "Configuración cancelada"
            return 0
        fi
        # Remover entrada existente
        crontab -l 2>/dev/null | grep -v "backup.sh" | crontab -
    fi
    
    # Agregar nueva entrada
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -
    
    log_success "Cron job configurado exitosamente"
    log_info "Horario: ${hour}:00 todos los días"
    log_info "Logs en: $log_path"
    
    echo ""
    echo "Para verificar: crontab -l"
    echo "Para editar horario: crontab -e"
}

show_help() {
    echo "Finanzas Pro - Sistema de Backup"
    echo ""
    echo "Uso: $0 [opción]"
    echo ""
    echo "Opciones:"
    echo "  (sin args)    Backup completo (local + nube)"
    echo "  --local-only  Solo backup local (sin subir a la nube)"
    echo "  --restore     Restaurar desde un backup"
    echo "  --status      Mostrar estado de backups"
    echo "  --setup-cron  Configurar backup automático diario"
    echo "  --help        Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno (opcionales):"
    echo "  POSTGRES_CONTAINER  Nombre del contenedor de PostgreSQL"
    echo "  POSTGRES_USER       Usuario de PostgreSQL (default: finanzas)"
    echo "  POSTGRES_DB         Base de datos (default: finanzas_pro)"
    echo "  RCLONE_REMOTE       Nombre del remote de rclone (default: gdrive)"
    echo "  RCLONE_PATH         Carpeta en la nube (default: Backup Finanzas Pro)"
    echo "  BACKUP_RETENTION_DAYS  Días de retención (default: 7)"
    echo ""
    echo "Ejemplos:"
    echo "  ./backup.sh                              # Backup completo"
    echo "  ./backup.sh --local-only                 # Solo local"
    echo "  RCLONE_REMOTE=dropbox ./backup.sh        # Usar Dropbox"
    echo "  POSTGRES_CONTAINER=mydb ./backup.sh      # Contenedor específico"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║       🔒 Finanzas Pro - Sistema de Backup Automatizado       ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    local local_only=false
    
    # Procesar argumentos
    case "${1:-}" in
        --local-only)
            local_only=true
            ;;
        --restore)
            check_dependencies
            restore_backup
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        --setup-cron)
            setup_cron
            exit 0
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
    esac
    
    # Ejecutar backup
    check_dependencies
    create_backup_dir
    
    local backup_file=$(perform_backup)
    
    cleanup_old_backups
    
    if [ "$local_only" = false ]; then
        upload_to_cloud "$backup_file"
    fi
    
    # Calcular tamaño del backup
    local backup_size=$(du -h "$backup_file" | cut -f1)
    local backup_name=$(basename "$backup_file")
    local cloud_status=""
    
    if [ "$local_only" = true ]; then
        cloud_status="(solo local)"
    else
        cloud_status="+ ${RCLONE_REMOTE}"
    fi
    
    echo ""
    log_success "¡Proceso de backup completado!"
    echo ""
    
    # Enviar notificación a Telegram si está habilitado
    send_telegram "✅ <b>Backup Finanzas Pro</b>

📦 Archivo: <code>${backup_name}</code>
📊 Tamaño: ${backup_size}
☁️ Destino: ${cloud_status}
🕐 Fecha: $(date '+%Y-%m-%d %H:%M')"
}

main "$@"
