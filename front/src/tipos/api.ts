export type AbaAtiva = 'proprietarios' | 'veiculos';
export type TipoNotificacao = 'erro' | 'info' | 'sucesso';
export type StatusVeiculo = 'APREENDIDO' | 'REGULAR';
export type Tema = 'claro' | 'escuro';

export interface ProblemDetail {
  detail?: string;
  instance?: string;
  status?: number;
  title?: string;
  type?: string;
}

export interface Proprietario {
  email: string;
  id: number;
  nome: string;
  telefone: string;
}

export interface ProprietarioResumo {
  id: number;
  nome: string;
}

export interface Veiculo {
  dataApreensao: string | null;
  dataCadastro: string;
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  proprietario: ProprietarioResumo;
  status: StatusVeiculo;
}

export interface Autuacao {
  dataOcorrencia: string;
  descricao: string;
  id: number;
  valorMulta: number;
}

export interface ProprietarioPayload {
  email: string;
  nome: string;
  telefone: string;
}

export interface VeiculoPayload {
  marca: string;
  modelo: string;
  placa: string;
  proprietario: {
    id: number;
  };
}

export interface AutuacaoPayload {
  descricao: string;
  valorMulta: number;
}

export interface Notificacao {
  mensagem: string;
  tipo: TipoNotificacao;
  titulo: string;
}
