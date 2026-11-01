package com.tienda.service;

import com.tienda.model.Fiado;
import com.tienda.repository.FiadoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class FiadoService {

    private final FiadoRepository fiadoRepository;

    public FiadoService(FiadoRepository fiadoRepository) {
        this.fiadoRepository = fiadoRepository;
    }

    public Fiado registrarPago(Long fiadoId, BigDecimal monto) {
        Fiado fiado = fiadoRepository.findById(fiadoId)
                .orElseThrow(() -> new RuntimeException("Fiado no encontrado con id: " + fiadoId));

        if (fiado.getPagado()) {
            throw new RuntimeException("Este fiado ya fue pagado completamente");
        }

        BigDecimal saldoPendiente = fiado.getMonto().subtract(fiado.getMontoPagado());
        if (monto.compareTo(saldoPendiente) > 0) {
            throw new RuntimeException("El monto del pago excede el saldo pendiente de: " + saldoPendiente);
        }

        fiado.setMontoPagado(fiado.getMontoPagado().add(monto));

        if (fiado.getMontoPagado().compareTo(fiado.getMonto()) >= 0) {
            fiado.setPagado(true);
        }

        return fiadoRepository.save(fiado);
    }

    public List<Fiado> listarTodos() {
        return fiadoRepository.findAll();
    }

    public List<Fiado> getFiadosPendientes() {
        return fiadoRepository.findByPagadoFalse();
    }

    public List<Fiado> getFiadosPorCliente(Long clienteId) {
        return fiadoRepository.findByClienteId(clienteId);
    }
}
