# Finanzas Pro

Finanzas Pro is a personal finance management application designed for self-hosting. It provides a clean, modern interface to track your income and expenses, manage budgets, and understand your financial health.

This project is set up as a multi-container Docker application using a client-server architecture.

## Architecture

- **Frontend:** A Progressive Web App (PWA) built with React and Vite.
- **Backend:** A RESTful API built with Node.js, Express, and TypeScript.
- **Database:** PostgreSQL for data persistence.
- **ORM:** Prisma for database access and management.
- **Authentication:** JSON Web Tokens (JWT).
- **Reverse Proxy:** Nginx to route traffic to the frontend and backend services.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- A [DuckDNS](https://www.duckdns.org/) account (or any other dynamic DNS provider).

## Setup and Deployment

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd finanzas-pro
```

### 2. Configure Environment Variables

The backend requires a `.env` file for configuration.

- **Navigate to the backend directory:**
  ```bash
  cd backend
  ```
- **Create a `.env` file** by copying the example:
  ```
  cp .env.example .env
  ```
- **Edit the `.env` file** and set your `JWT_SECRET`. The `DATABASE_URL` is pre-configured for the Docker environment.

  ```env
  DATABASE_URL="postgresql://herwingx:REDACTED_PASSWORD@db:5432/finanzas_pro"
  JWT_SECRET="your-super-secret-and-long-jwt-secret-key"
  ```

### 3. Configure Nginx

You need to update the Nginx configuration to use your domain.

- **Open `nginx/nginx.conf`**.
- **Replace `your_domain.duckdns.org`** with your actual DuckDNS domain.

### 4. Build and Run the Application

From the root directory of the project, run the following commands:

- **Build the Docker images:**
  ```bash
  docker-compose build
  ```

- **Run the database migration:**
  This command will apply the schema to the database.
  ```bash
  docker-compose run --rm backend npx prisma migrate dev --name init
  ```

- **Start all services in detached mode:**
  ```bash
  docker-compose up -d
  ```

Your application should now be running. The frontend will be accessible on port 80.

### 5. (Optional) Configure SSL with Let's Encrypt

For a secure setup, it is highly recommended to use HTTPS.

- **Port Forwarding:** Ensure that ports 80 and 443 on your router are forwarded to the IP address of your server.

- **Stop the Nginx container** to free up port 80:
  ```bash
  docker-compose stop nginx
  ```

- **Obtain SSL Certificate using Certbot:**
  Run the following command, replacing `your_domain.duckdns.org` with your domain. This will store the certificates in a `./ssl` directory.
  ```bash
  docker run -it --rm \
    -v "$(pwd)/ssl:/etc/letsencrypt" \
    -p 80:80 \
    certbot/certbot certonly --standalone \
    -d your_domain.duckdns.org
  ```

- **Update Nginx Configuration for SSL:**
  - Open `nginx/nginx.conf`.
  - Uncomment the lines related to SSL (the `listen 443 ssl` block).
  - Comment out the `listen 80;` line inside the main server block.
  - Make sure the `server_name` and paths to the `ssl_certificate` and `ssl_certificate_key` are correct.

- **Restart Nginx:**
  ```bash
  docker-compose up -d --force-recreate nginx
  ```

Your application is now accessible via `https://your_domain.duckdns.org`.

## Default Credentials

The default database credentials are:
- **User:** `herwingx`
- **Password:** `REDACTED_PASSWORD`
- **Database Name:** `finanzas_pro`

You will need to register a new user in the application to start using it.
