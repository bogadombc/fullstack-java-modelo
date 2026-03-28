package com.template.transito.domain.model;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import com.template.transito.domain.exception.NegocioException;
import com.template.transito.domain.validation.ValidationGroups;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.validation.Valid;
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

  // 1 proprietário pode ter nenhum ou vários veículos, mas um veículo tem apenas 1 proprietário
  @ManyToOne
  @Valid
  @ConvertGroup(from = Default.class, to = ValidationGroups.ProprietarioId.class)
  private Proprietario proprietario;

  private String marca;

  private String modelo;

  private String placa;

  @JsonProperty(access = Access.READ_ONLY)
  @Enumerated(EnumType.STRING)
  private StatusVeiculo status;
  
  @JsonProperty(access = Access.READ_ONLY)
  private OffsetDateTime dataCadastro;

  @JsonProperty(access = Access.READ_ONLY)
  private OffsetDateTime dataApreensao;

  @OneToMany(mappedBy = "veiculo", cascade = CascadeType.ALL)
  private List<Autuacao> autuacoes = new ArrayList<>();

  public Autuacao adicionarAutuacao(Autuacao autuacao) {
    autuacao.setDataOcorrencia(OffsetDateTime.now());
    autuacao.setVeiculo(this);
    this.autuacoes.add(autuacao);

    return autuacao;
  }

  public void apreender() {
    if (estaApreendido()) {
      throw new NegocioException("Veículo já está apreendido.");
    }
    setStatus(StatusVeiculo.APREENDIDO);
    setDataApreensao(OffsetDateTime.now());
  }

  public void liberarVeiculo() {
    if (naoEstaApreendido()) {
      throw new NegocioException("Veículo não está apreendido.");
    }
    setStatus(StatusVeiculo.REGULAR);
    setDataApreensao(null);
  }

  public boolean estaApreendido() {
    return StatusVeiculo.APREENDIDO.equals(this.status);
  }

  public boolean naoEstaApreendido() {
    return !estaApreendido();
  }

}
