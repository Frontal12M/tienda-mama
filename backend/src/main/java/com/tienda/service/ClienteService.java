package com.tienda.service;

import com.tienda.model.Cliente;
import com.tienda.model.Fiado;
import com.tienda.repository.ClienteRepository;
import com.tienda.repository.FiadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final FiadoRepository fiadoRepository;

    public ClienteService(ClienteRepository clienteRepository, FiadoRepository fiadoRepository) {
        this.clienteRepository = clienteRepository;
        this.fiadoRepository = fiadoRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public List<Cliente> listarActivos() {
        return clienteRepository.findByActivoTrue();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public List<Cliente> buscarPorNombre(String nombre) {
        return clienteRepository.findByNombreContainingIgnoreCase(nombre);
    }

    public Cliente guardar(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public void eliminar(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + id));
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    public BigDecimal getSaldoPendiente(Long clienteId) {
        List<Fiado> fiadosPendientes = fiadoRepository.findByClienteIdAndPagadoFalse(clienteId);
        return fiadosPendientes.stream()
                .map(f -> f.getMonto().subtract(f.getMontoPagado()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
