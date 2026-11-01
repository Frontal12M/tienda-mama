package com.tienda.controller;

import com.tienda.model.Fiado;
import com.tienda.service.FiadoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fiados")
@CrossOrigin
public class FiadoController {

    private final FiadoService fiadoService;

    public FiadoController(FiadoService fiadoService) {
        this.fiadoService = fiadoService;
    }

    @GetMapping
    public ResponseEntity<List<Fiado>> getAll() {
        return ResponseEntity.ok(fiadoService.listarTodos());
    }

    @GetMapping("/pendientes")
    public ResponseEntity<List<Fiado>> getPendientes() {
        return ResponseEntity.ok(fiadoService.getFiadosPendientes());
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Fiado>> getPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(fiadoService.getFiadosPorCliente(clienteId));
    }

    @PostMapping("/{id}/pago")
    public ResponseEntity<?> registrarPago(@PathVariable Long id, @RequestBody Map<String, BigDecimal> body) {
        try {
            BigDecimal monto = body.get("monto");
            if (monto == null) {
                return ResponseEntity.badRequest().body(Map.of("mensaje", "El campo 'monto' es requerido"));
            }
            fiadoService.registrarPago(id, monto);
            return ResponseEntity.ok(Map.of("mensaje", "Pago registrado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("mensaje", "Fiado no encontrado con id: " + id));
        }
    }
}
