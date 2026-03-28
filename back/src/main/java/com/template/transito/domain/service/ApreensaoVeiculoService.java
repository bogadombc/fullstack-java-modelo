package com.template.transito.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class ApreensaoVeiculoService {

  private final RegistroVeiculoService registroVeiculoService;

  @Transactional
  public void apreenderVeiculo(Long veiculoId) {
    var veiculo = registroVeiculoService.buscarPorId(veiculoId);
    veiculo.apreender();
  }

  @Transactional
  public void liberarVeiculo(Long veiculoId) {
    var veiculo = registroVeiculoService.buscarPorId(veiculoId);
    veiculo.liberarVeiculo();
  }
}
