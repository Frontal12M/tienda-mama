package com.tienda.repository;

import com.tienda.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    List<Venta> findByFechaVentaBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT DATE(v.fechaVenta) as fecha, SUM(v.total) as total " +
           "FROM Venta v WHERE v.fechaVenta BETWEEN :inicio AND :fin " +
           "GROUP BY DATE(v.fechaVenta)")
    List<Object[]> ventasPorDia(@Param("inicio") LocalDateTime inicio,
                                @Param("fin") LocalDateTime fin);

    @Query("SELECT dv.producto.id, dv.producto.nombre, SUM(dv.cantidad) as totalVendido " +
           "FROM DetalleVenta dv WHERE dv.venta.fechaVenta BETWEEN :inicio AND :fin " +
           "GROUP BY dv.producto.id, dv.producto.nombre ORDER BY totalVendido DESC")
    List<Object[]> productosMasVendidos(@Param("inicio") LocalDateTime inicio,
                                        @Param("fin") LocalDateTime fin);

    @Query("SELECT SUM(dv.cantidad * (dv.producto.precioVenta - dv.producto.precioCompra)) " +
           "FROM DetalleVenta dv WHERE dv.venta.fechaVenta BETWEEN :inicio AND :fin")
    BigDecimal gananciaEnRango(@Param("inicio") LocalDateTime inicio,
                               @Param("fin") LocalDateTime fin);

    @Query("SELECT v.metodoPago, COUNT(v), SUM(v.total) " +
           "FROM Venta v WHERE v.fechaVenta BETWEEN :inicio AND :fin " +
           "GROUP BY v.metodoPago")
    List<Object[]> resumenPorMetodoPago(@Param("inicio") LocalDateTime inicio,
                                        @Param("fin") LocalDateTime fin);
}
