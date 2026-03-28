package com.template.transito.api.assembler;

import java.util.List;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import com.template.transito.api.model.AutuacaoModel;
import com.template.transito.api.model.dto.AutuacaoDTO;
import com.template.transito.domain.model.Autuacao;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Component
public class AutuacaoAssembler {

  private final ModelMapper modelMapper;

  public Autuacao toEntity(AutuacaoDTO autuacaoDTO) {
    return modelMapper.map(autuacaoDTO, Autuacao.class);
  }

  public AutuacaoModel toModel(Autuacao autuacao) {
    return modelMapper.map(autuacao, AutuacaoModel.class);
  }

  public List<AutuacaoModel> toCollectionModel(List<Autuacao> autuacoes) {
    return autuacoes.stream()
        .map(this::toModel)
        .toList();
  }

}
