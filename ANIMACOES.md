# Movimentos compartilhados

A coreografia procedural de `7444526` foi reprovada. A biblioteca atual usa captura de movimento humano do CMU/cgspeed, adaptada às medidas de cada personagem. Depois da revisão das pernas em `791ed88`, o usuário apontou deformações em vários figurinos e corpos compactos achatados. Esta rodada corrige mangas, saias, escudos e pele atravessando roupa opaca e acrescenta altura proporcional. Rostos, cabelos e materiais de produção são preservados; somente os três corpos compactos do deserto recebem novas proporções. [Fonte, licença e créditos](assets/motions/PROVENANCE.md).

Abra **Animações → Reações e danças** no editor. Há reprodução, pausa, velocidade, barra de tempo e visualização do esqueleto. **Parar / pose A** restaura a pose de edição. [Revisão atual dos 34 personagens e cinco movimentos](revisao/altura-animacoes/). As galerias anteriores permanecem como histórico.

## Biblioteca

| Interface | ID existente / clipe GLB | Duração | Reprodução |
| --- | --- | --- | --- |
| Lobby | `lobby` / `Body_lobby` | 6 s | Contínua |
| Derrota | `defeat` / `Body_defeat` | 4,5 s | Uma vez; mantém a pose final |
| Vitória | `victory` / `Body_victory` | 6 s | Uma vez |
| Macarena | `dance_floss` / `Body_dance_floss` | 4 s | Contínua |
| Dança retrô | `dance_shuffle` / `Body_dance_shuffle` | 5 s | Contínua |

Os dois IDs antigos foram preservados para links e integrações. Seus rótulos agora indicam os movimentos reais. A sequência retrô usa um trecho de dança solo do arquivo `15_04`; o índice não identifica a dança em cada instante, por isso não se atribui um nome mais específico. Os movimentos não incluem música.

Links diretos:

