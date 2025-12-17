# 🔄 Flujo de Trabajo y Despliegue

Esta guía describe cómo desarrollar nuevas funcionalidades y desplegarlas en producción de forma segura, minimizando el impacto en los usuarios activos.

---

## 🛠️ Desarrollo Local

Antes de tocar nada en producción, desarrolla y prueba en tu máquina.

### 1. Preparar el entorno
Asegúrate de que no estás corriendo los contenedores de producción (para evitar conflictos de puertos si no usas el modo Cloudflare).

```bash
# Detener producción momentáneamente si usas puertos 3000/4000
./deploy.sh stop 

# O si usas Cloudflare (que no expone puertos), puedes correr dev paralelo:
# (Solo asegúrate de que el .env apuntan a DB local o dockerizada de dev)
```

### 2. Iniciar modo desarrollo
Esto usa `vite` y `nodemon` para Hot Reload (cambios en tiempo real).

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Accede a:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

### 3. Hacer cambios
1.  Crea una rama para tu nueva funcionalidad:
    ```bash
    git checkout -b feature/nueva-cosa
    ```
2.  Desarrolla...
3.  Si modificas la base de datos (`prisma/schema.prisma`):
    ```bash
    cd backend
    npx prisma migrate dev --name nombre_cambio
    ```
4.  Prueba que todo funcione.

---

## 🚀 Despliegue a Producción

Una vez que tus cambios están en la rama `main` de GitHub, es hora de actualizar el servidor.

> ⚠️ **Nota:** El proceso de despliegue con Docker Compose implica un breve tiempo de inactividad (downtime) de unos segundos mientras los contenedores se recrean. Intenta hacerlo en horarios de bajo tráfico.

### Paso 1: Backup Preventivo (¡Crucial!)
Antes de actualizar, asegura los datos actuales.

```bash
./deploy.sh backup
```
*Esto crea un archivo `.sql.gz` en `./backups/`.*

### Paso 2: Actualizar Código
Trae los últimos cambios de GitHub y reconstruye los contenedores.

```bash
./deploy.sh update
```
*Este comando hace automáticamente:*
1. `git pull`
2. `docker compose up -d --build` (Recrea contenedores)
3. `prisma migrate deploy` (Aplica cambios de DB si los hay)

### Paso 3: Verificar Salud
Asegúrate de que todo volvió a levantar correctamente.

```bash
./deploy.sh status
./deploy.sh logs
```

---

## 🚨 Plan de Recuperación (Rollback)

Si algo sale mal después del despliegue (ej. la app no carga, errores 500), sigue estos pasos:

### Caso A: Error de Código (Bugs)
Si el problema es un bug en el código nuevo:

1.  Revierte el cambio en git localmente:
    ```bash
    git revert HEAD  # Crea un commit que deshace lo anterior
    git push origin main
    ```
2.  Vuelve a desplegar:
    ```bash
    ./deploy.sh update
    ```

### Caso B: Base de Datos Corrupta
Si la base de datos se rompió o perdiste datos:

1.  Detén los servicios:
    ```bash
    ./deploy.sh stop
    ```
2.  Restaura el último backup:
    *(Asumiendo que estás dentro del contenedor de DB o tienes `psql` instalado)*
    ```bash
    # Descomprimir backup
    gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz > restaurar.sql
    
    # Borrar y recrear DB (PELIGROSO - Solo si es necesario)
    docker compose exec -T db psql -U finanzas postgres -c "DROP DATABASE finanzas_pro;"
    docker compose exec -T db psql -U finanzas postgres -c "CREATE DATABASE finanzas_pro;"
    
    # Importar
    cat restaurar.sql | docker compose exec -T db psql -U finanzas finanzas_pro
    ```
3.  Reinicia:
    ```bash
    ./deploy.sh start
    ```

---

## 📋 Resumen de Comandos

| Acción | Comando |
|--------|---------|
| **Iniciar todo** | `./deploy.sh start` |
| **Actualizar (Deploy)** | `./deploy.sh update` |
| **Ver logs** | `./deploy.sh logs` |
| **Hacer Backup** | `./deploy.sh backup` |
| **Estatus** | `./deploy.sh status` |
