package com.template.transito.api.exceptionhandler;

import org.jspecify.annotations.Nullable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.template.transito.domain.exception.EntidadeNaoEncontradaException;
import com.template.transito.domain.exception.NegocioException;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

  @Override
  protected @Nullable ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
      HttpHeaders headers, HttpStatusCode status, WebRequest request) {
    
    ProblemDetail problemDetail = ProblemDetail.forStatus(status);
    problemDetail.setTitle("Erro de validação");
    //problemDetail.setDetail("Um ou mais campos estão inválidos. Faça o preenchimento correto e tente novamente.");

    var fields = ex.getBindingResult().getFieldErrors();
    StringBuilder detailBuilder = new StringBuilder("Um ou mais campos estão inválidos. Faça o preenchimento correto e tente novamente. Detalhes: ");
    fields.forEach(field -> detailBuilder.append(String.format("Campo '%s' %s. ", field.getField(), field.getDefaultMessage())));
    problemDetail.setDetail(detailBuilder.toString());
      
    return super.handleExceptionInternal(ex, problemDetail, headers, status, request);
  }

  @ExceptionHandler(NegocioException.class)
  public ProblemDetail handleNegocio(NegocioException ex) {
    // Aqui você pode logar a exceção ou realizar outras ações necessárias
    ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    problemDetail.setTitle("Erro de negócio");
    problemDetail.setDetail(ex.getMessage());
    return problemDetail;
  }

  @ExceptionHandler(EntidadeNaoEncontradaException.class)
  public ProblemDetail handleEntidadeNaoEncontrada(EntidadeNaoEncontradaException ex) {
    // Aqui você pode logar a exceção ou realizar outras ações necessárias
    ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
    problemDetail.setTitle("Entidade não encontrada");
    problemDetail.setDetail(ex.getMessage());
    return problemDetail;
  }


  @ExceptionHandler(DataIntegrityViolationException.class)
  public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
    ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
    problemDetail.setTitle("Violação de integridade de dados");
    problemDetail.setDetail("Ocorreu um erro de integridade de dados. Verifique os dados enviados e tente novamente.");
    return problemDetail;
  }

}
