package com.template.transito.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.template.transito.domain.model.Autuacao;
import com.template.transito.domain.model.Veiculo;


import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class RegistroAutuacaoService {

  private final RegistroVeiculoService registroVeiculoService;

  @Transactional
  public Autuacao registrarAutuacao(Long veiculoId, Autuacao novaAutuacao) {
    Veiculo veiculo = registroVeiculoService.buscarPorId(veiculoId);
    return veiculo.adicionarAutuacao(novaAutuacao);

  }
    
}
