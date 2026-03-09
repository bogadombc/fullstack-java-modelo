package com.template.transito.api.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.template.transito.domain.exception.NegocioException;
import com.template.transito.domain.model.Veiculo;
import com.template.transito.domain.repository.VeiculoRepository;
import com.template.transito.domain.service.RegistroVeiculoService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;

import lombok.AllArgsConstructor;


@RestController
@RequestMapping("/veiculos")
@AllArgsConstructor
public class VeiculoController {

  private final VeiculoRepository veiculoRepository;
  private final RegistroVeiculoService registroVeiculoService;

  @GetMapping
  public List<Veiculo> listar() {
    return veiculoRepository.findAll();
  }

  @GetMapping("/{veiculoId}")
  public ResponseEntity<Veiculo> buscar(@PathVariable Long veiculoId) {
    return veiculoRepository.findById(veiculoId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Veiculo cadastrar(@Valid @RequestBody Veiculo veiculo) {
    return registroVeiculoService.cadastrar(veiculo);
  }

  @ExceptionHandler(NegocioException.class)
  public ResponseEntity<String> capturarExcecao(NegocioException ex) {
    // Aqui você pode logar a exceção ou realizar outras ações necessárias
    return ResponseEntity.badRequest().body(ex.getMessage());
  }

}
