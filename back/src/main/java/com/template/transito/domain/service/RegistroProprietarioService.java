package com.template.transito.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.template.transito.domain.exception.NegocioException;
import com.template.transito.domain.model.Proprietario;
import com.template.transito.domain.repository.ProprietarioRepository;


import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class RegistroProprietarioService {

  private final ProprietarioRepository proprietarioRepository;

  public Proprietario buscarPorId(Long proprietarioId) {
    return proprietarioRepository.findById(proprietarioId)
      .orElseThrow(() -> new NegocioException("Proprietário não encontrado com ID: " + proprietarioId));
  }

  @Transactional
  public Proprietario salvar(Proprietario proprietario) {
    // Lógica de validação e regras de negócio para salvar um proprietário
    
    // em caso de atualização o dono do email deve poder atualizar seu email, mas não pode atualizar para um email que já esteja em uso por outro proprietário
    boolean emailEmUso = proprietarioRepository.findByEmail(proprietario.getEmail())
      .filter(p -> !p.equals(proprietario)) 
      .isPresent();

    if(emailEmUso) {
      throw new NegocioException("Já existe um proprietário com este email.");
    }

    return proprietarioRepository.save(proprietario);
  }
  
  @Transactional
  public void excluir(Long proprietarioId) {
    // Lógica de validação e regras de negócio para excluir um proprietário
    proprietarioRepository.deleteById(proprietarioId);
  }

}
