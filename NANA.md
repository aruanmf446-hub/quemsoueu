# Nana — GLB recebido com rig, sem movimentos

[Abrir a Nana no Ateliê](https://aruanmf446-hub.github.io/quemsoueu/?personagem=nana_explorer).

A fonte enviada tem 48 juntas e nenhum clipe, porém quase todos os 13.706 vértices estavam ponderados somente no quadril. O esqueleto tinha matrizes inversas mas os nós não tinham TRS, e seu referencial estava girado em relação à geometria. A simples importação não articulava braços/pernas. O original está preservado em `assets/characters/sources/nana-explorer.glb`.

## Correção posterior — giro das pernas

O usuário relatou pernas revirando em movimento. O IK compartilhado encontrava joelho/tornozelo, mas alinhava o eixo local do osso sem conservar sua rotação de vínculo. Na Nana, cujo repouso Mixamo tem meia-volta no osso, essa escolha introduzia um giro axial e mudanças bruscas perto da perna estendida. As amostras esparsas de geometria finita da primeira rodada não verificavam isso.

`src/mixamo-leg-ik.js` conserva o resultado posicional da IK e aplica o alinhamento a partir das rotações de autoria da coxa/canela. O solver procedural compartilhado, as capturas CMU, o arquivo GLB e os pesos da Nana não mudaram. Perfil `mixamo-cmu-v3-roll`; import map e módulo de importação usam `nana-pernas-1` para evitar clipes antigos em cache.

`node tests/nana-pernas.mjs` verifica um caso sintético em torno da perna estendida, alvos/roll, 3.065 amostras nos cinco clipes a 120 Hz, comprimentos e emendas dos loops. Maior mudança angular medida caiu de aproximadamente 43,34° para 3,914° por 1/120 s; erro relativo máximo dos comprimentos: 0,00000107. Não elevar os limites dos testes de estiramento ou esconder a pele para corrigir essa rotação.

Os testes de rig, navegador/exportação e regressão da arqueira são repetidos após essa correção. O teste geométrico passou com maior estiramento de 3,220× e piso mínimo −0,0000253 unidade original. A validação técnica continua distinta de aprovação artística.

## Preparação feita localmente

A cópia usada no jogo conserva exatamente posições, normais, UVs, índice de 19.610 triângulos e JPEG da fonte. O vínculo foi reconstruído na orientação da geometria, inclusive através dos nós intermediários dos dedos sem influência própria. Os 48 joints foram conservados.

O cálculo de calor do Blender falhou na superfície aberta original. Uma cópia volumétrica temporária, voxel de 0,007 unidade, forneceu pesos em 26.928 dos 27.000 vértices do proxy. Quatro vizinhos válidos transferem os pesos ao original, com no máximo quatro influências normalizadas. O proxy nunca aparece no jogo. Distância mediana de transferência: 0,00261; maior distância: 0,01643 (altura original = 1). Cabeça/cabelo recebem uma transição específica acima do pescoço, evitando que os ombros puxem o rosto. Existem 22 juntas com influência significativa.

Os pesos são automáticos. Esta rodada não equivale a uma pintura manual acabada, a um teste de colisões em todos os quadros ou a aprovação artística.

## Movimentos e editor

`src/mixamo-motions.js` adapta os cinco movimentos CMU/cgspeed já usados no jogo às direções, palmas, pose de vínculo e comprimentos desta malha. IK conserva os comprimentos das pernas; amostras reais das solas controlam o apoio. O bake gera trilhas de quaternions e posição do quadril a 30 Hz, sem reesculpir vértices, repintar textura ou alterar escalas/comprimentos dos ossos. A fonte e o arquivo preparado continuam sem clipes armazenados; o carregamento gera os cinco localmente e a exportação os inclui.

O editor oferece altura proporcional, vistas, movimentos, velocidade, pausa, posição, esqueleto e exportação. Prévias no Worker carregam a mesma malha sem gerar clipes desnecessariamente. A arqueira conserva suas três animações nativas e seu binário original. As outras 32 identidades continuam no caminho procedural.

Troca de roupas/cabelo, peso/músculo e expressões faciais ainda exigem preparação modular/morphs. Nenhum serviço externo, crédito Tripo ou geração Mixamo foi utilizado. Créditos dos movimentos em `assets/motions/PROVENANCE.md`.

## Verificações

- `node tests/nana-rig.mjs`: fonte/cópia comparadas; pesos normalizados, 48 juntas, cinco clipes, 45 poses amostradas. Maior razão de estiramento das arestas maiores que 0,003: 4,121×, sob o limite de 6×. Menor piso: −0,0000323 unidade original. A mão move 0,447 unidade em relação ao quadril; não permanece presa à pose T.
- `node tests/nana-importada.cjs` (servidor 8000): controles, alturas sem reinício, cinco clipes/48 juntas/13.706 vértices no GLB, reimportação e comparação da mesma pose sem diferença nesta execução, Worker e captura mobile. GLB exportado medido: 2.030.340 bytes.
- `node tests/modelos-importados.cjs`: regressão da arqueira, recuperação de falha e retorno ao gerador procedural.

Capturas e relatórios em `renders/nana-glb/` ou na pasta informada por `ATELIE_RENDERS`. Os resultados técnicos não encerram a pendência de aprovação no README.

## Reprodução da preparação

Requer Three.js, Node, Blender 4.3.2, Python com NumPy/SciPy. Execute na raiz do repositório:

```sh
node scripts/preparar-rig-nana.mjs assets/characters/sources/nana-explorer.glb /tmp/nana-vinculo.glb
blender -b --python scripts/pesar-nana.py -- /tmp/nana-vinculo.glb /tmp/nana-pesos.json
python scripts/transferir-pesos-nana.py assets/characters/sources/nana-explorer.glb /tmp/nana-vinculo.glb /tmp/nana-pesos.json /tmp/nana-preparada.glb /tmp/nana-relatorio.json
```

Não sobrescrever a fonte. As medidas de cabeça/pescoço são específicas da Nana; não aplicar esse perfil automaticamente a personagens com outra anatomia. Cada próximo GLB precisa ter seus pesos e seu vínculo verificados antes de receber os movimentos.
