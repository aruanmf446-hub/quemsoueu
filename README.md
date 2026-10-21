# Quem Sou Eu — Ateliê Facial · Head V2

Protótipo separado do jogo principal para aprovar a anatomia facial de personagens cartoon 3D. A V2 reúne cabeça, rig facial, corpo, cabelo, acessórios e figurinos procedurais personalizáveis, sem assets externos.

## Tipos físicos

`buildBody(fit, id, { build: { weight, muscle } })` aplica deltas sobre o corpo original de cada personagem. `weight` vai de **-1 (magro)** a **1 (gordo)**; `muscle` vai de **0 (musculatura original)** a **1 (musculoso)**. `{weight:0,muscle:0}` mantém a forma original. Peso e músculo podem ser combinados.

As alterações afetam largura e volume: cintura, barriga, quadril, braços, pernas, ombros e peitoral. Altura, comprimentos, juntas, escala da cabeça e tamanho dos seios permanecem iguais; Cute continua sem seios. A seção do pescoço junto à cabeça usa exatamente o campo original, com transição suave para o volume abaixo. O rosto, os ossos faciais e seus blendshapes não são modificados.

A seção **Corpo** oferece os controles **Peso** e **Músculo** e os atalhos **Magro, Padrão, Gordo e Musculoso**. A escolha fica em `look.build`, é preservada por personagem e pode ser lida/trocada por `window.__atelie.getLook()`, `setLook({build:{weight,muscle}})` ou `await setBuild({weight,muscle})`. A troca remonta só corpo e roupas: as instâncias da cabeça, do rig facial, do cabelo e dos acessórios permanecem iguais. O status mostra “Montando corpo…” durante a troca; o GLB leva o build escolhido em `Body.extras.build`.

O cache do corpo diferencia personagem, densidade, escala da cabeça, cauda, peso e músculo e conserva até 64 geometrias. As roupas consultam esse campo individual: barrigas empurram o tecido, braços mais fortes alargam mangas e a cintura magra afina os cintos. Saiotes também consideram as coxas abaixo da cintura. Peças largas usam uma grade inicial maior, refinamento da superfície e projeção no campo; cintos e tiras finas mantêm a grade direta. Coletes, gibões e jalecos recortam primeiro a face externa e depois criam avesso e bordas fechadas, com normais independentes; isso evita perder paredes finas na malhagem volumétrica. Amostras compartilhadas entre blocos e coeficientes fixos dos membros reduzem o custo sem alterar o campo. No visualizador, a célula do corpo é `.032 × clamp(W,1,1.3)`; a exportação usa `.036`.

O status e `await window.__atelie.setBuild(...)` abrangem corpo **e** roupas; `bodyTiming()` expõe a última medição em milissegundos. As referências faciais continuam intactas durante essa operação. `node tests/tipos-fisicos.mjs` verifica juntas, emenda, cache e volume crescente de magro → padrão → gordo nos 12 personagens orgânicos. O robô conserva seu casco.

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
- **13 personagens em 4 famílias** (inclui o Rei), trocados por botões agrupados:
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
- **Visual por catálogo (clica e troca)** — nada de esticar olho, nariz ou boca; o rosto continua o do personagem:
  - **Pele**: amostras de tom (humanos, fantasia, vegetais). Blush, sombra da pálpebra, olheira e sulcos acompanham o novo tom.
  - **Cabelo**: 10 modelos — careca, curto, para trás, real, longo ondulado, longo com tranças, cachos volumosos, coque, coque guerreiro (com rabo e tranças com argolas) e cachinhos de palhaço — com 13 cores, trocadas na hora. Cada modelo se encaixa em qualquer cabeça: uma touca fina dentro da linha do cabelo e mechas em faixa contínua que nascem na risca / linha da frente / redemoinho / coque, abraçam o crânio, contornam rosto e orelhas e caem com a gravidade (ondas, cachos em espiral, tranças de 3 fios, pontas em mecha).
  - **Barba**: do personagem, sem barba, sombreada, cheia, bigode, bigode + cavanhaque. Quando o personagem tem cabelo, barba e bigode seguem a cor do cabelo.
  - **Acessórios** por encaixe: cabeça (tiara, coroa, chapéu de cowboy, cartola, coroa de bolhas), orelhas (brinco gota, argola, ponto de luz), testa (joia de testa), enfeite de cabelo (flores, coral) e rosto (óculos redondos). Coroas e chapéus são medidos na superfície real (pele + cabelo), brincos penduram no lóbulo de cada orelha. **Cores trocáveis na hora**: metal, pedra principal, pedras menores, chapéu, flores/coral.
  - Cada personagem tem um visual padrão (ex.: tiara + joia de testa + brincos + flores no feminino, coroa e barba branca no Rei, cartola no palhaço, chapéu no cacto, coroa no rei pimentão) e guarda as escolhas ao trocar de personagem e voltar. "Visual padrão" restaura.
  - Cabelo e acessórios ficam presos no osso `Bone_Head` e vão juntos no GLB (malhas `Hair_*` e `Acc_*`).
