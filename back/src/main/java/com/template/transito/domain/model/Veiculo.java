package com.template.transito.domain.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import com.template.transito.domain.validation.ValidationGroups;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.groups.ConvertGroup;
import jakarta.validation.groups.Default;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
public class Veiculo {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  // 1 proprietário pode ter vários veículos, mas um veículo tem apenas 1 proprietário
  @ManyToOne
  @NotNull(message = "O proprietário é obrigatório")
  @Valid
  //@JoinColumn(name = "proprietario_id") o jakarta já identifica esse nome automaticamente, teria que usar se fosse outro nome na tabela Veículo
  @ConvertGroup(from = Default.class, to = ValidationGroups.ProprietarioId.class)
  private Proprietario proprietario;

  @NotBlank(message = "A marca é obrigatória")
  private String marca;

  @NotBlank(message = "O modelo é obrigatório")
  private String modelo;

  @NotBlank(message = "A placa é obrigatória")
  @Pattern(regexp = "^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$", message = "A placa deve seguir o formato ABC1234 ou ABC1D23")
  private String placa;

  @JsonProperty(access = Access.READ_ONLY)
  @Enumerated(EnumType.STRING)
  private StatusVeiculo status;
  
  @JsonProperty(access = Access.READ_ONLY)
  private LocalDateTime dataCadastro;

  @JsonProperty(access = Access.READ_ONLY)
  private LocalDateTime dataApreensao;

}
