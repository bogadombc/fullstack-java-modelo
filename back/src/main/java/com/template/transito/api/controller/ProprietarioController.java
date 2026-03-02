package com.template.transito.api.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.template.transito.domain.model.Proprietario;

@RestController
public class ProprietarioController {

  @GetMapping("/proprietarios")
  public List<Proprietario> listar() {
    return null;
  }

}
