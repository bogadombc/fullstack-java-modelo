package com.template.transito.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.template.transito.domain.model.Proprietario;
import com.template.transito.domain.repository.ProprietarioRepository;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;


@RestController
@AllArgsConstructor
@RequestMapping("/proprietarios")
public class ProprietarioController {


  private final ProprietarioRepository proprietarioRepository;


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
  public ResponseEntity<Proprietario> salvar(@RequestBody @Valid Proprietario proprietario) {
    Proprietario proprietarioSalvo = proprietarioRepository.save(proprietario);
    return ResponseEntity.ok(proprietarioSalvo);
  }

  @PutMapping("/{proprietarioId}")
  public ResponseEntity<Proprietario> atualizar(@PathVariable Long proprietarioId, @RequestBody Proprietario proprietario) {

    if (!proprietarioRepository.existsById(proprietarioId)) {
      return ResponseEntity.notFound().build();
    }

    proprietario.setId(proprietarioId);

    Proprietario proprietarioAtualizado = proprietarioRepository.save(proprietario);
    return ResponseEntity.ok(proprietarioAtualizado);
      
  }

  @DeleteMapping("/{proprietarioId}")
  public ResponseEntity<Void> excluir(@PathVariable Long proprietarioId) {
    if (!proprietarioRepository.existsById(proprietarioId)) {
      return ResponseEntity.notFound().build();
    }

    proprietarioRepository.deleteById(proprietarioId);
    return ResponseEntity.noContent().build();
  }



}