- **Corpo inteiro** (só malha: sem roupa, sem acessórios, sem genitais), em pose A, gerado para cada personagem a partir do mesmo tipo de campo de distância da cabeça: tronco por curvas (trapézio, peito, costelas, cintura, barriga, quadril), pescoço que continua o da cabeça, braços com deltoide e antebraço, mãos com palma, 4 dedos de 3 falanges e polegar, pernas com coxa, joelho e panturrilha, pés com calcanhar e dedos arredondados, virilha lisa. Mulheres adultas com forma de seio (lisa, sem mamilo). Cada personagem tem seu tipo: feminino esguio, masculino atlético, Rei com barriga, Cute em proporção chibi, alquimista alto e magro, anão baixo e largo, palhaço barrigudo, orc musculoso, cacto com nervuras; pimentão (baixo e robusto) e pimenta (esguia e definida) ganham corpo humanoide vermelho, com pele mais fosca que a do vegetal. A pele do corpo segue a cor escolhida; o cabelo longo cai sobre ombros e costas. Malha por *surface nets* esparso (só perto da superfície), guardada em cache por personagem. Com o corpo, a cabeça inteira (rig, cabelo e acessórios juntos) é reduzida por personagem em volta da base do pescoço — escala uniforme no nó `Head_V2_*`, então ossos, blendshapes e animações do rosto não mudam. Opção "Mostrar corpo" e câmera "Corpo inteiro" / "Rosto"; o GLB leva o corpo (`Body`).
- **Figurinos por peças**: o conjunto é um atalho para preencher seis slots independentes: **parte de cima, parte de baixo, calçado, capa/manto, cinto e extras**. Escolha a categoria em “Personalizar peças”, clique no modelo e ajuste as cores dessa peça. Os figurinos de circo, orc, aventureiro, deserto, sereia pérola e rubi continuam disponíveis, junto aos modelos básicos.
  - **Caimento de tecido (envoltória)**: as partes de cima, vestidos e mantos não copiam mais a pele. Cada seção do tronco vira o contorno convexo do corpo (o pano passa por cima do vão entre os seios, dos sulcos do cacto, da coluna e do espaço entre as pernas), cai do ponto mais largo com inclinação limitada e só é puxado para dentro onde há cinto. Mangas são cones pelo eixo do braço unidos ao tronco com transição suave (bufante, sino, curta, até o cotovelo ou o punho). O corpo + folga entra só como piso, então a pele nunca atravessa. Camadas respeitam a ordem: colete e jaleco ficam por fora da camisa, cintos assentam sobre a peça e as calças nunca furam a túnica. Túnica (Cute), manto real com arminho (Rei e Rei pimentão), jaleco aberto com colete e gravata (alquimista) e camisa + colete + lenço (cacto e pimenta) foram refeitos assim; as partes de cima esculpidas (palhaço, aventureiro, deserto) usam a mesma envoltória.
  - **Acabamento**: anão com camisa bufante por baixo de um gibão justo e aberto (debrum dourado na cava, na abertura e na barra); falcoeiro com túnica de uma peça só (sem marcar o peito), faixa e tabardos assentados nela; Rei e Rei pimentão com murça de arminho em gomos com caudas pretas e capa com barra dourada; jaleco do alquimista por fora do colete e da calça, com debrum na abertura e bolsos assentados; colete de couro com debrum; sereias com corpete justo, decote coração e barbatanas. Os debruns são lidos da própria borda cortada da malha (`edgeTube`), então acompanham qualquer corpo. Capas seguem a envoltória da roupa de baixo (`over`).
  - **Correção da regressão após `caa45f5`**: roupas básicas recuperam seus modelos e paletas; calças passam a ter um volume contínuo, sem tubos separados nem cascas cruzadas na virilha. As roupas básicas preservam a modelagem dos ombros e mangas da referência. Nos figurinos esculpidos, os volumes originais recebem suavização Taubin somente no tecido. Saias e abas usam contornos medidos com interpolação cúbica periódica, 80 anéis e 192 colunas, preservando cintura, abertura e pregas. Avesso e barras não entram no cálculo das normais externas. O corpo original permanece intacto.
  - Estandarte rasgado do orc, estrelas e abas da casaca, tabardos com losangos e franjas foram recuperados nos seus tamanhos originais. A capa do falcoeiro abre nas laterais. Os véus da sereia rubi usam vermelho transparente. Escamas e listras são padrões procedurais incorporados ao GLB.
  - Barras enroladas, punhos volumosos, painéis separados no saiote, joias, bolsas, fivelas e ornamentos são geometria. Tecidos têm sheen, couro tem acabamento próprio e metais têm reflexão mais áspera. As escamas e listras são texturas **geradas em memória pelo código**, incorporadas no GLB; degradês e variação das dobras usam cores por vértice. Não há imagens baixadas ou assets externos.
  - **Cores por peça**, sem remontar a geometria. Alterar o tecido da capa preserva as cores do top e do cinto. Trocar um slot mantém as instâncias dos outros cinco; o cinto recupera seu contorno original medido, sem a escala que o fazia flutuar. A escolha de um conjunto restaura as peças e cores desse conjunto.
  - **Cache por corpo e figurino**: geometria imutável compartilhada, materiais independentes, contagem de referências e limite de 24 moldes completos (cada molde fornece seus slots). A primeira construção compartilha os campos das camadas entre todas as peças, evitando repetir o figurino inteiro a cada slot. A identidade do campo inclui o tipo físico, então nenhum molde ou contorno de outro build é reutilizado. As medições dos contornos também são reutilizadas por corpo, com limite de 16 mil amostras. Os testes registram o p95 das trocas em cache; o tempo inicial depende do dispositivo e do detalhe da peça.
  - **Combinações compatíveis**: preserva-se o tipo de corpo original de cada personagem. As sereias usam a base sem pernas que já existia; caudas aparecem no catálogo inferior dessas personagens e calçados ficam indisponíveis. Nos personagens com pernas, o catálogo inferior oferece calças e saias. Trocar roupas não remonta a cabeça, não altera o corpo e não muda o cabelo.
  - Roupas exportadas em `Personagem_*/Figurino/RoupaSlot_<slot>`, com malhas `Roupa_*`, materiais PBR, padrões e os 12 clipes faciais existentes. Corpo e roupas continuam estáticos na pose A. O cabelo não foi alterado; capas recebem afastamento conservador, sem simulação de colisão entre tecidos e cabelos.
  - **Acessórios refinados**: gemas com mesa/cintura/pavilhão, biséis mais suaves, filigrana e milgrain na coroa, borda e pesponto do chapéu, fita da cartola e variação sutil no metal/tecido. O anel de encaixe conserva a folga sobre a superfície externa do cabelo.