- [Nico — Macarena](https://aruanmf446-hub.github.io/quemsoueu/?v=altura-roupas-1&personagem=nico_inventor&animacao=dance_floss)
- [Nana — dança retrô](https://aruanmf446-hub.github.io/quemsoueu/?v=altura-roupas-1&personagem=nana_explorer&animacao=dance_shuffle)
- [Vigilante — vitória](https://aruanmf446-hub.github.io/quemsoueu/?v=altura-roupas-1&personagem=bread_vigilante&animacao=victory)

## Adaptação ao rig

`src/mocap-data.js` contém somente dados de movimento, reamostrados a 30 Hz; o jogo não baixa BVHs nem modelos externos. `scripts/importar-mocap.mjs` reproduz a conversão dos cinco arquivos originais, cujas URLs imutáveis e hashes estão nos metadados. A pose T artificial foi descartada. Fontes que caminhavam pelo cenário e salsa com parceiro foram substituídas por espera, desânimo e dança solo que ficam perto do lugar inicial.

`src/mocap-player.js` interpola posições por curvas cúbicas e orientações por SQUAD. Os ciclos fecham com mistura entre o fim e o início; as reações desaceleram antes da pose final. A torção dos braços recebe um filtro simétrico, seguido de projeção sobre a direção capturada, para retirar ruído sem mudar a direção dos gestos.

`src/body-rig.js` mantém 26 ossos comuns: os 22 anteriores e quatro `Drape_*` para tecidos. As orientações capturadas dos braços são calibradas pelas direções de repouso de cada corpo, em vez de aplicar os mesmos Euler globais a segmentos diagonais diferentes. Mãos recebem orientação anatômica própria. A raiz e os alvos dos pés usam o comprimento das pernas; a altura da pelve se adapta para que ambos os pés alcancem os alvos sem esticar os ossos. A IK conserva o plano de flexão dos joelhos. As trajetórias incluem passos e pivôs reais, não exigem que todo pé permaneça na âncora inicial.

Os pesos contínuos e os componentes rígidos de [CORRECAO-RIG.md](CORRECAO-RIG.md) foram mantidos e corrigidos onde a captura revelou falhas: a seção de quadril não afunila artificialmente nos glúteos, a união central das coxas acompanha a pelve e cabeça/pescoço deixam de influenciar os ombros externos. A influência medial da pelve termina gradualmente após a costura medida de cada corpo; abaixo dela, cada perna recebe seus próprios pesos. A sola e os dedos do pé acompanham o mesmo osso do calçado, com transição suave no tornozelo, para a pele não sair da bota. O cano flexível acompanha a perna; solas, placas e pequenos enfeites mantêm vínculos rígidos onde não atravessam uma articulação.

Quando as duas botas fazem parte de uma única superfície conectada, cada lado recebe o seu osso Foot. Usar o centro do componente prendia as duas botas ao mesmo pé. Enfeites individuais conservam o vínculo rígido da própria bota. O teste do catálogo verifica também o lado real dos vértices do calçado, além do movimento da sola de pele.

Os 34 personagens usam cinco perfis: bípedes, sereias, quadrúpedes, aves e robô flutuante. Bípedes executam os passos e gestos; sereias acompanham os gestos com a cauda. Aves, quadrúpedes e robô adaptam o ritmo à própria anatomia, com amplitudes menores. Não há simulação física completa de tecido, navegação ou articulação individual dos dedos.

## Roupas e altura

O corte do figurino na cintura preserva as mangas, inclusive punhos abaixo da linha de divisão. Antes, parte da manga do Rei era criada como peça inferior e ficava pendurada na saia. Barras, mantos e saias recebem pesos próprios nos quatro ossos `Drape_*`, com pivô na cintura. A abertura considera o contorno da roupa e cápsulas das pernas após a IK; a interpolação contínua das faixas evita saltos entre quadros. Mangas e calças conservam os ossos dos membros. Esse acompanhamento geométrico não resolve colisões arbitrárias entre todos os acessórios.

Escudos, armas e placas metálicas grandes são vinculados como componentes rígidos; debruns e cordões longos acompanham o tecido. Roupa opaca fornece máscaras conservadoras do corpo coberto. O rig omite somente triângulos com os três vértices cobertos, em uma cópia da malha, mantendo margem nas bordas. A geometria corporal original permanece completa e reaparece ao remover a peça. Tecidos transparentes e vazados não usam essa máscara.

**Corpo → Altura** controla `look.height` de `.6` a `1.4`. `src/character-height.js` aplica a mesma escala em XYZ ao ator inteiro, com pivô na sola. A solução do esqueleto usa limites locais, sem incorporar a escala do ator às medidas dos ossos. Isso mantém roupa, cabeça, acessórios e passos proporcionais em qualquer altura. O valor é salvo por personagem e exportado no nó raiz do GLB. `setHeight(valor)` mantém rig, tempo e pose da animação.

Os soldados cactos e o cowboy do deserto compartilhavam um corpo de 2,35 cabeças (2,8 no cacto grande), que comprimia tronco e membros. As bases agora usam 3,15 e 3,65 cabeças, com escalas uniformes padrão de `.85` e `.88`, respectivamente. Os outros 31 corpos mantêm a escultura anterior. As miniaturas foram versionadas para não reutilizar o modelo achatado.

## Tecido entre as pernas

A folga radial das calças preenchia o vão entre as pernas até perto da canela. Durante um passo, essa superfície se esticava como uma membrana. `src/leg-clearance.js` mede a costura e a distância medial nos triângulos reais do corpo. Os dois geradores de calça e o macacão inferior preservam uma abertura nessa região, com margem para a pele e para coxas em contato. Contornos externos, pregas, cores e acabamento permanecem.

O rig também elimina a influência da perna oposta abaixo dessa costura, mantendo uma transição contínua no quadril. O ajuste acompanha trocas de roupa, variações de corpo e a exportação GLB. [Comparação na mesma pose e câmera](revisao/pernas/).

## Exportação

Os GLBs com rosto animável incluem 17 clipes: 12 faciais e cinco corporais; o robô inclui cinco corporais. A solução do rig e dos pés é gravada a 30 Hz. O jogo que importa o GLB não precisa executar o solver.

```js
const mixer = new THREE.AnimationMixer(gltf.scene);
const clip = gltf.animations.find(c => c.name === 'Body_dance_floss');
mixer.clipAction(clip).play();
// A cada quadro: mixer.update(deltaSeconds).
```

API do editor: `window.__atelie.bodyRig()`, `playMotion(id)`, `pauseMotion()`, `seekMotion(segundos)`, `stopMotion()` e `motions`. O rig expõe `bones`, `skeleton`, `makeClips()`, `showSkeleton(on)`, `setSpeed(valor)` e `state()`.

## Verificação reproduzível

- `node tests/rig-corporal.mjs`: catálogo completo, pesos, pose A, deformação, clipes, reprodução e descarte. Mantém o limite anterior de estiramento de 6×.
- `node tests/independencia-pernas.mjs`: 27 bípedes, 19 calças padrão, três poses de uma perna por lado; perna parada sem arrasto, abertura do tecido e escultura corporal preservada. `LEG_IDS` filtra modelos e `LEG_BUILD='{"weight":1,"muscle":0}'` verifica outro tipo físico.
- `RIG_DENSE=1 RIG_IDS=nico_inventor,nana_explorer,bread_vigilante,dwarf_bard,cactus_soldier_large,sad_clown node tests/rig-corporal.mjs`: ciclos completos amostrados a cada 0,125 s.
- `node tests/apoio-pes.mjs`: alvos dos pés e direções dos braços, comprimentos dos ossos, sola e ator transformado antes/depois da vinculação. `FOOT_IDS` permite selecionar os corpos largos.
- `node tests/movimentos-compartilhados.mjs`: continuidade espacial e angular, emendas, acomodação final e clipes exportáveis.
- `node tests/direction-retarget.mjs` e `node tests/leg-ik.mjs`: direções anatômicas e IK, incluindo proporções e transformações distintas.
- `node tests/animacoes-jogo.cjs`: controles em desktop/celular, edição durante animação e GLBs reimportados com `GLTFLoader` e reproduzidos por `AnimationMixer`.
- `node tests/altura-personagem.mjs`: seis corpos, escala XYZ, apoio na sola e invariância da pose local em alturas diferentes.
- `node tests/altura-jogo.cjs`: controle em desktop/celular, persistência por personagem, animação em andamento e três GLBs com altura; compara juntas do arquivo importado com a cena.
- `node tests/altura-previas.cjs`: três personagens no Worker, alturas salvas e carregamento versionado das dependências locais.
- `node tests/altura-galeria.cjs`: decodificação/reprodução dos três vídeos, as 170 seleções do catálogo e ausência de rolagem horizontal em 390/1280 px.
- `node tests/corpo-sob-roupa.mjs`: cinco figurinos, máscara estável nas cinco animações e recuperação integral do corpo ao remover a roupa.
- `node tests/roupas-animadas.mjs`: punhos fora da saia, escudos rígidos e continuidade dos quatro ossos de tecido em quatro personagens.
- `AUDIT_ALL=1 AUDIT_OUT=renders/altura-animacao/catalogo-final node tests/revisar-catalogo-animado.cjs --neutral`: 510 imagens reais, três instantes dos cinco movimentos em cada personagem.
- `AUDIT_OUT=renders/altura-animacao/videos-finais node tests/revisar-catalogo-animado.cjs --full --neutral`: três vídeos completos a 24 fps. `AUDIT_BASE` seleciona uma base imutável; `AUDIT_CAMERA_FILE` reutiliza as câmeras de um relatório para comparar antes/depois. `python3 tests/publicar-altura-animacoes.py` publica a galeria somente após conferir catálogo, quadros e hashes atuais.
- `node tests/capturar-mocap.cjs --full --neutral`: grava os movimentos reais a 24 fps para avaliação visual; materiais simplificados de revisão não alteram a produção.
- `LEG_IDS=nana_explorer LEG_POSES=lift node tests/capturar-pernas.cjs`: reproduz a pose de diagnóstico com uma perna levantada. `LEG_BASE` seleciona o código anterior e `LEG_OUT` define a pasta de saída.

Relatórios locais ficam em `renders/mocap/`. Testes técnicos não representam aprovação da qualidade artística; a revisão visual dos ciclos completos e a avaliação do usuário continuam necessárias.

Na rodada de altura/roupas, os 34 personagens passaram novamente no teste do rig, mantendo o limite de 6× e usando os índices originais completos do corpo, inclusive sob roupa oculta. Os 27 bípedes/19 calças mantiveram a independência das pernas; apoio e continuidade compartilhada passaram. Oito GLBs convencionais foram reimportados; seis anatomias passaram no controle de altura e três GLBs com altura tiveram juntas comparadas à cena (erro máximo observado de 0,000013 unidade). As máscaras de cinco figurinos recuperaram o corpo original; quatro personagens passaram em rigidez dos escudos e continuidade dos tecidos. A galeria inclui 510 poses, três vídeos completos e comparação na mesma câmera com `791ed88`; os hashes das fontes são conferidos antes da publicação. Esses resultados documentam os defeitos reproduzidos e não equivalem a aprovação artística do catálogo.

Verificação da etapa de captura de movimento (`6f016c4`, 25/10/2026): os 34 personagens passaram no teste do catálogo, incluindo o lado correto dos calçados e a preservação da pose A. A amostragem densa de sete corpos passou com máximo de 5,632×, mantendo o limite de 6×. Apoio, direções, continuidade e exportação de clipes passaram. Sete personagens tiveram GLBs reimportados durante esta etapa; após o ajuste final dos canos, Vigilante e cacto grande foram repetidos, com controles e edição funcionando em desktop e celular.

Na correção das pernas, os 34 modelos passaram novamente; a amostragem densa de sete corpos ficou em até 5,931×, mantendo o mesmo limite de 6×. Os 27 bípedes e suas 19 calças padrão passaram nas seis poses de independência por personagem, com deslocamento zero na região testada da perna parada. Nico, Nana e Palhaço também passaram nas variações de peso −1 e +1. Quatro personagens tiveram GLBs reimportados nesta rodada; Nico, Nana e Palhaço foram repetidos após o limite final de folga, com controles e edição em desktop/celular válidos. Os três vídeos atuais foram decodificados e reproduzidos no navegador, com os hashes das fontes conferidos. Os ciclos completos e a comparação da mesma câmera foram inspecionados visualmente; ambas as galerias passaram nas larguras de 390 e 1280 px.

O teste histórico de cobertura mantém os mesmos 101 vértices anteriores da Nana; os outros sete modelos comparados não apresentaram falhas. A comparação com `6f016c4` confirma que esta correção não introduziu novos pontos sem cobertura. Essa pendência anterior não está contada como teste aprovado.
