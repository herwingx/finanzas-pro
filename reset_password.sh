#!/bin/bash
# =============================================================================
# reset_password.sh - Utilidad para resetear contraseñas de usuarios
# =============================================================================
# 
# USO:
#   ./reset_password.sh <email> <nueva_contraseña>
#
# EJEMPLOS:
#   ./reset_password.sh user@example.com nuevaPassword123
#   ./reset_password.sh admin@finanzas.com MiClaveSegura!
#
# DESCRIPCIÓN:
#   Este script permite resetear la contraseña de un usuario directamente
#   en la base de datos. Útil cuando:
#   - El usuario olvidó su contraseña y no hay SMTP configurado
#   - Necesitas crear un usuario administrador inicial
#   - Debug y desarrollo
#
# REQUISITOS:
#   - Docker Compose ejecutándose (docker compose up)
#   - Acceso al container de backend y db
#
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

EMAIL="$1"
PASSWORD="$2"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo -e "${YELLOW}Uso: ./reset_password.sh <email> <nueva_contraseña>${NC}"
    echo ""
    echo "Ejemplos:"
    echo "  ./reset_password.sh user@example.com nuevaPassword123"
    echo "  ./reset_password.sh admin@finanzas.com MiClaveSegura!"
    exit 1
fi

# Obtener usuario de PostgreSQL del .env o usar default
POSTGRES_USER=${POSTGRES_USER:-finanzas}
POSTGRES_DB=${POSTGRES_DB:-finanzas_pro}

echo -e "${YELLOW}🔄 Reseteando contraseña para: $EMAIL${NC}"

# Verificar que los containers estén corriendo
if ! docker compose ps | grep -q "backend.*running"; then
    echo -e "${RED}❌ Error: El container del backend no está corriendo${NC}"
    echo "Ejecuta: docker compose up -d"
    exit 1
fi

# Generar hash bcrypt usando node
echo "   Generando hash de contraseña..."
HASH=$(docker compose exec -T backend node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('$PASSWORD', 10).then(hash => console.log(hash));
")

# Limpiar el hash (remover caracteres extra)
HASH=$(echo "$HASH" | tr -d '\n\r' | sed 's/\x1b\[[0-9;]*m//g')

# Actualizar la contraseña en la base de datos
echo "   Actualizando base de datos..."
RESULT=$(docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "UPDATE \"User\" SET password = '$HASH' WHERE email = '$EMAIL';" 2>&1)

if echo "$RESULT" | grep -q "UPDATE 1"; then
    echo ""
    echo -e "${GREEN}✅ ¡Contraseña reseteada exitosamente!${NC}"
    echo ""
    echo -e "   📧 Email: ${YELLOW}$EMAIL${NC}"
    echo -e "   🔑 Nueva contraseña: ${YELLOW}$PASSWORD${NC}"
    echo ""
    echo "El usuario puede iniciar sesión con estas credenciales."
elif echo "$RESULT" | grep -q "UPDATE 0"; then
    echo ""
    echo -e "${RED}❌ Error: No se encontró usuario con email: $EMAIL${NC}"
    echo "Verifica que el email sea correcto."
    exit 1
else
    echo ""
    echo -e "${RED}❌ Error al actualizar la contraseña:${NC}"
    echo "$RESULT"
    exit 1
fi
