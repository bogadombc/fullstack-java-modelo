import type { StatusVeiculo } from '../tipos/api';

const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});

export function formatarDataHora(valor: string | null): string {
  if (!valor) {
    return '—';
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return '—';
  }

  return formatadorDataHora.format(data);
}

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor);
}

export function formatarStatus(status: StatusVeiculo): string {
  return status === 'APREENDIDO' ? 'Apreendido' : 'Regular';
}
