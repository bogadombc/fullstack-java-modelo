import './style.css';
import { AplicacaoTransito } from './app';
import { inicializarTema } from './core/tema';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Elemento #app não encontrado.');
}

inicializarTema();

const aplicacao = new AplicacaoTransito(root);

aplicacao.iniciar().catch((erro: unknown) => {
  console.error(erro);

  root.innerHTML = `
    <main class="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section class="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-6 shadow-sm shadow-slate-950/5 dark:border-rose-900/50 dark:bg-slate-900">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
          Erro ao iniciar
        </p>
        <h1 class="mt-3 text-2xl font-semibold">
          Não foi possível carregar o frontend.
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Verifique se as dependências foram instaladas corretamente e tente novamente.
        </p>
      </section>
    </main>
  `;
});
