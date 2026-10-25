# Fontes de movimento humano

Os dados de movimento vêm do CMU Graphics Lab Motion Capture Database, convertidos de ASF/AMC para BVH por Bruce Hahne (cgspeed, versão MotionBuilder-friendly de 2010). Nenhuma geometria de personagem foi importada.

A fonte imutável usada nesta revisão é o espelho `una-dinosauria/cmu-mocap`, commit `09a07f54f3bbb58797325f009282d0b2048a2871`:

- Termos: https://github.com/una-dinosauria/cmu-mocap/blob/09a07f54f3bbb58797325f009282d0b2048a2871/READMEFIRST.txt
- Índice de clipes: https://github.com/una-dinosauria/cmu-mocap/blob/09a07f54f3bbb58797325f009282d0b2048a2871/cmu-mocap-index-text.txt
- Banco original: http://mocap.cs.cmu.edu/

## Permissão de uso

A seção `USAGE RIGHTS` do README que acompanha a conversão diz:

> CMU places no restrictions on the use of the original dataset, and I (Bruce) place no additional restrictions on the use of this particular BVH conversion.

O mesmo documento reproduz a permissão original do CMU:

> Use this data! This data is free for use in research and commercial projects worldwide.

Crédito solicitado pelo projeto original:

> The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

## Clipes usados nesta revisão

| Uso | Arquivo original | Descrição do índice | Trecho usado | Duração no editor |
| --- | --- | --- | --- | --- |
| Lobby | `data/111/111_28.bvh` | Standing still | 9,333–13,333 s | 6 s |
| Derrota | `data/079/79_71.bvh` | sad | 0,100–4,600 s | 4,5 s |
| Vitória | `data/079/79_69.bvh` | very happy | 0,633–6,633 s | 6 s |
| Macarena | `data/143/143_35.bvh` | Macarena Dance | 0,300–4,300 s | 4 s |
| Dança retrô | `data/015/15_04.bvh` | dance — Egyptian walk, the Dive, the Twist, the Cabbage Patch | 117,133–122,067 s | 5 s |

O clipe `15_04` também contém ações fora da dança, como lavar janelas, sinais com as mãos e boxe. O trecho selecionado está na sequência de dança solo, com movimentos circulares dos braços, inclinação do tronco e pulsação dos joelhos. O nome público é **Dança retrô**, sem atribuir uma dança específica a uma marcação temporal que o índice original não fornece.

As opções `140_06` (Idle), `141_20` (Waiting), `141_27` (Mope), `60_01` (salsa) e `85_04` (FancyFootWork) foram investigadas e descartadas. O Idle estava agachado; Waiting e Mope percorriam distâncias grandes para um emote; a salsa dependia da postura de um parceiro; FancyFootWork exigia poses acrobáticas. Os dados finais usam espera e desânimo quase estacionários e dança solo.

Os arquivos originais têm uma pose T artificial no quadro 0. Ela deve ser descartada na reprodução. Os quadros seguintes foram capturados a aproximadamente 120 Hz. Na adaptação, pode-se reamostrar a 30 Hz, normalizar a orientação/translação e fechar ciclos por mistura no final. Os nomes legados de IDs podem ser preservados por compatibilidade, mas os rótulos precisam indicar os movimentos reais.

O CMU não capturou os movimentos individuais de dedos e polegares: o README explica que seus canais foram acrescentados por conveniência de edição e devem ser ignorados. Os movimentos não contêm áudio nem geometria humana.

## Dados usados no editor

`scripts/importar-mocap.mjs` converte os trechos para `src/mocap-data.js`. As durações públicas são 6 s de espera, 4,5 s de derrota, 6 s de comemoração, 4 s de Macarena e 5 s de Dança retrô. Os IDs legados `dance_floss` e `dance_shuffle` correspondem agora a Macarena e Dança retrô; os rótulos da interface indicam os movimentos reais.

As posições usam o comprimento médio das pernas da captura. A raiz corresponde à média das articulações das coxas, permitindo adaptar a posição do quadril às proporções dos personagens. Os braços têm direções anatômicas e orientações capturadas; os metadados `restDirections` registram as direções de repouso usadas para adaptar o movimento aos segmentos diagonais de cada corpo. Isso permite conservar a torção do braço, além de apontar o cotovelo e o punho para as direções corretas. Orientações de mãos usam apenas a captura dos punhos. As posições dos dedos/polegares na pose T servem somente para definir a base estática das mãos; seus canais de animação não são reproduzidos.

Os ciclos recebem uma mistura de 0,35 s entre o fim e o começo avançando, para fechar pose e velocidade. As reações desaceleram nos últimos 0,28 s. Há um filtro simétrico de sete quadros nas orientações distais e cinco na cabeça para reduzir ruído de marcadores. As quatro orientações dos braços recebem média uniforme de nove quadros, sem atraso temporal. Depois desse filtro, a orientação é projetada novamente sobre a direção capturada de cada segmento: isso suaviza a torção instável perto do cotovelo reto sem mudar as direções do gesto. As trajetórias dos contatos permanecem iguais. Os quadros são gravados a 30 Hz, com cinco casas decimais. Metadados registram a URL imutável e o SHA-256 de cada BVH original.

Para converter novamente, obtenha os cinco BVHs das URLs `sourceURL` registradas nos metadados e salve-os em uma pasta com os nomes `cmu-111_28.bvh`, `cmu-79_71.bvh`, `cmu-79_69.bvh`, `cmu-143_35.bvh` e `cmu-15_04.bvh`. Com a dependência Three.js disponível no projeto, execute `node scripts/importar-mocap.mjs CAMINHO_DA_PASTA`. Os arquivos BVH originais não são carregados pelo jogo.
