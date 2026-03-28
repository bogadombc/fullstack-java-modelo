package com.template.transito.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.template.transito.api.assembler.AutuacaoAssembler;
import com.template.transito.api.model.AutuacaoModel;
import com.template.transito.api.model.dto.AutuacaoDTO;
import com.template.transito.domain.model.Autuacao;
import com.template.transito.domain.service.RegistroAutuacaoService;
import com.template.transito.domain.service.RegistroVeiculoService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping("/veiculos/{veiculoId}/autuacoes")
public class AutuacaoController {

  private final AutuacaoAssembler autuacaoAssembler;
  private final RegistroAutuacaoService registroAutuacaoService;
  private final RegistroVeiculoService registroVeiculoService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public AutuacaoModel registrarAutuacao(@PathVariable Long veiculoId,
      @Valid @RequestBody AutuacaoDTO autuacaoDTO) {
    Autuacao novaAutuacao = autuacaoAssembler.toEntity(autuacaoDTO);
    Autuacao autuacaoRegistrada = registroAutuacaoService.registrarAutuacao(veiculoId, novaAutuacao);

    return autuacaoAssembler.toModel(autuacaoRegistrada);
  }
  
  @GetMapping
  public List<AutuacaoModel> listarAutuacoes(@PathVariable Long veiculoId) {
    var veiculo = registroVeiculoService.buscarPorId(veiculoId);
    var autuacoes = veiculo.getAutuacoes();
    return autuacaoAssembler.toCollectionModel(autuacoes);
  }

}
