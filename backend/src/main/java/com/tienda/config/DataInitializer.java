package com.tienda.config;

import com.tienda.model.Categoria;
import com.tienda.model.Producto;
import com.tienda.model.Usuario;
import com.tienda.repository.CategoriaRepository;
import com.tienda.repository.ProductoRepository;
import com.tienda.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(CategoriaRepository categoriaRepo,
                               ProductoRepository productoRepo,
                               UsuarioRepository usuarioRepo,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            // Crear usuario admin por defecto si no existe
            if (!usuarioRepo.existsByUsername("admin")) {
                Usuario admin = new Usuario();
                admin.setNombre("Administrador");
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRol(Usuario.Rol.ADMIN);
                usuarioRepo.save(admin);
            }

            if (categoriaRepo.count() > 0) return;

            Categoria bebidas = new Categoria();
            bebidas.setNombre("Bebidas");
            bebidas.setDescripcion("Refrescos, jugos, agua");
            categoriaRepo.save(bebidas);

            Categoria botanas = new Categoria();
            botanas.setNombre("Botanas");
            botanas.setDescripcion("Papas, cacahuates, dulces");
            categoriaRepo.save(botanas);

            Categoria lacteos = new Categoria();
            lacteos.setNombre("Lacteos");
            lacteos.setDescripcion("Leche, queso, yogurt");
            categoriaRepo.save(lacteos);

            Categoria abarrotes = new Categoria();
            abarrotes.setNombre("Abarrotes");
            abarrotes.setDescripcion("Arroz, frijol, aceite, enlatados");
            categoriaRepo.save(abarrotes);

            Categoria limpieza = new Categoria();
            limpieza.setNombre("Limpieza");
            limpieza.setDescripcion("Jabon, cloro, detergente");
            categoriaRepo.save(limpieza);

            Categoria higiene = new Categoria();
            higiene.setNombre("Higiene Personal");
            higiene.setDescripcion("Shampoo, pasta dental, papel");
            categoriaRepo.save(higiene);

            crearProducto(productoRepo, "7501055303182", "Coca-Cola 600ml", bebidas, 12.00, 18.00, 48, 12);
            crearProducto(productoRepo, "7501055303199", "Coca-Cola 2L", bebidas, 25.00, 35.00, 24, 6);
            crearProducto(productoRepo, "7501055363001", "Agua Ciel 600ml", bebidas, 5.00, 10.00, 60, 12);
            crearProducto(productoRepo, "7501000911721", "Sabritas Original 45g", botanas, 10.00, 18.00, 30, 10);
            crearProducto(productoRepo, "7501000913923", "Doritos Nacho 62g", botanas, 12.00, 20.00, 25, 10);
            crearProducto(productoRepo, "7501005102735", "Leche Lala 1L", lacteos, 20.00, 28.00, 20, 8);
            crearProducto(productoRepo, "7501005102742", "Yogurt Yoplait 1kg", lacteos, 30.00, 42.00, 15, 5);
            crearProducto(productoRepo, "7501008042236", "Arroz SOS 1kg", abarrotes, 22.00, 32.00, 15, 5);
            crearProducto(productoRepo, "7501008055236", "Frijol La Sierra 560g", abarrotes, 18.00, 28.00, 20, 8);
            crearProducto(productoRepo, "7501035910195", "Aceite 123 1L", abarrotes, 35.00, 48.00, 10, 4);
            crearProducto(productoRepo, "7501199413150", "Fabuloso 1L", limpieza, 25.00, 38.00, 12, 4);
            crearProducto(productoRepo, "7501199413167", "Cloro Cloralex 1L", limpieza, 15.00, 25.00, 10, 4);
            crearProducto(productoRepo, "7501001164263", "Papel Higienico Petal 4pz", higiene, 22.00, 35.00, 15, 5);
        };
    }

    private void crearProducto(ProductoRepository repo, String codigo, String nombre,
                                Categoria categoria, double compra, double venta, int stock, int minimo) {
        Producto p = new Producto();
        p.setCodigoBarras(codigo);
        p.setNombre(nombre);
        p.setCategoria(categoria);
        p.setPrecioCompra(BigDecimal.valueOf(compra));
        p.setPrecioVenta(BigDecimal.valueOf(venta));
        p.setStock(stock);
        p.setStockMinimo(minimo);
        repo.save(p);
    }
}
