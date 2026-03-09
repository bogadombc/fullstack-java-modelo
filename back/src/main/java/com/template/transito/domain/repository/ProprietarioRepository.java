package com.template.transito.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.template.transito.domain.model.Proprietario;

import org.springframework.stereotype.Repository;

@Repository
public interface ProprietarioRepository extends JpaRepository<Proprietario, Long>{
  List<Proprietario> findByNome(String nome);

  Optional<Proprietario> findByEmail(String email);

}
