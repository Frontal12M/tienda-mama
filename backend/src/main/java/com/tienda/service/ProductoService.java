package com.tienda.service;

import com.tienda.model.Producto;
import com.tienda.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    public List<Producto> listarActivos() {
        return productoRepository.findByActivoTrue();
    }

    public Optional<Producto> buscarPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Optional<Producto> buscarPorCodigoBarras(String codigoBarras) {
        return productoRepository.findByCodigoBarras(codigoBarras);
    }

    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepository.findByNombreContainingIgnoreCase(nombre);
    }

    public List<Producto> buscarPorCategoria(Long categoriaId) {
        return productoRepository.findByCategoriaId(categoriaId);
    }

    public Producto guardar(Producto producto) {
        return productoRepository.save(producto);
    }

    public void eliminar(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    public List<Producto> getProductosBajoStock() {
        return productoRepository.findProductosBajoStock();
    }

    public Producto actualizarStock(Long productoId, int cantidad) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + productoId));
        int nuevoStock = producto.getStock() + cantidad;
        if (nuevoStock < 0) {
            throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
        }
        producto.setStock(nuevoStock);
        return productoRepository.save(producto);
    }

    public List<Map<String, Object>> generarListaCompras() {
        List<Producto> productosBajoStock = productoRepository.findProductosBajoStock();
        return productosBajoStock.stream().map(p -> {
            Map<String, Object> item = new HashMap<>();
            item.put("productoId", p.getId());
            item.put("nombre", p.getNombre());
            item.put("stockActual", p.getStock());
            item.put("stockMinimo", p.getStockMinimo());
            int cantidadSugerida = p.getStockMinimo() * 2 - p.getStock();
            item.put("cantidadSugerida", cantidadSugerida);
            item.put("precioCompra", p.getPrecioCompra());
            item.put("costoEstimado", p.getPrecioCompra().multiply(java.math.BigDecimal.valueOf(cantidadSugerida)));
            return item;
        }).collect(Collectors.toList());
    }
}
