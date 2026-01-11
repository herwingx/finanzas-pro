#!/bin/bash
# =============================================================================
# deploy.sh - Script de despliegue para FinanzasPro
# =============================================================================
# USO: ./deploy.sh [comando]
#
# Comandos:
#   start     - Inicia todos los servicios
#   stop      - Detiene todos los servicios
#   restart   - Reinicia todos los servicios
#   update    - Actualiza código y reinicia
#   logs      - Muestra logs en tiempo real
#   status    - Muestra estado de los servicios
#   backup    - Crea backup de la base de datos
#   migrate   - Ejecuta migraciones de Prisma
#   shell     - Abre shell en el backend
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="finanzas-pro"
BACKUP_DIR="./backups"
POSTGRES_USER="${POSTGRES_USER:-finanzas}"
POSTGRES_DB="${POSTGRES_DB:-finanzas_pro}"

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose plugin no está instalado"
        exit 1
    fi
}

# Verificar variables de entorno
check_env() {
    if [ ! -f ".env" ]; then
        log_warning "No se encontró archivo .env"
        log_info "Copia .env.example y configura los valores para producción:"
        log_info "  cp .env.example .env && nano .env"
        exit 1
    fi
    
    # Cargar variables de entorno
    export $(cat .env | grep -v '^#' | xargs)
}

# Comandos principales
cmd_start() {
    log_info "Iniciando servicios..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
    log_success "Servicios iniciados"
    cmd_status
}

cmd_stop() {
    log_info "Deteniendo servicios..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME down
    log_success "Servicios detenidos"
}

cmd_restart() {
    log_info "Reiniciando servicios..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
    log_success "Servicios reiniciados"
}

cmd_update() {
    log_info "Actualizando aplicación..."
    
    # Pull cambios de git
    log_info "Obteniendo cambios de Git..."
    git pull origin main
    
    # Rebuild y restart
    log_info "Reconstruyendo contenedores..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d --build
    
    # Ejecutar migraciones
    cmd_migrate
    
    log_success "Aplicación actualizada"
    cmd_status
}

cmd_logs() {
    log_info "Mostrando logs (Ctrl+C para salir)..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
}

cmd_status() {
    log_info "Estado de los servicios:"
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
    
    echo ""
    log_info "Verificando conectividad del tunnel..."
    
    # Verificar si cloudflared está conectado
    if docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T cloudflared cloudflared tunnel info 2>/dev/null; then
        log_success "Tunnel conectado"
    else
        log_warning "No se pudo verificar estado del tunnel"
    fi
}

cmd_backup() {
    log_info "Creando backup de la base de datos..."
    
    mkdir -p $BACKUP_DIR
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
    
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T db \
        pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"
    
    # Comprimir
    gzip "$BACKUP_FILE"
    
    log_success "Backup creado: ${BACKUP_FILE}.gz"
    
    # Mostrar backups existentes
    log_info "Backups disponibles:"
    ls -lh $BACKUP_DIR/*.gz 2>/dev/null || echo "  (ninguno)"
    
    # Limpiar backups viejos (más de 30 días)
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
}

cmd_migrate() {
    log_info "Ejecutando migraciones de Prisma..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T backend \
        npx prisma migrate deploy
    log_success "Migraciones completadas"
}

cmd_shell() {
    log_info "Abriendo shell en el backend..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec backend sh
}

cmd_db() {
    log_info "Conectando a PostgreSQL..."
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec db \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
}

cmd_help() {
    echo "
╔═══════════════════════════════════════════════════════════════════╗
║                   🚀 FinanzasPro Deploy Script                     ║
╚═══════════════════════════════════════════════════════════════════╝

USO: ./deploy.sh [comando]

COMANDOS DISPONIBLES:

  ${GREEN}start${NC}     Inicia todos los servicios
  ${GREEN}stop${NC}      Detiene todos los servicios
  ${GREEN}restart${NC}   Reinicia todos los servicios
  ${GREEN}update${NC}    Actualiza código desde Git y reinicia
  ${GREEN}logs${NC}      Muestra logs en tiempo real
  ${GREEN}status${NC}    Muestra estado de los servicios
  ${GREEN}backup${NC}    Crea backup de la base de datos
  ${GREEN}migrate${NC}   Ejecuta migraciones de Prisma
  ${GREEN}shell${NC}     Abre shell en el backend
  ${GREEN}db${NC}        Conecta a PostgreSQL

EJEMPLOS:

  ./deploy.sh start     # Primera vez o después de parar
  ./deploy.sh update    # Después de hacer push a main
  ./deploy.sh logs      # Ver qué está pasando
  ./deploy.sh backup    # Antes de cambios importantes
"
}

# Main
check_docker
check_env

case "${1:-help}" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    update)
        cmd_update
        ;;
    logs)
        cmd_logs
        ;;
    status)
        cmd_status
        ;;
    backup)
        cmd_backup
        ;;
    migrate)
        cmd_migrate
        ;;
    shell)
        cmd_shell
        ;;
    db)
        cmd_db
        ;;
    help|--help|-h|*)
        cmd_help
        ;;
esac
