# Nana — GLB recebido com rig, sem movimentos

[Abrir a Nana no Ateliê](https://aruanmf446-hub.github.io/quemsoueu/?personagem=nana_explorer).

A fonte enviada tem 48 juntas e nenhum clipe, porém quase todos os 13.706 vértices estavam ponderados somente no quadril. O esqueleto tinha matrizes inversas mas os nós não tinham TRS, e seu referencial estava girado em relação à geometria. A simples importação não articulava braços/pernas. O original está preservado em `assets/characters/sources/nana-explorer.glb`.

## Revisão atual — mãos, corpo e rosto nas cinco animações

Após revisar os cinco movimentos, o usuário apontou mãos atravessando outras mãos, calças e rosto e punhos desalinhados. A adaptação agora usa o contorno da mão inteira medido nos vértices ponderados, incluindo dedos e polegar. Volumes convexos medidos no tronco e nas pernas consideram a roupa. As mãos contornam as pernas pela lateral anatômica correspondente; o gesto junto à cabeça passa ao lado dos óculos. Um corredor frontal protege a visibilidade dos olhos, mesmo quando a palma está fisicamente afastada da cabeça.

A correção atua somente nos seis canais de braço, antebraço e mão. O solucionador preserva comprimentos e a orientação de autoria, limita a flexão do punho e suaviza as curvas com filtro simétrico de nove amostras a 30 Hz. Depois do filtro, uma projeção limitada corrige contatos residuais, evitando que a interpolação corte o caminho por dentro da roupa. A máscara facial e as margens foram calibradas para a Nana; não constituem uma solução universal de colisão nem animação individual dos dedos.

Perfil `mixamo-cmu-v5-clearance`, módulos/import map `nana-contatos-1`. O GLB preparado continua sem clipes armazenados; o editor gera localmente os cinco movimentos, preservando a fonte enviada. Nenhum processamento pago foi utilizado.

Validação desta revisão:

- `node tests/nana-maos.mjs`: 65 trilhas fora dos braços idênticas à base aprovada `6656d93`, fonte/pesos com o mesmo SHA, 3.065 poses a 120 Hz, continuidade e emendas dos loops, alinhamento dos punhos medido nos vértices reais.
- `node tests/nana-contatos.mjs`: 13 poses de regressão; 770 poses e nove pares por pose (6.930 verificações de proximidade entre mãos, cabeça, tronco e pernas), usando uma grade espacial independente dos volumes do corretor; 1.535 poses a 60 Hz para conferir a região central dos óculos livre de mãos; regressão de arestas contra triângulos das mãos aos 3,3 s da dança retrô, nos dois sentidos.
- `node tests/nana-pernas.mjs` e `node tests/nana-rig.mjs`: rotação e comprimentos das pernas, deformação, apoio, geometria e textura originais.
- `node tests/nana-importada.cjs`: oito poses do GLB reaberto, incluindo rosto, pernas e os cinco movimentos, além de altura, Worker e interface mobile. `tests/modelos-importados.cjs` conserva a regressão da arqueira e a troca entre modelos importados/procedurais.

Uma auditoria adicional de arestas contra triângulos amostrou 770 poses e cinco pares por pose (3.850 verificações), sem cruzamentos detectados. As verificações amostradas não provam ausência de toda interseção entre triângulos ou oclusão em qualquer câmera. A comparação visual está em [revisao/nana-contatos/](revisao/nana-contatos/), com os cinco clipes completos a 24 fps e antes/depois no mesmo arquivo de vídeo. A avaliação artística continua pendente; a Nana não foi removida da fila do README.

## Histórico — primeiro ajuste no encontro das mãos

O usuário aprovou a correção das pernas e pediu um ajuste discreto na posição das mãos. Foram medidas sobreposições no lobby e na dança retrô. `src/mixamo-hands.js` aplica um pequeno afastamento quando as referências das palmas se aproximam, usando a orientação anatômica do tronco. A cadeia do braço mantém seus comprimentos e a orientação capturada da mão. A curva de correção é contínua e é aplicada depois do apoio das pernas.

A alteração atua somente nos encontros das mãos desses dois clipes. Derrota, vitória e Macarena conservaram todas as trilhas; não foi retirado o gesto de levar a mão ao rosto. O modelo, a textura e os pesos continuam com os mesmos hashes. Perfil `mixamo-cmu-v4-hands`; módulos/import map `nana-maos-1`.

`node tests/nana-maos.mjs` compara 83 trilhas com a referência aprovada `6656d93`, incluindo pernas, quadril e tronco. Nos três contatos medidos na geometria real, a distância entre os centros das mãos passou de 0,0136/0,0195/0,0121 para 0,0510/0,0593/0,0395 unidade original. Cada centro deslocou cerca de 0,020 a 0,028 nessas poses (altura nativa = 1). Há 1.322 amostras de continuidade a 120 Hz e conferência das emendas dos loops. Essas medidas não equivalem a uma simulação completa de contato dos dedos.

O navegador reabre o GLB e compara três poses: vitória e os contatos de lobby/dança retrô, sem diferença geométrica nesta execução. [Vídeos de antes/depois em close](revisao/nana-maos/) usam as mesmas câmeras e 24 fps, com os dois lados sincronizados no mesmo arquivo. Prévias, controle de altura e os testes das pernas continuam válidos. A avaliação visual permanece pendente no README.

## Correção posterior — giro das pernas

O usuário relatou pernas revirando em movimento. O IK compartilhado encontrava joelho/tornozelo, mas alinhava o eixo local do osso sem conservar sua rotação de vínculo. Na Nana, cujo repouso Mixamo tem meia-volta no osso, essa escolha introduzia um giro axial e mudanças bruscas perto da perna estendida. As amostras esparsas de geometria finita da primeira rodada não verificavam isso.

`src/mixamo-leg-ik.js` conserva o resultado posicional da IK e aplica o alinhamento a partir das rotações de autoria da coxa/canela. O solver procedural compartilhado, as capturas CMU, o arquivo GLB e os pesos da Nana não mudaram. Perfil `mixamo-cmu-v3-roll`; import map e módulo de importação usam `nana-pernas-1` para evitar clipes antigos em cache.

`node tests/nana-pernas.mjs` verifica um caso sintético em torno da perna estendida, alvos/roll, 3.065 amostras nos cinco clipes a 120 Hz, comprimentos e emendas dos loops. Maior mudança angular medida caiu de aproximadamente 43,34° para 3,914° por 1/120 s; erro relativo máximo dos comprimentos: 0,00000107. Não elevar os limites dos testes de estiramento ou esconder a pele para corrigir essa rotação.

[Comparação dos vídeos de vitória e dança retrô](revisao/nana-pernas/): mesma câmera, 24 fps e 528 quadros no total, com decodificação verificada. Os testes de rig, navegador/exportação e regressão da arqueira passaram após essa correção. O teste geométrico passou com maior estiramento de 3,220× e piso mínimo −0,0000253 unidade original. A validação técnica continua distinta de aprovação artística.

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
