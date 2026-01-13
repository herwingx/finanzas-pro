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
| `npx prisma generate`       | Regenera el cliente en `src/generated/prisma`.     |
| `npx prisma migrate dev`    | Crea y aplica migración (desarrollo).              |
| `npx prisma migrate deploy` | Aplica migraciones existentes (producción).        |

---

## 🗄️ Arquitectura de Base de Datos (Prisma 7)

El backend utiliza la arquitectura moderna de Prisma 7 con Driver Adapters.

### Componentes Clave

1. **Configuración (`prisma.config.ts`)**: Centraliza la conexión y configuración del CLI.
2. **Schema (`prisma/schema.prisma`)**: Define modelos usando el motor ligero `prisma-client`.
3. **Cliente (`src/generated/prisma`)**: Generado localmente para aislar dependencias.
4. **Instancia (`src/services/database.ts`)**: Singleton que usa `@prisma/adapter-pg` para conexión nativa optimizada.

### Flujo de Trabajo

Si modificas `schema.prisma`:
1. Ejecuta `npx prisma migrate dev` para crear las tablas.
2. El comando anterior ejecutará automáticamente `prisma generate`.
3. Importa el cliente desde `src/services/database.ts` en tu código.

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

## 🧠 Lógica Financiera (Refactorizada)

El controlador de planeación financiera implementa heurísticas avanzadas para ofrecer proyecciones precisas:

1.  **Estados de Cuenta (Source of Truth):**
    *   Si existe un `CreditCardStatement` pendiente, se utiliza su `totalDue` (Pago para no generar intereses) o `minimumPayment` como obligación base.
    *   Prioridad: Corte Real > Proyección Estimada. Esto garantiza precisión exacta vs el banco.

2.  **Proyección de Cuotas (MSI):**
    *   En ausencia de un corte oficial, el sistema proyecta las cuotas MSI activas que vencen en el periodo seleccionado.
    *   Se estima automáticamente el pago mínimo sobre saldo revolvente (aprox. 5%) y se suma a las obligaciones.

3.  **Intereses de Préstamos (`LOAN`):**
    *   Para cuentas de deuda personal, se calcula el interés simple mensual basado en `interestRate`.
    *   Si no se detectan pagos programados explícitos, se agrega una proyección de "Pago de Intereses Estimado" al flujo de caja (categoría NEEDS).

4.  **Regla 50/30/20 & Ingresos:**
    *   El análisis prioriza el `User.monthlyNetIncome` (Ingreso Neto Mensual) configurado en el perfil sobre el promedio de ingresos transaccionales.
    *   Esto ofrece una base estable para presupuestar, independiente de la volatilidad de los depósitos reales.
