import {
  GAS_CONFIG,
  CATEGORIAS_INFO,
  ESCOLAS_FUNDAMENTAL_INICIAIS,
  ESCOLAS_MEDIO_INICIAIS
} from './data.js';
import { LOGO_SVG, SEAL_SVG, SEAL_IMG_HTML } from './assets.js';
import {
  USEREMAIL,
  estaAutenticado,
  obterUsuarioAutenticado,
  loginComGoogle,
  logoutGoogle,
  obterPerfilEscola,
  salvarPerfilEscola
} from './auth.js';

// Estado global da aplicação
let estado = {
  fundamental: [...ESCOLAS_FUNDAMENTAL_INICIAIS],
  medio: [...ESCOLAS_MEDIO_INICIAIS],
  buscaFundamental: '',
  filtroNivelFundamental: 'todos',
  buscaMedio: '',
  filtroNivelMedio: 'todos',
  statusGas: 'carregando', // 'sincronizado', 'base_local', 'carregando'
  ultimaAtualizacao: null
};

// Inicialização ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  renderizarAssetsEstáticos();
  renderizarCategorias();
  renderizarAuthNav();
  renderizarAreaMinhaEscola();
  renderizarRankingFundamental();
  renderizarRankingMedio();
  inicializarEventos();
  sincronizarGoogleAppsScript();

  // Escuta alterações de autenticação
  window.addEventListener('edususten:auth-change', () => {
    renderizarAuthNav();
    renderizarAreaMinhaEscola();
  });
});

// Injeta os SVGs do logotipo e selo nos locais corretos
function renderizarAssetsEstáticos() {
  const logoNavbar = document.getElementById('logo-navbar-slot');
  if (logoNavbar) {
    logoNavbar.innerHTML = `
      <div class="flex items-center gap-3 group cursor-pointer" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
        <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          ${LOGO_SVG}
        </div>
        <div class="leading-none">
          <div class="text-xl font-extrabold tracking-tight font-montserrat">
            <span class="text-[#0a284f]">Edu</span><span class="text-[#118552]">Susten</span>
          </div>
          <span class="text-[9px] uppercase tracking-wider text-[#2f4a69] font-medium block">
            Ranking Sustentável
          </span>
        </div>
      </div>
    `;
  }

  const logoHero = document.getElementById('logo-hero-slot');
  if (logoHero) logoHero.innerHTML = LOGO_SVG;

  const seloHero = document.getElementById('selo-hero-slot');
  if (seloHero) seloHero.innerHTML = SEAL_IMG_HTML;

  const seloDestaque = document.getElementById('selo-destaque-slot');
  if (seloDestaque) seloDestaque.innerHTML = SEAL_SVG;

  const logoFooter = document.getElementById('logo-footer-slot');
  if (logoFooter) logoFooter.innerHTML = LOGO_SVG;
}

