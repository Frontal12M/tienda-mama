# 🏪 La Tienda de Mamá - Sistema POS

Sistema de punto de venta para tienda de abarrotes.

## Funciones
- **Punto de Venta** - Cobrar con escáner de código de barras
- **Inventario** - Control de productos y stock
- **Fiados** - Registro de créditos y pagos de clientes
- **Reportes** - Ventas por día, semana y mes
- **Lista de Compras** - Generada automáticamente cada domingo

## Requisitos
- Java 17+ (recomendado Java 21)
- Node.js 18+
- Maven 3.9+
- MySQL 8+

## Instalación en tu PC (desarrollo)

### 1. Crear la base de datos MySQL
```bash
mysql -u root -p -e "CREATE DATABASE tienda_mama CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```
Si tu MySQL tiene contraseña, edita `backend/src/main/resources/application.properties`
y pon tu contraseña en `spring.datasource.password=`.

### 2. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
El backend arranca en http://localhost:8080
Las tablas se crean solas la primera vez.

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
El frontend arranca en http://localhost:5173

## Tecnologías
- **Backend:** Spring Boot 3.3, Spring Data JPA, MySQL
- **Frontend:** React 19, Vite, Axios, React Router

## Para la Tablet
1. Conecta la tablet a la misma red WiFi que la computadora
2. En la tablet, abre el navegador y ve a: `http://[IP-DE-LA-COMPUTADORA]:5173`
3. Tip: Agrega la página como acceso directo en la pantalla de inicio

## Hardware Soportado
- Impresora de tickets (USB)
- Escáner de código de barras (USB - actúa como teclado)
- Tablet (cualquier tablet con navegador web)
