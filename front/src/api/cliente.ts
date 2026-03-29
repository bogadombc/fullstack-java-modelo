import type {
  Autuacao,
  AutuacaoPayload,
  ProblemDetail,
  Proprietario,
  ProprietarioPayload,
  Veiculo,
  VeiculoPayload,
} from '../tipos/api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  public readonly problem?: ProblemDetail;
  public readonly status: number;
  constructor(
    message: string,
    status: number,
    problem?: ProblemDetail,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

async function requisicao<T>(caminho: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const possuiCorpo = init?.body !== undefined;

  if (possuiCorpo && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const resposta = await fetch(`${API_BASE}${caminho}`, {
    ...init,
    headers,
  });

  if (resposta.status === 204) {
    return undefined as T;
  }

  const contentType = resposta.headers.get('content-type') ?? '';
  const ehJson = contentType.includes('json');

  const corpo = ehJson
    ? await resposta.json().catch(() => undefined)
    : await resposta.text().catch(() => undefined);

  if (!resposta.ok) {
    const problem =
      corpo && typeof corpo === 'object' ? (corpo as ProblemDetail) : undefined;
    const mensagem =
      problem?.detail ??
      problem?.title ??
      (typeof corpo === 'string' && corpo.trim() ? corpo : undefined) ??
      `Erro HTTP ${resposta.status}`;

    throw new ApiError(mensagem, resposta.status, problem);
  }

  return corpo as T;
}

export function listarProprietarios(): Promise<Proprietario[]> {
  return requisicao<Proprietario[]>('/proprietarios');
}

export function cadastrarProprietario(
  payload: ProprietarioPayload,
): Promise<Proprietario> {
  return requisicao<Proprietario>('/proprietarios', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function atualizarProprietario(
  id: number,
  payload: ProprietarioPayload,
): Promise<Proprietario> {
  return requisicao<Proprietario>(`/proprietarios/${id}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

export function excluirProprietario(id: number): Promise<void> {
  return requisicao<void>(`/proprietarios/${id}`, {
    method: 'DELETE',
  });
}

export function listarVeiculos(): Promise<Veiculo[]> {
  return requisicao<Veiculo[]>('/veiculos');
}

export function cadastrarVeiculo(payload: VeiculoPayload): Promise<Veiculo> {
  return requisicao<Veiculo>('/veiculos', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function apreenderVeiculo(id: number): Promise<void> {
  return requisicao<void>(`/veiculos/${id}/apreensao`, {
    method: 'PUT',
  });
}

export function liberarVeiculo(id: number): Promise<void> {
  return requisicao<void>(`/veiculos/${id}/apreensao`, {
    method: 'DELETE',
  });
}

export function listarAutuacoes(veiculoId: number): Promise<Autuacao[]> {
  return requisicao<Autuacao[]>(`/veiculos/${veiculoId}/autuacoes`);
}

export function cadastrarAutuacao(
  veiculoId: number,
  payload: AutuacaoPayload,
): Promise<Autuacao> {
  return requisicao<Autuacao>(`/veiculos/${veiculoId}/autuacoes`, {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}
