# 🚀 Guía de CI/CD - Despliegue Automático

> **Automatización Total** — Configura pipelines robustos para desplegar cambios sin esfuerzo.

Esta guía explica cómo configurar **despliegue automático** para Finanzas Pro. Una vez configurado, cada push a la rama `main` desplegará automáticamente los cambios en tu servidor.

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Requisitos Previos](#-requisitos-previos)
- [Opción 1: GitHub Actions + SSH](#-opción-1-github-actions--ssh-recomendada)
- [Opción 2: GitHub Actions + Cloudflare Tunnel SSH](#-opción-2-github-actions--cloudflare-tunnel-ssh)
- [Opción 3: Watchtower (Auto-pull de imágenes)](#-opción-3-watchtower)
- [Verificación y Troubleshooting](#-verificación-y-troubleshooting)

---

## 🎯 Visión General

### Flujo de CI/CD

```
Tu PC (desarrollo)          GitHub                    Tu Servidor
      │                        │                           │
      │  1. git push main      │                           │
      ├───────────────────────►│                           │
      │                        │  2. GitHub Actions        │
      │                        │     se activa             │
      │                        ├──────────────────────────►│
      │                        │  3. SSH al servidor       │
      │                        │                           │ 4. ./deploy.sh update
      │                        │                           │    - git pull
      │                        │                           │    - docker rebuild
      │                        │                           │    - prisma migrate
      │                        │◄──────────────────────────┤
      │                        │  5. Notificación ✅       │
      │◄───────────────────────┤                           │
```

### Beneficios

| Antes (manual)                       | Después (CI/CD)              |
| :----------------------------------- | :--------------------------- |
| SSH al server → `./deploy.sh update` | Solo `git push`              |
| ~2-5 min de tu tiempo                | 0 segundos (automático)      |
| Puedes olvidar ejecutar migraciones  | Todo automatizado            |
| No sabes qué versión está en prod    | Cada deploy queda registrado |

### Nombres Descriptivos de Workflows

Usamos `run-name` para que los deploys aparezcan con títulos informativos en la UI de GitHub Actions:

```yaml
name: 🚀 Deploy to Production

run-name: "🚀 Deploy por ${{ github.actor }} - ${{ github.event_name == 'workflow_dispatch' && '🔧 Manual' || github.event.head_commit.message }}"
```

**Ejemplos de títulos resultantes:**

| Trigger          | Título en GitHub Actions                                |
| :--------------- | :------------------------------------------------------ |
| Push a main      | `🚀 Deploy por herwingx - feat(auth): implementar login` |
| Ejecución manual | `🚀 Deploy por herwingx - 🔧 Manual`                      |

**Variables útiles para run-name:**

| Variable                           | Descripción                     | Ejemplo                     |
| :--------------------------------- | :------------------------------ | :-------------------------- |
| `github.actor`                     | Usuario que disparó el workflow | `herwingx`                  |
| `github.ref_name`                  | Nombre de la rama/tag           | `main`, `feat/login`        |
| `github.event_name`                | Tipo de evento                  | `push`, `workflow_dispatch` |
| `github.event.head_commit.message` | Mensaje del commit              | `feat(auth): login`         |

---

## 📦 Requisitos Previos

- ✅ Servidor funcionando con `docker-compose.yml`
- ✅ Script `deploy.sh` funcional
- ✅ Repositorio en GitHub
- ✅ Acceso SSH a tu servidor (método 1) o Cloudflare Tunnel (método 2)

---

## 🔧 Opción 1: GitHub Actions + SSH (Recomendada)

Esta opción requiere que tu servidor sea accesible por SSH desde Internet (puerto 22 abierto o redirigido).

### Paso 1: Crear par de llaves SSH dedicado

En tu **máquina local** (no en el servidor):

```bash
# Generar llave específica para CI/CD
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/finanzas_deploy

# Esto crea:
# ~/.ssh/finanzas_deploy      (llave privada - para GitHub)
# ~/.ssh/finanzas_deploy.pub  (llave pública - para el servidor)
```

### Paso 2: Autorizar la llave en el servidor

```bash
# Copiar la llave pública al servidor
ssh-copy-id -i ~/.ssh/finanzas_deploy.pub usuario@tu-servidor

# O manualmente:
cat ~/.ssh/finanzas_deploy.pub | ssh usuario@tu-servidor "cat >> ~/.ssh/authorized_keys"
```

### Paso 3: Configurar Secrets en GitHub

Ve a tu repositorio en GitHub → **Settings** → **Secrets and variables** → **Actions**

Agrega estos secrets:

| Secret Name       | Valor                                 | Descripción                       |
| :---------------- | :------------------------------------ | :-------------------------------- |
| `SSH_HOST`        | `tu-servidor.com` o `IP`              | Dirección del servidor            |
| `SSH_USER`        | `usuario`                             | Usuario SSH                       |
| `SSH_PRIVATE_KEY` | Contenido de `~/.ssh/finanzas_deploy` | Llave privada completa            |
| `SSH_PORT`        | `22`                                  | Puerto SSH (opcional, default 22) |
| `DEPLOY_PATH`     | `/opt/apps/finanzas-pro`              | Ruta de la aplicación             |

> ⚠️ **Importante**: Copia TODO el contenido de la llave privada, incluyendo las líneas `-----BEGIN` y `-----END`.

### Paso 4: Crear el Workflow

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: 🚀 Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch: # Permite ejecución manual desde GitHub

jobs:
  deploy:
    name: Deploy to Server
    runs-on: ubuntu-latest
    
    steps:
      - name: 📦 Checkout code
        uses: actions/checkout@v4
      
      - name: 🔐 Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
      
      - name: 🔧 Add server to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -p ${{ secrets.SSH_PORT || 22 }} -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts
      
      - name: 🚀 Deploy
        run: |
          ssh -p ${{ secrets.SSH_PORT || 22 }} ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            cd ${{ secrets.DEPLOY_PATH }}
            ./deploy.sh update
          EOF
      
      - name: ✅ Notify Success
        if: success()
        run: echo "✅ Deployment successful!"
      
      - name: ❌ Notify Failure
        if: failure()
        run: echo "❌ Deployment failed!"
```

### Paso 5: Probar

```bash
# Hacer cualquier cambio
git add .
git commit -m "ci: agregar despliegue automático"
git push origin main

# Ver el workflow en GitHub → Actions
```

---

## 🔒 Opción 2: GitHub Actions + Cloudflare Tunnel SSH

Si usas **Cloudflare Tunnels** y no quieres exponer el puerto SSH, esta opción permite conectar a tu servidor de forma segura a través de Cloudflare Access.

### Paso 1: Agregar ruta SSH al túnel

1. Ve a [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. En el menú lateral: **Redes** → **Túneles**
3. Haz clic en tu túnel existente (ej: `finanzaspro-tunnel`)
4. Pestaña **"Rutas de aplicación publicada"**
5. Clic en **"+ Agregar ruta de aplicación publicada"**
6. Configura:
   
   | Campo          | Valor              |
   | :------------- | :----------------- |
   | **Subdominio** | `deploy` (o `ssh`) |
   | **Dominio**    | `tudominio.com`    |
   | **Tipo**       | `SSH`              |
   | **URL**        | Ver nota abajo     |

   > ⚠️ **Importante**: Si tu túnel cloudflared corre en **Docker**, usa la IP del gateway de Docker en lugar de `localhost`:
   > ```bash
   > # En el servidor, obtener la IP del gateway
   > docker network inspect bridge | grep Gateway
   > # Típicamente: 172.17.0.1
   > ```
   > Entonces la URL sería: `172.17.0.1:22`
   >
   > Si cloudflared corre directamente en el host (no en Docker), usa: `localhost:22`

7. Guarda la ruta

### Paso 2: Crear Application en Access

1. En el menú lateral: **Controles de Access** → **Aplicaciones**
2. Clic en **"Agregar una aplicación"**
3. Selecciona tipo: **"Autoalojado"** (Self-hosted)
4. Configura **Información básica**:
   
   | Campo                     | Valor        |
   | :------------------------ | :----------- |
   | **Nombre de aplicación**  | `SSH Deploy` |
   | **Duración de la sesión** | `24 hours`   |

5. Clic en **"+ Agregar nombre de host público"**:
   
   | Campo          | Valor           |
   | :------------- | :-------------- |
   | **Subdominio** | `deploy`        |
   | **Dominio**    | `tudominio.com` |

6. Continúa al siguiente paso (políticas)

### Paso 3: Crear Service Token

> ⚠️ **Importante**: Debes crear el token ANTES de configurar la política.

1. En el menú lateral: **Controles de Access** → **Autenticación de servicio** → **Tokens de servicio**
2. Clic en **"Crear token de servicio"**
3. Configura:
   
   | Campo        | Valor                    |
   | :----------- | :----------------------- |
   | **Nombre**   | `github-actions-deploy`  |
   | **Duración** | `Non-expiring` (o 1 año) |

4. **¡IMPORTANTE!** Copia y guarda estos valores (solo se muestran una vez):
   - `CF-Access-Client-Id`: ejemplo `fd97ff505...access`
   - `CF-Access-Client-Secret`: ejemplo `e05845f929...`

### Paso 4: Configurar política en la Application

1. Regresa a **Controles de Access** → **Aplicaciones** → **SSH Deploy** → Editar
2. Clic en **"Agregar una política"**
3. Configura:
   
   | Campo                     | Valor                                                          |
   | :------------------------ | :------------------------------------------------------------- |
   | **Nombre de política**    | `GitHub Actions Deploy`                                        |
   | **Acción**                | `Service Auth`                                                 |
   | **Duración de la sesión** | `Igual que el tiempo de expiración de la sesión de aplicación` |

4. En **"Agregar reglas"** → sección **"Incluir"**:
   
   | Campo        | Valor                              |
   | :----------- | :--------------------------------- |
   | **Selector** | `Service Token`                    |
   | **Valor**    | Selecciona `github-actions-deploy` |

5. Guarda la política
6. Continúa hasta **"Ajustes avanzados"** → clic en **"Guardar"** (sin cambiar nada)

### Paso 5: Generar llave SSH en el servidor

Conéctate a tu servidor y ejecuta:

```bash
# Generar llave SSH para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""

# Autorizar la llave
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Mostrar la llave privada (la necesitas para GitHub)
cat ~/.ssh/github_deploy
```

Copia toda la salida del último comando (incluyendo `-----BEGIN` y `-----END`).

### Paso 6: Configurar Secrets en GitHub

Ve a tu repositorio: **Settings** → **Security** → **Secrets and variables** → **Actions**

Crea estos 6 secrets (uno por uno con "New repository secret"):

| Secret Name               | Valor                   | Ejemplo                  |
| :------------------------ | :---------------------- | :----------------------- |
| `SSH_HOST`                | Subdominio del túnel    | `deploy.tudominio.com`   |
| `SSH_USER`                | Usuario del servidor    | `root` o `tu_usuario`    |
| `SSH_PRIVATE_KEY`         | Llave privada completa  | `-----BEGIN OPENSSH...`  |
| `CF_ACCESS_CLIENT_ID`     | Client ID del token     | `fd97ff505...access`     |
| `CF_ACCESS_CLIENT_SECRET` | Client Secret del token | `e05845f929...`          |
| `DEPLOY_PATH`             | Ruta de la aplicación   | `/opt/apps/finanzas-pro` |

### Paso 7: Crear el Workflow

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: 🚀 Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch: # Permite ejecución manual desde GitHub

jobs:
  deploy:
    name: Deploy to Server
    runs-on: ubuntu-latest
    
    steps:
      - name: 📦 Checkout code
        uses: actions/checkout@v4
      
      - name: 🔐 Install cloudflared
        run: |
          curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
          chmod +x cloudflared
          sudo mv cloudflared /usr/local/bin/
      
      - name: � Setup SSH Key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
      
      - name: 🔧 Configure SSH for Cloudflare Access
        run: |
          cat >> ~/.ssh/config << EOF
          Host ${{ secrets.SSH_HOST }}
            ProxyCommand cloudflared access ssh --hostname %h --id ${{ secrets.CF_ACCESS_CLIENT_ID }} --secret ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
            User ${{ secrets.SSH_USER }}
            IdentityFile ~/.ssh/deploy_key
            StrictHostKeyChecking no
            UserKnownHostsFile /dev/null
          EOF
          chmod 600 ~/.ssh/config
      
      - name: 🚀 Deploy
        run: |
          ssh ${{ secrets.SSH_HOST }} << 'ENDSSH'
            cd ${{ secrets.DEPLOY_PATH }}
            echo "📍 Directorio: $(pwd)"
            echo "🔄 Ejecutando deploy..."
            ./deploy.sh update
            echo "✅ Deploy completado!"
          ENDSSH
      
      - name: ✅ Success
        if: success()
        run: echo "🎉 Deployment successful!"
      
      - name: ❌ Failure
        if: failure()
        run: echo "💥 Deployment failed! Check the logs above."
```

### Paso 8: Probar el workflow

```bash
git add .
git commit -m "ci: agregar despliegue automático con Cloudflare Tunnel"
git push origin main
```

Ve a **GitHub** → **Actions** para ver el workflow ejecutándose.

### Paso 9: Configurar Deploy Key (para git pull en el servidor)

El servidor necesita acceso al repositorio para hacer `git pull`. Si usas SSH forwarding localmente, GitHub Actions no lo tendrá.

**En tu servidor:**

```bash
# Generar llave para acceso a GitHub
ssh-keygen -t ed25519 -C "finanzas-pro-server" -f ~/.ssh/github_repo_key -N ""

# Mostrar la llave pública
cat ~/.ssh/github_repo_key.pub
```

**En GitHub:**

1. Ve al repositorio → **Settings** → **Deploy keys**
2. Clic en **"Add deploy key"**
3. Title: `Finanzas Pro Server`
4. Key: (pegar la llave pública)
5. Clic en **"Add key"**

**De vuelta en el servidor:**

```bash
# Configurar git para usar esta llave
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_repo_key
    IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

# Probar la conexión
ssh -T git@github.com
# Debería decir: "Hi herwingx/finanzas-pro! You've successfully authenticated..."
```

---

## 🐳 Opción 3: Watchtower

Watchtower es un contenedor que monitorea tus imágenes Docker y las actualiza automáticamente cuando hay cambios en el registry.

### Requisitos

- Publicar imágenes a Docker Hub o GitHub Container Registry (GHCR)

### Paso 1: Agregar Watchtower al docker-compose

```yaml
# Agregar a docker-compose.yml
services:
  # ... tus servicios existentes ...
  
  watchtower:
    image: containrrr/watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=300  # Revisar cada 5 minutos
      - WATCHTOWER_INCLUDE_STOPPED=true
    command: --include-restarting
```

### Paso 2: Configurar GitHub Actions para publicar imágenes

```yaml
name: Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:latest
      
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest
```

> ⚠️ **Nota**: Esta opción NO ejecuta migraciones automáticamente. Deberás manejarlas por separado.

---

## ✅ Verificación y Troubleshooting

### Verificar que el workflow funciona

1. Ve a tu repo en GitHub → **Actions**
2. Deberías ver el workflow ejecutándose
3. Haz clic para ver los logs de cada paso

### Problemas Comunes

#### "Permission denied (publickey)"

```bash
# Verificar que la llave está autorizada en el servidor
ssh -i ~/.ssh/finanzas_deploy usuario@servidor

# Si falla, revisar:
cat ~/.ssh/authorized_keys  # en el servidor
```

#### "Host key verification failed"

El paso `ssh-keyscan` debería manejar esto. Si persiste:

```bash
# Obtener la fingerprint del servidor
ssh-keyscan -H tu-servidor.com
```

#### El deploy se ejecuta pero no hay cambios

Verifica que `deploy.sh update` funciona manualmente:

```bash
ssh usuario@servidor
cd /ruta/a/finanzas-pro
./deploy.sh update
```

### Logs útiles

```bash
# En el servidor, ver logs del deploy
cd /opt/apps/finanzas-pro
./deploy.sh logs

# Ver historial de deployments en GitHub
# GitHub → Repo → Actions → Historial de workflows
```

---

## 🔐 Seguridad

### Buenas Prácticas

1. **Llave dedicada**: Usa una llave SSH exclusiva para CI/CD
2. **Permisos mínimos**: El usuario SSH solo necesita acceso a la carpeta del proyecto
3. **Secrets seguros**: Nunca commitees secrets al repositorio
4. **Branch protection**: Configura reglas para proteger `main`

### Configurar Branch Protection

1. GitHub → Settings → Branches
2. Add rule para `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Restrict who can push

---

## 📊 Monitoreo (Opcional)

### Notificaciones a Discord/Slack

Agrega este paso al workflow:

```yaml
- name: 📢 Notify Discord
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Deploy Finanzas Pro"
    description: "Commit: ${{ github.event.head_commit.message }}"
```

### Badge en README

Agrega esto a tu README.md:

```markdown
![Deploy Status](https://github.com/TU_USUARIO/finanzas-pro/actions/workflows/deploy.yml/badge.svg)
```

---

## 🎯 Resumen

| Opción                | Pros                    | Contras                    | Recomendado para               |
| :-------------------- | :---------------------- | :------------------------- | :----------------------------- |
| **SSH Directo**       | Simple, usa `deploy.sh` | Requiere puerto 22 abierto | VPS, servidores con IP pública |
| **Cloudflare Tunnel** | Seguro, sin puertos     | Más configuración          | Home Lab, NAT                  |
| **Watchtower**        | Zero-touch              | No ejecuta migraciones     | Imágenes pre-built             |

**Recomendación**: Para Home Labs con Cloudflare Tunnels, usa la **Opción 2**. Para VPS con IP pública, usa la **Opción 1**.
