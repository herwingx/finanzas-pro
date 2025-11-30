# Finanzas Pro - Aplicación de Gestión Financiera

Finanzas Pro es una aplicación full-stack diseñada para ayudarte a tomar el control de tus finanzas personales. Permite registrar ingresos y gastos, categorizarlos, gestionar transacciones recurrentes y analizar tus hábitos financieros con reportes detallados.

## Tecnologías Utilizadas

La aplicación está construida con una arquitectura moderna y escalable, utilizando las siguientes tecnologías:

-   **Frontend:**
    -   **React con Vite:** Un entorno de desarrollo frontend rápido y moderno.
    -   **TypeScript:** Para un código más robusto y mantenible.
    -   **Tailwind CSS:** Para un diseño de interfaz de usuario rápido y personalizable.
    -   **TanStack Query (React Query):** Para la gestión del estado del servidor y el fetching de datos.

-   **Backend:**
    -   **Node.js con Express:** Un framework minimalista y flexible para construir la API.
    -   **TypeScript:** Para consistencia y seguridad en el tipado.
    -   **Prisma:** Un ORM de nueva generación para una interacción segura y eficiente con la base de datos.
    -   **PostgreSQL:** Una base de datos relacional potente y de código abierto.

-   **Contenerización y Despliegue:**
    -   **Docker y Docker Compose:** Para crear entornos de desarrollo y producción consistentes y aislados.
    -   **Nginx:** Como proxy inverso para dirigir el tráfico a los servicios de frontend y backend.

---

## Despliegue y Ejecución en un Entorno Local

La aplicación está completamente dockerizada, lo que simplifica enormemente su despliegue en cualquier máquina con Docker instalado.

### Requisitos

