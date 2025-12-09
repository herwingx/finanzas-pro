# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with a simple static server
FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./dist
COPY package.json package-lock.json ./
RUN npm install --omit=dev
RUN apk add --no-cache wget
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
