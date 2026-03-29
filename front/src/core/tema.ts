import type { Tema } from '../tipos/api';

const CHAVE_TEMA = 'transito.tema';

function detectarTemaDoSistema(): Tema {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'escuro'
    : 'claro';
}

function salvarTema(tema: Tema): void {
  window.localStorage.setItem(CHAVE_TEMA, tema);
}

function aplicarTema(tema: Tema): void {
  document.documentElement.classList.toggle('dark', tema === 'escuro');
}

export function inicializarTema(): Tema {
  const temaSalvo = obterTemaPersistido();
  const tema = temaSalvo ?? detectarTemaDoSistema();

  aplicarTema(tema);

  return tema;
}

export function obterTemaPersistido(): Tema | null {
  const valor = window.localStorage.getItem(CHAVE_TEMA);

  if (valor === 'claro' || valor === 'escuro') {
    return valor;
  }

  return null;
}

export function obterTemaAtual(): Tema {
  return document.documentElement.classList.contains('dark') ? 'escuro' : 'claro';
}

export function alternarTema(): Tema {
  const proximoTema = obterTemaAtual() === 'escuro' ? 'claro' : 'escuro';

  salvarTema(proximoTema);
  aplicarTema(proximoTema);

  return proximoTema;
}
