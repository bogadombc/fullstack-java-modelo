package com.template.transito.api.assembler;

import java.util.List;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import com.template.transito.api.model.VeiculoModel;
import com.template.transito.api.model.dto.VeiculoDTO;
import com.template.transito.domain.model.Veiculo;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Component
public class VeiculoAssembler {

  private final ModelMapper modelMapper;

  public Veiculo toEntity(VeiculoDTO veiculoDTO) {
    return modelMapper.map(veiculoDTO, Veiculo.class);
  }

  public VeiculoModel toModel(Veiculo veiculo) {
    return modelMapper.map(veiculo, VeiculoModel.class);
  }


  public List<VeiculoModel> toCollectionModel(List<Veiculo> veiculos) {
    return veiculos.stream()
        .map(this::toModel)
        .toList();
  }

}
