package com.tienda.repository;

import com.tienda.model.Fiado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FiadoRepository extends JpaRepository<Fiado, Long> {

    List<Fiado> findByClienteId(Long clienteId);

    List<Fiado> findByPagadoFalse();

    List<Fiado> findByClienteIdAndPagadoFalse(Long clienteId);
}
