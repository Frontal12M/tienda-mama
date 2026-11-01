package com.tienda.controller;

import com.tienda.model.Usuario;
import com.tienda.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");

            if (username == null || password == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("mensaje", "Usuario y contraseña son obligatorios"));
            }

            Map<String, Object> response = authService.login(username, password);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Usuario usuario) {
        try {
            if (usuario.getRol() == null) {
                usuario.setRol(Usuario.Rol.CAJERO);
            }
            Usuario creado = authService.registrar(usuario);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Usuario creado correctamente",
                    "username", creado.getUsername(),
                    "nombre", creado.getNombre(),
                    "rol", creado.getRol().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", e.getMessage()));
        }
    }
}
