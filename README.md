# Quem Sou Eu — Ateliê Facial · Head V2

Protótipo separado do jogo principal para aprovar a anatomia facial de personagens cartoon 3D. A V2 é a base de **cabeça/rosto** (sem cabelo, corpo ou figurino) já preparada para originar vários personagens.

## Ver no navegador
https://aruanmf446-hub.github.io/quemsoueu/

Para rodar localmente, sirva a pasta com qualquer servidor estático (ex.: `python3 -m http.server`) e abra `index.html`. Os módulos ES não funcionam abrindo o arquivo direto (`file://`). Usa Three.js via CDN, sem build, Vercel, API de geração, Supabase ou serviços pagos.

## O que a V2 faz
- **Formato da cara por curvas**: o rosto é uma casca única definida por três curvas suaves por altura — contorno de frente (maçãs → mandíbula → queixo), perfil (testa → maçã → boca → queixo) e linha de trás (ramo e base da mandíbula) — fundida ao crânio, à nuca, a um pescoço de seção oval (garganta saindo de baixo do queixo, nuca contínua) e aos músculos do pescoço num campo de distância (SDF). As curvas têm curvatura contínua (sem "faixas" na luz) e pele + pescoço formam **uma única malha**, sem emendas nem volumes "montados".
- **Proporções calibradas pelas referências** (medidas pela distância entre as pupilas): olhos mais próximos, terço inferior mais longo (nariz, boca e queixo mais baixos), nariz projetando à frente da boca e queixo levemente recuado no perfil.
- **Região dos olhos esculpida**: arcada sobre o olho que sombreia a pálpebra, pálpebra superior com espessura e dobra, rolinho da pálpebra inferior emendando na maçã, canto interno mais fundo e **sombra da pálpebra sobre o globo** (topo da íris e da esclera escurecidos).
- **Boca**: lábio de cima fino com arco do cupido macio e borda suave, lábio de baixo cheio e arredondado, cantos encaixados nas bochechas.
- **Relevo do rosto** sobre essa base: planos de estrutura (zigomático, cavado abaixo dele, têmporas), órbitas, arcada, prega da pálpebra, nariz com ponte / ponta / asas / narinas, **lábios paramétricos com arco do cupido**, filtro, cantos da boca, sulco do queixo, maçãs e dobra nasolabial.
- **Olhos**: a pele envolve o globo (pálpebras na própria malha, abertura recortada nela), **íris côncava sob a córnea** (profundidade e brilho), íris procedural com fibras e luz entrando por baixo, carúncula no canto interno, linha d'água, **delineado com asa** e **tufos de cílios** curvados; sobrancelhas espessas e afinadas na cauda.
- **Pele**: variação orgânica de tom (manchas suaves por ruído, testa mais clara, nariz/maçãs/orelhas mais rosados, olheira sutil, barba sombreada no masculino), blush ajustável por preset nas maçãs e na ponta do nariz, microrrelevo no shader que quebra o brilho como pele real, zona T e lábios mais brilhantes, segunda camada especular suave, "wrap" avermelhado no terminador (falso espalhamento subsuperficial), oclusão por cavidade e sombras suaves projetadas.
- **4 presets** com identidade própria, trocados por botões:
  - `feminine_soft` — rosto em coração, olhos amendoados grandes com delineado e cílios, sobrancelha arqueada, nariz delicado, lábios cheios.
  - `masculine_soft` — rosto mais longo, mandíbula quadrada com queixo largo, arcada forte, olhos mais estreitos sob sobrancelhas grossas e baixas, nariz longo.
  - `cute_round` — rosto redondo e curto, olhos muito grandes e baixos, bochechas cheias, nariz de botão, sorriso.
  - `feminine_bold` — mesma qualidade do feminino com personalidade intensa: olhar felino de pálpebra pesada e asa longa, sobrancelha alta e arqueada, maçãs marcadas, lábios escuros e brilhantes.
- **Ajuste fino** por sliders (largura do crânio, bochechas, mandíbula, olhos, distância entre olhos, nariz, boca) aplicados por cima do preset, com limites para os olhos nunca saírem da silhueta. Trocar de preset zera os sliders. Durante o arraste é usada uma malha de prévia mais leve; ao soltar volta a malha completa.
- **Câmera**: rotação livre, zoom e botões Frente / Perfil / 3/4.
- **Exportação GLB** da cabeça (≈4,4 MB, 24 malhas nomeadas: `Head_Skin` com pescoço, `Eye_L/R` com `Sclera`/`Iris`/`Cornea`, `Lashes_L/R`, `Brow_L/R`, `Ear_L/R` (orelha em C com hélice, anti-hélice, concha, trago e lóbulo, no tamanho anatômico — da sobrancelha à ponta do nariz — apoiada numa raiz modelada na cabeça), `Mouth_Line`…), gerada com densidade um pouco menor que a do visualizador.

## Estrutura
```
index.html        interface, cena (luzes, sombras) e exportação
src/presets.js    dados dos presets (crânio, curvas do rosto, olhos, nariz, boca, pele…) e aplicação dos sliders
src/head.js       geração procedural: SDF (crânio + casca facial por curvas), projeção da malha, relevo do rosto, olhos, cílios, shader de pele
```
Para criar um novo preset, copie uma entrada de `PRESETS` (`src/presets.js`), ajuste o crânio (`cran`, `occ`), as curvas da casca facial (`loft`: `a`, `zf`, `zb`), o pescoço (`neck`, `scm`) e os traços, e inclua o id em `PRESET_ORDER` e em `SUBS` (`index.html`).

## Limites desta versão
Base de rosto, não personagem final: não há cabelo, corpo, figurino, blendshapes, rig facial nem topologia de produção (a malha é uma grade procedural densa, não *edge loops* de animação). Pele com cor por vértice, sem textura pintada; o shader de pele e as sombras ficam no visualizador (o GLB leva geometria, cores por vértice e materiais PBR padrão). A geração completa leva algumas centenas de milissegundos ao trocar de preset. As referências aprovadas são direção de arte para revisão manual, não um resultado reproduzido.

## GitHub Pages
Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** se ainda não estiver ativo. O workflow em `.github/workflows/pages.yml` publica a cada commit da main.