- **Câmera**: rotação livre, zoom e botões Frente / Perfil / 3/4.
- **Exportação GLB** da cabeça (≈10 MB com o rig, 24 malhas nomeadas: `Head_Skin` com pescoço, `Eye_L/R` com `Sclera`/`Iris`/`Cornea`, `Lashes_L/R`, `Brow_L/R`, `Ear_L/R` (orelha em C com hélice, anti-hélice, concha, trago e lóbulo, no tamanho anatômico — da sobrancelha à ponta do nariz — apoiada numa raiz modelada na cabeça), `Mouth_Line`…), gerada com densidade um pouco menor que a do visualizador.

## Estrutura
```
index.html        interface, cena (luzes, sombras) e exportação
src/presets.js    dados dos presets (crânio, curvas do rosto, olhos, nariz, boca, pele…)
src/look.js       visual por catálogo: tons de pele, visual padrão de cada personagem, monta cabelo + acessórios
src/hair.js       cabelos (touca + mechas em faixa, cachos, tranças, coques) e cores
src/clothes.js    slots, compatibilidade, cache por peça, materiais, cores ao vivo e exportação
src/fabric.js     superfícies com avesso, normais externas independentes e suavização de tecidos
src/legacy-clothes.js modelo antigo do guerreiro básico (os demais básicos usam a envoltória de outfits.js)
src/outfits.js    envoltória de tecido (garment/envelope), figurinos por peças, detalhes e referências (palhaço, orc, aventureiro, deserto, sereias), listras procedurais e escamas em relevo
src/body.js       corpo inteiro (SDF do corpo por tipo de personagem + malha surface nets)
src/accessories.js acessórios (tiara, coroa, chapéus, brincos, joia de testa, flores, coral, óculos) e cores
src/rig.js        rig facial: esqueleto, pesos, poses de expressão e clipes de animação
src/robot.js      gerador da cabeça de robô (casco, tela emissiva, orelhas de luz)
src/head.js       geração procedural: SDF (crânio + casca facial por curvas), projeção da malha, relevo do rosto, olhos, cílios, shader de pele
```
Para criar um personagem novo, o caminho mais curto é herdar de um existente e trocar só o que muda, por exemplo `PRESETS.meu_ogro = derive('orc_warrior', { id: 'meu_ogro', label: 'Ogro', family: 'Criaturas', sub: '…', skin: '#7a9a5a', tusks: null })`, e incluir o id em `PRESET_ORDER`. Para um preset do zero, copie uma entrada de `PRESETS` (`src/presets.js`), ajuste o crânio (`cran`, `occ`), as curvas da casca facial (`loft`: `a`, `zf`, `zb`), o pescoço (`neck`, `scm`) e os traços, e inclua o id em `PRESET_ORDER` (a família e a descrição do botão vêm de `family` e `sub`).

