package com.template.transito.common;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
      return new ModelMapper();
    }

}
