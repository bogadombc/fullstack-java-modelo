package com.template.transito.api.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class VeiculoDTO {

  @NotBlank(message = "A marca é obrigatória")
  @Size(max = 20, message = "A marca deve conter no máximo 20 caracteres")
  private String marca;

  @NotBlank(message = "O modelo é obrigatório")
  @Size(max = 20, message = "O modelo deve conter no máximo 20 caracteres")
  private String modelo;

  @NotBlank(message = "A placa é obrigatória")
  @Pattern(regexp = "^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$", message = "A placa deve seguir o formato ABC1234 ou ABC1D23")
  private String placa;

  @Valid
  @NotNull(message = "O proprietário é obrigatório")
  private ProprietarioIdDTO proprietario;

}
