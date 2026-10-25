# Movimentos compartilhados

A coreografia procedural de `7444526` foi reprovada. A biblioteca atual usa captura de movimento humano do CMU/cgspeed, adaptada às medidas de cada personagem. As skins, rostos e geometrias de autoria permanecem iguais. [Fonte, licença e créditos](assets/motions/PROVENANCE.md).

Abra **Animações → Reações e danças** no editor. Há reprodução, pausa, velocidade, barra de tempo e visualização do esqueleto. **Parar / pose A** restaura a pose de edição. [Revisão dos movimentos](revisao/movimentos/).

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

- [Nico — Macarena](https://aruanmf446-hub.github.io/quemsoueu/?v=mocap-1&personagem=nico_inventor&animacao=dance_floss)
- [Nana — dança retrô](https://aruanmf446-hub.github.io/quemsoueu/?v=mocap-1&personagem=nana_explorer&animacao=dance_shuffle)
- [Vigilante — vitória](https://aruanmf446-hub.github.io/quemsoueu/?v=mocap-1&personagem=bread_vigilante&animacao=victory)

## Adaptação ao rig

`src/mocap-data.js` contém somente dados de movimento, reamostrados a 30 Hz; o jogo não baixa BVHs nem modelos externos. `scripts/importar-mocap.mjs` reproduz a conversão dos cinco arquivos originais, cujas URLs imutáveis e hashes estão nos metadados. A pose T artificial foi descartada. Fontes que caminhavam pelo cenário e salsa com parceiro foram substituídas por espera, desânimo e dança solo que ficam perto do lugar inicial.

`src/mocap-player.js` interpola posições por curvas cúbicas e orientações por SQUAD. Os ciclos fecham com mistura entre o fim e o início; as reações desaceleram antes da pose final. A torção dos braços recebe um filtro simétrico, seguido de projeção sobre a direção capturada, para retirar ruído sem mudar a direção dos gestos.

`src/body-rig.js` mantém 22 ossos comuns. As orientações capturadas dos braços são calibradas pelas direções de repouso de cada corpo, em vez de aplicar os mesmos Euler globais a segmentos diagonais diferentes. Mãos recebem orientação anatômica própria. A raiz e os alvos dos pés usam o comprimento das pernas; a altura da pelve se adapta para que ambos os pés alcancem os alvos sem esticar os ossos. A IK conserva o plano de flexão dos joelhos. As trajetórias incluem passos e pivôs reais, não exigem que todo pé permaneça na âncora inicial.

Os pesos contínuos e os componentes rígidos de [CORRECAO-RIG.md](CORRECAO-RIG.md) foram mantidos e corrigidos onde a captura revelou falhas: a seção de quadril não afunila artificialmente nos glúteos, a união central das coxas acompanha a pelve e cabeça/pescoço deixam de influenciar os ombros externos. A sola e os dedos do pé acompanham o mesmo osso do calçado, com transição suave no tornozelo, para a pele não sair da bota. O cano flexível acompanha a perna; solas, placas e pequenos enfeites mantêm vínculos rígidos onde não atravessam uma articulação.

Quando as duas botas fazem parte de uma única superfície conectada, cada lado recebe o seu osso Foot. Usar o centro do componente prendia as duas botas ao mesmo pé. Enfeites individuais conservam o vínculo rígido da própria bota. O teste do catálogo verifica também o lado real dos vértices do calçado, além do movimento da sola de pele.

Os 34 personagens usam cinco perfis: bípedes, sereias, quadrúpedes, aves e robô flutuante. Bípedes executam os passos e gestos; sereias acompanham os gestos com a cauda. Aves, quadrúpedes e robô adaptam o ritmo à própria anatomia, com amplitudes menores. Não há simulação de tecido, navegação ou articulação individual dos dedos.

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
- `RIG_DENSE=1 RIG_IDS=nico_inventor,nana_explorer,bread_vigilante,dwarf_bard,cactus_soldier_large,sad_clown node tests/rig-corporal.mjs`: ciclos completos amostrados a cada 0,125 s.
- `node tests/apoio-pes.mjs`: alvos dos pés e direções dos braços, comprimentos dos ossos, sola e ator transformado antes/depois da vinculação. `FOOT_IDS` permite selecionar os corpos largos.
- `node tests/movimentos-compartilhados.mjs`: continuidade espacial e angular, emendas, acomodação final e clipes exportáveis.
- `node tests/direction-retarget.mjs` e `node tests/leg-ik.mjs`: direções anatômicas e IK, incluindo proporções e transformações distintas.
- `node tests/animacoes-jogo.cjs`: controles em desktop/celular, edição durante animação e GLBs reimportados com `GLTFLoader` e reproduzidos por `AnimationMixer`.
- `node tests/capturar-mocap.cjs --full --neutral`: grava os movimentos reais a 24 fps para avaliação visual; materiais simplificados de revisão não alteram a produção.

Relatórios locais ficam em `renders/mocap/`. Testes técnicos não representam aprovação da qualidade artística; a revisão visual dos ciclos completos e a avaliação do usuário continuam necessárias.

Verificação de 25/10/2026: os 34 personagens passaram no teste do catálogo, incluindo o lado correto dos calçados e a preservação da pose A. A amostragem densa de sete corpos passou com máximo de 5,632×, mantendo o limite de 6×. Apoio, direções, continuidade e exportação de clipes passaram. Sete personagens tiveram GLBs reimportados durante esta etapa; após o ajuste final dos canos, Vigilante e cacto grande foram repetidos, com controles e edição funcionando em desktop e celular. Os três vídeos foram decodificados integralmente e reproduzidos no navegador, sem erros e sem transbordamento nas larguras de 390 e 1280 px. Os hashes do manifesto correspondem ao código usado nas capturas.
