package com.template.transito.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.template.transito.domain.exception.NegocioException;
import com.template.transito.domain.model.Proprietario;
import com.template.transito.domain.repository.ProprietarioRepository;
import com.template.transito.domain.service.RegistroProprietarioService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;


@RestController
@AllArgsConstructor
@RequestMapping("/proprietarios")
public class ProprietarioController {

  private final ProprietarioRepository proprietarioRepository;
  private final RegistroProprietarioService registroProprietarioService;

  // apenas para consultas, o ProprietarioController pode acessar o proprietarioRepository diretamente, sem passar pelo service(registroProprietarioService)

  @GetMapping
  public List<Proprietario> listar() {
    return proprietarioRepository.findAll();
  }

  @GetMapping("/{proprietarioId}")
  public ResponseEntity<Proprietario> buscar(@PathVariable Long proprietarioId) {
    return proprietarioRepository.findById(proprietarioId)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Proprietario salvar(@RequestBody @Valid Proprietario proprietario) {
    return registroProprietarioService.salvar(proprietario);
  }

  @PutMapping("/{proprietarioId}")
  public ResponseEntity<Proprietario> atualizar(@PathVariable @Valid  Long proprietarioId, @RequestBody Proprietario proprietario) {

    if (!proprietarioRepository.existsById(proprietarioId)) {
      return ResponseEntity.notFound().build();
    }

    proprietario.setId(proprietarioId);

    Proprietario proprietarioAtualizado = registroProprietarioService.salvar(proprietario);
    return ResponseEntity.ok(proprietarioAtualizado);
      
  }

  @DeleteMapping("/{proprietarioId}")
  public ResponseEntity<Void> excluir(@PathVariable Long proprietarioId) {
    if (!proprietarioRepository.existsById(proprietarioId)) {
      return ResponseEntity.notFound().build();
    }

    registroProprietarioService.excluir(proprietarioId);
    return ResponseEntity.noContent().build();
  }

  @ExceptionHandler(NegocioException.class)
  public ResponseEntity<String> capturarExcecao(NegocioException ex) {
    // Aqui você pode logar a exceção ou realizar outras ações necessárias
    return ResponseEntity.badRequest().body(ex.getMessage());
  }


}
