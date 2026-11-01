package com.tienda.controller;

import com.tienda.model.Cliente;
import com.tienda.service.ClienteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public ResponseEntity<List<Cliente>> getAll() {
        return ResponseEntity.ok(clienteService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return clienteService.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("mensaje", "Cliente no encontrado con id: " + id)));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Cliente>> buscarPorNombre(@RequestParam String nombre) {
        return ResponseEntity.ok(clienteService.buscarPorNombre(nombre));
    }

    @GetMapping("/{id}/saldo")
    public ResponseEntity<?> getSaldoPendiente(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(Map.of("clienteId", id, "saldoPendiente", clienteService.getSaldoPendiente(id)));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("mensaje", "Cliente no encontrado con id: " + id));
        }
    }

    @PostMapping
    public ResponseEntity<Cliente> crear(@RequestBody Cliente cliente) {
        return ResponseEntity.ok(clienteService.guardar(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Cliente cliente) {
        return clienteService.buscarPorId(id)
                .<ResponseEntity<?>>map(existing -> {
                    cliente.setId(id);
                    return ResponseEntity.ok(clienteService.guardar(cliente));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("mensaje", "Cliente no encontrado con id: " + id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            clienteService.eliminar(id);
            return ResponseEntity.ok(Map.of("mensaje", "Cliente eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("mensaje", "Cliente no encontrado con id: " + id));
        }
    }
}