## Limites desta versão
Personagem de corpo inteiro com figurino, ainda sem esqueleto no corpo (o rig é só do rosto); também não há nem topologia de produção (a malha é uma grade procedural densa, não *edge loops* de animação). Pele com cor por vértice, sem textura pintada; o shader de pele e as sombras ficam no visualizador (o GLB leva geometria, cores por vértice e materiais PBR padrão). Trocar de personagem, pele ou barba remonta a cabeça (~1,5 s); trocar cabelo leva ~0,3–0,6 s; cores de cabelo, acessórios e roupas são instantâneas. O tamanho do GLB varia conforme cabelo, corpo e figurino; o teste registra os tamanhos por personagem em `renders/reports.json`. O visual ainda NÃO foi aprovado. As referências são direção de arte; os renders desta etapa servem para revisão manual.

## GitHub Pages
Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** se ainda não estiver ativo. O workflow em `.github/workflows/pages.yml` publica a cada commit da main.

## Depuração do figurino
`window.__atelie.clothes()` retorna a montagem atual e sua seleção. `setOutfit("adventurer")` aplica um conjunto sem remontar o rosto. `pieceOptions("cape")` lista as opções válidas e `setPiece("cape", "desert:cape")` troca só a capa. `setPieceColors("cape", { fabric: "#246366" })` colore somente essa peça; `setClothColors()` continua disponível como atalho global. `getLook()` inclui `outfit`, `clothColors`, `pieces` e `pieceColors`; `setLook()` também aceita esses campos. O modo anatômico é o padrão do personagem, independente da combinação de roupas.

## Verificações locais
As dependências abaixo são apenas de desenvolvimento; a página publicada continua sem build e usa o import map existente.

