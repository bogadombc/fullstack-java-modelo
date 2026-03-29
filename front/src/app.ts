import {
  ApiError,
  apreenderVeiculo,
  atualizarProprietario,
  cadastrarAutuacao,
  cadastrarProprietario,
  cadastrarVeiculo,
  excluirProprietario,
  liberarVeiculo,
  listarAutuacoes,
  listarProprietarios,
  listarVeiculos,
} from './api/cliente';
import { escapeHtml } from './core/html';
import { formatarDataHora, formatarMoeda, formatarStatus } from './core/formatadores';
import { alternarTema, obterTemaAtual } from './core/tema';
import type {
  AbaAtiva,
  Autuacao,
  Notificacao,
  Proprietario,
  ProprietarioPayload,
  StatusVeiculo,
  TipoNotificacao,
  Veiculo,
  VeiculoPayload,
} from './tipos/api';

interface EstadoApp {
  abaAtiva: AbaAtiva;
  autuacoes: Autuacao[];
  carregandoAutuacoes: boolean;
  carregandoInicial: boolean;
  editandoProprietario: Proprietario | null;
  enviandoAutuacao: boolean;
  enviandoProprietario: boolean;
  enviandoVeiculo: boolean;
  excluindoProprietarioId: number | null;
  notificacao: Notificacao | null;
  proprietarios: Proprietario[];
  processandoVeiculoId: number | null;
  veiculoSelecionadoId: number | null;
  veiculos: Veiculo[];
}

const CLASSE_CARTAO =
  'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 md:p-6';
const CLASSE_INPUT =
  'mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/15';
const CLASSE_TEXTO_AJUDA =
  'mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400';
const CLASSE_BOTAO_BASE =
  'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60';
const CLASSE_BOTAO_PRIMARIO = `${CLASSE_BOTAO_BASE} bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400`;
const CLASSE_BOTAO_SECUNDARIO = `${CLASSE_BOTAO_BASE} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800`;
const CLASSE_BOTAO_PERIGO = `${CLASSE_BOTAO_BASE} bg-rose-600 text-white hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400`;

