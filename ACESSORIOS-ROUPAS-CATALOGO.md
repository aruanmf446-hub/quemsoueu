# Acessórios e roupas do catálogo

Continuação autorizada após o elogio à revisão de cabelos e barbas `4b9b16f`. Rostos, proporções corporais, penteados e barbas foram preservados.

## Alterações

- Fivelas compartilhadas com rolete e lingueta, mantendo o vão da correia e os chanfros do quadro. A mudança chega também aos equipamentos das criaturas.
- Pedras lapidadas com cintura de espessura própria, assento com parede e borda metálica, além das garras existentes. Coroas, joias de testa e brincos mantêm suas identidades e cores selecionáveis.
- Argolas e brincos com seção mais suave; argolas com fecho. Óculos mantêm as medidas contra o rosto e recebem dobradiça com placa, parafuso e fenda.
- Cintos de couro com debrum e pontos reais acompanhando a superfície. O piloto que alcançava os braços foi descartado; a projeção usa o campo do cinto, que exclui mãos e mangas.
- Mapas de albedo, relevo e rugosidade estendidos às famílias de figurino e aos tecidos/couros do equipamento das criaturas. O tingimento e os slots continuam editáveis.

Não foi feita alteração de iluminação, exposição, rostos ou queixos.

## Comparação

[Galeria do catálogo](revisao/acabamentos/): 34 pares em 3/4 e oito representantes com corpo inteiro em 3/4 e costas, mais um close do cinto da Nana, totalizando 102 imagens. As câmeras são conferidas numericamente antes da publicação.

Base: `/workspace/outputs/aprovado-4b9b16f`. Capturas finais em `renders/acabamentos-catalogo/`; os ensaios em `piloto/` não são a entrega. As vistas faciais anteriores são as capturas finais de 4b9b16f; os oito corpos anteriores foram capturados no código dessa base.

## Verificação

`tests/acabamentos-catalogo.mjs` verificou 714 peças dos figurinos padrão: atributos, índices, mapas/UVs, troca de cores, independência de slots e preservação da pele. O teste inclui o limite do cinto da Nana para impedir que a costura volte a alcançar os braços. Os testes de folga passaram em quatro tipos físicos e no vestuário de sereia. Os óculos passaram em 240 amostras sobre cinco rostos.

`tests/qualidade-pelos-acessorios.mjs` confirmou os 34 rostos preservados e verificou 17 penteados, 21 acessórios e cinco modalidades de barba. Os dez GLBs passaram na validação de mapas, UV1 e 12 animações cada, incluindo roupas e acessórios. As cinco prévias verificadas no Worker também passaram. A galeria passou em desktop e celular, incluindo busca e abertura dos detalhes de corpo inteiro. Testes técnicos não substituem a avaliação visual.

Cache de miniaturas: `menu-v25-ferragens-costuras-catalogo`.