```sh
npm install --no-save --package-lock=false three@0.180.0 playwright
node tests/figurinos.mjs
python3 -m http.server 8000
# Em outro terminal, com Chromium disponível em /usr/bin/chromium:
node tests/visuais.cjs
```

O teste geométrico percorre os 14 conjuntos e todas as peças compatíveis nos 12 corpos. Verifica índices, posições, normais completas no avesso, troca de cor, preservação da pele e manutenção dos outros slots; registra o p95 das trocas em cache. O teste de navegador gera renders de frente e 3/4 dos 13 personagens em `renders/`, valida nós, escala da cabeça, skin, blendshapes e clipes do GLB, testa todas as peças e cores, a independência dos slots, a preservação da pele e a opção de ocultar o corpo. Ele intercepta o CDN para usar o Three.js local e reduz apenas no teste a sombra para 1024 px, com renderização sob demanda, para rodar em SwiftShader. A produção mantém sombras de 4096 px e animação contínua.

Para gerar também os closes dos acessórios, rode `ATELIE_CLOSEUPS=1 node tests/visuais.cjs`. O teste percorre todos os modelos e canais de cor disponíveis nos slots de acessórios. O visual continua pendente da avaliação do usuário; a validação automática verifica funcionamento e integridade, não aprovação estética.


Para verificar a cobertura das calças padrão na malha real, rode `node tests/cobertura.mjs`. O teste constrói uma árvore espacial das faces do tecido e consulta, para cada vértice de pele na região coberta, o primeiro encontro na direção da normal: ele deve estar à frente da pele, com folga positiva e orientação de saída. Essa verificação complementa os renders; não substitui a revisão das combinações de catálogo.

A comparação visual usa um checkout separado de `caa45f5`, o mesmo Three.js, resolução, luzes, pose neutra e matrizes de câmera nas duas versões. Os acessórios atuais são preservados na versão corrigida. Não se altera rosto, rig, corpo, cabelo nem escala dos personagens.

Comparação reproduzível (dois servidores locais, um em cada checkout):

```sh
git worktree add --detach ../quemsoueu-baseline caa45f5
python3 -m http.server 8001 --directory ../quemsoueu-baseline
# Em outro terminal, sirva a versão atual na porta 8000.
ATELIE_REFERENCIA=1 node tests/comparacao.cjs
node tests/comparacao.cjs
```

Os PNGs e as matrizes ficam em `renders/comparacao/{caa45f5,nova}/`. A câmera das sereias é afastada igualmente nas duas versões para incluir a nadadeira inteira. `ATELIE_BASELINE` permite indicar outro caminho para o checkout da referência; `ATELIE_COMPARACOES` muda a pasta de saída e `ATELIE_PERSONAGENS` limita a captura por IDs separados por vírgula. O teste geométrico principal também executa a verificação de cobertura e protege a independência das normais externas em relação à espessura do tecido.

Verificação desta correção (19/10/2026): 13 personagens no navegador, 688 trocas de peças e cores, nenhum erro de console, 12 clipes preservados em cada personagem com rig facial. Maior p95 de troca em cache: 46 ms no SwiftShader. O teste de cobertura verificou 79.011 vértices das calças padrão, sem falhas. Esses números descrevem esta execução, não um limite de desempenho para qualquer dispositivo.

## Validação dos tipos físicos

```sh
node tests/figurinos.mjs
# Servidor local na porta 8000; three@0.180.0, playwright e Chromium instalado (Pillow para as pranchas):
node tests/visuais-tipos.cjs
node tests/corpos-completos.cjs
node tests/desempenho-tipos.cjs
python3 tests/galeria-tipos.py renders/tipos-fisicos
```

`figurinos.mjs` inclui a comparação de juntas, volume e pescoço nos quatro tipos e a cobertura da malha real nos builds `{-1,0}`, `{1,0}` e `{0,1}` dos 12 personagens orgânicos. A cobertura inclui calças/saias/caudas, troncos e trechos das mangas; recortes intencionalmente abertos do orc são excluídos. As mulheres adultas preservam os seios e Cute continua sem eles.