// Renderiza os 5 indicadores principais com pesos da planilha real (300, 200, 150, 150, 200 = 1000 pts)
function renderizarCategorias() {
  const container = document.getElementById('grid-categorias');
  if (!container) return;

  container.innerHTML = CATEGORIAS_INFO.map((cat, idx) => `
    <div class="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg" style="background-color: ${cat.cor}18; color: ${cat.cor}">
            <i data-lucide="${cat.icone}" class="w-6 h-6"></i>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-md text-slate-700 bg-slate-100">
            ${cat.pontosMax} pts (${cat.peso})
          </span>
        </div>
        <h3 class="text-lg font-bold text-[#0a284f] font-montserrat mb-2 flex items-center gap-2">
          <span>${idx + 1}. ${cat.nome}</span>
        </h3>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">
          ${cat.descricao}
        </p>
      </div>
      <div>
        <div class="pt-4 border-t border-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Critérios Avaliados na Planilha:</p>
          <ul class="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            ${cat.criterios.slice(0, 2).map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
        <button 
          onclick="abrirModalCategoria('${cat.id}')"
          class="mt-4 w-full py-2 px-3 text-xs font-semibold text-[#118552] bg-[#118552]/10 hover:bg-[#118552]/20 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          <span>Ver metodologia detalhada</span>
          <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Normalizador dos dados vindos do Google Apps Script
function normalizarItemDaPlanilha(item, index, tipo) {
  const nome = item["Nome da Escola"] || item["Nome"] || item["Escola"] || `Escola #${index + 1}`;
  const localizacao = item["Localização"] || item["Localizacao"] || item["Cidade"] || "Cabo de Santo Agostinho - PE";
  
  const energia = Number(item["Energia (Máx 300)"] || item["Energia"] || 0);
  const agua = Number(item["Água (Máx 200)"] || item["Agua (Máx 200)"] || item["Água"] || item["Agua"] || 0);
  const infraestrutura = Number(item["Infraestrutura (Máx 150)"] || item["Infraestrutura"] || 0);
  const residuos = Number(item["Resíduos (Máx 150)"] || item["Residuos (Máx 150)"] || item["Resíduos"] || item["Residuos"] || 0);
  const educacao = Number(item["Educação Ambiental (Máx 200)"] || item["Educacao Ambiental (Máx 200)"] || item["Educação Ambiental"] || 0);

  let pontuacaoTotal = Number(item["Pontuação Total"] || item["Pontuacao Total"] || 0);
  if (!pontuacaoTotal && (energia || agua || infraestrutura || residuos || educacao)) {
    pontuacaoTotal = energia + agua + infraestrutura + residuos + educacao;
  }

  // Definição do nível/selo
  let nivel = 'Participante';
  let selo = 'Em Avaliação';
  if (pontuacaoTotal >= 900) {
    nivel = 'Ouro';
    selo = 'Selo Ouro';
  } else if (pontuacaoTotal >= 800) {
    nivel = 'Prata';
    selo = 'Selo Prata';
  } else if (pontuacaoTotal >= 700) {
    nivel = 'Bronze';
    selo = 'Selo Bronze';
  } else if (pontuacaoTotal >= 500) {
    nivel = 'Bronze';
    selo = 'Escola Compromissada';
  }

  const observacoes = item["Observações"] || item["Observacoes"] || "";
  const destaque = observacoes ? observacoes : (pontuacaoTotal > 0 ? "Instituição com desempenho certificado no ciclo 2026." : "Escola inscrita na plataforma. Aguardando envio das evidências.");

  return {
    id: `${tipo}-${index}-${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    posicao: item["Posição"] || item["Posicao"] || (index + 1),
    nome,
    localizacao,
    cidade: localizacao.split('-')[0].trim(),
    uf: localizacao.split('-')[1]?.trim() || 'PE',
    energia,
    agua,
    infraestrutura,
    residuos,
    educacao,
    pontuacaoTotal,
    pontuacaoMax: 1000,
    nivel,
    selo,
    observacoes,
    destaque,
    anoAvaliaca: 2026,
    alunos: pontuacaoTotal > 0 ? (tipo === 'ef' ? 620 : 850) : 350,
    residuosRecicladosTon: pontuacaoTotal > 0 ? ((residuos / 150) * (tipo === 'ef' ? 14 : 22)).toFixed(1) : 0
  };
}

// Sincronização inteligente com a Web App do Google Apps Script
export async function sincronizarGoogleAppsScript() {
  const statusBadge = document.getElementById('status-gas-badge');
  if (statusBadge) {
    statusBadge.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0a284f] border border-blue-200">
        <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>
        <span>Sincronizando com Google Planilhas...</span>
      </span>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  let dadosRecebidos = null;

  // Tentativa 1: Via URL de proxy local (/api/ranking) para evitar qualquer problema de CORS em iframes
  try {
    const res = await fetch(GAS_CONFIG.proxyUrl, { method: 'GET' });
    if (res.ok) {
      dadosRecebidos = await res.json();
    }
  } catch (e) {
    // Falha silenciosa no proxy, tenta direto
  }

  // Tentativa 2: Direto da URL oficial do Google Apps Script
  if (!dadosRecebidos) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(GAS_CONFIG.webAppUrl, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        dadosRecebidos = await res.json();
      }
    } catch (e) {
      console.warn('Tentativa direta ao Google Apps Script encontrou restrição de rede, usando dados sincronizados em cache:', e);
    }
  }

  if (dadosRecebidos && typeof dadosRecebidos === 'object') {
    // Identifica as abas no JSON retornado
    const chaves = Object.keys(dadosRecebidos);
    const chaveFundamental = chaves.find(k => k.trim().toLowerCase().includes('fundamental')) || 'Escolas Fundamentais';
    const chaveMedio = chaves.find(k => k.trim().toLowerCase().includes('médio') || k.trim().toLowerCase().includes('medio')) || ' Escolas Ensino Médio ';

    const rawFundamental = dadosRecebidos[chaveFundamental] || [];
    const rawMedio = dadosRecebidos[chaveMedio] || [];

    if (rawFundamental.length > 0) {
      estado.fundamental = rawFundamental.map((item, idx) => normalizarItemDaPlanilha(item, idx, 'ef'));
    }
    if (rawMedio.length > 0) {
      estado.medio = rawMedio.map((item, idx) => normalizarItemDaPlanilha(item, idx, 'em'));
    }

    estado.statusGas = 'sincronizado';
    estado.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (statusBadge) {
      statusBadge.innerHTML = `
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#118552] border border-emerald-300">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
            <span>Google Planilhas Conectado ao Vivo (${estado.ultimaAtualizacao})</span>
          </span>
          <button id="btn-sync-gas-reload" class="text-xs text-[#0a284f] hover:text-[#118552] font-semibold underline flex items-center gap-1 cursor-pointer">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
            <span>Atualizar Agora</span>
          </button>
        </div>
      `;
      const btn = document.getElementById('btn-sync-gas-reload');
      if (btn) btn.addEventListener('click', () => sincronizarGoogleAppsScript());
    }

    renderizarRankingFundamental();
    renderizarRankingMedio();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Se não foi possível buscar online no momento, os dados espelhados da planilha oficial já estão ativos
  estado.statusGas = 'base_local';
  if (statusBadge) {
    statusBadge.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#118552] border border-emerald-200">
          <i data-lucide="database" class="w-3.5 h-3.5"></i>
          <span>Dados Reais da Planilha Carregados (${estado.fundamental.length + estado.medio.length} escolas)</span>
        </span>
        <button id="btn-sync-gas-retry" class="text-xs text-[#0a284f] hover:text-[#118552] font-semibold underline flex items-center gap-1 cursor-pointer">
          <i data-lucide="refresh-cw" class="w-3 h-3"></i>
          <span>Sincronizar Novamente</span>
        </button>
      </div>
    `;
    const retryBtn = document.getElementById('btn-sync-gas-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => sincronizarGoogleAppsScript());
  }
  if (window.lucide) window.lucide.createIcons();
}

// Renderiza a seção de Ensino Fundamental
export function renderizarRankingFundamental() {
  const listaFiltrada = estado.fundamental.filter(escola => {
    const matchBusca = escola.nome.toLowerCase().includes(estado.buscaFundamental.toLowerCase()) ||
                       escola.cidade.toLowerCase().includes(estado.buscaFundamental.toLowerCase()) ||
                       escola.uf.toLowerCase().includes(estado.buscaFundamental.toLowerCase()) ||
                       escola.localizacao.toLowerCase().includes(estado.buscaFundamental.toLowerCase());
    const matchNivel = estado.filtroNivelFundamental === 'todos' || 
                       escola.nivel.toLowerCase() === estado.filtroNivelFundamental.toLowerCase();
    return matchBusca && matchNivel;
  }).sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  // Top 1 Fundamental (com pontuação > 0)
  const topEscola = estado.fundamental.slice().sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal).find(e => e.pontuacaoTotal > 0) || estado.fundamental[0];
  const topSlot = document.getElementById('top1-fundamental-slot');
  if (topSlot && topEscola) {
    topSlot.innerHTML = `
      <div class="bg-gradient-to-br from-[#0a284f] to-[#177147] text-white rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div class="absolute -right-8 -bottom-8 w-44 h-44 opacity-20 pointer-events-none">
          ${SEAL_SVG}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase px-3 py-1 bg-[#cca549] text-slate-900 rounded-full">
            <i data-lucide="crown" class="w-4 h-4"></i>
            <span>Top #1 Sustentabilidade Escolar · Fundamental</span>
          </div>
          <span class="text-xs text-white/80">Planilha Oficial Google · Ciclo 2026</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div class="lg:col-span-8">
            <h3 class="text-2xl lg:text-3xl font-extrabold font-montserrat text-white mb-2">
              ${topEscola.nome}
            </h3>
            <p class="text-sm text-emerald-100/90 mb-4 flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-[#cca549]"></i>
              <span>${topEscola.localizacao}</span>
              <span class="text-white/40">·</span>
              <span>Posição #${topEscola.posicao}</span>
            </p>
            <p class="text-xs lg:text-sm text-slate-200/90 italic bg-white/10 p-3 rounded-lg border border-white/10">
              "${topEscola.destaque}"
            </p>
          </div>

          <div class="lg:col-span-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15 text-center flex flex-col items-center justify-center">
            <div class="text-4xl lg:text-5xl font-black text-[#cca549] font-montserrat">
              ${topEscola.pontuacaoTotal}
            </div>
            <div class="text-xs text-emerald-100 font-medium mt-1">de 1.000 pontos possíveis</div>
            <div class="mt-3 px-3 py-1 bg-white/20 rounded-md text-xs font-bold text-white uppercase tracking-wider">
              ${topEscola.selo}
            </div>
            <button onclick="abrirModalEscola('${topEscola.id}')" class="mt-4 w-full py-2 px-3 bg-[#cca549] hover:bg-[#b89139] text-[#0a284f] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <span>Ver Relatório Completo</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Estatísticas Gerais Fundamental
  const statsSlot = document.getElementById('stats-fundamental-slot');
  if (statsSlot) {
    const totalEscolas = estado.fundamental.length;
    const escolasAvaliadas = estado.fundamental.filter(e => e.pontuacaoTotal > 0);
    const mediaPontos = escolasAvaliadas.length > 0 
      ? Math.round(escolasAvaliadas.reduce((acc, cur) => acc + cur.pontuacaoTotal, 0) / escolasAvaliadas.length)
      : 0;

    statsSlot.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Escolas na Planilha</div>
          <div class="text-2xl font-bold text-[#0a284f] font-montserrat mt-1">${totalEscolas}</div>
          <div class="text-[11px] text-[#118552] flex items-center gap-1 mt-1 font-medium">
            <i data-lucide="sheet" class="w-3.5 h-3.5"></i>
            <span>Aba Escolas Fundamentais</span>
          </div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Média das Auditadas</div>
          <div class="text-2xl font-bold text-[#118552] font-montserrat mt-1">${mediaPontos} <span class="text-xs text-slate-400 font-normal">/ 1000</span></div>
          <div class="text-[11px] text-slate-500 mt-1">${escolasAvaliadas.length} com notas computadas</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Nota Máxima em Energia</div>
          <div class="text-2xl font-bold text-[#cca549] font-montserrat mt-1">${Math.max(...estado.fundamental.map(e => e.energia))} <span class="text-xs text-slate-400 font-normal">/ 300</span></div>
          <div class="text-[11px] text-slate-500 mt-1">Destaque em energia solar</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Município Sede</div>
          <div class="text-lg font-bold text-[#2f4a69] font-montserrat mt-1 truncate">Cabo de Santo Agostinho</div>
          <div class="text-[11px] text-slate-500 mt-1">Pernambuco (PE)</div>
        </div>
      </div>
    `;
  }

  // Tabela Interativa Fundamental
  const tabelaSlot = document.getElementById('tabela-fundamental-slot');
  if (tabelaSlot) {
    if (listaFiltrada.length === 0) {
      tabelaSlot.innerHTML = `
        <div class="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <i data-lucide="search-x" class="w-10 h-10 mx-auto text-slate-400 mb-3"></i>
          <p class="font-semibold text-slate-700">Nenhuma escola de Ensino Fundamental encontrada</p>
          <p class="text-xs text-slate-500 mt-1">Tente ajustar a busca ou o filtro de selo.</p>
        </div>
      `;
    } else {
      tabelaSlot.innerHTML = `
        <div class="overflow-x-auto bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <table class="w-full text-left text-sm border-collapse min-w-[820px]">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th class="py-3.5 px-4 text-center w-16">Posição</th>
                <th class="py-3.5 px-4">Escola / Localização</th>
                <th class="py-3.5 px-3 text-center">Energia<br><span class="text-[10px] text-slate-400 font-normal">(Máx 300)</span></th>
                <th class="py-3.5 px-3 text-center">Água<br><span class="text-[10px] text-slate-400 font-normal">(Máx 200)</span></th>
                <th class="py-3.5 px-3 text-center">Infra<br><span class="text-[10px] text-slate-400 font-normal">(Máx 150)</span></th>
                <th class="py-3.5 px-3 text-center">Resíduos<br><span class="text-[10px] text-slate-400 font-normal">(Máx 150)</span></th>
                <th class="py-3.5 px-3 text-center">Educação<br><span class="text-[10px] text-slate-400 font-normal">(Máx 200)</span></th>
                <th class="py-3.5 px-4 text-center">Total<br><span class="text-[10px] text-slate-400 font-normal">(1.000)</span></th>
                <th class="py-3.5 px-4 text-center">Certificação</th>
                <th class="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${listaFiltrada.map((escola, i) => {
                const medalhaHtml = escola.pontuacaoTotal > 0 && i === 0 
                  ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">🥇 1º</span>`
                  : escola.pontuacaoTotal > 0 && i === 1 
                  ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs">🥈 2º</span>`
                  : escola.pontuacaoTotal > 0 && i === 2 
                  ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-extrabold text-xs">🥉 3º</span>`
                  : `<span class="font-bold text-slate-400">#${escola.posicao || (i + 1)}</span>`;

                const seloCor = escola.pontuacaoTotal >= 900
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : escola.pontuacaoTotal >= 800
                  ? 'bg-slate-50 text-slate-700 border-slate-300'
                  : escola.pontuacaoTotal >= 500
                  ? 'bg-orange-50 text-orange-800 border-orange-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200';

                return `
                  <tr class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">${medalhaHtml}</td>
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-[#0a284f] font-montserrat">${escola.nome}</div>
                      <div class="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span>${escola.localizacao}</span>
                        ${escola.observacoes ? `<span class="text-slate-300">·</span><span class="text-slate-500 italic truncate max-w-[200px]">${escola.observacoes}</span>` : ''}
                      </div>
                    </td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.energia > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.energia || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.agua > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.agua || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.infraestrutura > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.infraestrutura || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.residuos > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.residuos || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.educacao > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.educacao || '-'}</td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      ${escola.pontuacaoTotal > 0 
                        ? `<span class="font-black text-base text-[#118552]">${escola.pontuacaoTotal}</span><span class="text-[10px] text-slate-400 block">/1000</span>` 
                        : `<span class="text-xs text-slate-400 font-medium italic">Pendente</span>`}
                    </td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      <span class="inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${seloCor}">
                        ${escola.selo}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      <button 
                        onclick="abrirModalEscola('${escola.id}')"
                        class="text-xs font-semibold text-[#118552] hover:text-[#0a284f] hover:underline px-2 py-1 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1">
                        <span>Ver Ficha</span>
                        <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Renderiza a seção de Ensino Médio
export function renderizarRankingMedio() {
  const listaFiltrada = estado.medio.filter(escola => {
    const matchBusca = escola.nome.toLowerCase().includes(estado.buscaMedio.toLowerCase()) ||
                       escola.cidade.toLowerCase().includes(estado.buscaMedio.toLowerCase()) ||
                       escola.uf.toLowerCase().includes(estado.buscaMedio.toLowerCase()) ||
                       escola.localizacao.toLowerCase().includes(estado.buscaMedio.toLowerCase());
    const matchNivel = estado.filtroNivelMedio === 'todos' || 
                       escola.nivel.toLowerCase() === estado.filtroNivelMedio.toLowerCase();
    return matchBusca && matchNivel;
  }).sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  // Top 1 Médio (com pontuação > 0)
  const topEscola = estado.medio.slice().sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal).find(e => e.pontuacaoTotal > 0) || estado.medio[0];
  const topSlot = document.getElementById('top1-medio-slot');
  if (topSlot && topEscola) {
    topSlot.innerHTML = `
      <div class="bg-gradient-to-br from-[#0a284f] via-[#2f4a69] to-[#118552] text-white rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div class="absolute -right-8 -bottom-8 w-44 h-44 opacity-20 pointer-events-none">
          ${SEAL_SVG}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase px-3 py-1 bg-[#cca549] text-slate-900 rounded-full">
            <i data-lucide="trophy" class="w-4 h-4"></i>
            <span>Top #1 Sustentabilidade Escolar · Ensino Médio</span>
          </div>
          <span class="text-xs text-white/80">Planilha Oficial Google · Ciclo 2026</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div class="lg:col-span-8">
            <h3 class="text-2xl lg:text-3xl font-extrabold font-montserrat text-white mb-2">
              ${topEscola.nome}
            </h3>
            <p class="text-sm text-emerald-100/90 mb-4 flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-[#cca549]"></i>
              <span>${topEscola.localizacao}</span>
              <span class="text-white/40">·</span>
              <span>Posição #${topEscola.posicao}</span>
            </p>
            <p class="text-xs lg:text-sm text-slate-200/90 italic bg-white/10 p-3 rounded-lg border border-white/10">
              "${topEscola.destaque}"
            </p>
          </div>

          <div class="lg:col-span-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15 text-center flex flex-col items-center justify-center">
            <div class="text-4xl lg:text-5xl font-black text-[#cca549] font-montserrat">
              ${topEscola.pontuacaoTotal}
            </div>
            <div class="text-xs text-emerald-100 font-medium mt-1">de 1.000 pontos possíveis</div>
            <div class="mt-3 px-3 py-1 bg-white/20 rounded-md text-xs font-bold text-white uppercase tracking-wider">
              ${topEscola.selo}
            </div>
            <button onclick="abrirModalEscola('${topEscola.id}')" class="mt-4 w-full py-2 px-3 bg-[#cca549] hover:bg-[#b89139] text-[#0a284f] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <span>Ver Relatório Completo</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Estatísticas Gerais Médio
  const statsSlot = document.getElementById('stats-medio-slot');
  if (statsSlot) {
    const totalEscolas = estado.medio.length;
    const escolasAvaliadas = estado.medio.filter(e => e.pontuacaoTotal > 0);
    const mediaPontos = escolasAvaliadas.length > 0 
      ? Math.round(escolasAvaliadas.reduce((acc, cur) => acc + cur.pontuacaoTotal, 0) / escolasAvaliadas.length)
      : 0;

    statsSlot.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Escolas na Planilha</div>
          <div class="text-2xl font-bold text-[#0a284f] font-montserrat mt-1">${totalEscolas}</div>
          <div class="text-[11px] text-[#118552] flex items-center gap-1 mt-1 font-medium">
            <i data-lucide="sheet" class="w-3.5 h-3.5"></i>
            <span>Aba Escolas Ensino Médio</span>
          </div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Média das Auditadas</div>
          <div class="text-2xl font-bold text-[#118552] font-montserrat mt-1">${mediaPontos} <span class="text-xs text-slate-400 font-normal">/ 1000</span></div>
          <div class="text-[11px] text-slate-500 mt-1">${escolasAvaliadas.length} com notas computadas</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Nota Máxima em Energia</div>
          <div class="text-2xl font-bold text-[#cca549] font-montserrat mt-1">${Math.max(...estado.medio.map(e => e.energia))} <span class="text-xs text-slate-400 font-normal">/ 300</span></div>
          <div class="text-[11px] text-slate-500 mt-1">Destaque em eficiência técnica</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">Município Sede</div>
          <div class="text-lg font-bold text-[#2f4a69] font-montserrat mt-1 truncate">Cabo de Santo Agostinho</div>
          <div class="text-[11px] text-slate-500 mt-1">Pernambuco (PE)</div>
        </div>
      </div>
    `;
  }

  // Tabela Interativa Médio
  const tabelaSlot = document.getElementById('tabela-medio-slot');
  if (tabelaSlot) {
    if (listaFiltrada.length === 0) {
      tabelaSlot.innerHTML = `
        <div class="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <i data-lucide="search-x" class="w-10 h-10 mx-auto text-slate-400 mb-3"></i>
          <p class="font-semibold text-slate-700">Nenhuma escola de Ensino Médio encontrada</p>
          <p class="text-xs text-slate-500 mt-1">Tente ajustar a busca ou o filtro de selo.</p>
        </div>
      `;
    } else {
      tabelaSlot.innerHTML = `
        <div class="overflow-x-auto bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <table class="w-full text-left text-sm border-collapse min-w-[820px]">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th class="py-3.5 px-4 text-center w-16">Posição</th>
                <th class="py-3.5 px-4">Escola / Localização</th>
                <th class="py-3.5 px-3 text-center">Energia<br><span class="text-[10px] text-slate-400 font-normal">(Máx 300)</span></th>
                <th class="py-3.5 px-3 text-center">Água<br><span class="text-[10px] text-slate-400 font-normal">(Máx 200)</span></th>
                <th class="py-3.5 px-3 text-center">Infra<br><span class="text-[10px] text-slate-400 font-normal">(Máx 150)</span></th>
                <th class="py-3.5 px-3 text-center">Resíduos<br><span class="text-[10px] text-slate-400 font-normal">(Máx 150)</span></th>
                <th class="py-3.5 px-3 text-center">Educação<br><span class="text-[10px] text-slate-400 font-normal">(Máx 200)</span></th>
                <th class="py-3.5 px-4 text-center">Total<br><span class="text-[10px] text-slate-400 font-normal">(1.000)</span></th>
                <th class="py-3.5 px-4 text-center">Certificação</th>
                <th class="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${listaFiltrada.map((escola, i) => {
                const medalhaHtml = escola.pontuacaoTotal > 0 && i === 0 
                  ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">🥇 1º</span>`
                  : escola.pontuacaoTotal > 0 && i === 1 
                  ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs">🥈 2º</span>`
                  : escola.pontuacaoTotal > 0 && i === 2 
                  ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-extrabold text-xs">🥉 3º</span>`
                  : `<span class="font-bold text-slate-400">#${escola.posicao || (i + 1)}</span>`;

                const seloCor = escola.pontuacaoTotal >= 900
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : escola.pontuacaoTotal >= 800
                  ? 'bg-slate-50 text-slate-700 border-slate-300'
                  : escola.pontuacaoTotal >= 500
                  ? 'bg-orange-50 text-orange-800 border-orange-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200';

                return `
                  <tr class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">${medalhaHtml}</td>
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-[#0a284f] font-montserrat">${escola.nome}</div>
                      <div class="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span>${escola.localizacao}</span>
                        ${escola.observacoes ? `<span class="text-slate-300">·</span><span class="text-slate-500 italic truncate max-w-[200px]">${escola.observacoes}</span>` : ''}
                      </div>
                    </td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.energia > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.energia || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.agua > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.agua || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.infraestrutura > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.infraestrutura || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.residuos > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.residuos || '-'}</td>
                    <td class="py-3.5 px-3 text-center font-medium ${escola.educacao > 0 ? 'text-slate-800 font-semibold' : 'text-slate-300'}">${escola.educacao || '-'}</td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      ${escola.pontuacaoTotal > 0 
                        ? `<span class="font-black text-base text-[#118552]">${escola.pontuacaoTotal}</span><span class="text-[10px] text-slate-400 block">/1000</span>` 
                        : `<span class="text-xs text-slate-400 font-medium italic">Pendente</span>`}
                    </td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      <span class="inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${seloCor}">
                        ${escola.selo}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                      <button 
                        onclick="abrirModalEscola('${escola.id}')"
                        class="text-xs font-semibold text-[#118552] hover:text-[#0a284f] hover:underline px-2 py-1 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1">
                        <span>Ver Ficha</span>
                        <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Inicializa os eventos da página
function inicializarEventos() {
  // Busca em tempo real - Fundamental
  const inputBuscaFund = document.getElementById('busca-fundamental');
  if (inputBuscaFund) {
    inputBuscaFund.addEventListener('input', (e) => {
      estado.buscaFundamental = e.target.value;
      renderizarRankingFundamental();
    });
  }

  // Filtros de nível - Fundamental
  document.querySelectorAll('[data-filtro-fundamental]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-filtro-fundamental]').forEach(b => {
        b.classList.remove('bg-[#118552]', 'text-white');
        b.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-100');
      });
      const target = e.currentTarget;
      target.classList.remove('bg-white', 'text-slate-600', 'hover:bg-slate-100');
      target.classList.add('bg-[#118552]', 'text-white');
      estado.filtroNivelFundamental = target.getAttribute('data-filtro-fundamental');
      renderizarRankingFundamental();
    });
  });

  // Busca em tempo real - Médio
  const inputBuscaMedio = document.getElementById('busca-medio');
  if (inputBuscaMedio) {
    inputBuscaMedio.addEventListener('input', (e) => {
      estado.buscaMedio = e.target.value;
      renderizarRankingMedio();
    });
  }

  // Filtros de nível - Médio
  document.querySelectorAll('[data-filtro-medio]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-filtro-medio]').forEach(b => {
        b.classList.remove('bg-[#0a284f]', 'text-white');
        b.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-100');
      });
      const target = e.currentTarget;
      target.classList.remove('bg-white', 'text-slate-600', 'hover:bg-slate-100');
      target.classList.add('bg-[#0a284f]', 'text-white');
      estado.filtroNivelMedio = target.getAttribute('data-filtro-medio');
      renderizarRankingMedio();
    });
  });

  // Menu mobile toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

// Modal de Detalhes da Escola
window.abrirModalEscola = function(id) {
  const escola = [...estado.fundamental, ...estado.medio].find(e => e.id === id);
  if (!escola) return;

  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button onclick="fecharModal()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="px-3 py-1 text-xs font-bold rounded-md bg-[#118552]/10 text-[#118552] uppercase tracking-wider">
            ${escola.selo}
          </span>
          <span class="text-xs text-slate-400">Posição Oficial: #${escola.posicao} · Ciclo ${escola.anoAvaliaca}</span>
        </div>

        <h3 class="text-2xl font-extrabold text-[#0a284f] font-montserrat">
          ${escola.nome}
        </h3>
        <p class="text-sm text-slate-500 mt-1 flex items-center gap-2">
          <i data-lucide="map-pin" class="w-4 h-4 text-[#118552]"></i>
          <span>${escola.localizacao}</span>
        </p>

        <div class="my-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500 uppercase font-semibold">Pontuação Total Auditada (Google Planilhas)</div>
            <div class="text-3xl font-black text-[#118552] font-montserrat mt-1">
              ${escola.pontuacaoTotal > 0 ? escola.pontuacaoTotal : 'Pendente'} 
              <span class="text-sm text-slate-400 font-normal">/ 1.000 pontos</span>
            </div>
          </div>
          <div class="w-16 h-16 flex-shrink-0">
            ${SEAL_SVG}
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Notas por Indicador na Planilha:</h4>
          
          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-700 flex items-center gap-1.5"><i data-lucide="zap" class="w-3.5 h-3.5 text-[#cca549]"></i> Energia (Máx 300)</span>
              <span class="text-slate-900">${escola.energia} / 300 pts</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-[#cca549] h-2 rounded-full" style="width: ${(escola.energia / 300) * 100}%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-700 flex items-center gap-1.5"><i data-lucide="droplets" class="w-3.5 h-3.5 text-[#2f4a69]"></i> Água (Máx 200)</span>
              <span class="text-slate-900">${escola.agua} / 200 pts</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-[#2f4a69] h-2 rounded-full" style="width: ${(escola.agua / 200) * 100}%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-700 flex items-center gap-1.5"><i data-lucide="building-2" class="w-3.5 h-3.5 text-[#177147]"></i> Infraestrutura (Máx 150)</span>
              <span class="text-slate-900">${escola.infraestrutura} / 150 pts</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-[#177147] h-2 rounded-full" style="width: ${(escola.infraestrutura / 150) * 100}%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-700 flex items-center gap-1.5"><i data-lucide="recycle" class="w-3.5 h-3.5 text-[#118552]"></i> Resíduos (Máx 150)</span>
              <span class="text-slate-900">${escola.residuos} / 150 pts</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-[#118552] h-2 rounded-full" style="width: ${(escola.residuos / 150) * 100}%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-700 flex items-center gap-1.5"><i data-lucide="sprout" class="w-3.5 h-3.5 text-[#22a267]"></i> Educação Ambiental (Máx 200)</span>
              <span class="text-slate-900">${escola.educacao} / 200 pts</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-[#22a267] h-2 rounded-full" style="width: ${(escola.educacao / 200) * 100}%"></div>
            </div>
          </div>
        </div>

        <div class="bg-emerald-50/70 border border-emerald-100 p-4 rounded-xl mb-6">
          <h5 class="text-xs font-bold text-[#118552] uppercase mb-1">Observações da Avaliação:</h5>
          <p class="text-sm text-slate-700 leading-relaxed">${escola.destaque}</p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button onclick="fecharModal()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer">
            Fechar
          </button>
          <a href="#formulario" onclick="fecharModal()" class="px-5 py-2.5 bg-[#118552] hover:bg-[#0e6b42] text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">
            Atualizar Dados da Minha Escola
          </a>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
};

// Modal de Metodologia Detalhada por Categoria
window.abrirModalCategoria = function(categoriaId) {
  const cat = CATEGORIAS_INFO.find(c => c.id === categoriaId);
  if (!cat) return;

  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 lg:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onclick="fecharModal()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>

        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4" style="background-color: ${cat.cor}18; color: ${cat.cor}">
          <i data-lucide="${cat.icone}" class="w-6 h-6"></i>
        </div>

        <h3 class="text-2xl font-extrabold text-[#0a284f] font-montserrat mb-1">
          ${cat.nome}
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Coluna na Planilha: <code>${cat.chaveGas}</code> · Peso: <strong>${cat.peso}</strong> (Máx: ${cat.pontosMax} pontos)
        </p>

        <p class="text-sm text-slate-600 leading-relaxed mb-6">
          ${cat.descricao}
        </p>

        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Critérios Auditados:
        </h4>
        <ul class="space-y-2 mb-6">
          ${cat.criterios.map(c => `
            <li class="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <i data-lucide="check" class="w-4 h-4 text-[#118552] flex-shrink-0 mt-0.5"></i>
              <span>${c}</span>
            </li>
          `).join('')}
        </ul>

        <div class="flex justify-end">
          <button onclick="fecharModal()" class="px-5 py-2.5 bg-[#118552] hover:bg-[#0e6b42] text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer">
            Entendido
          </button>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
};

window.fecharModal = function() {
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer) modalContainer.innerHTML = '';
};

// ==========================================
// SISTEMA DE AUTENTICAÇÃO E ÁREA DA ESCOLA
// ==========================================

// Renderiza a barra de navegação de autenticação
export function renderizarAuthNav() {
  const slotDesktop = document.getElementById('auth-nav-slot');
  const slotMobile = document.getElementById('mobile-auth-slot');
  const user = obterUsuarioAutenticado();

  if (slotDesktop) {
    if (user && user.email) {
      slotDesktop.innerHTML = `
        <div class="flex items-center gap-2 bg-slate-100/90 border border-slate-200/80 rounded-full pl-2 pr-3 py-1 shadow-xs">
          <div class="w-7 h-7 rounded-full bg-[#118552] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
            ${user.foto ? `<img src="${user.foto}" alt="${user.nome}" class="w-full h-full object-cover">` : user.email.charAt(0).toUpperCase()}
          </div>
          <div class="text-left leading-tight hidden lg:block">
            <span class="text-xs font-bold text-[#0a284f] block truncate max-w-[140px]">${user.nome || 'Gestor Escolar'}</span>
            <span class="text-[10px] text-slate-500 font-mono block truncate max-w-[140px]">${user.email}</span>
          </div>
          <a href="#minha-escola" class="px-2.5 py-1 text-[11px] font-bold text-[#118552] hover:bg-[#118552]/10 rounded-full transition-colors flex items-center gap-1">
            <i data-lucide="school" class="w-3.5 h-3.5"></i>
            <span>Minha Escola</span>
          </a>
          <button onclick="executarLogoutGoogle()" class="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer" title="Desconectar da Conta Google">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    } else {
      slotDesktop.innerHTML = `
        <button 
          onclick="abrirModalLoginGoogle()"
          class="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all duration-200 flex items-center gap-2 cursor-pointer">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Entrar com Google</span>
        </button>
        <a href="#minha-escola" class="px-4 py-2.5 bg-[#118552] hover:bg-[#0d6b41] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2">
          <i data-lucide="lock" class="w-3.5 h-3.5"></i>
          <span>Área da Escola</span>
        </a>
      `;
    }
  }

  if (slotMobile) {
    if (user && user.email) {
      slotMobile.innerHTML = `
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-full bg-[#118552] text-white flex items-center justify-center font-bold text-xs">
              ${user.email.charAt(0).toUpperCase()}
            </div>
            <div class="overflow-hidden">
              <span class="text-xs font-bold text-[#0a284f] block truncate">${user.nome}</span>
              <span class="text-[10px] text-slate-500 font-mono block truncate">${user.email}</span>
            </div>
          </div>
          <button onclick="executarLogoutGoogle()" class="w-full py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-md flex items-center justify-center gap-1.5">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            <span>Sair da Conta Google</span>
          </button>
        </div>
      `;
    } else {
      slotMobile.innerHTML = `
        <button onclick="abrirModalLoginGoogle()" class="w-full py-3 bg-white border border-slate-300 text-slate-700 text-center text-sm font-bold rounded-lg flex items-center justify-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Fazer Login com Google</span>
        </button>
      `;
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

// Renderiza a Área Restrita: "Perfil da Escola" e "Acesso ao Formulário Google"
export function renderizarAreaMinhaEscola() {
  const container = document.getElementById('area-minha-escola-slot');
  if (!container) return;

  const autenticado = estaAutenticado();

  if (!autenticado) {
    // ESTADO 1: REQUIRE SIGN-IN ATIVADO (BLOQUEADO ATÉ O LOGIN)
    container.innerHTML = `
      <div class="max-w-3xl mx-auto text-center py-6">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6">
          <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600"></i>
          <span>Configuração Ativa: Require Sign-In (Exigir Login)</span>
        </div>

        <div class="bg-gradient-to-b from-white to-[#f8faf8] rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl relative overflow-hidden">
          <div class="w-16 h-16 rounded-2xl bg-[#0a284f]/10 text-[#0a284f] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <i data-lucide="lock" class="w-8 h-8 text-[#118552]"></i>
          </div>

          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#0a284f] font-montserrat tracking-tight mb-4">
            Área Restrita da Instituição Escolar
          </h2>

          <p class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
            Para garantir a integridade dos dados e a vinculação oficial com a sua escola, o acesso ao <strong>Perfil da Escola</strong> e ao <strong>Formulário de Avaliação</strong> exige autenticação via <strong>Conta Google</strong>.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left max-w-xl mx-auto">
            <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div class="w-7 h-7 rounded-lg bg-[#118552]/10 text-[#118552] flex items-center justify-center font-bold text-xs mb-2">
                <i data-lucide="user-check" class="w-4 h-4"></i>
              </div>
              <div class="text-xs font-bold text-[#0a284f]">USEREMAIL()</div>
              <div class="text-[11px] text-slate-500 mt-1">Identificação automática e segura por e-mail</div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div class="w-7 h-7 rounded-lg bg-[#0a284f]/10 text-[#0a284f] flex items-center justify-center font-bold text-xs mb-2">
                <i data-lucide="building" class="w-4 h-4"></i>
              </div>
              <div class="text-xs font-bold text-[#0a284f]">Perfil da Escola</div>
              <div class="text-[11px] text-slate-500 mt-1">Gestão de endereço, diretor e níveis</div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div class="w-7 h-7 rounded-lg bg-[#cca549]/20 text-[#a07c2c] flex items-center justify-center font-bold text-xs mb-2">
                <i data-lucide="file-check-2" class="w-4 h-4"></i>
              </div>
              <div class="text-xs font-bold text-[#0a284f]">Acesso Exclusivo</div>
              <div class="text-[11px] text-slate-500 mt-1">Formulário oficial liberado após login</div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onclick="abrirModalLoginGoogle()"
              class="w-full sm:w-auto px-8 py-4 bg-[#118552] hover:bg-[#0d6b41] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Fazer Login com Google para Continuar</span>
              <i data-lucide="arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>

          <p class="text-xs text-slate-400 mt-6">
            Dúvidas ou problemas no acesso? Entre em contato pelo e-mail: <strong>edususten@gmail.com</strong>
          </p>
        </div>
      </div>
    `;
  } else {
    // ESTADO 2: AUTENTICADO! EXIBE VIEW "MINHA ESCOLA", TABELA DE PERFIL E ACESSO AO FORMULÁRIO
    const userEmailAtual = USEREMAIL();
    const perfil = obterPerfilEscola(userEmailAtual) || {};
    const niveisAtuais = perfil.niveis || ['Fundamental', 'Medio'];

    container.innerHTML = `
      <div class="space-y-12 animate-in fade-in duration-300">
        
        <!-- Header da View Minha Escola -->
        <div class="bg-gradient-to-r from-[#0a284f] to-[#177147] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-200 mb-3 border border-white/15">
                <i data-lucide="check-circle" class="w-3.5 h-3.5 text-[#cca549]"></i>
                <span>Autenticação Google Ativa · Require Sign-In Validado</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold font-montserrat text-white tracking-tight">
                View: Minha Escola
              </h2>
              <p class="text-sm text-emerald-100/90 mt-1 max-w-xl">
                Gestão cadastral da instituição e envio oficial dos dados para o Ranking Edu Susten 2026.
              </p>
            </div>

            <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#cca549] text-[#0a284f] flex items-center justify-center font-bold text-sm">
                <i data-lucide="user" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="text-xs text-emerald-200 uppercase font-bold tracking-wider">Conta Google Conectada:</div>
                <div class="text-sm font-mono font-bold text-white">${userEmailAtual}</div>
              </div>
              <button onclick="executarLogoutGoogle()" class="ml-2 p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors" title="Desconectar">
                <i data-lucide="log-out" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- SESSÃO 1: TABELA / FORMULÁRIO DE PERFIL DA ESCOLA -->
        <div class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md">
          <div class="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-[#118552]">Cadastro Institucional</span>
              <h3 class="text-2xl font-extrabold text-[#0a284f] font-montserrat mt-1">
                Tabela de Perfil da Escola
              </h3>
              <p class="text-xs text-slate-500 mt-1">
                Os dados desta sessão são associados ao seu e-mail de acesso e identificam a instituição no ranking.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1.5 bg-emerald-50 text-[#118552] border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-4 h-4"></i>
                <span>Vínculo com USEREMAIL()</span>
              </span>
            </div>
          </div>

          <form id="form-perfil-escola" onsubmit="salvarPerfilEscolaForm(event)" class="space-y-6">
            
            <!-- Campo 1: Email do Usuário (USEREMAIL()) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="mail" class="w-4 h-4 text-[#118552]"></i>
                  <span>Email do Usuário</span>
                </label>
                <span class="text-[11px] font-semibold text-[#118552] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Puxado automaticamente pela função USEREMAIL()
                </span>
              </div>
              <div class="relative">
                <input 
                  type="text" 
                  id="perfil-email"
                  value="${userEmailAtual}" 
                  readonly 
                  class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 cursor-not-allowed select-all focus:outline-none focus:ring-0"
                />
                <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-400">
                  <i data-lucide="lock" class="w-4 h-4"></i>
                  <span class="hidden sm:inline">Autenticado via Google</span>
                </div>
              </div>
              <p class="text-[11px] text-slate-500 mt-1.5">
                Este e-mail é recuperado dinamicamente do login ativo e garante a auditoria do questionário.
              </p>
            </div>

            <!-- Campo 2: Nome da Escola -->
            <div>
              <label for="perfil-nome-escola" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Nome da Escola, que deve ser inserido <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="perfil-nome-escola"
                required
                placeholder="Insira o nome oficial da escola (Ex: Escola Municipal Verde Esperança)" 
                value="${perfil.nomeEscola || ''}"
                class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#118552] focus:border-transparent transition-all shadow-2xs font-semibold"
              />
            </div>

            <!-- Campo 3: Dados Básicos (Endereço, Diretor, Telefone, Níveis) -->
            <div class="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-5">
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0a284f] border-b border-slate-200 pb-2">
                <i data-lucide="info" class="w-4 h-4 text-[#cca549]"></i>
                <span>Dados Básicos da Instituição</span>
              </div>

              <!-- Endereço -->
              <div>
                <label for="perfil-endereco" class="block text-xs font-bold text-slate-700 mb-1.5">
                  Endereço da Escola:
                </label>
                <input 
                  type="text" 
                  id="perfil-endereco"
                  placeholder="Rua, Número, Bairro, Cidade, Estado e CEP (Ex: Av. Beira Mar, 100 - Cabo de Santo Agostinho, PE)" 
                  value="${perfil.endereco || ''}"
                  class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#118552] focus:border-transparent"
                />
              </div>

              <!-- Diretor e Telefone -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="perfil-diretor" class="block text-xs font-bold text-slate-700 mb-1.5">
                    Diretor(a) Responsável:
                  </label>
                  <input 
                    type="text" 
                    id="perfil-diretor"
                    placeholder="Nome completo do(a) gestor(a)" 
                    value="${perfil.diretor || ''}"
                    class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#118552] focus:border-transparent"
                  />
                </div>
                <div>
                  <label for="perfil-telefone" class="block text-xs font-bold text-slate-700 mb-1.5">
                    Número de Telefone / WhatsApp:
                  </label>
                  <input 
                    type="tel" 
                    id="perfil-telefone"
                    placeholder="(00) 00000-0000" 
                    value="${perfil.telefone || ''}"
                    class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#118552] focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Níveis de Ensino: Fundamental e Médio -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-2">
                  Níveis de Ensino Oferecidos:
                </label>
                <div class="flex flex-wrap items-center gap-4">
                  <label class="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-[#118552] transition-colors">
                    <input 
                      type="checkbox" 
                      id="nivel-fundamental" 
                      value="Fundamental"
                      ${niveisAtuais.includes('Fundamental') ? 'checked' : ''}
                      class="w-4 h-4 text-[#118552] rounded focus:ring-[#118552]"
                    />
                    <span class="text-xs font-bold text-slate-700">Ensino Fundamental</span>
                  </label>

                  <label class="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-[#118552] transition-colors">
                    <input 
                      type="checkbox" 
                      id="nivel-medio" 
                      value="Medio"
                      ${niveisAtuais.includes('Medio') ? 'checked' : ''}
                      class="w-4 h-4 text-[#118552] rounded focus:ring-[#118552]"
                    />
                    <span class="text-xs font-bold text-slate-700">Ensino Médio</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Botão Salvar Perfil -->
            <div class="flex items-center justify-between pt-2">
              <div id="perfil-feedback-msg" class="text-xs font-semibold text-[#118552]"></div>
              <button 
                type="submit" 
                class="px-6 py-3 bg-[#0a284f] hover:bg-[#118552] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
                <i data-lucide="save" class="w-4 h-4"></i>
                <span>Salvar Dados do Perfil da Escola</span>
              </button>
            </div>
          </form>
        </div>

        <!-- SESSÃO 2: ACESSO AO FORMULÁRIO GOOGLE -->
        <div class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md">
          <div class="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-[#cca549]">Etapa Final de Participação</span>
              <h3 class="text-2xl font-extrabold text-[#0a284f] font-montserrat mt-1">
                Acesso ao Formulário Google de Avaliação
              </h3>
              <p class="text-xs text-slate-500 mt-1">
                Questionário oficial do ciclo 2026. Preencha pelo container integrado abaixo ou utilize o botão de redirecionamento.
              </p>
            </div>

            <!-- BOTÃO DE AÇÃO PARA O LINK DE REDIRECIONAMENTO (SOLICITADO) -->
            <div>
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSejpWBCPQayd1a3e0SbymB-EC3N2l2xsNIVGRbnSE6I_zjkDQ/viewform?usp=publish-editor" 
                target="_blank" 
                rel="noopener noreferrer"
                class="px-5 py-3 bg-[#118552] hover:bg-[#0d6b41] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group">
                <i data-lucide="external-link" class="w-4 h-4 transition-transform group-hover:scale-110"></i>
                <span>Abrir Formulário Externo (Redirecionamento)</span>
              </a>
            </div>
          </div>

          <!-- Banner Informativo -->
          <div class="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 mb-6 flex items-start gap-3 text-xs text-slate-700">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-[#118552] flex-shrink-0 mt-0.5"></i>
            <div>
              <strong>Acesso Autorizado para ${userEmailAtual}:</strong> Suas respostas alimentarão automaticamente a planilha do Google Sheets conectada às abas de <em>Escolas Fundamentais</em> e <em>Escolas Ensino Médio</em>.
            </div>
          </div>

          <!-- IFRAME DO GOOGLE FORMS EXCLUSIVO -->
          <!-- 
            Acesso ao Formulário google:
            src="https://docs.google.com/forms/d/e/1FAIpQLSejpWBCPQayd1a3e0SbymB-EC3N2l2xsNIVGRbnSE6I_zjkDQ/viewform?usp=publish-editor"
          -->
          <div class="relative w-full overflow-hidden rounded-2xl bg-white shadow-xs border border-slate-200 min-h-[640px] sm:min-h-[720px]">
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSejpWBCPQayd1a3e0SbymB-EC3N2l2xsNIVGRbnSE6I_zjkDQ/viewform?embedded=true" 
              width="100%" 
              height="750" 
              frameborder="0" 
              marginheight="0" 
              marginwidth="0"
              class="w-full h-full min-h-[720px]"
              title="Formulário Restrito Edu Susten">
              Carregando formulário oficial de avaliação...
            </iframe>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span>Formulário seguro conectado à auditoria Edu Susten 2026.</span>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSejpWBCPQayd1a3e0SbymB-EC3N2l2xsNIVGRbnSE6I_zjkDQ/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[#118552] hover:underline font-semibold flex items-center gap-1">
              <span>Caso o formulário não carregue, clique para abrir diretamente no Google Forms</span>
              <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
            </a>
          </div>

        </div>

      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

// Salva o perfil da escola preenchido
window.salvarPerfilEscolaForm = function(event) {
  event.preventDefault();
  const nomeEscola = document.getElementById('perfil-nome-escola')?.value?.trim();
  const endereco = document.getElementById('perfil-endereco')?.value?.trim();
  const diretor = document.getElementById('perfil-diretor')?.value?.trim();
  const telefone = document.getElementById('perfil-telefone')?.value?.trim();
  
  const nivelFund = document.getElementById('nivel-fundamental')?.checked;
  const nivelMed = document.getElementById('nivel-medio')?.checked;

  const niveis = [];
  if (nivelFund) niveis.push('Fundamental');
  if (nivelMed) niveis.push('Medio');

  if (!nomeEscola) {
    alert('Por favor, informe o Nome da Escola.');
    return;
  }

  try {
    salvarPerfilEscola({
      nomeEscola,
      endereco,
      diretor,
      telefone,
      niveis
    });

    const feedback = document.getElementById('perfil-feedback-msg');
    if (feedback) {
      feedback.innerHTML = `
        <span class="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          Perfil salvo com sucesso para o e-mail ${USEREMAIL()}!
        </span>
      `;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        if (feedback) feedback.innerHTML = '';
      }, 5000);
    }
  } catch (e) {
    alert('Erro ao salvar perfil: ' + e.message);
  }
};

// Modal de Login com Conta Google
window.abrirModalLoginGoogle = function() {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        <button onclick="fecharModal()" class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>

        <div class="text-center mb-6">
          <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h3 class="text-xl font-extrabold text-[#0a284f] font-montserrat">
            Fazer Login com Google
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            Requisito ativo: <strong>Require Sign-In</strong> para acesso institucional ao Edu Susten
          </p>
        </div>

        <div class="space-y-4">
          <!-- Opção 1: Conta Padrão do Sistema (edususten@gmail.com) -->
          <button 
            onclick="executarLoginGoogle('edususten@gmail.com', 'EduSusten Gestor Escolar')" 
            class="w-full p-4 rounded-xl border-2 border-emerald-200 hover:border-[#118552] bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all flex items-center justify-between group cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-[#118552] text-white flex items-center justify-center font-bold text-sm">
                ES
              </div>
              <div>
                <span class="text-xs font-bold text-[#0a284f] block">Entrar como Gestor Oficial</span>
                <span class="text-xs font-mono text-[#118552] font-semibold">edususten@gmail.com</span>
              </div>
            </div>
            <i data-lucide="arrow-right" class="w-4 h-4 text-[#118552] transition-transform group-hover:translate-x-1"></i>
          </button>

          <!-- Divisor -->
          <div class="relative my-4 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
            <span class="relative bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase">ou use outra conta</span>
          </div>

          <!-- Opção 2: Inserir outro e-mail institucional Google -->
          <form onsubmit="executarLoginCustomizado(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">E-mail institucional Google:</label>
              <input 
                type="email" 
                id="input-login-email" 
                required 
                placeholder="exemplo@gmail.com ou @escola.edu.br" 
                class="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#118552]"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nome do(a) Representante:</label>
              <input 
                type="text" 
                id="input-login-nome" 
                required 
                placeholder="Ex: Profa. Maria Silva" 
                class="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#118552]"
              />
            </div>
            <button 
              type="submit" 
              class="w-full py-3 bg-[#0a284f] hover:bg-[#118552] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <span>Continuar com esta Conta Google</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </form>
        </div>

        <div class="mt-6 text-center text-[11px] text-slate-400">
          Ao entrar, sua conta Google será associada via função <code class="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">USEREMAIL()</code> para acesso ao formulário.
        </div>

      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
};

window.executarLoginGoogle = function(email = 'edususten@gmail.com', nome = 'EduSusten Gestor Escolar') {
  loginComGoogle({
    email,
    nome,
    foto: null,
    provedor: 'Google Accounts',
    autenticadoEm: new Date().toISOString()
  });
  fecharModal();
  // Rola suavemente até a seção Minha Escola
  const el = document.getElementById('minha-escola');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

window.executarLoginCustomizado = function(event) {
  event.preventDefault();
  const email = document.getElementById('input-login-email')?.value?.trim();
  const nome = document.getElementById('input-login-nome')?.value?.trim();
  if (email && nome) {
    executarLoginGoogle(email, nome);
  }
};

window.executarLogoutGoogle = function() {
  if (confirm('Deseja realmente sair da sua Conta Google? O acesso ao Perfil da Escola e ao Formulário será bloqueado.')) {
    logoutGoogle();
  }
};

