package com.tienda.config;

import com.tienda.model.Categoria;
import com.tienda.model.Usuario;
import com.tienda.repository.CategoriaRepository;
import com.tienda.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(CategoriaRepository categoriaRepo,
                               UsuarioRepository usuarioRepo,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            if (!usuarioRepo.existsByUsername("admin")) {
                Usuario admin = new Usuario();
                admin.setNombre("Administrador");
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRol(Usuario.Rol.ADMIN);
                usuarioRepo.save(admin);
            }

            if (categoriaRepo.count() == 0) {
                categoriaRepo.save(crearCategoria("Bebidas", "Refrescos, jugos, agua"));
                categoriaRepo.save(crearCategoria("Botanas", "Papas, cacahuates, dulces"));
                categoriaRepo.save(crearCategoria("Lacteos", "Leche, queso, yogurt"));
                categoriaRepo.save(crearCategoria("Abarrotes", "Arroz, frijol, aceite, enlatados"));
                categoriaRepo.save(crearCategoria("Limpieza", "Jabon, cloro, detergente"));
                categoriaRepo.save(crearCategoria("Higiene Personal", "Shampoo, pasta dental, papel"));
            }
        };
    }

    private Categoria crearCategoria(String nombre, String descripcion) {
        Categoria c = new Categoria();
        c.setNombre(nombre);
        c.setDescripcion(descripcion);
        return c;
    }
}