`visuais-tipos.cjs` captura frente e perfil dos 13 personagens nos quatro tipos, com e sem roupa, e verifica o GLB de cada combinação, a escala da cabeça, os 12 clipes, os 11 blendshapes e a identidade dos objetos preservados. `corpos-completos.cjs` acrescenta a variante humana com pernas das duas sereias, sem reconstruir o visual. O robô não ganha corpo humano: seu casco permanece igual. A galeria reúne pranchas por personagem, imagens originais e um ZIP. `ATELIE_CAPTURAR=0` permite validar apenas o GLB sem gerar novas imagens.

Execute `desempenho-tipos.cjs` sozinho para medir geração completa abaixo de 3 s e cache abaixo de 500 ms. `ATELIE_RENDERS` altera a pasta de saída; `ATELIE_PERSONAGENS` limita personagens. Ao capturar em paralelo com a suíte de geometria, use `ATELIE_COBRAR_TEMPO=0` em `visuais-tipos.cjs` e mantenha a medição exclusiva separada. Os tempos dependem do dispositivo; os valores desta execução ficam em `desempenho.json`. Os renders servem à avaliação do usuário, sem aprovação estética automática.

Verificação desta etapa (20/10/2026): 12 corpos × 14 conjuntos; 36 casos de cobertura com 386.486 vértices consultados e nenhuma falha. Juntas e encaixe preservados, volume crescente de magro → padrão → gordo. Foram capturadas 224 imagens dos 13 personagens, com validação de 52 GLBs (48 com 12 clipes faciais e 4 do robô). Nenhum erro de console. Na medição exclusiva, o maior tempo de corpo + roupas foi 2,794 s; maior volta ao cache: 136 ms. Os arquivos `desempenho.json` e `relatorio.json` acompanham a galeria.

## Menu por categorias e prévias visuais

A interface foi reorganizada em **Personagem, Corpo, Aparência, Roupas, Acessórios e Expressões**. Cada categoria abre suas subcategorias na coluna esquerda e mostra somente os controles daquela seleção. A câmera, a opção de mostrar o corpo, restaurar o visual e exportar GLB ficam junto do personagem. Há também uma vista de costas.

Os modelos são cartões com prévias do próprio personagem, visíveis antes de clicar: personagens, quatro tipos físicos, cabelos, barbas, conjuntos, peças, acessórios e expressões. Peso e músculo continuam por controles de arrastar; cores usam amostras. As cores da roupa ficam dentro da peça selecionada, em uma seção expansível, e mostram somente os canais utilizados por ela. Os acessórios mostram as cores do slot aberto.

`src/editor.js` e `src/editor.css` organizam a navegação. `src/previews.js` gera a fila visível, reutiliza imagens em memória e no IndexedDB e monta o worker a partir do mesmo import map. `src/preview-worker.js` renderiza uma cena independente em OffscreenCanvas; `src/preview-spec.js` aplica as escolhas apenas à cópia usada na miniatura. Não há imagens externas, build ou serviço novo. As miniaturas aparecem progressivamente na primeira visita. Se o navegador não oferecer o recurso necessário, o catálogo continua selecionável e informa que a prévia está indisponível.

Depuração: `window.__atelie.editor.select('body','type')`, `.select('clothes','upper')`, `.sections()` e `.previews.stats()`. `.previews.pause()` interrompe a geração para testes isolados do personagem, sem alterar a skin.

```sh
# Com o servidor local na porta 8000:
node tests/menu-previas.cjs
```

Esse teste percorre as 26 subcategorias, captura suas telas em `renders/menu/`, confere que a prévia não altera a cena principal, exercita o cache após clique e recarga, os controles, o layout móvel e a exportação GLB.