-   **Docker:** [Instrucciones de instalación](https://docs.docker.com/engine/install/)
-   **Docker Compose:** [Instrucciones de instalación](https://docs.docker.com/compose/install/) (generalmente incluido con Docker Desktop).
-   **Git:** Para clonar el repositorio.

### Pasos para el Despliegue

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd finanzas-pro
    ```

2.  **Configurar Variables de Entorno:**
    El backend necesita un archivo `.env` para conectarse a la base de datos. Crea un archivo llamado `.env` dentro de la carpeta `backend/` con el siguiente contenido. Docker Compose se encargará de usar estas variables para configurar la base de datos PostgreSQL.

    ```env
    # backend/.env
    DATABASE_URL="postgresql://herwingx:REDACTED_PASSWORD@db:5432/finanzas_pro"
    ```

3.  **Construir y Levantar los Contenedores:**
    Este comando construirá las imágenes de Docker para el frontend y el backend, y luego iniciará todos los servicios (frontend, backend, base de datos y Nginx) en segundo plano.

    ```bash
    docker compose up --build -d
    ```
    -   `--build`: Fuerza la reconstrucción de las imágenes si ha habido cambios en el código o en los `Dockerfiles`.
    -   `-d`: Ejecuta los contenedores en modo "detached" (en segundo plano).

4.  **Aplicar las Migraciones de la Base de Datos:**
    La primera vez que levantes la aplicación, la base de datos estará vacía. Debes aplicar el esquema de Prisma para crear las tablas necesarias.

    ```bash
    docker compose exec backend npx prisma migrate dev
    ```
    Este comando se ejecuta *dentro* del contenedor del backend para asegurar que tenga conexión con la base de datos.

5.  **Acceder a la Aplicación:**
    ¡Listo! La aplicación ahora debería estar disponible en tu navegador en la siguiente dirección:
    [http://localhost](http://localhost) (o la IP de tu máquina si la estás ejecutando en un servidor local).

---

## Gestión de Cambios y Desarrollo

Para realizar cambios en el código y verlos reflejados, sigue este flujo de trabajo:

1.  **Realiza tus cambios:** Modifica el código en el frontend o el backend según sea necesario.

2.  **Reconstruye la imagen del servicio modificado:** Si cambiaste código del backend, reconstruye solo el backend. Esto es más rápido que reconstruir todo.
    ```bash
    # Ejemplo para el backend
    docker compose build backend
    ```

3.  **Reinicia los servicios para aplicar los cambios:** El comando `up` aplicará los cambios y recreará solo los contenedores necesarios.
    ```bash
    docker compose up -d
    ```

4.  **Si modificas el esquema de la base de datos (`schema.prisma`):** Este es un cambio crítico que requiere una migración.
    -   **Crea la migración:**
        ```bash
        docker compose exec backend npx prisma migrate dev --name "nombre-descriptivo-de-la-migracion"
        ```
    -   Esto aplicará la migración y generará los nuevos tipos para Prisma Client. Después, es una buena práctica reconstruir la imagen del backend.

---

## Disponibilidad Continua y Persistencia de Datos

### Disponibilidad

La aplicación está configurada para ser resiliente. En el archivo `docker-compose.yml`, todos los servicios clave (frontend, backend, db, nginx) tienen la política `restart: unless-stopped`.

-   **¿Qué significa esto?** Si un contenedor se detiene por un error o si el servidor se reinicia, Docker lo levantará automáticamente. Esto asegura que la aplicación intente recuperarse por sí misma, minimizando el tiempo de inactividad.

### Persistencia de Datos

**Tus datos están seguros.** La base de datos PostgreSQL utiliza un **Volumen de Docker** (`postgres_data`) para almacenar toda su información.

-   **¿Cómo funciona?** Los volúmenes se gestionan por Docker y existen fuera del ciclo de vida de los contenedores. Esto significa que puedes detener, eliminar o reconstruir el contenedor de la base de datos (`db`) sin perder ni un solo dato. Al levantar el contenedor de nuevo, se conectará automáticamente al volumen existente y todos tus usuarios, transacciones y categorías estarán ahí.

---

## Monitoreo y Buenas Prácticas

Mantener la aplicación funcionando correctamente es crucial. Aquí hay algunas prácticas recomendadas para monitorear su estado.

### 1. Visualización de Logs en Tiempo Real

Los logs son tu principal fuente de información para depurar problemas. Puedes ver los logs de todos los servicios o de uno en específico.

-   **Ver logs de todos los servicios:**
    ```bash
    docker compose logs -f
    ```

-   **Ver logs de un servicio específico (ej: backend):**
    ```bash
    docker compose logs -f backend
    ```
    -   `-f`: Sigue la salida de los logs en tiempo real.

    **¿Qué buscar en los logs del backend?**
    -   Errores de Prisma (`PrismaClientKnownRequestError`).
    -   Errores 500 (Internal Server Error) que indiquen fallos no controlados.
    -   Mensajes de conexión a la base de datos.

    **¿Qué buscar en los logs de Nginx?**
    -   Errores 404 (Not Found) o 502 (Bad Gateway), que pueden indicar que Nginx no puede comunicarse con el frontend o el backend.

### 2. Estado de los Contenedores

Verifica que todos los contenedores estén en funcionamiento y no se hayan reiniciado inesperadamente.

```bash
docker compose ps
```
El comando te mostrará el estado (`STATUS`) de cada servicio. Deberían estar todos en `Up` o `running`. Si un contenedor está en `restarting` o `exited`, es una señal de que algo anda mal y debes revisar sus logs.

### 3. Conexión a la Base de Datos

Si la aplicación no puede leer o escribir datos, es posible que haya un problema con la base de datos. Puedes conectarte directamente a la base de datos dentro del contenedor para realizar diagnósticos.

1.  **Abrir una sesión de `psql` dentro del contenedor de la base de datos:**
    ```bash
    docker compose exec db psql -U herwingx -d finanzas_pro
    ```

2.  **Una vez dentro, puedes ejecutar comandos de SQL para verificar los datos:**
    -   `\dt`: Lista todas las tablas para confirmar que la migración se aplicó.
    -   `SELECT * FROM "User";`: Muestra todos los usuarios.
    -   `\q`: Para salir.

### 4. Actualizaciones y Mantenimiento

Para actualizar la aplicación con los últimos cambios del repositorio:

1.  **Obtener los últimos cambios:**
    ```bash
    git pull
    ```

2.  **Reconstruir y reiniciar los servicios:**
    ```bash
    docker compose up --build -d
    ```

3.  **Aplicar nuevas migraciones (si las hay):**
    Si se ha modificado el `schema.prisma`, es crucial aplicar las nuevas migraciones.
    ```bash
    docker compose exec backend npx prisma migrate dev
    ```
