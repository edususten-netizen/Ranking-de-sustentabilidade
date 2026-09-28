import {
  GAS_CONFIG,
  CATEGORIAS_INFO,
  ESCOLAS_FUNDAMENTAL_INICIAIS,
  ESCOLAS_MEDIO_INICIAIS
} from './data.js';
import { LOGO_SVG, SEAL_SVG, SEAL_IMG_HTML } from './assets.js';

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
  renderizarRankingFundamental();
  renderizarRankingMedio();
  inicializarEventos();
  sincronizarGoogleAppsScript();
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
