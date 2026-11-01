package com.tienda.service;

import com.tienda.model.DetalleVenta;
import com.tienda.model.Fiado;
import com.tienda.model.Producto;
import com.tienda.model.Venta;
import com.tienda.repository.FiadoRepository;
import com.tienda.repository.ProductoRepository;
import com.tienda.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final FiadoRepository fiadoRepository;

    public VentaService(VentaRepository ventaRepository,
                        ProductoRepository productoRepository,
                        FiadoRepository fiadoRepository) {
        this.ventaRepository = ventaRepository;
        this.productoRepository = productoRepository;
        this.fiadoRepository = fiadoRepository;
    }

    public Venta registrarVenta(Venta venta) {
        for (DetalleVenta detalle : venta.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new RuntimeException(
                            "Producto no encontrado con id: " + detalle.getProducto().getId()));

            if (producto.getStock() < detalle.getCantidad()) {
                throw new RuntimeException(
                        "Stock insuficiente para el producto: " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - detalle.getCantidad());
            productoRepository.save(producto);

            detalle.setVenta(venta);
        }

        if (venta.getFechaVenta() == null) {
            venta.setFechaVenta(LocalDateTime.now());
        }

        Venta ventaGuardada = ventaRepository.save(venta);

        if (venta.getMetodoPago() == com.tienda.model.MetodoPago.FIADO) {
            if (venta.getCliente() == null) {
                throw new RuntimeException("Se requiere un cliente para ventas a fiado");
            }
            Fiado fiado = new Fiado();
            fiado.setCliente(venta.getCliente());
            fiado.setVenta(ventaGuardada);
            fiado.setMonto(venta.getTotal());
            fiado.setMontoPagado(BigDecimal.ZERO);
            fiado.setPagado(false);
            fiado.setFechaFiado(LocalDateTime.now());
            fiadoRepository.save(fiado);
        }

        return ventaGuardada;
    }

    public Optional<Venta> buscarPorId(Long id) {
        return ventaRepository.findById(id);
    }

    public List<Venta> getVentasPorRango(LocalDateTime inicio, LocalDateTime fin) {
        return ventaRepository.findByFechaVentaBetween(inicio, fin);
    }

    public List<Venta> getVentasHoy() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fin = LocalDate.now().atTime(LocalTime.MAX);
        return ventaRepository.findByFechaVentaBetween(inicio, fin);
    }

    public List<Venta> getVentasSemana() {
        LocalDateTime inicio = LocalDate.now().with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime fin = LocalDateTime.now();
        return ventaRepository.findByFechaVentaBetween(inicio, fin);
    }

    public List<Venta> getVentasMes() {
        LocalDateTime inicio = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        LocalDateTime fin = LocalDateTime.now();
        return ventaRepository.findByFechaVentaBetween(inicio, fin);
    }

    public Map<String, Object> getResumenVentas(LocalDateTime inicio, LocalDateTime fin) {
        Map<String, Object> resumen = new HashMap<>();

        List<Venta> ventas = ventaRepository.findByFechaVentaBetween(inicio, fin);
        resumen.put("cantidadVentas", ventas.size());
        resumen.put("totalVentas", ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        resumen.put("productosMasVendidos", ventaRepository.productosMasVendidos(inicio, fin));

        return resumen;
    }

    public Map<String, Object> getCorteDeCaja(LocalDateTime inicio, LocalDateTime fin) {
        Map<String, Object> corte = new HashMap<>();

        List<Venta> ventas = ventaRepository.findByFechaVentaBetween(inicio, fin);

        BigDecimal totalVentas = ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ganancia = ventaRepository.gananciaEnRango(inicio, fin);
        if (ganancia == null) ganancia = BigDecimal.ZERO;

        BigDecimal recomendacionAhorro = ganancia.multiply(new BigDecimal("0.50"))
                .setScale(2, RoundingMode.HALF_UP);

        corte.put("totalVentas", totalVentas);
        corte.put("cantidadVentas", ventas.size());
        corte.put("ganancia", ganancia);
        corte.put("recomendacionAhorro", recomendacionAhorro);

        List<Object[]> metodoRaw = ventaRepository.resumenPorMetodoPago(inicio, fin);
        List<Map<String, Object>> porMetodo = new ArrayList<>();
        for (Object[] row : metodoRaw) {
            Map<String, Object> m = new HashMap<>();
            m.put("metodo", row[0].toString());
            m.put("cantidad", row[1]);
            m.put("total", row[2]);
            porMetodo.add(m);
        }
        corte.put("porMetodoPago", porMetodo);

        corte.put("productosMasVendidos", ventaRepository.productosMasVendidos(inicio, fin));

        return corte;
    }
}
