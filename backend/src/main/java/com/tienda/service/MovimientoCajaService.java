package com.tienda.service;

import com.tienda.model.MovimientoCaja;
import com.tienda.repository.MovimientoCajaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class MovimientoCajaService {

    private final MovimientoCajaRepository movimientoCajaRepository;

    public MovimientoCajaService(MovimientoCajaRepository movimientoCajaRepository) {
        this.movimientoCajaRepository = movimientoCajaRepository;
    }

    public MovimientoCaja registrar(MovimientoCaja movimiento) {
        return movimientoCajaRepository.save(movimiento);
    }

    public List<MovimientoCaja> getMovimientosPorRango(LocalDateTime inicio, LocalDateTime fin) {
        return movimientoCajaRepository.findByFechaBetweenOrderByFechaDesc(inicio, fin);
    }

    public Map<String, Object> getResumen(LocalDateTime inicio, LocalDateTime fin) {
        Map<String, Object> resumen = new HashMap<>();
        BigDecimal entradas = movimientoCajaRepository.totalEntradas(inicio, fin);
        BigDecimal salidas = movimientoCajaRepository.totalSalidas(inicio, fin);
        resumen.put("totalEntradas", entradas);
        resumen.put("totalSalidas", salidas);
        resumen.put("balance", entradas.subtract(salidas));
        resumen.put("movimientos", movimientoCajaRepository.findByFechaBetweenOrderByFechaDesc(inicio, fin));
        return resumen;
    }
}
