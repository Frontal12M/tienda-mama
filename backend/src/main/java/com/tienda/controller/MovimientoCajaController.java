package com.tienda.controller;

import com.tienda.model.MovimientoCaja;
import com.tienda.service.MovimientoCajaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/movimientos-caja")
@CrossOrigin
public class MovimientoCajaController {

    private final MovimientoCajaService movimientoCajaService;

    public MovimientoCajaController(MovimientoCajaService movimientoCajaService) {
        this.movimientoCajaService = movimientoCajaService;
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody MovimientoCaja movimiento) {
        MovimientoCaja guardado = movimientoCajaService.registrar(movimiento);
        return ResponseEntity.ok(guardado);
    }

    @GetMapping
    public ResponseEntity<?> getMovimientos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return ResponseEntity.ok(movimientoCajaService.getMovimientosPorRango(inicioDateTime, finDateTime));
    }

    @GetMapping("/resumen")
    public ResponseEntity<?> getResumen(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);
        return ResponseEntity.ok(movimientoCajaService.getResumen(inicioDateTime, finDateTime));
    }
}
