package com.template.transito.api.controller;

import java.util.List;

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

import com.template.transito.api.assembler.VeiculoAssembler;
import com.template.transito.api.model.VeiculoModel;
import com.template.transito.api.model.dto.VeiculoDTO;
import com.template.transito.domain.model.Veiculo;
import com.template.transito.domain.repository.VeiculoRepository;
import com.template.transito.domain.service.ApreensaoVeiculoService;
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
  private final VeiculoAssembler veiculoAssembler;
  private final ApreensaoVeiculoService apreensaoVeiculoService;

  @GetMapping
  public List<VeiculoModel> listar() {
    return veiculoAssembler.toCollectionModel(veiculoRepository.findAll());
  }

  @GetMapping("/{veiculoId}")
  public ResponseEntity<VeiculoModel> buscar(@PathVariable Long veiculoId) {
    return veiculoRepository.findById(veiculoId)
        .map(veiculoAssembler::toModel)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public VeiculoModel cadastrar(@Valid @RequestBody VeiculoDTO veiculoDTO) {
    Veiculo novoVeiculo = veiculoAssembler.toEntity(veiculoDTO);
    Veiculo veiculoCadastrado = registroVeiculoService.cadastrar(novoVeiculo);

    return veiculoAssembler.toModel(veiculoCadastrado);
  }
  
  @PutMapping("/{veiculoId}/apreensao")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void apreender(@PathVariable Long veiculoId) {
    apreensaoVeiculoService.apreenderVeiculo(veiculoId);
  }

  @DeleteMapping("/{veiculoId}/apreensao")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void liberar(@PathVariable Long veiculoId) {
    apreensaoVeiculoService.liberarVeiculo(veiculoId);
  }

}
