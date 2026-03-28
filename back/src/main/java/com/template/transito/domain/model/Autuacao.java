package com.template.transito.domain.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
public class Autuacao {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  @ManyToOne
  private Veiculo veiculo;

  private String descricao;
  private BigDecimal valorMulta;
  private OffsetDateTime dataOcorrencia;


}
