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

## 🚀 Desarrollo Local

### 1. Configuración de Entorno

Asegúrate de tener el archivo `.env` configurado (ver README principal).

```bash
cp .env.example .env
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Base de Datos (Docker)

Necesitas una instancia de PostgreSQL corriendo. Puedes usar Docker:

```bash
docker run -d --name finanzas-db \
  -e POSTGRES_USER=finanzas \
  -e POSTGRES_PASSWORD=tu_password \
  -e POSTGRES_DB=finanzas_pro \
  -p 5432:5432 \
  postgres:16-alpine
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

| Comando | Descripción |
| :--- | :--- |
| `npm run build` | Compila TypeScript a JavaScript (carpeta `dist/`). |
| `npm start` | Inicia el servidor compilado (producción). |
| `npx prisma studio` | Abre una interfaz web para ver/editar la BD. |
| `npx prisma generate` | Regenera el cliente de Prisma (útil si cambias `schema.prisma`). |

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
