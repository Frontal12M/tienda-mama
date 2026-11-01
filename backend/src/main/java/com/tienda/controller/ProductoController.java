package com.tienda.controller;

import com.tienda.model.Producto;
import com.tienda.service.ProductoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public ResponseEntity<List<Producto>> getAll() {
        return ResponseEntity.ok(productoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return productoService.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("mensaje", "Producto no encontrado con id: " + id)));
    }

    @GetMapping("/barcode/{codigo}")
    public ResponseEntity<?> getByCodigoBarras(@PathVariable String codigo) {
        return productoService.buscarPorCodigoBarras(codigo)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("mensaje", "Producto no encontrado con codigo de barras: " + codigo)));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Producto>> buscarPorNombre(@RequestParam String nombre) {
        return ResponseEntity.ok(productoService.buscarPorNombre(nombre));
    }

    @GetMapping("/categoria/{categoriaId}")
    public ResponseEntity<List<Producto>> getByCategoria(@PathVariable Long categoriaId) {
        return ResponseEntity.ok(productoService.buscarPorCategoria(categoriaId));
    }

    @GetMapping("/bajo-stock")
    public ResponseEntity<List<Producto>> getBajoStock() {
        return ResponseEntity.ok(productoService.getProductosBajoStock());
    }

    @GetMapping("/lista-compras")
    public ResponseEntity<?> getListaCompras() {
        return ResponseEntity.ok(productoService.generarListaCompras());
    }

    @PostMapping
    public ResponseEntity<Producto> crear(@RequestBody Producto producto) {
        return ResponseEntity.ok(productoService.guardar(producto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Producto producto) {
        return productoService.buscarPorId(id)
                .<ResponseEntity<?>>map(existing -> {
                    producto.setId(id);
                    return ResponseEntity.ok(productoService.guardar(producto));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("mensaje", "Producto no encontrado con id: " + id)));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> actualizarStock(@PathVariable Long id, @RequestParam int cantidad) {
        try {
            productoService.actualizarStock(id, cantidad);
            return ResponseEntity.ok(Map.of("mensaje", "Stock actualizado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("mensaje", "Producto no encontrado con id: " + id));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            productoService.eliminar(id);
            return ResponseEntity.ok(Map.of("mensaje", "Producto eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("mensaje", "Producto no encontrado con id: " + id));
        }
    }
}
