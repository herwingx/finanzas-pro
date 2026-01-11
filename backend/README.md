# ⚙️ Finanzas Pro - Backend

> **API REST robusta y segura** construida con Node.js, Express y PostgreSQL.

Esta carpeta contiene la lógica del servidor, modelos de datos y endpoints de la API.

## 🛠️ Stack Tecnológico

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express 5](https://expressjs.com/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Base de Datos**: [PostgreSQL 16](https://www.postgresql.org/)
- **Seguridad**: JWT, Bcrypt, Helmet, Rate Limit

---

## 🔐 Variables de Entorno

> 📘 **Documentación completa en [README principal](../README.md#-variables-de-entorno)**

### Configuración Rápida

```bash
# Copiar plantilla (valores de desarrollo listos para usar)
cp .env.example .env
```

Para **producción**, consulta la sección "Variables Backend" en el README principal.

---

## 🚀 Desarrollo Local

### 1. Configuración de Entorno

Asegúrate de tener el archivo `.env` configurado:

```bash
cp .env.example .env
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Base de Datos

Necesitas PostgreSQL corriendo. Usa el script de desarrollo desde la raíz:

```bash
# Desde la raíz del proyecto
./dev.sh start
```

O manualmente:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Migraciones

Sincroniza el esquema de Prisma con la base de datos:

```bash
npx prisma migrate dev
```

### 5. Iniciar Servidor

```bash
npm run dev
```

El servidor iniciará en `http://localhost:4000`.

---

## 🔧 Comandos Útiles

| Comando                     | Descripción                                        |
| :-------------------------- | :------------------------------------------------- |
| `npm run dev`               | Inicia servidor con hot-reload (desarrollo).       |
| `npm run build`             | Compila TypeScript a JavaScript (carpeta `dist/`). |
| `npm start`                 | Inicia el servidor compilado (producción).         |
| `npx prisma studio`         | Abre una interfaz web para ver/editar la BD.       |
| `npx prisma generate`       | Regenera el cliente de Prisma.                     |
| `npx prisma migrate dev`    | Crea y aplica migración (desarrollo).              |
| `npx prisma migrate deploy` | Aplica migraciones existentes (producción).        |

---

## 📂 Estructura

```
src/
├── config/       # Configuración de env, db, cors
├── controllers/  # Lógica de los endpoints (Req/Res)
├── middlewares/  # Autenticación, validación, logs
├── routes/       # Definición de rutas de la API
├── services/     # Lógica de negocio (reutilizable)
├── utils/        # Helpers y utilidades
└── server.ts     # Punto de entrada
```

---

## 🔗 Ver También

- [📖 README Principal](../README.md) - Documentación completa del proyecto
- [🔐 Variables de Entorno](../README.md#-variables-de-entorno) - Configuración detallada
- [🐳 Docker Compose](../README.md#-opciones-de-docker-compose) - Opciones de despliegue
