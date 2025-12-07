#!/bin/bash

# Configuración
DOMAIN="controlfinanzas.duckdns.org"
EMAIL="herwingx@gmail.com"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== Iniciando configuración SSL para Finanzas Pro ===${NC}"

# Verificar si el usuario ha configurado el dominio
if grep -q "your-domain.duckdns.org" docker-compose.yml; then
    echo -e "${RED}Error: Primero debes configurar tu dominio en este script y en nginx.conf${NC}"
    exit 1
fi

# Leer dominio del .env si existe
if [ -f .env ]; then
    source .env
    if [ ! -z "$DUCKDNS_SUBDOMAIN" ]; then
        DOMAIN="${DUCKDNS_SUBDOMAIN}.duckdns.org"
        echo -e "Detectado dominio: ${DOMAIN}"
    fi
fi

echo "1. Deteniendo Nginx temporalmente para liberar el puerto 80..."
docker compose stop nginx

echo "2. Solicitando certificado SSL a Let's Encrypt..."
# Usamos la imagen oficial de certbot
docker run -it --rm \
    -p 80:80 \
    -v $(pwd)/ssl:/etc/letsencrypt/archive \
    -v $(pwd)/ssl-conf:/etc/letsencrypt \
    certbot/certbot certonly \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}3. ¡Certificado generado exitosamente!${NC}"
    
    echo "4. Preparando configuración de Nginx..."
    # Aquí podríamos descomentar automáticamente las líneas SSL en nginx.conf
    # Por seguridad, lo dejamos manual o creamos un archivo de bandera
    
    echo "5. Reiniciando Nginx..."
    docker compose start nginx
    
    echo -e "${GREEN}=== Proceso completado ===${NC}"
    echo "Los certificados están en ./ssl/$DOMAIN/"
    echo "Asegúrate de actualizar nginx/nginx.conf para usar estos certificados."
else
    echo -e "${RED}Error al generar certificados. Asegúrate de que los puertos 80/443 están abiertos en tu router.${NC}"
    docker compose start nginx
fi
