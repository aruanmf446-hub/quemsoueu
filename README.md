# Quem Sou Eu — Ateliê Facial · Head V2

Protótipo separado do jogo principal para aprovar a anatomia facial de personagens cartoon 3D. A V2 é a base de **cabeça/rosto** (sem cabelo, corpo ou figurino) já preparada para originar vários personagens.

## Ver no navegador
https://aruanmf446-hub.github.io/quemsoueu/

Para rodar localmente, sirva a pasta com qualquer servidor estático (ex.: `python3 -m http.server`) e abra `index.html`. Os módulos ES não funcionam abrindo o arquivo direto (`file://`). Usa Three.js via CDN, sem build, Vercel, API de geração, Supabase ou serviços pagos.

## O que a V2 faz
- **Forma da cabeça por volumes anatômicos**: crânio, terço médio, maçãs do rosto, mandíbula (do queixo ao ângulo, opcionalmente quadrada), queixo, pescoço e músculos do pescoço (esternocleidomastoideo) são fundidos por união suave num campo de distância (SDF). Pele e pescoço formam **uma única malha**, sem emendas — perfil com testa, nariz, lábios, queixo e linha da mandíbula até a orelha.
- **Relevo do rosto** sobre essa base: órbitas, arcada, prega da pálpebra, nariz com ponte / ponta / asas / narinas, **lábios paramétricos com arco do cupido**, filtro, cantos da boca, sulco do queixo, maçãs e dobra nasolabial.
- **Olhos**: a pele envolve o globo (pálpebras na própria malha, abertura recortada nela), **íris côncava sob a córnea** (profundidade e brilho), íris procedural com fibras e luz entrando por baixo, carúncula no canto interno, linha d'água, **delineado com asa** e **tufos de cílios** curvados; sobrancelhas espessas e afinadas na cauda.
- **Pele**: shader com "wrap" avermelhado no terminador (falso espalhamento subsuperficial), oclusão por cavidade calculada na malha, brilho por vértice (lábios mais brilhantes), sombras suaves projetadas (nariz, pálpebra sobre o olho, queixo).
- **4 presets** com identidade própria, trocados por botões:
  - `feminine_soft` — rosto em coração, olhos amendoados grandes com delineado e cílios, sobrancelha arqueada, nariz delicado, lábios cheios.
  - `masculine_soft` — rosto mais longo, mandíbula quadrada com queixo largo, arcada forte, olhos mais estreitos sob sobrancelhas grossas e baixas, nariz longo.
  - `cute_round` — rosto redondo e curto, olhos muito grandes e baixos, bochechas cheias, nariz de botão, sorriso.
  - `feminine_bold` — mesma qualidade do feminino com personalidade intensa: olhar felino de pálpebra pesada e asa longa, sobrancelha alta e arqueada, maçãs marcadas, lábios escuros e brilhantes.
- **Ajuste fino** por sliders (largura do crânio, bochechas, mandíbula, olhos, distância entre olhos, nariz, boca) aplicados por cima do preset, com limites para os olhos nunca saírem da silhueta. Trocar de preset zera os sliders. Durante o arraste é usada uma malha de prévia mais leve; ao soltar volta a malha completa.
- **Câmera**: rotação livre, zoom e botões Frente / Perfil / 3/4.
- **Exportação GLB** da cabeça (≈4,4 MB, 24 malhas nomeadas: `Head_Skin` com pescoço, `Eye_L/R` com `Sclera`/`Iris`/`Cornea`, `Lashes_L/R`, `Brow_L/R`, `Ear_L/R` (concha com hélice, anti-hélice e lóbulo), `Mouth_Line`…), gerada com densidade um pouco menor que a do visualizador.

## Estrutura
```
index.html        interface, cena (luzes, sombras) e exportação
src/presets.js    dados dos presets (volumes do SDF + olhos, nariz, boca…) e aplicação dos sliders
src/head.js       geração procedural: SDF da cabeça, projeção da malha, relevo do rosto, olhos, cílios, pele
```
Para criar um novo preset, copie uma entrada de `PRESETS` (`src/presets.js`), ajuste os volumes (`cran`, `face`, `cheekB`, `jaw`, `chin`, `neck`, `scm`) e os traços, e inclua o id em `PRESET_ORDER` e em `SUBS` (`index.html`).

## Limites desta versão
Base de rosto, não personagem final: não há cabelo, corpo, figurino, blendshapes, rig facial nem topologia de produção (a malha é uma grade procedural densa, não *edge loops* de animação). Pele com cor por vértice, sem textura pintada; o shader de pele e as sombras ficam no visualizador (o GLB leva geometria, cores por vértice e materiais PBR padrão). A geração completa leva algumas centenas de milissegundos ao trocar de preset. As referências aprovadas são direção de arte para revisão manual, não um resultado reproduzido.

## GitHub Pages
Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** se ainda não estiver ativo. O workflow em `.github/workflows/pages.yml` publica a cada commit da main.