**Validação final do menu (20/10/2026):** a execução [GitHub Actions #39499185385](https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39499185385) passou nas três suítes: `tests/menu-previas.cjs`, `tests/visuais.cjs` e `tests/figurinos.mjs`. Foram registradas **26 telas de subcategoria, 118 prévias renderizadas, 144 imagens no cache**, além das capturas móveis e especiais. O teste confirmou os quatro tipos físicos simultâneos, troca de opções sem alterar a cena, cores ao vivo, cache persistente, ausência de rolagem horizontal em 390 px e GLB com 12 clipes. A suíte visual percorreu os 13 personagens, vistas frente/3/4, figurinos, acessórios e GLBs. A geométrica incluiu os 36 casos de cobertura dos tipos físicos.

A primeira rodada encontrou `RangeError: Maximum call stack size exceeded` nas miniaturas do anão e do palhaço: `clothSurface` usava `ids.push(...faces)` com uma lista de índices grande demais para a pilha do Worker. A correção em `src/fabric.js` passou a copiar os **mesmos índices em ordem, sem spread**; nenhuma posição, face, normal, proporção, rosto, rig, cabelo ou acessório foi redesenhado. Depois da correção, todas as prévias da suíte passaram.

**Capturas públicas, sem ZIP:** [galeria de todas as subcategorias](https://aruanmf446-hub.github.io/quemsoueu/capturas/menu/index.html) e [galeria dos 13 personagens](https://aruanmf446-hub.github.io/quemsoueu/capturas/personagens/index.html). Os PNGs são publicados em branch independente `capturas-atelie`, sem adicionar binários à `main`. O workflow `.github/workflows/validar-menu.yml` executa os testes; `publicar-capturas.yml` publica os resultados aprovados e `pages.yml` incorpora a galeria ao site.

**Aprovação estética permanece com o usuário.** Os testes comprovam o funcionamento técnico, não que todos os enquadramentos ou o acabamento artístico estejam visualmente aprovados. A suíte específica de 52 combinações de tipo físico e GLB também pode ser reproduzida com `tests/visuais-tipos.cjs` ou seu workflow dedicado `validar-tipos.yml`.

## Fluidez do Ateliê sem perda de qualidade (20/10/2026)

A geração das miniaturas continua a usar a **mesma** cena, malha, materiais, enquadramento, resolução e parâmetros de renderização procedural. O motor principal do Ateliê (câmera, iluminação, sombras, geometria, rig facial e exportação GLB) **não foi modificado** nesta etapa.

- `src/previews.js` implementa `previews.hold(motivo, ativo)`: não inicia a próxima renderização do Worker enquanto o jogador interage com a cena. Os trabalhos já em andamento terminam normalmente, preservando as imagens originais e os mesmos conteúdos de cache.
- `src/editor.js` mantém a fila em espera enquanto o jogador gira o personagem (pointerdown → pointerup/pointercancel ou perda de foco), durante o gesto de zoom (liberação 220 ms após o último scroll) e com a aba em segundo plano.
- `src/previews.js` obtém a skin-base uma única vez por atualização dos cartões, evitando múltiplas cópias completas do mesmo estado. As opções de personagem continuam usando seus looks individuais.
- `tests/fluidez.cjs` executa no Playwright com mouse real, rotação/zoom, retomada de fila, navegação entre categorias, quatro miniaturas completas e integridade do visual; o CI está em `.github/workflows/validar-fluidez.yml`.

**Nenhuma estratégia de redução dinâmica de resolução, sombras, densidade da malha, rig ou qualidade de imagem foi introduzida.** A otimização controla prioridade de execução, não fidelidade. A medição de FPS depende da GPU e do navegador do visitante; não há promessa de ganho percentual universal. O teste CI usa SwiftShader e reduz a sombra apenas na execução de teste, como as suítes anteriores; a produção continua com os parâmetros originais.

**Resultado de validação de fluidez:** [GitHub Actions #39507159296](https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39507159296) aprovado. O teste de gestos reais validou rotação, zoom, liberação ao perder foco, retomada da fila e quatro miniaturas de tipo físico, mantendo inalterado o visual do personagem. A navegação entre quatro subcategorias levou **16,7 ms** nessa execução de Chromium/SwiftShader; não confundir essa medição com FPS ou ganho percentual no dispositivo final. A suíte completa do menu, rig, GLB e geometria também passou [#39504990256](https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39504990256). O objetivo de desempenho foi atingido nos testes de CI disponíveis, mas a aprovação subjetiva de fluidez e acabamento depende da revisão no dispositivo do usuário.

## Encaixe das roupas no tipo físico

A envoltória de tecido limita quanto da largura dos ombros pode ser carregado até o peito e a cintura. A folga também considera a espessura medida da seção e o peso selecionado. Mangas, pregas, saias rodadas e camadas continuam com seus volumes próprios; o campo do corpo permanece apenas como limite de segurança para a cobertura da pele.

Nas sereias, o cós e o quadril da cauda usam o contorno do corpo escolhido, incluindo profundidades diferentes na frente e nas costas. A extensão da cauda afina a partir desse encaixe, e os filetes dourados seguem a superfície medida. O saiote do orc teve a folga e a abertura reduzidas. As imagens antigas do catálogo recebem uma nova chave de cache; as melhorias de prioridade dos gestos de câmera foram preservadas.

`node tests/ajuste-roupas.mjs` verifica limites de folga em seções do tronco/cauda, resposta aos quatro tipos físicos, preservação da pele, cores e troca em cache. Ele também integra `node tests/figurinos.mjs`. A comparação visual usa o checkout `8655440` como referência:

```sh
# Referência servida na porta 8001, versão atual na 8000:
ATELIE_BASELINE=/caminho/da/referencia ATELIE_PORT=8001 ATELIE_FASE=antes node tests/encaixe-roupas.cjs
node tests/encaixe-roupas.cjs
```

`ATELIE_RENDERS` define a pasta compartilhada das duas capturas. O teste registra frente, perfil e 3/4, compara a malha do corpo entre as versões e confere GLB nos casos principais. Esses renders servem à avaliação do usuário; testes de cobertura, por si só, não aprovam a estética do encaixe.

Verificação do encaixe (20/10/2026): 36 casos de cobertura, 386.486 vértices e zero falhas; 12 casos adicionais de limites de folga. Foram comparados dez casos de orc/sereias em frente, perfil e 3/4, com o corpo idêntico ao da referência. Os 13 personagens passaram na regressão visual e de GLB; 700 trocas de peças e cores, maior p95 em cache de 18 ms nesta execução, sem erros de console. As prévias reais do catálogo preservaram o orc magro. A aprovação estética final continua com o usuário.

## Seleção de tipo físico e peso

Ao abrir **Corpo**, a câmera enquadra o corpo inteiro. Selecionar um tipo físico ou ajustar peso/músculo ativa a exibição do corpo e mantém o ângulo de visão. Os cartões permanecem no DOM durante os toques; a confirmação **Aplicado** aparece junto dos controles. O arraste usa `input` com debounce e confirma o valor final em `change`, incluindo teclado e acessibilidade.

Os testes anteriores confirmavam os modelos gerados; a nova regressão verifica a largura real da cintura após toques nos botões dos 12 personagens e arrastes do peso, além dos estados de corpo oculto e câmera no rosto. A API `setBuild(build)` mantém o comportamento anterior; a interface pede explicitamente a visualização do resultado. Geometria, proporções, roupas, cabelo e rig não mudaram nesta correção.

```sh
# Servidor na porta 8000:
node tests/controles-corpo.cjs
node tests/corpo-visivel.cjs
# Para reproduzir os estados de visibilidade anteriores à correção:
ATELIE_REFERENCIA=1 node tests/corpo-visivel.cjs
```

`ATELIE_MOBILE=1` executa os controles em largura de celular. `ATELIE_PERSONAGENS` permite limitar a medição por IDs; `ATELIE_RENDERS` escolhe a pasta das capturas e relatórios. Os testes de visibilidade também conferem identidade da cabeça e exportação do build escolhido com os 12 clipes faciais.

Verificação: os 12 personagens orgânicos responderam aos toques em Magro/Padrão/Gordo, com cintura medida na malha e cabeça/rig preservados. Os três casos de visibilidade falharam na referência `60f7e90` e passaram após a correção; arraste e confirmação por `change` também passaram, com exportação GLB de 12 clipes e sem erros de console.
