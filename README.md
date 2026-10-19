# Quem Sou Eu — Ateliê Facial · Head V2

Protótipo separado do jogo principal para aprovar a anatomia facial de personagens cartoon 3D. A V2 reúne cabeça, rig facial, corpo, cabelo, acessórios e figurinos procedurais personalizáveis, sem assets externos.

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
- **Figurinos por catálogo**: sem roupa, aventureiro, vestido, palhaço, guerreiro, faroeste, realeza e inventor. Conjuntos completos com seleção independente de tecido principal, tecido secundário, acabamentos e couro/calçados; as cores mudam ao vivo, sem remontar cabeça ou corpo. Cada personagem começa com um conjunto e conserva suas escolhas durante a sessão. O robô mantém o próprio casco e não recebe figurino. Ative **Mostrar corpo** para vestir e exportar as roupas.
  - Túnicas, vestidos, coletes, jalecos, saias e capas são superfícies medidas no SDF do corpo, com folga e caimento; calças, mangas, botas e braçadeiras são recortes interpolados da superfície corporal. Pompons, gola franzida, ombreira, rebites, cintos, botões, lenço e broche são geometria procedural.
  - As roupas ficam em `Personagem_*/Figurino`, com malhas `Roupa_*` e materiais PBR `Roupa_fabric/secondary/trim/leather`. Entram no GLB junto com os 12 clipes faciais. A pele original e as escalas aprovadas das cabeças são preservadas.
  - São figurinos cartoon inspirados nas referências; não há simulação de tecido, texturas pintadas, armas ou reprodução dos detalhes fotográficos. Corpo e roupas continuam estáticos em pose A. O cabelo ainda colide com o corpo, sem considerar a superfície das roupas.
- **Câmera**: rotação livre, zoom e botões Frente / Perfil / 3/4.
- **Exportação GLB** da cabeça (≈10 MB com o rig, 24 malhas nomeadas: `Head_Skin` com pescoço, `Eye_L/R` com `Sclera`/`Iris`/`Cornea`, `Lashes_L/R`, `Brow_L/R`, `Ear_L/R` (orelha em C com hélice, anti-hélice, concha, trago e lóbulo, no tamanho anatômico — da sobrancelha à ponta do nariz — apoiada numa raiz modelada na cabeça), `Mouth_Line`…), gerada com densidade um pouco menor que a do visualizador.

## Estrutura
```
index.html        interface, cena (luzes, sombras) e exportação
src/presets.js    dados dos presets (crânio, curvas do rosto, olhos, nariz, boca, pele…)
src/look.js       visual por catálogo: tons de pele, visual padrão de cada personagem, monta cabelo + acessórios
src/hair.js       cabelos (touca + mechas em faixa, cachos, tranças, coques) e cores
src/clothes.js    figurinos, encaixe no corpo, modelos de catálogo e cores ao vivo
src/body.js       corpo inteiro (SDF do corpo por tipo de personagem + malha surface nets)
src/accessories.js acessórios (tiara, coroa, chapéus, brincos, joia de testa, flores, coral, óculos) e cores
src/rig.js        rig facial: esqueleto, pesos, poses de expressão e clipes de animação
src/robot.js      gerador da cabeça de robô (casco, tela emissiva, orelhas de luz)
src/head.js       geração procedural: SDF (crânio + casca facial por curvas), projeção da malha, relevo do rosto, olhos, cílios, shader de pele
```
Para criar um personagem novo, o caminho mais curto é herdar de um existente e trocar só o que muda, por exemplo `PRESETS.meu_ogro = derive('orc_warrior', { id: 'meu_ogro', label: 'Ogro', family: 'Criaturas', sub: '…', skin: '#7a9a5a', tusks: null })`, e incluir o id em `PRESET_ORDER`. Para um preset do zero, copie uma entrada de `PRESETS` (`src/presets.js`), ajuste o crânio (`cran`, `occ`), as curvas da casca facial (`loft`: `a`, `zf`, `zb`), o pescoço (`neck`, `scm`) e os traços, e inclua o id em `PRESET_ORDER` (a família e a descrição do botão vêm de `family` e `sub`).

## Limites desta versão
Personagem de corpo inteiro com figurino, ainda sem esqueleto no corpo (o rig é só do rosto); também não há nem topologia de produção (a malha é uma grade procedural densa, não *edge loops* de animação). Pele com cor por vértice, sem textura pintada; o shader de pele e as sombras ficam no visualizador (o GLB leva geometria, cores por vértice e materiais PBR padrão). Trocar de personagem, pele ou barba remonta a cabeça (~1,5 s); trocar cabelo leva ~0,3–0,6 s; cores de cabelo, acessórios e roupas são instantâneas. O tamanho do GLB varia conforme cabelo, corpo e figurino; o teste registra os tamanhos por personagem em `renders/reports.json`. As referências aprovadas são direção de arte para revisão manual, não um resultado reproduzido.

## GitHub Pages
Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** se ainda não estiver ativo. O workflow em `.github/workflows/pages.yml` publica a cada commit da main.

## Depuração do figurino
`window.__atelie.clothes()` retorna o figurino atual. `setOutfit("royal")` troca o conjunto sem remontar o rosto, e `setClothColors({ fabric: "#246366" })` altera as cores ao vivo. `getLook()` inclui `outfit` e `clothColors`; `setLook()` também aceita esses campos. “Sem roupa” restaura a exibição da malha original, sem alterar a geometria do corpo.

## Verificações locais
As dependências abaixo são apenas de desenvolvimento; a página publicada continua sem build e usa o import map existente.

```sh
npm install --no-save --package-lock=false three@0.180.0 playwright
node tests/figurinos.mjs
python3 -m http.server 8000
# Em outro terminal, com Chromium disponível em /usr/bin/chromium:
node tests/visuais.cjs
```

O teste geométrico percorre os oito modelos nos 12 corpos e verifica índices, posições, normais, troca de cor e preservação da pele. O teste de navegador gera renders de frente e 3/4 dos 13 personagens em `renders/`, valida nós, escala da cabeça, skin, blendshapes e clipes do GLB, testa o catálogo e a opção de ocultar o corpo. Ele intercepta o CDN para usar o Three.js local e reduz apenas no teste a sombra para 1024 px, com renderização sob demanda, para rodar em SwiftShader. A produção mantém sombras de 4096 px e animação contínua.
