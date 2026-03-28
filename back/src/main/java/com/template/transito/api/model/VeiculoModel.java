package com.template.transito.api.model;

import java.time.OffsetDateTime;

import com.template.transito.domain.model.StatusVeiculo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VeiculoModel {

  private Long id;
  private ProprietarioResumoModel proprietario;
  private String marca;
  private String modelo;
  private String placa;
  private StatusVeiculo status;
  private OffsetDateTime dataCadastro;
  private OffsetDateTime dataApreensao;

}
