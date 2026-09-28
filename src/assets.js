// EduSusten - SVGs Oficiais baseados nas imagens fornecidas

export const LOGO_SVG = `
<svg viewBox="0 0 480 320" class="w-full h-auto select-none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="EduSusten Logo">
  <defs>
    <!-- Gradientes Verde Folha -->
    <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2ecc71" />
      <stop offset="100%" stop-color="#118552" />
    </linearGradient>
    <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22a267" />
      <stop offset="100%" stop-color="#177147" />
    </linearGradient>
    <linearGradient id="leafGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#195b39" />
      <stop offset="100%" stop-color="#0e3a24" />
    </linearGradient>
    <!-- Gradiente Dourado -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5d378" />
      <stop offset="50%" stop-color="#cca549" />
      <stop offset="100%" stop-color="#a07d2c" />
    </linearGradient>
    <!-- Gradiente Azul Capelo -->
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1b3d68" />
      <stop offset="100%" stop-color="#0a284f" />
    </linearGradient>
    <filter id="subtleDrop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.18" flood-color="#0a284f" />
    </filter>
  </defs>

  <g transform="translate(40, 10)">
    <!-- FOLHA GEOMÉTRICA POLIGONAL -->
    <!-- Faceta Superior Direita -->
    <polygon points="260,35 315,95 260,115" fill="url(#leafGrad1)" />
    <!-- Faceta Superior Esquerda / Centro -->
    <polygon points="260,35 260,115 210,85" fill="url(#leafGrad2)" />
    <!-- Faceta Ponta Direita -->
    <polygon points="315,95 310,150 260,115" fill="url(#leafGrad2)" />
    <polygon points="310,150 260,180 260,115" fill="url(#leafGrad3)" />
    <!-- Faceta Inferior Direita -->
    <polygon points="310,150 295,195 260,180" fill="url(#leafGrad1)" />
    <!-- Haste / Pecíolo da Folha -->
    <path d="M 260,115 L 180,240" stroke="#118552" stroke-width="12" stroke-linecap="round" />

    <!-- REDE / NÓS DE CONEXÃO TECNOLÓGICA (Pontos e Linhas Douradas e Azuis) -->
    <!-- Linhas -->
    <line x1="210" y1="85" x2="235" y2="48" stroke="#cca549" stroke-width="3.5" />
    <line x1="235" y1="48" x2="265" y2="50" stroke="#cca549" stroke-width="3.5" />
    <line x1="265" y1="50" x2="310" y2="92" stroke="#cca549" stroke-width="3.5" />
    <line x1="310" y1="92" x2="305" y2="155" stroke="#cca549" stroke-width="3.5" />
    <line x1="260" y1="180" x2="235" y2="175" stroke="#cca549" stroke-width="3.5" />
    <line x1="235" y1="175" x2="238" y2="215" stroke="#cca549" stroke-width="3.5" />
    <line x1="238" y1="215" x2="280" y2="210" stroke="#cca549" stroke-width="3.5" />
    <line x1="280" y1="210" x2="305" y2="155" stroke="#cca549" stroke-width="3.5" />

    <!-- Pontos Dourados e Azuis -->
    <circle cx="235" cy="48" r="8" fill="#cca549" />
    <circle cx="265" cy="50" r="8" fill="#0a284f" />
    <circle cx="310" cy="92" r="8.5" fill="#0a284f" />
    <circle cx="305" cy="155" r="9" fill="#cca549" />
    <circle cx="235" cy="175" r="8" fill="#cca549" />
    <circle cx="238" cy="215" r="8" fill="#0a284f" />
    <circle cx="280" cy="210" r="8.5" fill="#cca549" />

    <!-- CAPELO (MORTARBOARD / CHAPÉU DE FORMATURA) -->
    <!-- Base / Faixa Dourada do Capelo -->
    <path d="M 160,135 Q 185,160 215,145 L 215,162 Q 185,178 160,152 Z" fill="#cca549" />
    <!-- Copa Inferior Azul -->
    <path d="M 165,130 Q 185,152 210,140 L 210,155 Q 185,170 165,145 Z" fill="#0a284f" />
    <!-- Losango Superior do Capelo -->
    <polygon points="190,75 250,110 190,145 130,110" fill="url(#capGrad)" stroke="#118552" stroke-width="2" filter="url(#subtleDrop)" />
    <!-- Botão Central e Cordão do Capelo com Pingente -->
    <circle cx="190" cy="110" r="5" fill="#cca549" />
    <!-- Fio / Pingente do Capelo caindo para a esquerda -->
    <path d="M 190,110 Q 150,118 142,148" stroke="#cca549" stroke-width="3" fill="none" stroke-linecap="round" />
    <!-- Tassel / Franja Azul Escuro -->
    <path d="M 142,148 L 138,172 L 146,172 Z" fill="#0a284f" />
    <circle cx="142" cy="151" r="3.5" fill="#0a284f" />
  </g>

  <!-- TEXTO EDUSUSTEN -->
  <g transform="translate(240, 260)" text-anchor="middle">
    <text font-family="'Montserrat', sans-serif" font-weight="800" font-size="44" letter-spacing="-0.5">
      <tspan fill="#0a284f">Edu</tspan><tspan fill="#118552">Susten</tspan>
    </text>
    <text y="24" font-family="'Montserrat', sans-serif" font-weight="500" font-size="13" fill="#2f4a69" letter-spacing="0.2">
      Plataforma de Classificação de Escolas em Sustentabilidade
    </text>
  </g>
</svg>
`;

