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
# Configuración
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="finanzas-pro"

# Detectar modo Self-Hosted
if [[ "$*" == *"--self-hosted"* ]]; then
    COMPOSE_FILE="docker-compose.selfhosted.yml"
    echo -e "${YELLOW}[INFO] Modo Self-Hosted activado (usando $COMPOSE_FILE)${NC}"
fi
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

cmd_reset_password() {
    local email="$1"
    local pass="$2"
    
    # Modo interactivo si faltan argumentos
    if [[ -z "$email" ]]; then
        echo ""
        log_info "=== Resetear Contraseña ==="
        read -p "  📧 Email del usuario: " email
        read -s -p "  🔑 Nueva contraseña: " pass
        echo ""
    fi
    
    if [[ -z "$email" ]] || [[ -z "$pass" ]]; then
        log_error "Email y contraseña son requeridos"
        return 1
    fi
    
    # Exportar contexto de Docker Compose para el script hijo
    export COMPOSE_FILE="$COMPOSE_FILE"
    export COMPOSE_PROJECT_NAME="$PROJECT_NAME"
    
    if [ -f "./reset_password.sh" ]; then
        chmod +x ./reset_password.sh
        ./reset_password.sh "$email" "$pass"
    else
        log_error "No se encuentra reset_password.sh"
    fi
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
  ${GREEN}reset-pw${NC}  Resetea contraseña de usuario

EJEMPLOS:

  ./deploy.sh start     # Primera vez o después de parar
  ./deploy.sh update    # Después de hacer push a main
  ./deploy.sh logs      # Ver qué está pasando
  ./deploy.sh backup    # Antes de cambios importantes
  ./deploy.sh reset-pw  # Resetear contraseña interactivamente

MODO SELF-HOSTED (sin Cloudflare):
  ./deploy.sh start --self-hosted
"
}

# Main
check_docker
check_env

# Menú Interactivo Premium
show_menu() {
    clear
    echo -e "${BLUE}"
    echo "  ______ _                              _____           "
    echo " |  ____(_)                            |  __ \          "
    echo " | |__   _ _ __   __ _ _ __  ______ _  | |__) | __ ___  "
    echo " |  __| | | '_ \ / _\` | '_ \|_  / _\` | |  ___/ '__/ _ \ "
    echo " | |    | | | | | (_| | | | |/ / (_| | | |   | | | (_) |"
    echo " |_|    |_|_| |_|\__,_|_| |_/___\__,_| |_|   |_|  \___/ "
    echo -e "${NC}"
    echo -e "  🌍 ${GREEN}Production Deploy Manager${NC}"
    
    if [[ "$COMPOSE_FILE" == *"selfhosted"* ]]; then
        echo -e "  🔧 MODO: ${YELLOW}Self-Hosted (Direct Ports)${NC}"
    else
        echo -e "  ☁️  MODO: ${BLUE}Cloudflare Tunnel (Secure)${NC}"
    fi
    echo "=========================================================="
    echo ""
    echo -e "  ${GREEN}1)${NC} Iniciar servicios     ${YELLOW}(start)${NC}"
    echo -e "  ${GREEN}2)${NC} Detener servicios     ${YELLOW}(stop)${NC}"
    echo -e "  ${GREEN}3)${NC} Actualizar App        ${YELLOW}(update)${NC}"
    echo -e "  ${GREEN}4)${NC} Ver Estado            ${YELLOW}(status)${NC}"
    echo -e "  ${GREEN}5)${NC} Ver Logs              ${YELLOW}(logs)${NC}"
    echo -e "  ${GREEN}6)${NC} Backup Datos          ${YELLOW}(backup)${NC}"
    echo -e "  ${GREEN}7)${NC} Shell Backend         ${YELLOW}(shell)${NC}"
    echo -e "  ${GREEN}8)${NC} Shell Base Datos      ${YELLOW}(db)${NC}"
    echo -e "  ${GREEN}9)${NC} Reset Password        ${YELLOW}(reset-pw)${NC}"
    echo -e "  ${GREEN}0)${NC} Salir"
    echo ""
    echo "=========================================================="
    read -p "  👉 Selecciona una opción [0-9]: " option
    
    case $option in
        1) cmd_start ;;
        2) cmd_stop ;;
        3) cmd_update ;;
        4) cmd_status ;;
        5) cmd_logs ;;
        6) cmd_backup ;;
        7) cmd_shell ;;
        8) cmd_db ;;
        9) cmd_reset_password ;;
        *) echo "¡Hasta luego! 👋"; exit 0 ;;
    esac
}

# Main
check_docker
check_env

if [ $# -eq 0 ]; then
    show_menu
else
    case "${1}" in
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
        reset-pw|reset-password)
            shift
            cmd_reset_password "$@"
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            cmd_help
            ;;
    esac
fi
