package com.template.transito.domain.service;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.template.transito.domain.exception.EntidadeNaoEncontradaException;
import com.template.transito.domain.exception.NegocioException;
import com.template.transito.domain.model.Proprietario;
import com.template.transito.domain.model.StatusVeiculo;
import com.template.transito.domain.model.Veiculo;
import com.template.transito.domain.repository.VeiculoRepository;


import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class RegistroVeiculoService {

  private final VeiculoRepository veiculoRepository;
  private final RegistroProprietarioService registroProprietarioService;


  public Veiculo buscarPorId(Long veiculoId) {
    return veiculoRepository.findById(veiculoId)
      .orElseThrow(() -> new EntidadeNaoEncontradaException("Veículo não encontrado"));
  }

  @Transactional
  public Veiculo cadastrar(Veiculo novoVeiculo) {

    if(novoVeiculo.getId() != null) {
      throw new NegocioException("O ID do veículo deve ser nulo para cadastro.");
    }

    boolean placaEmUso = veiculoRepository.findByPlaca(novoVeiculo.getPlaca())
      .filter(veiculo -> !veiculo.equals(novoVeiculo))
      .isPresent();

    if (placaEmUso) {
      throw new NegocioException("Já existe um veículo cadastrado com esta placa");
    }

    Proprietario proprietario = registroProprietarioService.buscarPorId(novoVeiculo.getProprietario().getId());

    novoVeiculo.setProprietario(proprietario);
    novoVeiculo.setStatus(StatusVeiculo.REGULAR);
    novoVeiculo.setDataCadastro(OffsetDateTime.now());
    
    return veiculoRepository.save(novoVeiculo);
  }

}
