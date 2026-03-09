package com.template.transito.domain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.template.transito.domain.model.Veiculo;
import org.springframework.stereotype.Repository;


@Repository
public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {

  Optional<Veiculo> findByPlaca(String placa);

}
