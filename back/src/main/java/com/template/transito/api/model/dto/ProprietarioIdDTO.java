package com.template.transito.api.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class ProprietarioIdDTO {

  @NotNull
  private Long id;
}
