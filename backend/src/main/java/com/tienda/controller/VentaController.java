package com.tienda.controller;

import com.tienda.model.Venta;
import com.tienda.service.VentaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @PostMapping
    public ResponseEntity<?> registrarVenta(@RequestBody Venta venta) {
        Venta guardada = ventaService.registrarVenta(venta);
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", guardada.getId());
        resp.put("total", guardada.getTotal());
        resp.put("metodoPago", guardada.getMetodoPago());
        resp.put("fechaVenta", guardada.getFechaVenta());
        resp.put("message", "Venta registrada exitosamente");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ventaService.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("mensaje", "Venta no encontrada con id: " + id)));
    }

    @GetMapping("/hoy")
    public ResponseEntity<?> getVentasHoy() {
        return ResponseEntity.ok(ventaService.getVentasHoy());
    }

    @GetMapping("/semana")
    public ResponseEntity<?> getVentasSemana() {
        return ResponseEntity.ok(ventaService.getVentasSemana());
    }

    @GetMapping("/mes")
    public ResponseEntity<?> getVentasMes() {
        return ResponseEntity.ok(ventaService.getVentasMes());
    }

    @GetMapping("/rango")
    public ResponseEntity<?> getVentasPorRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ventaService.getVentasPorRango(inicioDateTime, finDateTime));
    }

    @GetMapping("/resumen")
    public ResponseEntity<?> getResumenVentas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ventaService.getResumenVentas(inicioDateTime, finDateTime));
    }

    @GetMapping("/corte")
    public ResponseEntity<?> getCorteDeCaja(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return ResponseEntity.ok(ventaService.getCorteDeCaja(inicioDateTime, finDateTime));
    }
}