function ordenarProprietarios(proprietarios: Proprietario[]): Proprietario[] {
  return [...proprietarios].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function ordenarVeiculos(veiculos: Veiculo[]): Veiculo[] {
  return [...veiculos].sort((a, b) => a.placa.localeCompare(b.placa, 'pt-BR'));
}

function ordenarAutuacoes(autuacoes: Autuacao[]): Autuacao[] {
  return [...autuacoes].sort((a, b) => {
    const dataA = new Date(a.dataOcorrencia).getTime();
    const dataB = new Date(b.dataOcorrencia).getTime();

    return dataB - dataA;
  });
}

function normalizarPlaca(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function converterTexto(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function converterNumeroInteiro(valor: FormDataEntryValue | null): number {
  return Number.parseInt(converterTexto(valor), 10);
}

function converterDecimal(valor: FormDataEntryValue | null): number {
  const texto = converterTexto(valor).replace(/\s+/g, '');

  if (!texto) {
    return Number.NaN;
  }

  if (texto.includes(',') && texto.includes('.')) {
    return Number(texto.replace(/\./g, '').replace(',', '.'));
  }

  if (texto.includes(',')) {
    return Number(texto.replace(',', '.'));
  }

  return Number(texto);
}

function mensagemDeErro(erro: unknown, fallback: string): string {
  if (erro instanceof ApiError) {
    return erro.problem?.detail ?? erro.problem?.title ?? erro.message;
  }

  if (erro instanceof Error && erro.message) {
    return erro.message;
  }

  return fallback;
}

function classeStatus(status: StatusVeiculo): string {
  if (status === 'APREENDIDO') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200';
  }

  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200';
}

export class AplicacaoTransito {
  private readonly root: HTMLElement;
  private readonly estado: EstadoApp = {
    abaAtiva: 'veiculos',
    autuacoes: [],
    carregandoAutuacoes: false,
    carregandoInicial: true,
    editandoProprietario: null,
    enviandoAutuacao: false,
    enviandoProprietario: false,
    enviandoVeiculo: false,
    excluindoProprietarioId: null,
    notificacao: null,
    proprietarios: [],
    processandoVeiculoId: null,
    veiculoSelecionadoId: null,
    veiculos: [],
  };

  private temporizadorNotificacao: number | null = null;
  constructor(root: HTMLElement) {
    this.root = root;
    this.root.addEventListener('click', this.aoClicar);
    this.root.addEventListener('submit', this.aoEnviarFormulario);
  }

  async iniciar(): Promise<void> {
    this.render();
    await this.sincronizarListas(true);

    if (!this.estado.veiculoSelecionadoId && this.estado.veiculos.length > 0) {
      await this.selecionarVeiculo(this.estado.veiculos[0]!.id);
    }
  }

  private get veiculoSelecionado(): Veiculo | null {
    if (!this.estado.veiculoSelecionadoId) {
      return null;
    }

    return (
      this.estado.veiculos.find(
        (veiculo) => veiculo.id === this.estado.veiculoSelecionadoId,
      ) ?? null
    );
  }

  private aoClicar = async (evento: Event): Promise<void> => {
    const alvo = evento.target;

    if (!(alvo instanceof HTMLElement)) {
      return;
    }

    const elementoAcao = alvo.closest<HTMLElement>('[data-action]');

    if (!elementoAcao) {
      return;
    }

    const acao = elementoAcao.dataset.action;

    if (!acao) {
      return;
    }

    evento.preventDefault();

    switch (acao) {
      case 'alternar-tema': {
        const tema = alternarTema();
        this.notificar(
          'info',
          'Tema atualizado',
          `O modo ${tema === 'escuro' ? 'escuro' : 'claro'} foi ativado.`,
        );
        this.render();
        return;
      }
      case 'mudar-aba': {
        const aba = elementoAcao.dataset.aba;

        if (aba === 'proprietarios' || aba === 'veiculos') {
          this.estado.abaAtiva = aba;
          this.render();
        }
        return;
      }
      case 'fechar-notificacao': {
        this.limparNotificacao();
        this.render();
        return;
      }
      case 'editar-proprietario': {
        const id = Number(elementoAcao.dataset.proprietarioId);
        const proprietario =
          this.estado.proprietarios.find((item) => item.id === id) ?? null;

        if (!proprietario) {
          return;
        }

        this.estado.abaAtiva = 'proprietarios';
        this.estado.editandoProprietario = proprietario;
        this.render();
        return;
      }
      case 'cancelar-edicao-proprietario': {
        this.estado.editandoProprietario = null;
        this.render();
        return;
      }
      case 'excluir-proprietario': {
        const id = Number(elementoAcao.dataset.proprietarioId);
        await this.excluirProprietario(id);
        return;
      }
      case 'selecionar-veiculo': {
        const id = Number(elementoAcao.dataset.veiculoId);
        await this.selecionarVeiculo(id);
        return;
      }
      case 'apreender-veiculo': {
        const id = Number(elementoAcao.dataset.veiculoId);
        await this.executarAcaoVeiculo(id, 'apreender');
        return;
      }
      case 'liberar-veiculo': {
        const id = Number(elementoAcao.dataset.veiculoId);
        await this.executarAcaoVeiculo(id, 'liberar');
        return;
      }
      default:
        return;
    }
  };

  private aoEnviarFormulario = async (evento: Event): Promise<void> => {
    const formulario = evento.target;

    if (!(formulario instanceof HTMLFormElement)) {
      return;
    }

    const tipo = formulario.dataset.form;

    if (!tipo) {
      return;
    }

    evento.preventDefault();

    if (!formulario.reportValidity()) {
      return;
    }

    switch (tipo) {
      case 'proprietario':
        await this.salvarProprietario(formulario);
        return;
      case 'veiculo':
        await this.salvarVeiculo(formulario);
        return;
      case 'autuacao':
        await this.salvarAutuacao(formulario);
        return;
      default:
        return;
    }
  };

  private async sincronizarListas(exibirCarregamento: boolean): Promise<void> {
    if (exibirCarregamento) {
      this.estado.carregandoInicial = true;
      this.render();
    }

    try {
      const [proprietarios, veiculos] = await Promise.all([
        listarProprietarios(),
        listarVeiculos(),
      ]);

      this.estado.proprietarios = ordenarProprietarios(proprietarios);
      this.estado.veiculos = ordenarVeiculos(veiculos);

      if (this.estado.editandoProprietario) {
        this.estado.editandoProprietario =
          this.estado.proprietarios.find(
            (item) => item.id === this.estado.editandoProprietario?.id,
          ) ?? null;
      }

      const selecionadoAindaExiste = this.estado.veiculos.some(
        (veiculo) => veiculo.id === this.estado.veiculoSelecionadoId,
      );

      if (!selecionadoAindaExiste) {
        this.estado.veiculoSelecionadoId = null;
        this.estado.autuacoes = [];
      }
    } catch (erro: unknown) {
      this.notificar(
        'erro',
        'Falha ao carregar dados',
        mensagemDeErro(
          erro,
          'Não foi possível obter os dados da API. Verifique se o backend está em execução.',
        ),
      );
    } finally {
      this.estado.carregandoInicial = false;
      this.render();
    }
  }

  private async selecionarVeiculo(veiculoId: number): Promise<void> {
    if (!Number.isFinite(veiculoId)) {
      return;
    }

    this.estado.veiculoSelecionadoId = veiculoId;
    this.estado.abaAtiva = 'veiculos';
    this.estado.carregandoAutuacoes = true;
    this.render();

    try {
      const autuacoes = await listarAutuacoes(veiculoId);
      this.estado.autuacoes = ordenarAutuacoes(autuacoes);
    } catch (erro: unknown) {
      this.estado.autuacoes = [];
      this.notificar(
        'erro',
        'Falha ao carregar autuações',
        mensagemDeErro(erro, 'Não foi possível carregar as autuações do veículo.'),
      );
    } finally {
      this.estado.carregandoAutuacoes = false;
      this.render();
    }
  }

  private async salvarProprietario(formulario: HTMLFormElement): Promise<void> {
    const dados = new FormData(formulario);
    const payload: ProprietarioPayload = {
      email: converterTexto(dados.get('email')),
      nome: converterTexto(dados.get('nome')),
      telefone: converterTexto(dados.get('telefone')),
    };

    this.estado.enviandoProprietario = true;
    this.render();

    try {
      if (this.estado.editandoProprietario) {
        await atualizarProprietario(this.estado.editandoProprietario.id, payload);
        this.notificar(
          'sucesso',
          'Proprietário atualizado',
          'As informações do proprietário foram salvas com sucesso.',
        );
      } else {
        await cadastrarProprietario(payload);
        this.notificar(
          'sucesso',
          'Proprietário cadastrado',
          'O proprietário foi cadastrado com sucesso.',
        );
      }

      this.estado.editandoProprietario = null;
      await this.sincronizarListas(false);
    } catch (erro: unknown) {
      this.notificar(
        'erro',
        'Erro ao salvar proprietário',
        mensagemDeErro(erro, 'Não foi possível salvar o proprietário.'),
      );
    } finally {
      this.estado.enviandoProprietario = false;
      this.render();
    }
  }

  private async excluirProprietario(proprietarioId: number): Promise<void> {
    if (!Number.isFinite(proprietarioId)) {
      return;
    }

    const proprietario =
      this.estado.proprietarios.find((item) => item.id === proprietarioId) ?? null;

    if (
      proprietario &&
      !window.confirm(
        `Deseja realmente excluir o proprietário "${proprietario.nome}"?`,
      )
    ) {
      return;
    }

    this.estado.excluindoProprietarioId = proprietarioId;
    this.render();

    try {
      await excluirProprietario(proprietarioId);

      if (this.estado.editandoProprietario?.id === proprietarioId) {
        this.estado.editandoProprietario = null;
      }

      this.notificar(
        'sucesso',
        'Proprietário excluído',
        'O proprietário foi removido com sucesso.',
      );
      await this.sincronizarListas(false);
    } catch (erro: unknown) {
      this.notificar(
        'erro',
        'Erro ao excluir proprietário',
        mensagemDeErro(erro, 'Não foi possível excluir o proprietário.'),
      );
    } finally {
      this.estado.excluindoProprietarioId = null;
      this.render();
    }
  }

  private async salvarVeiculo(formulario: HTMLFormElement): Promise<void> {
    const dados = new FormData(formulario);
    const proprietarioId = converterNumeroInteiro(dados.get('proprietarioId'));
    const placa = normalizarPlaca(converterTexto(dados.get('placa')));

    if (!/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/.test(placa)) {
      this.notificar(
        'erro',
        'Placa inválida',
        'A placa deve seguir o formato ABC1234 ou ABC1D23.',
      );
      this.render();
      return;
    }

    if (!Number.isFinite(proprietarioId)) {
      this.notificar(
        'erro',
        'Proprietário obrigatório',
        'Selecione um proprietário válido antes de cadastrar o veículo.',
      );
      this.render();
      return;
    }

    const payload: VeiculoPayload = {
      marca: converterTexto(dados.get('marca')),
      modelo: converterTexto(dados.get('modelo')),
      placa,
      proprietario: {
        id: proprietarioId,
      },
    };

    this.estado.enviandoVeiculo = true;
    this.render();

    try {
      const veiculo = await cadastrarVeiculo(payload);

      this.notificar(
        'sucesso',
        'Veículo cadastrado',
        `O veículo de placa ${veiculo.placa} foi cadastrado com sucesso.`,
      );

      formulario.reset();
      await this.sincronizarListas(false);
      await this.selecionarVeiculo(veiculo.id);
    } catch (erro: unknown) {
      this.notificar(
        'erro',
        'Erro ao cadastrar veículo',
        mensagemDeErro(erro, 'Não foi possível cadastrar o veículo.'),
      );
      this.render();
    } finally {
      this.estado.enviandoVeiculo = false;
      this.render();
    }
  }

  private async executarAcaoVeiculo(
    veiculoId: number,
    acao: 'apreender' | 'liberar',
  ): Promise<void> {
    if (!Number.isFinite(veiculoId)) {
      return;
    }

    this.estado.processandoVeiculoId = veiculoId;
    this.render();

    try {
      if (acao === 'apreender') {
        await apreenderVeiculo(veiculoId);
        this.notificar(
          'sucesso',
          'Veículo apreendido',
          'A apreensão do veículo foi registrada com sucesso.',
        );
      } else {
        await liberarVeiculo(veiculoId);
        this.notificar(
          'sucesso',
          'Veículo liberado',
          'O veículo foi liberado com sucesso.',
        );
      }

      await this.sincronizarListas(false);

      if (this.estado.veiculoSelecionadoId === veiculoId) {
        await this.selecionarVeiculo(veiculoId);
      } else {
        this.render();
      }
    } catch (erro: unknown) {
      this.notificar(
        'erro',
        acao === 'apreender'
          ? 'Erro ao apreender veículo'
          : 'Erro ao liberar veículo',
        mensagemDeErro(
          erro,
          acao === 'apreender'
            ? 'Não foi possível apreender o veículo.'
            : 'Não foi possível liberar o veículo.',
        ),
      );
      this.render();
    } finally {
      this.estado.processandoVeiculoId = null;
      this.render();
    }
  }

  private async salvarAutuacao(formulario: HTMLFormElement): Promise<void> {
    const veiculoId = this.estado.veiculoSelecionadoId;

    if (!veiculoId) {
      this.notificar(
        'erro',
        'Selecione um veículo',
        'Escolha um veículo antes de registrar uma autuação.',
      );
      this.render();
      return;
    }

    const dados = new FormData(formulario);
    const valorMulta = converterDecimal(dados.get('valorMulta'));

    if (!Number.isFinite(valorMulta) || valorMulta <= 0) {
      this.notificar(
        'erro',
        'Valor da multa inválido',
        'Informe um valor maior que zero. Você pode usar vírgula ou ponto como separador decimal.',
      );
      this.render();
      return;
    }

    this.estado.enviandoAutuacao = true;
    this.render();

    try {
      await cadastrarAutuacao(veiculoId, {
        descricao: converterTexto(dados.get('descricao')),
        valorMulta,
      });

      this.notificar(
        'sucesso',
        'Autuação registrada',
        'A autuação foi vinculada ao veículo com sucesso.',
      );

      formulario.reset();
      await this.selecionarVeiculo(veiculoId);
    } catch (erro: unknown) {
      this.notificar(
        'erro',
        'Erro ao registrar autuação',
        mensagemDeErro(erro, 'Não foi possível registrar a autuação.'),
      );
      this.render();
    } finally {
      this.estado.enviandoAutuacao = false;
      this.render();
    }
  }

  private notificar(
    tipo: TipoNotificacao,
    titulo: string,
    mensagem: string,
  ): void {
    if (this.temporizadorNotificacao !== null) {
      window.clearTimeout(this.temporizadorNotificacao);
      this.temporizadorNotificacao = null;
    }

    this.estado.notificacao = {
      mensagem,
      tipo,
      titulo,
    };

    this.temporizadorNotificacao = window.setTimeout(() => {
      this.limparNotificacao();
      this.render();
    }, 7000);
  }

  private limparNotificacao(): void {
    if (this.temporizadorNotificacao !== null) {
      window.clearTimeout(this.temporizadorNotificacao);
      this.temporizadorNotificacao = null;
    }

    this.estado.notificacao = null;
  }

  private render(): void {
    this.root.innerHTML = `
      <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        ${this.renderCabecalho()}
        <main class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
          ${this.renderNotificacao()}
          ${this.renderResumo()}
          ${
            this.estado.abaAtiva === 'proprietarios'
              ? this.renderAbaProprietarios()
              : this.renderAbaVeiculos()
          }
        </main>
      </div>
    `;
  }

  private renderCabecalho(): string {
    const temaAtual = obterTemaAtual();

    return `
      <header class="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90">
        <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
              Sistema de Autuação de Veículos
            </p>
            <h1 class="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Operação de proprietários, veículos e autuações
            </h1>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Interface para consumir a API existente sem criar fluxos além do que o backend já expõe.
            </p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              ${this.renderBotaoAba('veiculos', 'Veículos')}
              ${this.renderBotaoAba('proprietarios', 'Proprietários')}
            </nav>
            <button
              type="button"
              data-action="alternar-tema"
              class="${CLASSE_BOTAO_SECUNDARIO} whitespace-nowrap"
            >
              ${temaAtual === 'escuro' ? '☀️ Ativar modo claro' : '🌙 Ativar modo escuro'}
            </button>
          </div>
        </div>
      </header>
    `;
  }

  private renderBotaoAba(aba: AbaAtiva, rotulo: string): string {
    const ativa = this.estado.abaAtiva === aba;
    const classes = ativa
      ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
      : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50';

    return `
      <button
        type="button"
        data-action="mudar-aba"
        data-aba="${aba}"
        class="rounded-xl px-4 py-2 text-sm font-semibold transition ${classes}"
      >
        ${rotulo}
      </button>
    `;
  }

  private renderNotificacao(): string {
    const notificacao = this.estado.notificacao;

    if (!notificacao) {
      return '';
    }

    const estilo = {
      erro: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-50',
      info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-50',
      sucesso:
        'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-50',
    }[notificacao.tipo];

    return `
      <section class="rounded-3xl border px-5 py-4 shadow-sm shadow-slate-950/5 ${estilo}">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold">${escapeHtml(notificacao.titulo)}</p>
            <p class="mt-1 text-sm leading-6 opacity-90">
              ${escapeHtml(notificacao.mensagem)}
            </p>
          </div>
          <button
            type="button"
            data-action="fechar-notificacao"
            class="rounded-xl px-2 py-1 text-sm font-semibold opacity-70 transition hover:opacity-100"
            aria-label="Fechar notificação"
          >
            ✕
          </button>
        </div>
      </section>
    `;
  }

  private renderResumo(): string {
    const totalApreendidos = this.estado.veiculos.filter(
      (veiculo) => veiculo.status === 'APREENDIDO',
    ).length;

    const resumoAutuacoes = this.veiculoSelecionado
      ? `${this.estado.autuacoes.length} registradas`
      : 'Selecione um veículo';

    return `
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        ${this.renderCardResumo('Proprietários', String(this.estado.proprietarios.length), 'cadastros disponíveis para vínculo')}
        ${this.renderCardResumo('Veículos', String(this.estado.veiculos.length), 'itens cadastrados na API')}
        ${this.renderCardResumo('Apreendidos', String(totalApreendidos), 'veículos com status crítico')}
        ${this.renderCardResumo('Autuações', resumoAutuacoes, this.veiculoSelecionado ? `veículo ${escapeHtml(this.veiculoSelecionado.placa)}` : 'detalhe do veículo selecionado')}
      </section>
    `;
  }

  private renderCardResumo(titulo: string, valor: string, descricao: string): string {
    return `
      <article class="${CLASSE_CARTAO}">
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
          ${titulo}
        </p>
        <p class="mt-3 text-3xl font-semibold tracking-tight">
          ${valor}
        </p>
        <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          ${descricao}
        </p>
      </article>
    `;
  }

  private renderAbaProprietarios(): string {
    return `
      <section class="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <article class="${CLASSE_CARTAO}">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold tracking-tight">
                ${this.estado.editandoProprietario ? 'Editar proprietário' : 'Novo proprietário'}
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                ${
                  this.estado.editandoProprietario
                    ? 'Atualize os dados do proprietário selecionado.'
                    : 'Cadastre um proprietário antes de vincular veículos.'
                }
              </p>
            </div>
            ${
              this.estado.editandoProprietario
                ? `
                  <button
                    type="button"
                    data-action="cancelar-edicao-proprietario"
                    class="${CLASSE_BOTAO_SECUNDARIO}"
                  >
                    Cancelar
                  </button>
                `
                : ''
            }
          </div>
          <form data-form="proprietario" class="mt-6 space-y-4">
            ${this.renderCampoTexto({
              autocomplete: 'name',
              ajuda: 'Obrigatório. Máximo de 60 caracteres.',
              id: 'nome',
              label: 'Nome',
              maxLength: 60,
              name: 'nome',
              placeholder: 'Ex.: Marcelo Costa',
              required: true,
              type: 'text',
              value: this.estado.editandoProprietario?.nome ?? '',
            })}
            ${this.renderCampoTexto({
              autocomplete: 'email',
              ajuda: 'Use um e-mail único para cada proprietário.',
              id: 'email',
              label: 'E-mail',
              maxLength: 255,
              name: 'email',
              placeholder: 'nome@exemplo.com',
              required: true,
              type: 'email',
              value: this.estado.editandoProprietario?.email ?? '',
            })}
            ${this.renderCampoTexto({
              autocomplete: 'tel',
              ajuda: 'Obrigatório. Máximo de 20 caracteres.',
              id: 'telefone',
              label: 'Telefone',
              maxLength: 20,
              name: 'telefone',
              placeholder: '(11) 99999-0000',
              required: true,
              type: 'text',
              value: this.estado.editandoProprietario?.telefone ?? '',
            })}
            <div class="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                class="${CLASSE_BOTAO_PRIMARIO} flex-1"
                ${this.estado.enviandoProprietario ? 'disabled' : ''}
              >
                ${
                  this.estado.enviandoProprietario
                    ? 'Salvando...'
                    : this.estado.editandoProprietario
                      ? 'Salvar alterações'
                      : 'Cadastrar proprietário'
                }
              </button>
              ${
                this.estado.editandoProprietario
                  ? `
                    <button
                      type="button"
                      data-action="cancelar-edicao-proprietario"
                      class="${CLASSE_BOTAO_SECUNDARIO}"
                    >
                      Limpar
                    </button>
                  `
                  : ''
              }
            </div>
          </form>
        </article>

        <article class="${CLASSE_CARTAO}">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold tracking-tight">
                Proprietários cadastrados
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Lista usada para os vínculos no cadastro de veículos.
              </p>
            </div>
            <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              ${this.estado.proprietarios.length}
            </span>
          </div>
          <div class="mt-6">
            ${this.renderListaProprietarios()}
          </div>
        </article>
      </section>
    `;
  }

  private renderListaProprietarios(): string {
    if (this.estado.carregandoInicial && this.estado.proprietarios.length === 0) {
      return `<p class="text-sm text-slate-500 dark:text-slate-400">Carregando proprietários...</p>`;
    }

    if (this.estado.proprietarios.length === 0) {
      return this.renderEstadoVazio(
        'Nenhum proprietário cadastrado',
        'Cadastre o primeiro proprietário para começar a vincular veículos.',
      );
    }

    return `
      <div class="space-y-4">
        ${this.estado.proprietarios
          .map((proprietario) => {
            const estaEditando =
              this.estado.editandoProprietario?.id === proprietario.id;
            const estaExcluindo =
              this.estado.excluindoProprietarioId === proprietario.id;

            return `
              <article class="rounded-3xl border border-slate-200 p-4 transition dark:border-slate-800 ${estaEditando ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20' : ''}">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div class="min-w-0 space-y-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-lg font-semibold tracking-tight">
                        ${escapeHtml(proprietario.nome)}
                      </h3>
                      ${
                        estaEditando
                          ? '<span class="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-200">em edição</span>'
                          : ''
                      }
                    </div>
                    <p class="break-all text-sm text-slate-600 dark:text-slate-300">
                      ${escapeHtml(proprietario.email)}
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      ${escapeHtml(proprietario.telefone)}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-action="editar-proprietario"
                      data-proprietario-id="${proprietario.id}"
                      class="${CLASSE_BOTAO_SECUNDARIO}"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      data-action="excluir-proprietario"
                      data-proprietario-id="${proprietario.id}"
                      class="${CLASSE_BOTAO_PERIGO}"
                      ${estaExcluindo ? 'disabled' : ''}
                    >
                      ${estaExcluindo ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              </article>
            `;
          })
          .join('')}
      </div>
    `;
  }

  private renderAbaVeiculos(): string {
    const semProprietarios = this.estado.proprietarios.length === 0;

    return `
      <section class="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <article class="${CLASSE_CARTAO}">
          <h2 class="text-xl font-semibold tracking-tight">
            Novo veículo
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            O cadastro usa o DTO da API e exige um proprietário válido.
          </p>
          ${
            semProprietarios
              ? `
                <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Cadastre ao menos um proprietário na aba correspondente antes de criar veículos.
                </div>
              `
              : ''
          }
          <form data-form="veiculo" class="mt-6 space-y-4">
            ${this.renderCampoTexto({
              autocomplete: 'off',
              ajuda: 'Obrigatório. Máximo de 20 caracteres.',
              id: 'marca',
              label: 'Marca',
              maxLength: 20,
              name: 'marca',
              placeholder: 'Ex.: Toyota',
              required: true,
              type: 'text',
              value: '',
            })}
            ${this.renderCampoTexto({
              autocomplete: 'off',
              ajuda: 'Obrigatório. Máximo de 20 caracteres.',
              id: 'modelo',
              label: 'Modelo',
              maxLength: 20,
              name: 'modelo',
              placeholder: 'Ex.: Corolla',
              required: true,
              type: 'text',
              value: '',
            })}
            ${this.renderCampoTexto({
              autocomplete: 'off',
              ajuda: 'Formato aceito: ABC1234 ou ABC1D23. Hífens e espaços são removidos automaticamente.',
              id: 'placa',
              label: 'Placa',
              maxLength: 8,
              name: 'placa',
              placeholder: 'ABC1D23',
              required: true,
              type: 'text',
              value: '',
            })}
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Proprietário
              <select
                id="proprietarioId"
                name="proprietarioId"
                class="${CLASSE_INPUT}"
                required
                ${semProprietarios ? 'disabled' : ''}
              >
                <option value="">Selecione um proprietário</option>
                ${this.estado.proprietarios
                  .map(
                    (proprietario) => `
                      <option value="${proprietario.id}">
                        ${escapeHtml(proprietario.nome)} — ${escapeHtml(proprietario.email)}
                      </option>
                    `,
                  )
                  .join('')}
              </select>
              <span class="${CLASSE_TEXTO_AJUDA}">
                O backend exige apenas o identificador do proprietário no payload.
              </span>
            </label>
            <button
              type="submit"
              class="${CLASSE_BOTAO_PRIMARIO} w-full"
              ${semProprietarios || this.estado.enviandoVeiculo ? 'disabled' : ''}
            >
              ${this.estado.enviandoVeiculo ? 'Cadastrando...' : 'Cadastrar veículo'}
            </button>
          </form>
        </article>

        <article class="${CLASSE_CARTAO}">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold tracking-tight">
                Veículos cadastrados
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Ações de apreensão e liberação respeitam os endpoints não-CRUD da API.
              </p>
            </div>
            <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              ${this.estado.veiculos.length}
            </span>
          </div>
          <div class="mt-6">
            ${this.renderListaVeiculos()}
          </div>
        </article>
      </section>

      <section class="${CLASSE_CARTAO}">
        ${this.renderDetalheVeiculo()}
      </section>
    `;
  }

  private renderListaVeiculos(): string {
    if (this.estado.carregandoInicial && this.estado.veiculos.length === 0) {
      return `<p class="text-sm text-slate-500 dark:text-slate-400">Carregando veículos...</p>`;
    }

    if (this.estado.veiculos.length === 0) {
      return this.renderEstadoVazio(
        'Nenhum veículo cadastrado',
        'Cadastre um veículo para acompanhar status e registrar autuações.',
      );
    }

    return `
      <div class="space-y-4">
        ${this.estado.veiculos
          .map((veiculo) => {
            const selecionado = this.estado.veiculoSelecionadoId === veiculo.id;
            const processando = this.estado.processandoVeiculoId === veiculo.id;

            return `
              <article class="rounded-3xl border border-slate-200 p-4 transition dark:border-slate-800 ${selecionado ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20' : ''}">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0 space-y-3">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-lg font-semibold tracking-tight">
                        ${escapeHtml(veiculo.placa)}
                      </h3>
                      <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classeStatus(veiculo.status)}">
                        ${formatarStatus(veiculo.status)}
                      </span>
                    </div>
                    <p class="text-sm text-slate-600 dark:text-slate-300">
                      ${escapeHtml(veiculo.marca)} ${escapeHtml(veiculo.modelo)}
                    </p>
                    <div class="grid gap-2 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                      <p><span class="font-medium text-slate-700 dark:text-slate-200">Proprietário:</span> ${escapeHtml(veiculo.proprietario.nome)}</p>
                      <p><span class="font-medium text-slate-700 dark:text-slate-200">Cadastro:</span> ${escapeHtml(formatarDataHora(veiculo.dataCadastro))}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-action="selecionar-veiculo"
                      data-veiculo-id="${veiculo.id}"
                      class="${CLASSE_BOTAO_SECUNDARIO}"
                    >
                      ${selecionado ? 'Detalhe aberto' : 'Ver detalhe'}
                    </button>
                    ${
                      veiculo.status === 'REGULAR'
                        ? `
                          <button
                            type="button"
                            data-action="apreender-veiculo"
                            data-veiculo-id="${veiculo.id}"
                            class="${CLASSE_BOTAO_PERIGO}"
                            ${processando ? 'disabled' : ''}
                          >
                            ${processando ? 'Processando...' : 'Apreender'}
                          </button>
                        `
                        : `
                          <button
                            type="button"
                            data-action="liberar-veiculo"
                            data-veiculo-id="${veiculo.id}"
                            class="${CLASSE_BOTAO_PRIMARIO}"
                            ${processando ? 'disabled' : ''}
                          >
                            ${processando ? 'Processando...' : 'Liberar'}
                          </button>
                        `
                    }
                  </div>
                </div>
              </article>
            `;
          })
          .join('')}
      </div>
    `;
  }

  private renderDetalheVeiculo(): string {
    const veiculo = this.veiculoSelecionado;

    if (!veiculo) {
      return this.renderEstadoVazio(
        'Nenhum veículo selecionado',
        'Escolha um veículo na lista para visualizar detalhes e gerenciar suas autuações.',
      );
    }

    const processando = this.estado.processandoVeiculoId === veiculo.id;

    return `
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <section>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                Veículo selecionado
              </p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight">
                ${escapeHtml(veiculo.placa)}
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                ${escapeHtml(veiculo.marca)} ${escapeHtml(veiculo.modelo)} — proprietário ${escapeHtml(veiculo.proprietario.nome)}
              </p>
            </div>
            <span class="inline-flex self-start rounded-full px-3 py-1 text-sm font-semibold ${classeStatus(veiculo.status)}">
              ${formatarStatus(veiculo.status)}
            </span>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            ${this.renderCampoResumo('Marca', veiculo.marca)}
            ${this.renderCampoResumo('Modelo', veiculo.modelo)}
            ${this.renderCampoResumo('Proprietário', veiculo.proprietario.nome)}
            ${this.renderCampoResumo('Status', formatarStatus(veiculo.status))}
            ${this.renderCampoResumo('Data de cadastro', formatarDataHora(veiculo.dataCadastro))}
            ${this.renderCampoResumo('Data de apreensão', formatarDataHora(veiculo.dataApreensao))}
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            ${
              veiculo.status === 'REGULAR'
                ? `
                  <button
                    type="button"
                    data-action="apreender-veiculo"
                    data-veiculo-id="${veiculo.id}"
                    class="${CLASSE_BOTAO_PERIGO}"
                    ${processando ? 'disabled' : ''}
                  >
                    ${processando ? 'Processando...' : 'Apreender veículo'}
                  </button>
                `
                : `
                  <button
                    type="button"
                    data-action="liberar-veiculo"
                    data-veiculo-id="${veiculo.id}"
                    class="${CLASSE_BOTAO_PRIMARIO}"
                    ${processando ? 'disabled' : ''}
                  >
                    ${processando ? 'Processando...' : 'Liberar veículo'}
                  </button>
                `
            }
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 p-4 dark:border-slate-800 md:p-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold tracking-tight">
                Autuações do veículo
              </h3>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Sub-recurso disponível em <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">/veiculos/${veiculo.id}/autuacoes</code>
              </p>
            </div>
            <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              ${this.estado.autuacoes.length}
            </span>
          </div>

          <div class="mt-5">
            ${this.renderListaAutuacoes()}
          </div>

          <form data-form="autuacao" class="mt-6 space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h4 class="text-base font-semibold tracking-tight">
              Registrar nova autuação
            </h4>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Descrição
              <textarea
                id="descricao"
                name="descricao"
                class="${CLASSE_INPUT} min-h-28 resize-y"
                placeholder="Ex.: Estacionamento em local proibido"
                required
              ></textarea>
            </label>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Valor da multa
              <input
                id="valorMulta"
                name="valorMulta"
                type="text"
                inputmode="decimal"
                class="${CLASSE_INPUT}"
                placeholder="Ex.: 195,23"
                required
              />
              <span class="${CLASSE_TEXTO_AJUDA}">
                O backend exige um número positivo.
              </span>
            </label>
            <button
              type="submit"
              class="${CLASSE_BOTAO_PRIMARIO} w-full"
              ${this.estado.enviandoAutuacao ? 'disabled' : ''}
            >
              ${this.estado.enviandoAutuacao ? 'Registrando...' : 'Registrar autuação'}
            </button>
          </form>
        </section>
      </div>
    `;
  }

  private renderListaAutuacoes(): string {
    if (this.estado.carregandoAutuacoes) {
      return `<p class="text-sm text-slate-500 dark:text-slate-400">Carregando autuações...</p>`;
    }

    if (this.estado.autuacoes.length === 0) {
      return this.renderEstadoVazio(
        'Nenhuma autuação registrada',
        'Use o formulário abaixo para criar a primeira autuação deste veículo.',
      );
    }

    return `
      <div class="space-y-3">
        ${this.estado.autuacoes
          .map(
            (autuacao) => `
              <article class="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div class="space-y-2">
                    <h4 class="font-semibold text-slate-900 dark:text-slate-50">
                      ${escapeHtml(autuacao.descricao)}
                    </h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      ${escapeHtml(formatarDataHora(autuacao.dataOcorrencia))}
                    </p>
                  </div>
                  <strong class="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    ${escapeHtml(formatarMoeda(autuacao.valorMulta))}
                  </strong>
                </div>
              </article>
            `,
          )
          .join('')}
      </div>
    `;
  }

  private renderCampoTexto(config: {
    autocomplete: string;
    ajuda: string;
    id: string;
    label: string;
    maxLength: number;
    name: string;
    placeholder: string;
    required: boolean;
    type: string;
    value: string;
  }): string {
    return `
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
        ${config.label}
        <input
          id="${config.id}"
          name="${config.name}"
          type="${config.type}"
          autocomplete="${config.autocomplete}"
          maxlength="${config.maxLength}"
          placeholder="${escapeHtml(config.placeholder)}"
          class="${CLASSE_INPUT}"
          value="${escapeHtml(config.value)}"
          ${config.required ? 'required' : ''}
        />
        <span class="${CLASSE_TEXTO_AJUDA}">
          ${escapeHtml(config.ajuda)}
        </span>
      </label>
    `;
  }

  private renderCampoResumo(rotulo: string, valor: string): string {
    return `
      <article class="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          ${escapeHtml(rotulo)}
        </p>
        <p class="mt-2 text-sm font-medium leading-6 text-slate-900 dark:text-slate-50">
          ${escapeHtml(valor)}
        </p>
      </article>
    `;
  }

  private renderEstadoVazio(titulo: string, descricao: string): string {
    return `
      <div class="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
        <p class="text-base font-semibold text-slate-900 dark:text-slate-50">
          ${escapeHtml(titulo)}
        </p>
        <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          ${escapeHtml(descricao)}
        </p>
      </div>
    `;
  }
}
