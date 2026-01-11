#!/bin/bash
# =============================================================================
# dev.sh - Script para desarrollo local de FinanzasPro
# =============================================================================
# USO: ./dev.sh [comando]
#
# FLUJO DE DESARROLLO:
#   1. ./dev.sh setup     # Primera vez: configura todo
#   2. ./dev.sh start     # Inicia DB + Backend + Frontend
#   3. ./dev.sh stop      # Detiene todo
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[DEV]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# COMANDOS
# =============================================================================

cmd_setup() {
    log_info "Configurando entorno de desarrollo..."
    
    # 1. Copiar .env raíz si no existe
    if [ ! -f ".env" ]; then
        log_info "Creando .env desde .env.example..."
        cp .env.example .env
        log_success ".env creado"
    else
        log_warning ".env ya existe, no se sobrescribe"
    fi
    
    # 2. Copiar .env a backend
    if [ ! -f "backend/.env" ]; then
        log_info "Creando backend/.env desde backend/.env.example..."
        cp backend/.env.example backend/.env
        log_success "backend/.env creado"
    else
        log_warning "backend/.env ya existe, no se sobrescribe"
    fi
    
    # 3. Copiar .env a frontend
    if [ ! -f "frontend/.env" ]; then
        log_info "Creando frontend/.env desde frontend/.env.example..."
        cp frontend/.env.example frontend/.env
        log_success "frontend/.env creado"
    else
        log_warning "frontend/.env ya existe, no se sobrescribe"
    fi
    
    # 4. Instalar dependencias backend
    log_info "Instalando dependencias del backend..."
    (cd backend && npm install)
    log_success "Dependencias backend instaladas"
    
    # 4. Instalar dependencias frontend
    log_info "Instalando dependencias del frontend..."
    (cd frontend && npm install)
    log_success "Dependencias frontend instaladas"
    
    # 5. Iniciar base de datos
    log_info "Iniciando PostgreSQL..."
    docker compose -f docker-compose.dev.yml up -d
    sleep 3
    log_success "PostgreSQL iniciado en puerto 5432"
    
    # 6. Generar cliente Prisma
    log_info "Generando cliente Prisma..."
    (cd backend && npx prisma generate)
    log_success "Cliente Prisma generado"
    
    # 7. Ejecutar migraciones
    log_info "Ejecutando migraciones..."
    (cd backend && npx prisma migrate dev)
    log_success "Migraciones aplicadas"
    
    echo ""
    log_success "=== SETUP COMPLETADO ==="
    echo ""
    echo "Ahora puedes ejecutar: ./dev.sh start"
    echo ""
}

cmd_start() {
    log_info "Iniciando entorno de desarrollo..."
    
    # 1. Iniciar DB si no está corriendo
    if ! docker ps | grep -q finanzas-pro-db-dev; then
        log_info "Iniciando PostgreSQL..."
        docker compose -f docker-compose.dev.yml up -d
        sleep 2
    else
        log_info "PostgreSQL ya está corriendo"
    fi
    
    echo ""
    log_success "=== PostgreSQL listo en localhost:5432 ==="
    echo ""
    echo "Ahora inicia backend y frontend en terminales separadas:"
    echo ""
    echo "  Terminal 1 (Backend):"
    echo "    cd backend && npm run dev"
    echo ""
    echo "  Terminal 2 (Frontend):"
    echo "    cd frontend && npm run dev"
    echo ""
    echo "URLs:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:4000"
    echo "  API:      http://localhost:4000/api"
    echo ""
}

cmd_stop() {
    log_info "Deteniendo entorno de desarrollo..."
    docker compose -f docker-compose.dev.yml down
    log_success "PostgreSQL detenido"
}

cmd_db_reset() {
    log_warning "Esto eliminará TODOS los datos de desarrollo"
    read -p "¿Continuar? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        log_info "Reseteando base de datos..."
        docker compose -f docker-compose.dev.yml down -v
        docker compose -f docker-compose.dev.yml up -d
        sleep 3
        (cd backend && npx prisma migrate dev)
        log_success "Base de datos reseteada"
    else
        log_info "Cancelado"
    fi
}

cmd_migrate() {
    log_info "Ejecutando migraciones..."
    (cd backend && npx prisma migrate dev)
    log_success "Migraciones aplicadas"
}

cmd_studio() {
    log_info "Abriendo Prisma Studio..."
    cd backend && npx prisma studio
}

cmd_help() {
    echo "
╔═══════════════════════════════════════════════════════════════════╗
║              🛠️  FinanzasPro - Desarrollo Local                    ║
╚═══════════════════════════════════════════════════════════════════╝

USO: ./dev.sh [comando]

COMANDOS:

  ${GREEN}setup${NC}      Primera vez: instala deps, configura DB, corre migraciones
  ${GREEN}start${NC}      Inicia PostgreSQL y muestra instrucciones
  ${GREEN}stop${NC}       Detiene PostgreSQL
  ${GREEN}migrate${NC}    Ejecuta migraciones de Prisma
  ${GREEN}studio${NC}     Abre Prisma Studio (UI para ver la BD)
  ${GREEN}db-reset${NC}   Elimina y recrea la BD (¡BORRA DATOS!)

FLUJO DE TRABAJO:

  1. Primera vez:     ./dev.sh setup
  2. Desarrollo:      ./dev.sh start
  3. Nuevos modelos:  ./dev.sh migrate
  4. Terminar:        ./dev.sh stop
"
}

# =============================================================================
# MAIN
# =============================================================================

# Verificar dependencias
check_deps() {
    local missing=0
    for cmd in docker node npm; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd no está instalado"
            missing=1
        fi
    done
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# Menú Interactivo
show_menu() {
    echo ""
    echo -e "${BLUE}=== FinanzasPro Dev Tool ===${NC}"
    echo ""
    echo "1) 🚀 Iniciar entorno (start)"
    echo "2) 🛑 Detener entorno (stop)"
    echo "3) 🛠️  Configuración inicial (setup)"
    echo "4) 🔄 Ejecutar migraciones (migrate)"
    echo "5) 📊 Abrir Prisma Studio (studio)"
    echo "6) ⚠️  Resetear Base de Datos (db-reset)"
    echo "7) ❌ Salir"
    echo ""
    read -p "Selecciona una opción [1-7]: " option
    
    case $option in
        1) cmd_start ;;
        2) cmd_stop ;;
        3) cmd_setup ;;
        4) cmd_migrate ;;
        5) cmd_studio ;;
        6) cmd_db_reset ;;
        *) exit 0 ;;
    esac
}

# =============================================================================
# MAIN
# =============================================================================

check_deps

if [ $# -eq 0 ]; then
    show_menu
else
    case "${1}" in
        setup)    cmd_setup ;;
        start)    cmd_start ;;
        stop)     cmd_stop ;;
        migrate)  cmd_migrate ;;
        studio)   cmd_studio ;;
        db-reset) cmd_db_reset ;;
        help|--help|-h) cmd_help ;;
        *)        cmd_help ;;
    esac
fi
