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
- **12 personagens em 4 famílias**, trocados por botões agrupados:
  - **Humanos**: `feminine_soft`, `masculine_soft`, `cute_round`, `feminine_bold`, `alchemist_villain` (rosto longo, queixo pontudo, nariz adunco, sorriso torto, olheiras), `dwarf_bard` (nariz grande, barba e bigode, orelhas pontudas), `sad_clown` (pintura branca, marcas azuis, nariz bola, boca caída).
  - **Criaturas**: `orc_warrior` (testa pesada, olhos amarelos, presas, orelhas pontudas, barba, mandíbula larga).
  - **Vegetais** (forma própria por perfil girado — `lathe` —, sem o molde de cabeça humana; olhos saltados; cor acompanhando o relevo): `cactus_cowboy` (coluna com cúpula, 8 nervuras e espinhos, olhar sonolento, sorriso de canto), `pepper_king` (pimentão de 4 gomos com covinha e talo no topo, bigode de guidão, cavanhaque), `chili_bandit` (pimenta afinando para baixo, olhos arregalados, sorriso aberto com dentes e língua para fora).
  - **Robôs**: `robot_ball` (casco com faixas e painéis, tela curva com rosto em luz, orelhas com anel brilhante) — gerador próprio em `src/robot.js`.
- **Peças reutilizáveis** que qualquer personagem novo pode ligar por parâmetro: forma por perfil girado (`lathe`: largura por altura, achatamento, tampa arredondada, covinha), padrão de superfície (`pattern`: nervuras ou gomos), `spines`, `stem` (talo + cálice), orelha pontuda (`earPoint`, `earTipA`, `earFlare`) ou sem orelha (`earType: 'none'`), nariz bola ou sem nariz (`noseType`), barba esculpida (`beardVol`), bigode (`stache`), cavanhaque (`goatee`), presas (`tusks`), pintura facial (`paint`), boca aberta com dentes e língua (`open`, `teeth`, `tongue`), sorriso torto (`smirk`), sorriso invertido (`smile` negativo), olheira colorida (`bag`), pele brilhante/encerada (`skinGloss`, `clearcoat`), cor de espalhamento da pele (`sss`).
- **Rig facial híbrido (ossos + blendshapes esculpidos)**, exportado no GLB como *skin* + *morph targets* padrão glTF (Unity, Unreal, Godot, three.js):
  - **Ossos** (8): `Bone_Head`, `Bone_Jaw`, `Bone_Eye_L/R`, `Bone_LidUp_L/R`, `Bone_LidLo_L/R`. A mandíbula abre uma **fenda real na boca** em forma de lente; aparecem o interior da boca, os dentes de cima e de baixo e a língua. A abertura é normalizada para ficar parecida em todos os personagens.
  - **Blendshapes** (11, na pele e nos acessórios): `smile_L/R`, `frown_L/R`, `mouthWide`, `mouthPucker`, `mouthPress`, `browUp_L/R`, `browInnerUp`, `browDown`. São esculpidos pelo próprio campo do rosto: o sorriso sobe a maçã e marca o sulco, a tristeza afunda os cantos e enruga o queixo, e o bico projeta os lábios. Sobrancelhas, bigode, dentes, língua e o interior da boca acompanham.
  - **Expressões prontas**: feliz, risada, triste, bravo, surpreso, piscadela, desconfiado, beijo, além de sliders por controle (olhar, piscar, apertar, arregalar, mandíbula, sorriso por lado, largura, bico, pressão e sobrancelhas por lado).
  - **Fala**: visemas A/E/O/U/M (`VISEMES`, `talkPose`).
  - **Clipes no GLB**: `Blink`, `Wink_R`, `Talk`, `LookAround` e `Expr_*` para cada expressão (trilhas de ossos e de blendshapes).
  - Robô: o rig é o próprio rosto da tela (a mesma pose redesenha olhos, boca e "sobrancelhas" de luz).
  - Código em `src/rig.js` (ossos, pesos, mapeamento pose → blendshapes, expressões, visemas, clipes); as formas são geradas em `src/head.js`. Expressões novas: acrescente em `EXPRESSIONS`.
- **Ajuste fino** por sliders (largura do crânio, bochechas, mandíbula, olhos, distância entre olhos, nariz, boca) aplicados por cima do preset, com limites para os olhos nunca saírem da silhueta. Trocar de preset zera os sliders. Durante o arraste é usada uma malha de prévia mais leve; ao soltar volta a malha completa.
- **Câmera**: rotação livre, zoom e botões Frente / Perfil / 3/4.
- **Exportação GLB** da cabeça (≈10 MB com o rig, 24 malhas nomeadas: `Head_Skin` com pescoço, `Eye_L/R` com `Sclera`/`Iris`/`Cornea`, `Lashes_L/R`, `Brow_L/R`, `Ear_L/R` (orelha em C com hélice, anti-hélice, concha, trago e lóbulo, no tamanho anatômico — da sobrancelha à ponta do nariz — apoiada numa raiz modelada na cabeça), `Mouth_Line`…), gerada com densidade um pouco menor que a do visualizador.

## Estrutura
```
index.html        interface, cena (luzes, sombras) e exportação
src/presets.js    dados dos presets (crânio, curvas do rosto, olhos, nariz, boca, pele…) e aplicação dos sliders
src/rig.js        rig facial: esqueleto, pesos, poses de expressão e clipes de animação
src/robot.js      gerador da cabeça de robô (casco, tela emissiva, orelhas de luz)
src/head.js       geração procedural: SDF (crânio + casca facial por curvas), projeção da malha, relevo do rosto, olhos, cílios, shader de pele
```
Para criar um personagem novo, o caminho mais curto é herdar de um existente e trocar só o que muda, por exemplo `PRESETS.meu_ogro = derive('orc_warrior', { id: 'meu_ogro', label: 'Ogro', family: 'Criaturas', sub: '…', skin: '#7a9a5a', tusks: null })`, e incluir o id em `PRESET_ORDER`. Para um preset do zero, copie uma entrada de `PRESETS` (`src/presets.js`), ajuste o crânio (`cran`, `occ`), as curvas da casca facial (`loft`: `a`, `zf`, `zb`), o pescoço (`neck`, `scm`) e os traços, e inclua o id em `PRESET_ORDER` (a família e a descrição do botão vêm de `family` e `sub`).

## Limites desta versão
Base de rosto, não personagem final: não há cabelo, corpo, figurino nem topologia de produção (a malha é uma grade procedural densa, não *edge loops* de animação). Pele com cor por vértice, sem textura pintada; o shader de pele e as sombras ficam no visualizador (o GLB leva geometria, cores por vértice e materiais PBR padrão). A geração completa (com blendshapes) leva ~1,5 s ao trocar de personagem. As referências aprovadas são direção de arte para revisão manual, não um resultado reproduzido.

## GitHub Pages
Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** se ainda não estiver ativo. O workflow em `.github/workflows/pages.yml` publica a cada commit da main.