export const SEAL_IMG_HTML = `
  <img src="/selo-edu-susten.png" alt="Selo Oficial EduSusten - Certificação de Escola Sustentável" class="w-full h-auto object-contain select-none drop-shadow-md rounded-full" />
`;

export const SEAL_SVG = `
<svg viewBox="0 0 400 400" class="w-full h-auto select-none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Selo de Escola Sustentável EduSusten">
  <defs>
    <!-- Gradiente de Ouro Reluzente -->
    <linearGradient id="sealGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff2af" />
      <stop offset="25%" stop-color="#cca549" />
      <stop offset="50%" stop-color="#9a7828" />
      <stop offset="75%" stop-color="#e8c86d" />
      <stop offset="100%" stop-color="#a07c2c" />
    </linearGradient>

    <!-- Gradiente Verde Esmeralda -->
    <linearGradient id="sealGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f7a4d" />
      <stop offset="50%" stop-color="#118552" />
      <stop offset="100%" stop-color="#0a4d2e" />
    </linearGradient>

    <!-- Gradiente Azul Edifício -->
    <linearGradient id="sealBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1b3d68" />
      <stop offset="100%" stop-color="#0a284f" />
    </linearGradient>

    <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.25" flood-color="#071b35" />
    </filter>

    <!-- Trilhas Circulares para Texto em Curva -->
    <path id="circleTopPath" d="M 60,200 A 140,140 0 1,1 340,200" fill="none" />
    <path id="circleBottomPath" d="M 345,200 A 145,145 0 0,1 55,200" fill="none" />
  </defs>

  <g filter="url(#sealShadow)">
    <!-- Borda Externa Dourada Biselada -->
    <circle cx="200" cy="200" r="192" fill="url(#sealGoldGrad)" />
    <circle cx="200" cy="200" r="182" fill="#7a5d1b" />
    <!-- Anel Verde Esmeralda -->
    <circle cx="200" cy="200" r="176" fill="url(#sealGreenGrad)" />
    <!-- Borda Interna Dourada -->
    <circle cx="200" cy="200" r="126" fill="none" stroke="url(#sealGoldGrad)" stroke-width="5" />
    <circle cx="200" cy="200" r="121" fill="#ffffff" />
  </g>

  <!-- FAIXA / FITA SUPERIOR EM AZUL MARINHO PARA "EDUSUSTEN" -->
  <path d="M 95,125 C 125,75 275,75 305,125 C 290,140 260,110 200,105 C 140,110 110,140 95,125 Z" fill="#0a284f" stroke="url(#sealGoldGrad)" stroke-width="2.5" />
  <path d="M 85,130 C 115,70 285,70 315,130 C 300,148 260,112 200,106 C 140,112 100,148 85,130 Z" fill="#0a284f" stroke="#cca549" stroke-width="2" />
  
  <!-- Texto EDUSUSTEN -->
  <text font-family="'Montserrat', sans-serif" font-weight="900" font-size="32" fill="#ffffff" letter-spacing="4">
    <textPath href="#circleTopPath" startOffset="50%" text-anchor="middle">
      EDUSUSTEN
    </textPath>
  </text>

  <!-- Pontos Dourados Laterais Decorativos -->
  <circle cx="56" cy="200" r="6" fill="url(#sealGoldGrad)" stroke="#7a5d1b" stroke-width="1" />
  <circle cx="344" cy="200" r="6" fill="url(#sealGoldGrad)" stroke="#7a5d1b" stroke-width="1" />

  <!-- Texto Inferior: CERTIFICAÇÃO DE ESCOLA SUSTENTÁVEL -->
  <text font-family="'Montserrat', sans-serif" font-weight="800" font-size="14.5" fill="#ffffff" letter-spacing="2.2">
    <textPath href="#circleBottomPath" startOffset="50%" text-anchor="middle">
      CERTIFICAÇÃO DE ESCOLA SUSTENTÁVEL
    </textPath>
  </text>

  <!-- NÚCLEO CENTRAL: FOLHA + BARRAS/PRÉDIOS + ARCO ENVOLVENTE -->
  <g transform="translate(200, 205)">
    <!-- Arco envolvente dourado e verde -->
    <path d="M -75,25 C -55,-75 25,-90 75,-25 C 85,25 35,68 -20,68 C -65,68 -80,45 -75,25 Z" stroke="url(#sealGoldGrad)" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M -73,25 C -55,-65 20,-80 65,-25 C 75,15 35,55 -15,55" stroke="#118552" stroke-width="3" fill="none" stroke-linecap="round" />

    <!-- 3 BARRAS CRESCENTES (Edifícios com chanfros superiores e arestas douradas) -->
    <!-- Barra 1 (Esquerda) -->
    <rect x="-16" y="-8" width="16" height="42" rx="1.5" fill="url(#sealBlueGrad)" stroke="#cca549" stroke-width="1.5" />
    <polygon points="-16,-8 -8,-18 0,-8" fill="#1b3d68" stroke="#cca549" stroke-width="1" />

    <!-- Barra 2 (Centro) -->
    <rect x="6" y="-35" width="17" height="69" rx="1.5" fill="url(#sealBlueGrad)" stroke="#cca549" stroke-width="1.5" />
    <polygon points="6,-35 14.5,-47 23,-35" fill="#1b3d68" stroke="#cca549" stroke-width="1" />

    <!-- Barra 3 (Direita - Mais Alta) -->
    <rect x="29" y="-62" width="18" height="96" rx="1.5" fill="url(#sealBlueGrad)" stroke="#cca549" stroke-width="1.5" />
    <polygon points="29,-62 38,-75 47,-62" fill="#1b3d68" stroke="#cca549" stroke-width="1" />

    <!-- FOLHA ESTILIZADA À ESQUERDA (com nervura central dourada e facetas) -->
    <!-- Corpo da Folha -->
    <path d="M -20,30 C -70,15 -82,-45 -40,-72 C -20,-50 -16,-18 -20,30 Z" fill="#177147" stroke="#118552" stroke-width="1.5" />
    <path d="M -20,30 C -45,15 -60,-20 -40,-72 C -20,-50 -16,-18 -20,30 Z" fill="#22a267" opacity="0.6" />
    
    <!-- Nervura Central Dourada -->
    <path d="M -20,30 Q -42,-25 -40,-72" stroke="url(#sealGoldGrad)" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <!-- Nervuras Laterais Douradas -->
    <path d="M -28,-5 Q -46,-12 -55,-7" stroke="#f5d378" stroke-width="2" fill="none" opacity="0.9" />
    <path d="M -33,-30 Q -52,-38 -58,-28" stroke="#f5d378" stroke-width="2" fill="none" opacity="0.9" />
    <path d="M -37,-52 Q -48,-58 -52,-50" stroke="#f5d378" stroke-width="1.5" fill="none" opacity="0.9" />
  </g>
</svg>
`;
