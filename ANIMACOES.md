# Esqueleto corporal e animações compartilhadas

A vinculação inicial de 857cbdb foi reprovada por deformações. Os pesos contínuos e equipamentos rígidos de [CORRECAO-RIG.md](CORRECAO-RIG.md) foram mantidos. Após nova reprovação dos movimentos, as cinco coreografias passaram a usar poses por batida e apoio dos pés por cinemática inversa nos bípedes. [Vídeos completos de revisão](revisao/coreografias/).

Abra a produção e escolha **Animações → Reações e danças**. Selecione um movimento, troque de personagem para comparar e use Pausar, velocidade e a barra de tempo. **Mostrar esqueleto** exibe os ossos; **Parar / pose A** restaura a pose de edição. A exportação GLB inclui o rig corporal e os clipes, além do rig facial existente.

Links diretos:

- [Nico — Floss](https://aruanmf446-hub.github.io/quemsoueu/?v=coreografia-ik-1&personagem=nico_inventor&animacao=dance_floss)
- [Nana — Shuffle](https://aruanmf446-hub.github.io/quemsoueu/?v=coreografia-ik-1&personagem=nana_explorer&animacao=dance_shuffle)
- [Vigilante — vitória](https://aruanmf446-hub.github.io/quemsoueu/?v=coreografia-ik-1&personagem=bread_vigilante&animacao=victory)

## Biblioteca

| Movimento | Clipe GLB | Duração | Reprodução |
| --- | --- | --- | --- |
| Lobby | `Body_lobby` | 6 s | Contínua |
| Derrota | `Body_defeat` | 3,6 s | Uma vez; mantém a pose final |
| Vitória | `Body_victory` | 6 s | Uma vez |
| Floss | `Body_dance_floss` | 4 s | Contínua |
| Shuffle | `Body_dance_shuffle` | 4 s | Contínua |

São coreografias procedurais próprias com referências de movimentos sociais conhecidos, sem vídeo ou música embutidos. Todos usam a mesma fonte de movimento em `src/motions.js`; as medidas do corpo não são substituídas por um personagem padrão.

As poses têm interpolação Hermite com velocidade contínua nas emendas. No Floss, quadril e braços se contrapõem e alternam a passagem pela frente e por trás do quadril. O Shuffle alterna apoio e recolhimento do pé, com braços opostos. A vitória tem preparação, dois gestos de comemoração, passos e recuperação. Lobby e derrota usam movimentos menores, com atraso entre tronco e cabeça.

## Rig

`src/body-rig.js` monta 22 ossos comuns com prefixo `Rig_`: raiz, quadril, coluna, peito, pescoço, cabeça, braços/antebraços/mãos, coxas/pernas/pés/dedos dos pés e dois ossos de cauda. O rig facial continua independente, subordinado à cabeça corporal. Cabelos, barbas e acessórios do rosto acompanham esse conjunto.

O corpo e os figurinos recebem pesos por envelopes anatômicos compartilhados, em cópias das geometrias para proteger o cache de roupas. Pequenas peças metálicas recebem uma influência rígida para não amassar as joias. Trocas de físico, roupa e cores desmontam e reconstroem o vínculo, conservando o movimento selecionado. Parar restaura as posições originais; descartar o rig devolve as malhas originais e libera as cópias.

Os 34 personagens usam cinco perfis: bípedes, sereias, quadrúpedes, aves e robô flutuante. As articulações e os tempos são comuns; as amplitudes dos companheiros e do robô são adaptadas à anatomia. A sereia usa a cauda, o quadrúpede usa as patas dianteiras no papel dos braços, e o robô movimenta o casco. O cowboy montado acompanha a sela e mantém seu rig facial. O apoio vertical é corrigido por pontos de contato dos pés/patas/cauda conforme as proporções.

Nos bípedes, `src/leg-ik.js` calcula joelho e tornozelo a partir de alvos no espaço do personagem. O pé em apoio permanece no mesmo lugar enquanto o quadril se desloca; o pé livre segue uma trajetória suave. O deslocamento usa a largura corporal. As rotações das pernas são calculadas para os comprimentos reais de cada modelo; não se exige que um personagem baixo e um alto tenham os mesmos ângulos de joelho. Os outros perfis conservam sua adaptação por rotações e apoio vertical.

A pose A, as proporções, os rostos, os materiais e as geometrias de autoria foram preservados. Não foram adicionados ossos individuais de dedos das mãos, simulação de tecido ou locomoção com navegação; esta entrega fornece o rig corporal e cinco movimentos para avaliação no jogo. Dobras extremas e colisões de vestes longas ainda podem exigir refinamento artístico.

## Exportação e uso

Os GLBs dos personagens com rosto animável levam 17 clipes: os 12 faciais anteriores e cinco corporais. O robô leva cinco clipes corporais e mantém o rosto de tela no visualizador. Os nomes de ossos, as durações e os nomes dos clipes são estáveis. As translações e a solução das pernas são adaptadas ao tamanho de cada modelo; as rotações do tronco e braços são compartilhadas dentro de cada perfil anatômico. Os resultados da cinemática inversa são gravados nos clipes a 30 quadros por segundo; o jogo que importa o GLB não precisa executar o solver.

```js
const mixer = new THREE.AnimationMixer(gltf.scene);
const clip = gltf.animations.find(c => c.name === 'Body_dance_floss');
mixer.clipAction(clip).play();
// No loop de renderização: mixer.update(deltaSeconds).
```

API do editor: `window.__atelie.bodyRig()`, `playMotion(id)`, `pauseMotion()`, `seekMotion(segundos)`, `stopMotion()` e `motions`. O rig expõe `bones`, `skeleton`, `makeClips()`, `showSkeleton(on)`, `setSpeed(valor)` e `state()`.

## Validação

- `node tests/rig-corporal.mjs`: 34 personagens, 22 ossos, cinco clipes e cinco perfis. Pesos normalizados, índices válidos, pose A preservada, limite de estiramento, movimentos finitos, retorno à pose original, descarte e identidade das rotações compartilhadas de tronco/braços por perfil.
- `RIG_DENSE=1 RIG_IDS=nico_inventor,nana_explorer,bread_vigilante,dwarf_bard,cactus_soldier_large,sad_clown node tests/rig-corporal.mjs`: amostragem adicional a cada 0,125 s nos ciclos completos. A rodada desta revisão passou nos seis modelos, com máximo de 5,800× no limite existente de 6×. Os picos de vitória também fazem parte do teste padrão de todo o catálogo.
- `node tests/leg-ik.mjs`: 27 casos de alvos alcançáveis, limites, proporções, transformação do ator e preservação dos comprimentos dos ossos.
- `node tests/apoio-pes.mjs`: apoios e elevações dos pés de Nico, Nana e alquimista; inclui ator transladado, rotacionado e escalado.
- `node tests/movimentos-compartilhados.mjs`: continuidade de pose/velocidade, emendas de loops, acomodação final e continuidade dos clipes exportáveis.
- `node tests/animacoes-jogo.cjs`: controles de desktop/celular, pausa, tempo, esqueleto, mudança de físico/roupa/cor durante animação e GLBs reimportados com `GLTFLoader` e reproduzidos por `AnimationMixer`.
- Oito exportações únicas foram exercitadas nas rodadas de navegador: Nico, Nana, Rei pimentão, Paysandu, Corvo rubi, robô, sereia e cowboy montado. Os companheiros foram repetidos depois dos ajustes de enquadramento e acessórios.
- Artefatos locais em `renders/animacoes/`; relatórios de exportação originais e da rodada final em `exportacao.json` e `entrega/exportacao.json`. Testes técnicos verificam funcionamento; a qualidade artística dos movimentos permanece para avaliação do usuário.
- `node tests/capturar-coreografias.cjs --full`: vídeos completos de Nico/Floss, Nana/Shuffle e Vigilante/vitória em `revisao/coreografias/`, com poses determinísticas do rig real e resolução de revisão. Capturas e relatórios desta rodada ficam em `renders/coreografias/`.

Rodada de 24/10/2026: o teste atualizado do catálogo passou nos 34 personagens, incluindo os três picos da vitória. Solver, continuidade e apoio dos pés passaram. Cinco modelos foram exportados/reimportados e reproduzidos no navegador (Nana, Nico, Vigilante, Paysandu e sereia); Nana e Vigilante foram repetidos após ampliar os passos. Controles e edição durante animação passaram em desktop e celular de 390 px, sem erros de console. Os vídeos de revisão usam 480 px/8 fps e não representam a taxa de quadros do jogo.
