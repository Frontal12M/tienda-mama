# Documentación Técnica — La Tienda de Mamá (Sistema POS)

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Base de Datos — Modelo de Datos](#3-base-de-datos--modelo-de-datos)
4. [Backend — Spring Boot](#4-backend--spring-boot)
5. [Frontend — React](#5-frontend--react)
6. [Seguridad — JWT](#6-seguridad--jwt)
7. [Flujos Principales](#7-flujos-principales)
8. [API Reference (tabla completa)](#8-api-reference-tabla-completa)
9. [Configuración y Despliegue](#9-configuración-y-despliegue)

---

## 1. Descripción General

**La Tienda de Mamá** es un sistema de Punto de Venta (POS) diseñado para una tienda de abarrotes pequeña en México. Su objetivo es ser extremadamente sencillo de usar (pensado para una persona que solo sabe usar WhatsApp).

### ¿Qué hace el sistema?

- **Punto de Venta (POS):** Cobrar productos con escáner de código de barras o búsqueda manual. Soporta 3 métodos de pago: efectivo, tarjeta y fiado (crédito).
- **Inventario:** Dar de alta productos con código de barras, precio de compra/venta, stock. Alerta automática cuando un producto está bajo de stock.
- **Fiados (Créditos):** Registrar ventas a crédito asociadas a un cliente. Permite pagos parciales o totales.
- **Reportes:** Ver ventas del día, semana, mes. Gráfica de productos más vendidos. Historial de ventas con detalle.
- **Lista de Compras:** Se genera automáticamente a partir de los productos que están por debajo del stock mínimo. Calcula el costo estimado de re-abastecimiento.
- **Autenticación JWT:** Login con usuario/contraseña, roles ADMIN y CAJERO.

### Stack Tecnológico

| Capa       | Tecnología                          | Versión   |
|------------|-------------------------------------|-----------|
| Frontend   | React + Vite                        | React 19, Vite 6 |
| Backend    | Spring Boot + Spring Data JPA       | 3.3.5     |
| Base de Datos | MySQL                            | 8+        |
| Seguridad  | Spring Security + JWT (jjwt)        | jjwt 0.12.6 |
| Lenguaje   | Java (backend), JavaScript (frontend) | Java 21   |

---

## 2. Arquitectura del Sistema

### Diagrama General

```
┌──────────────┐          ┌──────────────────────────────────────┐
│              │          │          SERVIDOR (PC / VPS)          │
│   TABLET     │          │                                      │
│  (Navegador) │──WiFi───▶│  ┌────────────┐    ┌──────────────┐ │
│              │          │  │  Frontend   │    │   Backend     │ │
│  React App   │          │  │  Vite :5173 │───▶│ Spring Boot   │ │
│              │          │  │  (dev proxy)│    │  :8080        │ │
└──────────────┘          │  └────────────┘    │               │ │
                          │                    │  ┌──────────┐ │ │
                          │                    │  │  MySQL    │ │ │
                          │                    │  │  :3306    │ │ │
                          │                    │  └──────────┘ │ │
                          │                    └──────────────┘ │
                          └──────────────────────────────────────┘
```

### Modelo Cliente-Servidor

El sistema sigue una arquitectura **cliente-servidor** clásica:

- **Cliente (Frontend):** Aplicación React que corre en el navegador de la tablet o PC. Es una SPA (Single Page Application) que se comunica con el backend vía HTTP/JSON.
- **Servidor (Backend):** API REST construida con Spring Boot. Recibe peticiones HTTP, ejecuta la lógica de negocio y persiste datos en MySQL.

### Proxy de Vite (desarrollo)

En desarrollo, Vite sirve el frontend en el puerto `5173` y el backend corre en el puerto `8080`. Para evitar problemas de CORS durante desarrollo, Vite actúa como **proxy reverso**:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

**¿Cómo funciona?** Cuando el frontend hace una petición a `/api/productos`, Vite intercepta cualquier ruta que empiece con `/api` y la redirige a `http://localhost:8080/api/productos`. El navegador cree que habla con el mismo servidor, eliminando problemas de CORS.

### Configuración CORS (producción)

Además del proxy de Vite, el backend tiene su propia configuración CORS para permitir peticiones desde otros orígenes (necesario cuando frontend y backend están en servidores distintos):

```java
// CorsConfig.java
@Bean
public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",
        "http://localhost:3000"
    ));
    config.setAllowedMethods(Arrays.asList(
        "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
    ));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return new CorsFilter(source);
}
```

**Nota:** En producción (VPS), hay que agregar la URL/IP pública del VPS a `allowedOrigins`.

---

## 3. Base de Datos — Modelo de Datos

### Diagrama Entidad-Relación

```
┌───────────────┐       ┌───────────────────┐
│  categorias   │       │     productos      │
├───────────────┤       ├───────────────────┤
│ id (PK)       │───1:N─│ id (PK)           │
│ nombre        │       │ categoria_id (FK)  │
│ descripcion   │       │ codigoBarras (UQ)  │
└───────────────┘       │ nombre             │
                        │ descripcion        │
                        │ precioCompra       │
                        │ precioVenta        │
                        │ stock              │
                        │ stockMinimo        │
                        │ activo             │
                        │ fechaCreacion      │
                        │ fechaActualizacion │
                        └────────┬──────────┘
                                 │
                                 │ N:1
                                 ▼
┌───────────────┐       ┌───────────────────┐       ┌───────────────┐
│   clientes    │       │     ventas         │       │ detalle_ventas│
├───────────────┤       ├───────────────────┤       ├───────────────┤
│ id (PK)       │──1:N──│ id (PK)           │──1:N──│ id (PK)       │
│ nombre        │       │ cliente_id (FK)    │       │ venta_id (FK) │
│ telefono      │       │ fechaVenta         │       │ producto_id   │
│ direccion     │       │ total              │       │ cantidad      │
│ activo        │       │ metodoPago (ENUM)  │       │ precioUnitario│
│ fechaRegistro │       └────────┬──────────┘       │ subtotal      │
└───────┬───────┘                │                   └───────────────┘
        │                        │ 1:1
        │ 1:N                    ▼
        │               ┌───────────────────┐
        └──────────────▶│     fiados         │
                        ├───────────────────┤
                        │ id (PK)           │
                        │ cliente_id (FK)    │
                        │ venta_id (FK, UQ)  │
                        │ monto              │
                        │ montoPagado        │
                        │ pagado             │
                        │ fechaFiado         │
                        │ fechaPago          │
                        └───────────────────┘

┌───────────────┐
│   usuarios    │
├───────────────┤
│ id (PK)       │
│ nombre        │
│ username (UQ)  │
│ password (BCrypt) │
│ rol (ENUM)     │
│ activo         │
│ fechaCreacion  │
└───────────────┘
```

### Detalle de cada Entidad

#### Categoria (`categorias`)

| Campo       | Tipo Java   | Tipo DB     | Notas                      |
|-------------|-------------|-------------|----------------------------|
| id          | Long        | BIGINT (PK) | Auto-incremento            |
| nombre      | String      | VARCHAR     |                            |
| descripcion | String      | VARCHAR     |                            |

#### Producto (`productos`)

| Campo              | Tipo Java      | Tipo DB         | Notas                                    |
|--------------------|----------------|-----------------|------------------------------------------|
| id                 | Long           | BIGINT (PK)     | Auto-incremento                          |
| codigoBarras       | String         | VARCHAR (UNIQUE) | Código EAN-13 del producto              |
| nombre             | String         | VARCHAR         |                                          |
| descripcion        | String         | VARCHAR         | Opcional                                 |
| precioCompra       | BigDecimal     | DECIMAL         | Lo que cuesta al comprar al proveedor    |
| precioVenta        | BigDecimal     | DECIMAL         | Lo que se cobra al cliente               |
| stock              | Integer        | INT             | Unidades disponibles actualmente         |
| stockMinimo        | Integer        | INT             | Umbral para alerta de bajo stock         |
| categoria          | Categoria      | FK → categorias | Relación ManyToOne                       |
| activo             | Boolean        | BOOLEAN         | Default `true`. Borrado lógico           |
| fechaCreacion      | LocalDateTime  | DATETIME        | Se asigna automáticamente (@PrePersist)  |
| fechaActualizacion | LocalDateTime  | DATETIME        | Se actualiza automáticamente (@PreUpdate) |

**Relaciones:**
- `@ManyToOne` con `Categoria` — Cada producto pertenece a una categoría.

#### Venta (`ventas`)

| Campo      | Tipo Java          | Tipo DB         | Notas                                      |
|------------|--------------------|-----------------|--------------------------------------------|
| id         | Long               | BIGINT (PK)     | Auto-incremento                            |
| fechaVenta | LocalDateTime      | DATETIME        | Se asigna automáticamente (@PrePersist)    |
| total      | BigDecimal         | DECIMAL         | Monto total de la venta                    |
| metodoPago | MetodoPago (Enum)  | VARCHAR (STRING) | EFECTIVO, FIADO o TARJETA                 |
| cliente    | Cliente            | FK → clientes   | Nullable. Solo obligatorio cuando es FIADO |
| detalles   | List\<DetalleVenta\> | —             | Relación OneToMany                         |

**Relaciones:**
- `@ManyToOne` con `Cliente` — Opcional; se usa cuando el pago es FIADO.
- `@OneToMany` con `DetalleVenta` — `cascade = CascadeType.ALL, orphanRemoval = true`. Al guardar la venta, se guardan automáticamente todos los detalles.

#### DetalleVenta (`detalle_ventas`)

| Campo          | Tipo Java  | Tipo DB     | Notas                                    |
|----------------|------------|-------------|------------------------------------------|
| id             | Long       | BIGINT (PK) | Auto-incremento                          |
| producto       | Producto   | FK → productos | Qué producto se vendió                |
| cantidad       | Integer    | INT         | Cuántas unidades                         |
| precioUnitario | BigDecimal | DECIMAL     | Precio al momento de la venta            |
| subtotal       | BigDecimal | DECIMAL     | cantidad × precioUnitario                |
| venta          | Venta      | FK → ventas | @JsonIgnore para evitar referencia circular |

**Relaciones:**
- `@ManyToOne` con `Producto`
- `@ManyToOne` con `Venta` — Anotado con `@JsonIgnore` para que al serializar a JSON no se cree un ciclo infinito (Venta → DetalleVenta → Venta → ...).

#### Cliente (`clientes`)

| Campo         | Tipo Java     | Tipo DB     | Notas                          |
|---------------|---------------|-------------|--------------------------------|
| id            | Long          | BIGINT (PK) | Auto-incremento                |
| nombre        | String        | VARCHAR     |                                |
| telefono      | String        | VARCHAR     | Opcional                       |
| direccion     | String        | VARCHAR     | Opcional                       |
| activo        | Boolean       | BOOLEAN     | Default `true`. Borrado lógico |
| fechaRegistro | LocalDateTime | DATETIME    | @PrePersist                    |

#### Fiado (`fiados`)

| Campo       | Tipo Java     | Tipo DB     | Notas                                      |
|-------------|---------------|-------------|--------------------------------------------|
| id          | Long          | BIGINT (PK) | Auto-incremento                            |
| cliente     | Cliente       | FK → clientes | A quién se le fió                        |
| venta       | Venta         | FK → ventas  | La venta original (relación 1:1)          |
| monto       | BigDecimal    | DECIMAL     | Monto total de la deuda                    |
| montoPagado | BigDecimal    | DECIMAL     | Default `0`. Cuánto ha pagado hasta ahora  |
| pagado      | Boolean       | BOOLEAN     | Default `false`. True cuando paga todo     |
| fechaFiado  | LocalDateTime | DATETIME    | @PrePersist — cuándo se creó el fiado      |
| fechaPago   | LocalDateTime | DATETIME    | Nullable — cuándo se pagó completamente    |

**Relaciones:**
- `@ManyToOne` con `Cliente` — Un cliente puede tener muchos fiados.
- `@OneToOne` con `Venta` — Cada fiado corresponde a exactamente una venta.

#### Usuario (`usuarios`)

| Campo         | Tipo Java     | Tipo DB         | Notas                         |
|---------------|---------------|-----------------|-------------------------------|
| id            | Long          | BIGINT (PK)     | Auto-incremento               |
| nombre        | String        | VARCHAR (NOT NULL) | Nombre para mostrar         |
| username      | String        | VARCHAR (NOT NULL, UNIQUE) | Para login         |
| password      | String        | VARCHAR (NOT NULL) | Almacenado con BCrypt       |
| rol           | Rol (Enum)    | VARCHAR (STRING) | ADMIN o CAJERO               |
| activo        | Boolean       | BOOLEAN         | Default `true`                |
| fechaCreacion | LocalDateTime | DATETIME        | @PrePersist                   |

### MetodoPago (Enum)

```java
public enum MetodoPago {
    EFECTIVO,   // Pago en efectivo
    FIADO,      // Crédito (se crea un registro en tabla fiados)
    TARJETA     // Pago con tarjeta
}
```

Se almacena como `STRING` en la base de datos gracias a `@Enumerated(EnumType.STRING)`, lo que significa que en la columna se guarda el texto "EFECTIVO", "FIADO" o "TARJETA" (no un número).

### Rol de Usuario (Enum)

```java
public enum Rol {
    ADMIN,    // Acceso total: puede registrar usuarios, ver reportes completos
    CAJERO    // Acceso básico: cobrar, ver inventario
}
```

Definido dentro de la clase `Usuario`.

---

## 4. Backend — Spring Boot

### 4.1 Estructura de Carpetas

```
backend/
├── pom.xml                          # Configuración Maven y dependencias
├── src/
│   └── main/
│       ├── java/com/tienda/
│       │   ├── TiendaApplication.java     # Punto de entrada Spring Boot
│       │   ├── config/
│       │   │   ├── CorsConfig.java        # Filtro CORS
│       │   │   └── DataInitializer.java   # Datos iniciales (categorías + productos)
│       │   ├── model/
│       │   │   ├── Categoria.java         # Entidad categoría
│       │   │   ├── Producto.java          # Entidad producto
│       │   │   ├── Venta.java             # Entidad venta
│       │   │   ├── DetalleVenta.java      # Entidad detalle de venta
│       │   │   ├── Cliente.java           # Entidad cliente
│       │   │   ├── Fiado.java             # Entidad fiado/crédito
│       │   │   ├── MetodoPago.java        # Enum de métodos de pago
│       │   │   └── Usuario.java           # Entidad usuario (con enum Rol)
│       │   ├── repository/
│       │   │   ├── CategoriaRepository.java
│       │   │   ├── ProductoRepository.java
│       │   │   ├── VentaRepository.java
│       │   │   ├── ClienteRepository.java
│       │   │   ├── FiadoRepository.java
│       │   │   └── UsuarioRepository.java
│       │   ├── service/
│       │   │   ├── ProductoService.java
│       │   │   ├── VentaService.java
│       │   │   ├── ClienteService.java
│       │   │   ├── FiadoService.java
│       │   │   └── AuthService.java       # Implementa UserDetailsService
│       │   ├── controller/
│       │   │   ├── ProductoController.java
│       │   │   ├── CategoriaController.java
│       │   │   ├── VentaController.java
│       │   │   ├── ClienteController.java
│       │   │   ├── FiadoController.java
│       │   │   └── AuthController.java
│       │   └── security/
│       │       ├── SecurityConfig.java        # Configuración Spring Security
│       │       ├── JwtUtil.java               # Generación y validación de tokens
│       │       └── JwtAuthenticationFilter.java # Filtro que valida JWT en cada request
│       └── resources/
│           └── application.properties     # Configuración (MySQL, JWT, server)
```

### 4.2 Modelos (Entities) — Anotaciones Clave

Las entidades JPA usan las siguientes anotaciones de Jakarta Persistence (jakarta.persistence):

| Anotación                  | ¿Qué hace?                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| `@Entity`                  | Marca la clase como una entidad JPA que se mapea a una tabla               |
| `@Table(name = "x")`      | Nombre de la tabla en MySQL                                                |
| `@Id`                      | Define la llave primaria                                                    |
| `@GeneratedValue(strategy = GenerationType.IDENTITY)` | Auto-incremento en MySQL            |
| `@Column(unique = true)`  | Restricción UNIQUE en la columna                                           |
| `@Column(nullable = false)` | Restricción NOT NULL                                                      |
| `@Column(columnDefinition = "boolean default true")` | Valor por defecto en DDL           |
| `@ManyToOne`               | Relación muchos-a-uno (ej: muchos Productos → una Categoría)              |
| `@OneToMany`               | Relación uno-a-muchos (ej: una Venta → muchos DetalleVenta)               |
| `@OneToOne`                | Relación uno-a-uno (ej: un Fiado → una Venta)                             |
| `@JoinColumn(name = "x")` | Nombre de la columna FK en la tabla                                        |
| `@Enumerated(EnumType.STRING)` | Guardar el enum como texto (no como ordinal/número)                  |
| `@PrePersist`              | Método que se ejecuta automáticamente ANTES de insertar en la DB           |
| `@PreUpdate`               | Método que se ejecuta automáticamente ANTES de actualizar en la DB         |
| `@JsonIgnore`              | Excluye el campo de la serialización JSON (evita ciclos)                   |
| `CascadeType.ALL`          | Operaciones en cascada: al guardar/borrar Venta, se guardan/borran sus Detalles |
| `orphanRemoval = true`     | Si un DetalleVenta se quita de la lista, se borra de la DB                 |

**Ejemplo de @PrePersist en Producto:**

```java
@PrePersist
protected void onCreate() {
    this.fechaCreacion = LocalDateTime.now();
    this.fechaActualizacion = LocalDateTime.now();
}

@PreUpdate
protected void onUpdate() {
    this.fechaActualizacion = LocalDateTime.now();
}
```

Esto garantiza que `fechaCreacion` se asigne automáticamente al crear el producto, y `fechaActualizacion` se actualice cada vez que se modifica.

### 4.3 Repositorios — Spring Data JPA

Los repositorios extienden `JpaRepository<Entidad, TipoId>`, lo que da gratis todos los métodos CRUD básicos:

- `findAll()`, `findById(id)`, `save(entity)`, `deleteById(id)`, `count()`, etc.

Además, Spring Data permite crear consultas solo con el nombre del método (query derivation):

**ProductoRepository:**

```java
// Spring genera el SQL: SELECT * FROM productos WHERE codigo_barras = ?
Optional<Producto> findByCodigoBarras(String codigoBarras);

// SELECT * FROM productos WHERE LOWER(nombre) LIKE LOWER('%?%')
List<Producto> findByNombreContainingIgnoreCase(String nombre);

// SELECT * FROM productos WHERE categoria_id = ?
List<Producto> findByCategoriaId(Long categoriaId);

// SELECT * FROM productos WHERE activo = true
List<Producto> findByActivoTrue();
```

**Consultas personalizadas con @Query (JPQL):**

```java
// ProductoRepository — Productos cuyo stock actual es <= su stock mínimo
@Query("SELECT p FROM Producto p WHERE p.stock <= p.stockMinimo AND p.activo = true")
List<Producto> findProductosBajoStock();
```

```java
// VentaRepository — Ventas agrupadas por día
@Query("SELECT DATE(v.fechaVenta) as fecha, SUM(v.total) as total " +
       "FROM Venta v WHERE v.fechaVenta BETWEEN :inicio AND :fin " +
       "GROUP BY DATE(v.fechaVenta)")
List<Object[]> ventasPorDia(@Param("inicio") LocalDateTime inicio,
                            @Param("fin") LocalDateTime fin);

// Top productos más vendidos en un rango de fechas
@Query("SELECT dv.producto.id, dv.producto.nombre, SUM(dv.cantidad) as totalVendido " +
       "FROM DetalleVenta dv WHERE dv.venta.fechaVenta BETWEEN :inicio AND :fin " +
       "GROUP BY dv.producto.id, dv.producto.nombre ORDER BY totalVendido DESC")
List<Object[]> productosMasVendidos(@Param("inicio") LocalDateTime inicio,
                                    @Param("fin") LocalDateTime fin);
```

**FiadoRepository:**

```java
List<Fiado> findByClienteId(Long clienteId);           // Fiados de un cliente
List<Fiado> findByPagadoFalse();                       // Fiados sin pagar
List<Fiado> findByClienteIdAndPagadoFalse(Long clienteId); // Sin pagar de un cliente
```

**UsuarioRepository:**

```java
Optional<Usuario> findByUsername(String username);      // Buscar por username
boolean existsByUsername(String username);               // Verificar si existe
```

### 4.4 Servicios — Lógica de Negocio

#### ProductoService

```java
@Service
@Transactional
public class ProductoService { ... }
```

| Método                | ¿Qué hace?                                                                              |
|-----------------------|------------------------------------------------------------------------------------------|
| `listarTodos()`       | Retorna todos los productos (activos e inactivos)                                       |
| `listarActivos()`     | Retorna solo los productos con `activo = true`                                          |
| `buscarPorId(id)`     | Busca por ID. Retorna `Optional<Producto>`                                              |
| `buscarPorCodigoBarras(codigo)` | Busca por código de barras (para el escáner). Retorna `Optional<Producto>`   |
| `buscarPorNombre(nombre)` | Búsqueda por texto parcial, case-insensitive                                        |
| `buscarPorCategoria(id)` | Filtra productos por categoría                                                        |
| `guardar(producto)`   | Crea o actualiza un producto                                                            |
| `eliminar(id)`        | **Borrado lógico**: pone `activo = false` en vez de eliminar de la DB                   |
| `getProductosBajoStock()` | Retorna productos cuyo `stock <= stockMinimo`                                       |
| `actualizarStock(id, cantidad)` | Suma `cantidad` al stock actual. Si `cantidad` es negativo, resta. Valida que no quede en negativo |
| `generarListaCompras()` | Genera lista de compras (ver detalle abajo)                                            |

**Lógica de `generarListaCompras()`:**

```java
public List<Map<String, Object>> generarListaCompras() {
    List<Producto> productosBajoStock = productoRepository.findProductosBajoStock();
    return productosBajoStock.stream().map(p -> {
        Map<String, Object> item = new HashMap<>();
        item.put("productoId", p.getId());
        item.put("nombre", p.getNombre());
        item.put("stockActual", p.getStock());
        item.put("stockMinimo", p.getStockMinimo());
        // Fórmula: queremos llevar el stock al doble del mínimo
        int cantidadSugerida = p.getStockMinimo() * 2 - p.getStock();
        item.put("cantidadSugerida", cantidadSugerida);
        item.put("precioCompra", p.getPrecioCompra());
        item.put("costoEstimado", p.getPrecioCompra().multiply(BigDecimal.valueOf(cantidadSugerida)));
        return item;
    }).collect(Collectors.toList());
}
```

**Fórmula:** `cantidadSugerida = stockMinimo × 2 − stockActual`

Ejemplo: Un producto con stockMinimo=10 y stockActual=3 → cantidadSugerida = 10×2 − 3 = 17 unidades.

#### VentaService

| Método                          | ¿Qué hace?                                                                 |
|---------------------------------|-----------------------------------------------------------------------------|
| `registrarVenta(venta)`         | Registra una venta completa (ver flujo detallado abajo)                    |
| `getVentasHoy()`                | Ventas de hoy (desde las 00:00 hasta ahora)                               |
| `getVentasSemana()`             | Ventas desde el lunes de la semana actual                                  |
| `getVentasMes()`                | Ventas desde el primer día del mes actual                                  |
| `getVentasPorRango(inicio, fin)` | Ventas en un rango personalizado de fechas                                |
| `getResumenVentas(inicio, fin)` | Mapa con: `cantidadVentas`, `totalVentas`, `productosMasVendidos`         |

**Lógica de `registrarVenta()`:**

```java
public Venta registrarVenta(Venta venta) {
    // 1. Por cada producto en la venta, descontar stock
    for (DetalleVenta detalle : venta.getDetalles()) {
        Producto producto = productoRepository.findById(detalle.getProducto().getId())...;
        // Validar que hay suficiente stock
        if (producto.getStock() < detalle.getCantidad()) {
            throw new RuntimeException("Stock insuficiente para: " + producto.getNombre());
        }
        // Restar stock
        producto.setStock(producto.getStock() - detalle.getCantidad());
        productoRepository.save(producto);
        // Vincular detalle con la venta
        detalle.setVenta(venta);
    }
    // 2. Guardar la venta
    Venta ventaGuardada = ventaRepository.save(venta);
    // 3. Si el método de pago es FIADO, crear registro de deuda
    if ("FIADO".equalsIgnoreCase(venta.getMetodoPago())) {
        Fiado fiado = new Fiado();
        fiado.setCliente(venta.getCliente());
        fiado.setVenta(ventaGuardada);
        fiado.setMontoTotal(venta.getTotal());
        fiado.setMontoPagado(BigDecimal.ZERO);
        fiado.setPagado(false);
        fiadoRepository.save(fiado);
    }
    return ventaGuardada;
}
```

#### ClienteService

| Método                       | ¿Qué hace?                                                          |
|------------------------------|----------------------------------------------------------------------|
| `listarTodos()`              | Todos los clientes                                                   |
| `listarActivos()`            | Solo clientes con `activo = true`                                    |
| `buscarPorId(id)`            | Buscar por ID                                                        |
| `buscarPorNombre(nombre)`    | Búsqueda parcial case-insensitive                                    |
| `guardar(cliente)`           | Crear o actualizar                                                   |
| `eliminar(id)`               | Borrado lógico (`activo = false`)                                    |
| `getSaldoPendiente(clienteId)` | Suma todos los fiados pendientes: `Σ(monto - montoPagado)` de fiados con `pagado = false` |

**Lógica de `getSaldoPendiente()`:**

```java
public BigDecimal getSaldoPendiente(Long clienteId) {
    List<Fiado> fiadosPendientes = fiadoRepository.findByClienteIdAndPagadoFalse(clienteId);
    return fiadosPendientes.stream()
            .map(f -> f.getMontoTotal().subtract(f.getMontoPagado()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

#### FiadoService

| Método                          | ¿Qué hace?                                                          |
|---------------------------------|----------------------------------------------------------------------|
| `registrarPago(fiadoId, monto)` | Registra un pago parcial o total sobre un fiado                      |
| `getFiadosPendientes()`         | Fiados donde `pagado = false`                                       |
| `getFiadosPorCliente(clienteId)` | Todos los fiados (pagados y pendientes) de un cliente               |

**Lógica de `registrarPago()`:**

```java
public Fiado registrarPago(Long fiadoId, BigDecimal monto) {
    Fiado fiado = fiadoRepository.findById(fiadoId)...;
    // Validar que no esté ya pagado
    if (fiado.isPagado()) throw ...;
    // Validar que el pago no exceda el saldo pendiente
    BigDecimal saldoPendiente = fiado.getMontoTotal().subtract(fiado.getMontoPagado());
    if (monto.compareTo(saldoPendiente) > 0) throw ...;
    // Acumular pago
    fiado.setMontoPagado(fiado.getMontoPagado().add(monto));
    // Si ya pagó todo, marcar como pagado
    if (fiado.getMontoPagado().compareTo(fiado.getMontoTotal()) >= 0) {
        fiado.setPagado(true);
    }
    return fiadoRepository.save(fiado);
}
```

#### AuthService

Implementa `UserDetailsService` de Spring Security (necesario para que Spring Security sepa cómo cargar usuarios).

| Método                          | ¿Qué hace?                                                          |
|---------------------------------|----------------------------------------------------------------------|
| `loadUserByUsername(username)`   | Carga un usuario para Spring Security. Valida que esté activo       |
| `login(username, password)`     | Autentica con AuthenticationManager, genera token JWT                |
| `registrar(usuario)`            | Crea un usuario nuevo. Encripta password con BCrypt. Valida que el username no exista |

### 4.5 Controladores — Endpoints

#### ProductoController (`/api/productos`)

| Método   | Ruta                          | Descripción                        |
|----------|-------------------------------|------------------------------------|
| GET      | `/api/productos`              | Listar todos los productos         |
| GET      | `/api/productos/{id}`         | Obtener producto por ID            |
| GET      | `/api/productos/barcode/{codigo}` | Buscar por código de barras    |
| GET      | `/api/productos/buscar?nombre=` | Buscar por nombre (parcial)      |
| GET      | `/api/productos/categoria/{categoriaId}` | Filtrar por categoría     |
| GET      | `/api/productos/bajo-stock`   | Productos con stock bajo           |
| GET      | `/api/productos/lista-compras`| Lista de compras generada          |
| POST     | `/api/productos`              | Crear producto                     |
| PUT      | `/api/productos/{id}`         | Actualizar producto completo       |
| PATCH    | `/api/productos/{id}/stock?cantidad=` | Ajustar stock (+ o -)      |
| DELETE   | `/api/productos/{id}`         | Eliminar producto (borrado lógico) |

#### CategoriaController (`/api/categorias`)

| Método | Ruta               | Descripción            |
|--------|--------------------|-----------------------|
| GET    | `/api/categorias`  | Listar todas          |
| POST   | `/api/categorias`  | Crear una nueva       |

#### VentaController (`/api/ventas`)

| Método | Ruta                                | Descripción                          |
|--------|-------------------------------------|--------------------------------------|
| POST   | `/api/ventas`                       | Registrar una venta                  |
| GET    | `/api/ventas/{id}`                  | Obtener venta por ID                 |
| GET    | `/api/ventas/hoy`                   | Ventas de hoy                        |
| GET    | `/api/ventas/semana`                | Ventas de esta semana                |
| GET    | `/api/ventas/mes`                   | Ventas de este mes                   |
| GET    | `/api/ventas/rango?inicio=&fin=`    | Ventas en rango personalizado        |
| GET    | `/api/ventas/resumen?inicio=&fin=`  | Resumen (total, cantidad, top prod.) |

#### ClienteController (`/api/clientes`)

| Método | Ruta                          | Descripción                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/api/clientes`               | Listar todos                    |
| GET    | `/api/clientes/{id}`          | Obtener por ID                  |
| GET    | `/api/clientes/buscar?nombre=`| Buscar por nombre               |
| GET    | `/api/clientes/{id}/saldo`    | Saldo pendiente del cliente     |
| POST   | `/api/clientes`               | Crear cliente                   |
| PUT    | `/api/clientes/{id}`          | Actualizar cliente              |
| DELETE | `/api/clientes/{id}`          | Eliminar (borrado lógico)       |

#### FiadoController (`/api/fiados`)

| Método | Ruta                            | Descripción                      |
|--------|---------------------------------|----------------------------------|
| GET    | `/api/fiados`                   | Listar todos los fiados          |
| GET    | `/api/fiados/pendientes`        | Solo los que no se han pagado    |
| GET    | `/api/fiados/cliente/{clienteId}` | Fiados de un cliente específico |
| POST   | `/api/fiados/{id}/pago`         | Registrar pago (parcial o total) |

#### AuthController (`/api/auth`) — PÚBLICO (sin JWT)

| Método | Ruta                  | Descripción                 |
|--------|-----------------------|-----------------------------|
| POST   | `/api/auth/login`     | Iniciar sesión, recibir JWT |
| POST   | `/api/auth/registro`  | Registrar usuario nuevo     |

---

## 5. Frontend — React

### 5.1 Estructura de Carpetas

```
frontend/
├── package.json           # Dependencias y scripts npm
├── vite.config.js         # Configuración de Vite + proxy
├── index.html             # HTML base (carga Inter font)
├── src/
│   ├── main.jsx           # Punto de entrada React (BrowserRouter)
│   ├── index.css          # Estilos globales y variables CSS
│   ├── App.jsx            # Layout principal (sidebar + rutas)
│   ├── services/
│   │   └── api.js         # Instancia Axios + todas las funciones API
│   └── pages/
│       ├── PuntoDeVenta.jsx   # Pantalla de cobro (POS)
│       ├── Inventario.jsx     # Gestión de productos
│       ├── Fiados.jsx         # Créditos y pagos
│       ├── Reportes.jsx       # Reportes de ventas
│       └── ListaCompras.jsx   # Lista de compras semanal
```

### 5.2 Configuración

**package.json — Dependencias:**

| Paquete            | Versión | ¿Para qué?                                      |
|--------------------|---------|--------------------------------------------------|
| react              | ^19.0   | Biblioteca UI principal                          |
| react-dom          | ^19.0   | Renderizado en el navegador                      |
| react-router-dom   | ^7.0    | Navegación entre páginas (SPA routing)           |
| react-icons        | ^5.3    | Íconos (Feather Icons — prefijo Fi)              |
| react-hot-toast    | ^2.4    | Notificaciones (toasts) elegantes                |
| axios              | ^1.7    | Cliente HTTP para llamar al backend              |

**Variables CSS globales (index.css):**

```css
:root {
  --primary: #2563eb;       /* Azul — botones principales, navegación activa */
  --success: #16a34a;       /* Verde — pago exitoso, stock OK */
  --danger: #dc2626;        /* Rojo — stock bajo, deudas */
  --warning: #f59e0b;       /* Ámbar — fiado, advertencias */
  --bg: #f1f5f9;            /* Fondo de página (gris claro) */
  --card: #ffffff;          /* Fondo de tarjetas */
  --text: #1e293b;          /* Texto principal */
  --text-light: #64748b;    /* Texto secundario */
  --border: #e2e8f0;        /* Bordes */
  --radius: 12px;           /* Radio de esquinas */
}
```

Todos los botones tienen un mínimo de **48px de alto** para uso táctil en tablet.

### 5.3 API Service (api.js)

Archivo central que define **una instancia de Axios** y exporta funciones para cada endpoint:

```javascript
const api = axios.create({
  baseURL: '/api',                    // En desarrollo, Vite lo proxea a :8080
  headers: { 'Content-Type': 'application/json' },
});
```

**Funciones exportadas (28 total):**

| Función                    | Método | Ruta que llama                         |
|----------------------------|--------|----------------------------------------|
| `getProductos()`           | GET    | `/productos`                           |
| `getProducto(id)`          | GET    | `/productos/{id}`                      |
| `getProductoPorCodigo(codigo)` | GET | `/productos/barcode/{codigo}`         |
| `buscarProductos(nombre)`  | GET    | `/productos/buscar?nombre=`            |
| `getProductosPorCategoria(id)` | GET | `/productos/categoria/{id}`           |
| `getProductosBajoStock()`  | GET    | `/productos/bajo-stock`                |
| `getListaCompras()`        | GET    | `/productos/lista-compras`             |
| `crearProducto(data)`      | POST   | `/productos`                           |
| `actualizarProducto(id, data)` | PUT | `/productos/{id}`                     |
| `actualizarStock(id, cantidad)` | PATCH | `/productos/{id}/stock?cantidad=`   |
| `eliminarProducto(id)`     | DELETE | `/productos/{id}`                      |
| `getCategorias()`          | GET    | `/categorias`                          |
| `crearCategoria(data)`     | POST   | `/categorias`                          |
| `registrarVenta(data)`     | POST   | `/ventas`                              |
| `getVenta(id)`             | GET    | `/ventas/{id}`                         |
| `getVentasHoy()`           | GET    | `/ventas/hoy`                          |
| `getVentasSemana()`        | GET    | `/ventas/semana`                       |
| `getVentasMes()`           | GET    | `/ventas/mes`                          |
| `getVentasRango(inicio, fin)` | GET | `/ventas/rango?inicio=&fin=`          |
| `getResumenVentas(inicio, fin)` | GET | `/ventas/resumen?inicio=&fin=`      |
| `getClientes()`            | GET    | `/clientes`                            |
| `getCliente(id)`           | GET    | `/clientes/{id}`                       |
| `buscarClientes(nombre)`   | GET    | `/clientes/buscar?nombre=`             |
| `crearCliente(data)`       | POST   | `/clientes`                            |
| `actualizarCliente(id, data)` | PUT | `/clientes/{id}`                      |
| `eliminarCliente(id)`      | DELETE | `/clientes/{id}`                       |
| `getSaldoCliente(id)`      | GET    | `/clientes/{id}/saldo`                 |
| `getFiados()`              | GET    | `/fiados`                              |
| `getFiadosPendientes()`    | GET    | `/fiados/pendientes`                   |
| `getFiadosPorCliente(id)`  | GET    | `/fiados/cliente/{id}`                 |
| `registrarPago(fiadoId, monto)` | POST | `/fiados/{fiadoId}/pago`            |

### 5.4 Navegación (App.jsx)

La navegación usa `react-router-dom` v7 con `BrowserRouter` + `Routes`.

**Desktop (≥768px):** Sidebar izquierdo de 80px (íconos) que se expande a 220px al hacer hover (íconos + texto).

**Mobile (<768px):** El sidebar se oculta con CSS media query y aparece una barra de tabs en la parte inferior del estilo de iOS/Android.

```
Desktop:                          Mobile:
┌──┬───────────────┐              ┌───────────────────┐
│🛒│               │              │                   │
│📦│  Contenido    │              │    Contenido      │
│👥│  de la        │              │    de la          │
│📊│  página       │              │    página         │
│🛍│               │              │                   │
│  │               │              ├─────────────────── │
└──┴───────────────┘              │ 🛒 📦 👥 📊 🛍  │
                                  └───────────────────┘
```

**Rutas definidas:**

| Ruta         | Componente    | Ícono          | Label     |
|--------------|---------------|----------------|-----------|
| `/`          | PuntoDeVenta  | FiShoppingCart  | Ventas    |
| `/inventario`| Inventario    | FiPackage       | Inventario|
| `/fiados`    | Fiados        | FiUsers         | Fiados    |
| `/reportes`  | Reportes      | FiBarChart2     | Reportes  |
| `/compras`   | ListaCompras  | FiShoppingBag   | Compras   |

### 5.5 Páginas

#### PuntoDeVenta.jsx (~965 líneas)

La pantalla principal del sistema. Layout de dos columnas (60%/40% en desktop, una sola en mobile).

**Columna izquierda — Búsqueda y Productos:**
- Barra de búsqueda que detecta automáticamente el escáner de código de barras vs. texto manual.
- Grid de productos en 2 columnas con tarjetas que muestran nombre, precio y stock.

**Detección del escáner de código de barras:**

```
El escáner USB actúa como un teclado. Cuando escanea, "teclea" los dígitos
muy rápido (< 50ms entre cada tecla) y presiona Enter al final.

El código mide el tiempo entre teclas:
- Si el tiempo es < 50ms → es el escáner → busca por código de barras
- Si el tiempo es ≥ 50ms → es el usuario escribiendo → búsqueda por texto (debounced 300ms)
```

**Columna derecha — Carrito:**
- Lista de productos agregados con controles de cantidad (+/−)
- Footer sticky con el total en fuente grande (36px)
- 3 botones de pago:
  - 🟢 **Efectivo** — Registra la venta directamente
  - 🔵 **Tarjeta** — Registra la venta directamente
  - 🟡 **Fiado** — Abre un modal para seleccionar el cliente

**Flujo de venta por fiado:**
1. Click en botón "Fiado"
2. Se abre modal de selección de cliente
3. Se selecciona un cliente existente (o se crea uno nuevo)
4. Se confirma la venta
5. El backend crea la Venta + el Fiado automáticamente

#### Inventario.jsx (~748 líneas)

**Componentes principales:**
- **Header:** Título + botón grande "Agregar Producto"
- **Barra de búsqueda** + filtros "Todos" / "Bajo Stock"
- **Tabla responsive:** En desktop es tabla; en mobile cambia a tarjetas (CSS @media)

**Columnas de la tabla:**
Nombre | Código | Categoría | P. Compra | P. Venta | Stock | Stock Mín. | Estado | Acciones

**Código de colores del stock:**
- 🔴 Rojo: `stock ≤ stockMinimo` (bajo stock, urgente)
- 🟡 Ámbar: Stock cercano al mínimo
- 🟢 Verde: Stock OK

**Acciones por fila:**
- Botones **+/−** para ajustar stock rápidamente (llama `actualizarStock(id, +1 o -1)`)
- Botón **Editar** (abre modal con todos los campos)
- Botón **Eliminar** (con confirmación)

**Modal de Agregar/Editar Producto:**
Campos: nombre, códigoBarras, descripción, categoría (dropdown), precioCompra, precioVenta, stock, stockMinimo.

#### Fiados.jsx (~815 líneas)

**Tabs:**
- **"Pendientes"** (default): Muestra fiados sin pagar, agrupados por cliente
- **"Todos los Clientes"**: Lista de todos los clientes con su saldo

**Vista Pendientes:**
- Tarjetas por cliente con nombre, teléfono y total adeudado
- Click en la tarjeta → se expande mostrando cada fiado individual con:
  - Fecha del fiado
  - Monto total
  - Monto ya pagado
  - Monto restante
  - Botón "Pagar"

**Vista Todos los Clientes:**
- Grid de tarjetas con nombre, teléfono, dirección y saldo pendiente
- Botón "Agregar Cliente" → modal con: nombre (obligatorio), teléfono, dirección
- Click → se expande mostrando el historial de fiados (pagados y pendientes)

**Modal de Pago:**
- Muestra resumen: total del fiado, cuánto ya pagó, cuánto resta
- Campo para ingresar monto a pagar
- Botón "Pagar Todo" que auto-llena el monto restante
- Botón "Confirmar Pago" que llama `registrarPago(fiadoId, monto)`

#### Reportes.jsx (~553 líneas)

**Tabs de periodo:** Hoy | Semana | Mes | Personalizado (con date inputs)

**3 tarjetas resumen:**
- 💰 Total Vendido (suma de todas las ventas del periodo)
- 🧾 Número de Ventas (conteo)
- 📊 Ticket Promedio (total ÷ cantidad)

**Gráfica de barras horizontal:**
- Top 10 productos más vendidos
- Barras creadas con divs + CSS (sin librería externa)
- Muestra nombre del producto y cantidad vendida

**Tabla de historial de ventas:**
- Columnas: Fecha/Hora, Total, Método de pago, Productos
- Filas expandibles → muestran detalle de productos vendidos (nombre, cantidad, precio, subtotal)
- Badges de color por método de pago: 🟢 Efectivo, 🔵 Tarjeta, 🟡 Fiado

#### ListaCompras.jsx (~505 líneas)

**Título:** "Lista de Compras - Domingo" con la fecha del próximo domingo.

**Lista tipo checklist:**
- Cada ítem muestra: checkbox ✅, nombre del producto, stock actual → stock mínimo
- Controles +/− para ajustar la cantidad sugerida
- Costo estimado por producto (cantidad × precioCompra)

**Entrada manual:** Campo para agregar ítems que no están en el sistema.

**Total:** Suma del costo estimado de todos los productos.

**Botón "Imprimir Lista":** Usa `@media print` CSS para generar una versión limpia para imprimir.

---

## 6. Seguridad — JWT

### Arquitectura de Seguridad

```
Request del navegador
        │
        ▼
┌─────────────────────────┐
│  JwtAuthenticationFilter │
│  (OncePerRequestFilter)  │
│                          │
│  ¿Tiene header           │
│  "Authorization:         │──No──▶ Continúa sin autenticar
│   Bearer xxx"?           │        (solo accede a /api/auth/**)
│         │                │
│        Sí                │
│         ▼                │
│  Extraer token           │
│  Validar firma + fecha   │
│  Cargar UserDetails      │
│  Setear autenticación    │
│  en SecurityContext      │
│         │                │
│         ▼                │
│  Continúa la request     │
│  como usuario autenticado│
└─────────────────────────┘
```

### Clases de Seguridad

**SecurityConfig.java** — Configuración central de Spring Security:
- CSRF deshabilitado (API REST stateless)
- Sesiones deshabilitadas (`SessionCreationPolicy.STATELESS`) — cada request lleva su propio JWT
- Rutas públicas: `/api/auth/**` (login y registro)
- Todas las demás rutas `/api/**` requieren autenticación
- Password encoder: BCrypt

**JwtUtil.java** — Utilería para JWT:
- `generateToken(username, role)` — Crea un token con subject=username, claim "role", expiración configurable (default 24h)
- `extractUsername(token)` — Lee el username del token
- `extractRole(token)` — Lee el rol del token
- `validateToken(token, userDetails)` — Valida que el token no esté expirado y que el username coincida
- Usa HMAC-SHA con clave configurable desde `application.properties`

**JwtAuthenticationFilter.java** — Filtro que intercepta cada request:
- Lee el header `Authorization: Bearer <token>`
- Si hay token, lo valida y carga el `UserDetails` correspondiente
- Si es válido, setea la autenticación en el `SecurityContext`
- Excluye rutas que empiezan con `/api/auth/` (login y registro)

### Configuración JWT en application.properties

```properties
jwt.secret=TiendaDeMamaSecretKeyParaJWT2024MuySegura123456789
jwt.expiration=86400000   # 24 horas en milisegundos
```

**⚠️ Importante:** En producción, cambiar el `jwt.secret` por una clave larga y aleatoria. Idealmente usar una variable de entorno.

### Flujo de Login

```
1. POST /api/auth/login  { "username": "admin", "password": "1234" }
2. AuthService.login() → AuthenticationManager autentica
3. Si es válido → genera JWT con JwtUtil.generateToken()
4. Response: { "token": "eyJhb...", "nombre": "Admin", "rol": "ADMIN", "username": "admin" }
5. Frontend guarda el token y lo envía en cada request:
   Authorization: Bearer eyJhb...
```

### Flujo de Registro

```
1. POST /api/auth/registro  { "nombre": "Juan", "username": "juan", "password": "1234", "rol": "CAJERO" }
2. AuthService.registrar() → Valida que username no exista → Encripta password con BCrypt → Guarda
3. Response: { "mensaje": "Usuario creado correctamente", "username": "juan", "nombre": "Juan", "rol": "CAJERO" }
```

---

## 7. Flujos Principales

### 7.1 Flujo de una Venta (Efectivo o Tarjeta)

```
1. ESCANEO/BÚSQUEDA
   ├─ Escáner: Keystroke timing < 50ms → getProductoPorCodigo(codigo)
   └─ Manual: Debounce 300ms → buscarProductos(nombre)

2. AGREGAR AL CARRITO
   └─ Click en producto → se agrega al array de carrito con cantidad=1
      └─ Si ya existe → incrementa cantidad

3. AJUSTAR CANTIDADES
   └─ Botones +/− en el carrito

4. COBRAR
   └─ Click en "Efectivo" o "Tarjeta"
      └─ Envía POST /api/ventas con body:
         {
           "metodoPago": "EFECTIVO",
           "total": 86.00,
           "detalles": [
             {
               "producto": { "id": 1 },
               "cantidad": 2,
               "precioUnitario": 18.00,
               "subtotal": 36.00
             },
             {
               "producto": { "id": 3 },
               "cantidad": 5,
               "precioUnitario": 10.00,
               "subtotal": 50.00
             }
           ]
         }

5. BACKEND PROCESA
   ├─ Por cada detalle: resta stock del producto
   ├─ Guarda la venta con todos los detalles
   └─ Retorna la venta guardada

6. FRONTEND CONFIRMA
   └─ Toast de éxito ✅ + animación + limpia carrito
```

### 7.2 Flujo de un Fiado (Crédito)

```
1. COBRAR CON FIADO
   └─ Click en botón "Fiado" (ámbar)
      └─ Se abre modal de selección de cliente

2. SELECCIONAR/CREAR CLIENTE
   ├─ Buscar cliente existente por nombre
   └─ O crear nuevo: nombre (obligatorio), teléfono, dirección

3. CONFIRMAR VENTA
   └─ POST /api/ventas con body:
      {
        "metodoPago": "FIADO",
        "cliente": { "id": 5 },
        "total": 86.00,
        "detalles": [...]
      }

4. BACKEND PROCESA
   ├─ Resta stock (igual que efectivo)
   ├─ Guarda la venta
   └─ CREA REGISTRO DE FIADO automáticamente:
      {
        "cliente": { id: 5 },
        "venta": { id: 42 },
        "monto": 86.00,
        "montoPagado": 0,
        "pagado": false
      }

5. CUANDO EL CLIENTE PAGA (días/semanas después)
   └─ En la página Fiados → Click "Pagar" en el fiado
      └─ Modal de pago:
         ├─ Pago parcial: ingresa monto < restante
         │  └─ POST /api/fiados/42/pago  { "monto": 50.00 }
         │     └─ montoPagado: 0 → 50. Sigue pendiente.
         └─ Pago total: click "Pagar Todo" o ingresa monto = restante
            └─ POST /api/fiados/42/pago  { "monto": 36.00 }
               └─ montoPagado: 50 → 86. pagado = true ✅
```

### 7.3 Flujo de Lista de Compras

```
1. EL SISTEMA DETECTA PRODUCTOS BAJOS
   └─ Consulta: SELECT * FROM productos WHERE stock <= stockMinimo AND activo = true

2. GENERA LISTA AUTOMÁTICAMENTE
   └─ Para cada producto bajo stock:
      ├─ cantidadSugerida = stockMinimo × 2 − stockActual
      └─ costoEstimado = cantidadSugerida × precioCompra

   Ejemplo:
   ┌──────────────────┬───────┬────────┬───────────┬────────┬──────────┐
   │ Producto         │ Stock │ Mínimo │ Sugerido  │ P.Comp │ Costo    │
   ├──────────────────┼───────┼────────┼───────────┼────────┼──────────┤
   │ Coca-Cola 600ml  │   3   │   12   │    21     │ $12.00 │ $252.00  │
   │ Leche Lala 1L    │   2   │    8   │    14     │ $20.00 │ $280.00  │
   │ Arroz SOS 1kg    │   1   │    5   │     9     │ $22.00 │ $198.00  │
   └──────────────────┴───────┴────────┴───────────┴────────┴──────────┘
                                              TOTAL ESTIMADO: $730.00

3. EL USUARIO PUEDE
   ├─ Marcar items como "ya comprados" (checkbox)
   ├─ Ajustar cantidades sugeridas (+/−)
   ├─ Agregar items manuales
   └─ Imprimir la lista (botón que usa @media print)
```

---

## 8. API Reference (tabla completa)

### Autenticación (`/api/auth`) — PÚBLICO

| Método | Ruta                 | Body                                                              | Respuesta                                                          |
|--------|----------------------|-------------------------------------------------------------------|--------------------------------------------------------------------|
| POST   | `/api/auth/login`    | `{"username":"x","password":"y"}`                                 | `{"token":"eyJ...","nombre":"x","rol":"ADMIN","username":"x"}`     |
| POST   | `/api/auth/registro` | `{"nombre":"x","username":"y","password":"z","rol":"CAJERO"}`     | `{"mensaje":"Usuario creado correctamente","username":"y",...}`     |

### Productos (`/api/productos`) — REQUIERE JWT

| Método | Ruta                                   | Body / Params                                     | Respuesta                                |
|--------|----------------------------------------|---------------------------------------------------|------------------------------------------|
| GET    | `/api/productos`                       | —                                                 | `[{id,codigoBarras,nombre,...}]`         |
| GET    | `/api/productos/{id}`                  | —                                                 | `{id,codigoBarras,nombre,...}`           |
| GET    | `/api/productos/barcode/{codigo}`      | —                                                 | `{id,codigoBarras,nombre,...}`           |
| GET    | `/api/productos/buscar`                | `?nombre=coca`                                    | `[{id,nombre,...}]`                      |
| GET    | `/api/productos/categoria/{catId}`     | —                                                 | `[{id,nombre,...}]`                      |
| GET    | `/api/productos/bajo-stock`            | —                                                 | `[{id,nombre,stock,stockMinimo,...}]`    |
| GET    | `/api/productos/lista-compras`         | —                                                 | `[{productoId,nombre,stockActual,stockMinimo,cantidadSugerida,precioCompra,costoEstimado}]` |
| POST   | `/api/productos`                       | `{codigoBarras,nombre,precioCompra,precioVenta,stock,stockMinimo,categoria:{id}}` | Producto creado |
| PUT    | `/api/productos/{id}`                  | Producto completo                                 | Producto actualizado                     |
| PATCH  | `/api/productos/{id}/stock`            | `?cantidad=5` (positivo=suma, negativo=resta)     | `{"mensaje":"Stock actualizado"}`        |
| DELETE | `/api/productos/{id}`                  | —                                                 | `{"mensaje":"Producto eliminado"}`       |

### Categorías (`/api/categorias`) — REQUIERE JWT

| Método | Ruta               | Body                          | Respuesta              |
|--------|--------------------|---------------------------------|------------------------|
| GET    | `/api/categorias`  | —                               | `[{id,nombre,desc}]`  |
| POST   | `/api/categorias`  | `{"nombre":"x","descripcion":"y"}` | Categoría creada    |

### Ventas (`/api/ventas`) — REQUIERE JWT

| Método | Ruta                        | Body / Params                                          | Respuesta                              |
|--------|-----------------------------|--------------------------------------------------------|----------------------------------------|
| POST   | `/api/ventas`               | `{metodoPago,total,cliente:{id},detalles:[{producto:{id},cantidad,precioUnitario,subtotal}]}` | Venta guardada |
| GET    | `/api/ventas/{id}`          | —                                                      | Venta con detalles                     |
| GET    | `/api/ventas/hoy`           | —                                                      | `[ventas]`                             |
| GET    | `/api/ventas/semana`        | —                                                      | `[ventas]`                             |
| GET    | `/api/ventas/mes`           | —                                                      | `[ventas]`                             |
| GET    | `/api/ventas/rango`         | `?inicio=2024-01-01T00:00:00&fin=2024-12-31T23:59:59` | `[ventas]`                             |
| GET    | `/api/ventas/resumen`       | `?inicio=...&fin=...`                                  | `{cantidadVentas,totalVentas,productosMasVendidos}` |

### Clientes (`/api/clientes`) — REQUIERE JWT

| Método | Ruta                           | Body / Params              | Respuesta                                 |
|--------|--------------------------------|----------------------------|-------------------------------------------|
| GET    | `/api/clientes`                | —                          | `[{id,nombre,telefono,...}]`              |
| GET    | `/api/clientes/{id}`           | —                          | `{id,nombre,...}`                         |
| GET    | `/api/clientes/buscar`         | `?nombre=juan`             | `[{id,nombre,...}]`                       |
| GET    | `/api/clientes/{id}/saldo`     | —                          | `{"clienteId":1,"saldoPendiente":250.00}` |
| POST   | `/api/clientes`                | `{nombre,telefono,direccion}` | Cliente creado                         |
| PUT    | `/api/clientes/{id}`           | Cliente completo           | Cliente actualizado                       |
| DELETE | `/api/clientes/{id}`           | —                          | `{"mensaje":"Cliente eliminado"}`         |

### Fiados (`/api/fiados`) — REQUIERE JWT

| Método | Ruta                             | Body                   | Respuesta                          |
|--------|----------------------------------|------------------------|------------------------------------|
| GET    | `/api/fiados`                    | —                      | `[{id,cliente,venta,monto,...}]`   |
| GET    | `/api/fiados/pendientes`         | —                      | `[fiados con pagado=false]`        |
| GET    | `/api/fiados/cliente/{clienteId}`| —                      | `[fiados del cliente]`             |
| POST   | `/api/fiados/{id}/pago`          | `{"monto": 50.00}`    | `{"mensaje":"Pago registrado"}`    |

---

## 9. Configuración y Despliegue

### Configuración de MySQL

**1. Instalar MySQL 8+ (si no lo tienes):**

Windows: Descargar de https://dev.mysql.com/downloads/mysql/
Mac: `brew install mysql`
Linux: `sudo apt install mysql-server`

**2. Crear la base de datos:**

```sql
mysql -u root -p -e "CREATE DATABASE tienda_mama CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

`utf8mb4` soporta todos los caracteres en español (ñ, acentos, etc.).

**3. Crear usuario de primer acceso (en la base de datos, no MySQL):**

La primera vez que arranque la app, necesitas registrar un usuario admin manualmente con una petición HTTP (porque /api/auth/registro es público):

```bash
curl -X POST http://localhost:8080/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Administrador","username":"admin","password":"1234","rol":"ADMIN"}'
```

### application.properties explicado línea por línea

```properties
# Nombre de la aplicación (aparece en logs)
spring.application.name=Tienda de Mama

# ============ MySQL ============
# URL de conexión: host:puerto/nombre_db + opciones
# useSSL=false          → no usar SSL (ok para local)
# serverTimezone        → zona horaria de México
# allowPublicKeyRetrieval → necesario para autenticación MySQL 8
spring.datasource.url=jdbc:mysql://localhost:3306/tienda_mama?useSSL=false&serverTimezone=America/Mexico_City&allowPublicKeyRetrieval=true

# Driver de MySQL
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# Credenciales MySQL (cambiar según tu instalación)
spring.datasource.username=root
spring.datasource.password=

# ============ JPA ============
# update = crear tablas nuevas automáticamente, no borrar datos existentes
# Otras opciones: create (borra y recrea), validate (solo valida), none
spring.jpa.hibernate.ddl-auto=update

# No mostrar SQL en la consola (cambiar a true para debug)
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Dialecto de MySQL para optimizar las queries generadas
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# ============ Server ============
# Puerto del backend
server.port=8080

# ============ CORS ============
# Orígenes permitidos (agregar URL del VPS en producción)
spring.web.cors.allowed-origins=http://localhost:5173,http://localhost:3000

# ============ JWT ============
# Clave secreta para firmar tokens (CAMBIAR EN PRODUCCIÓN)
jwt.secret=TiendaDeMamaSecretKeyParaJWT2024MuySegura123456789

# Tiempo de expiración del token en milisegundos (86400000 = 24 horas)
jwt.expiration=86400000
```

### Cómo correr en desarrollo

**Terminal 1 — Backend:**

```bash
cd tienda-mama/backend
mvn spring-boot:run
```

Arranca en `http://localhost:8080`. Las tablas se crean automáticamente la primera vez.

**Terminal 2 — Frontend:**

```bash
cd tienda-mama/frontend
npm install       # Solo la primera vez
npm run dev
```

Arranca en `http://localhost:5173`. Abre esa URL en tu navegador.

### Cómo conectar la tablet

1. Asegúrate que la tablet y la computadora estén en la **misma red WiFi**
2. En la computadora, encuentra tu IP local:
   - Windows: `ipconfig` → busca "IPv4 Address" (ej: 192.168.1.100)
   - Mac/Linux: `ifconfig` o `ip addr` → busca la IP de tu adaptador WiFi
3. En la tablet, abre Chrome y ve a: `http://192.168.1.100:5173`
4. **Tip:** Agrega la página como acceso directo en la pantalla de inicio para que se vea como una app

### Datos iniciales (DataInitializer)

La primera vez que arranca el backend con la base de datos vacía, `DataInitializer.java` crea automáticamente:

**6 categorías:** Bebidas, Botanas, Lácteos, Abarrotes, Limpieza, Higiene Personal

**13 productos de ejemplo** con precios reales en MXN:

| Producto               | Categoría | P.Compra | P.Venta | Stock | Mínimo |
|------------------------|-----------|----------|---------|-------|--------|
| Coca-Cola 600ml        | Bebidas   | $12.00   | $18.00  | 48    | 12     |
| Coca-Cola 2L           | Bebidas   | $25.00   | $35.00  | 24    | 6      |
| Agua Ciel 600ml        | Bebidas   | $5.00    | $10.00  | 60    | 12     |
| Sabritas Original 45g  | Botanas   | $10.00   | $18.00  | 30    | 10     |
| Doritos Nacho 62g      | Botanas   | $12.00   | $20.00  | 25    | 10     |
| Leche Lala 1L          | Lácteos   | $20.00   | $28.00  | 20    | 8      |
| Yogurt Yoplait 1kg     | Lácteos   | $30.00   | $42.00  | 15    | 5      |
| Arroz SOS 1kg          | Abarrotes | $22.00   | $32.00  | 15    | 5      |
| Frijol La Sierra 560g  | Abarrotes | $18.00   | $28.00  | 20    | 8      |
| Aceite 123 1L          | Abarrotes | $35.00   | $48.00  | 10    | 4      |
| Fabuloso 1L            | Limpieza  | $25.00   | $38.00  | 12    | 4      |
| Cloro Cloralex 1L      | Limpieza  | $15.00   | $25.00  | 10    | 4      |
| Papel Higiénico Petal  | Higiene   | $22.00   | $35.00  | 15    | 5      |

Los productos incluyen códigos de barras EAN-13 reales de marcas mexicanas para que funcionen con un escáner.

---

## Glosario

| Término         | Significado                                                  |
|-----------------|--------------------------------------------------------------|
| POS             | Point of Sale (Punto de Venta)                               |
| Fiado           | Venta a crédito. El cliente se lleva el producto y paga después |
| Stock Mínimo    | Cantidad mínima que debería haber. Por debajo = alerta       |
| Borrado Lógico  | En vez de borrar el registro de la DB, se marca `activo=false` |
| SPA             | Single Page Application — la página no se recarga completa   |
| JWT             | JSON Web Token — token firmado para autenticación stateless  |
| BCrypt          | Algoritmo de hash para guardar passwords de forma segura     |
| CORS            | Cross-Origin Resource Sharing — permite que el frontend (puerto 5173) hable con el backend (puerto 8080) |
| JPQL            | Java Persistence Query Language — SQL-like para entidades JPA |
| Query Derivation| Spring Data genera SQL automáticamente a partir del nombre del método |
