# Cabelos e barbas de todo o catálogo

Esta é a rodada anterior. O usuário voltou a reprovar a qualidade do cabelo após `341259b`; veja a [reconstrução atual](RECONSTRUCAO-CABELOS.md). As barbas foram preservadas na reconstrução.

Revisão autorizada após a aprovação de `a2a9445`. Os rostos, proporções corporais, figurinos, acessórios e iluminação dessa versão foram preservados.

## Alterações

- Mechas com curvatura intermediária, seção abaulada e variação de largura ao longo do comprimento. As mechas de detalhe recebem fibras secundárias reais acompanhando seu fluxo.
- Nico, Padeiro e Vigilante mantêm seus cortes, com transição e afunilamento revistos nas mechas. O cabelo do Vigilante continua acomodado sob o capuz.
- Nana mantém o rabo cacheado e as mechas branca/roxa. Seus cachos variam em espessura, passo e raio das voltas.
- Barbas cheias recebem três camadas sobrepostas, com comprimentos variados e leve curvatura em direção ao queixo, reduzindo as faixas paralelas contínuas.
- Bigodes e cavanhaques recebem fibras secundárias mais finas; barbas por fazer têm distribuição mais densa e direções variadas.

A construção compartilhada atende os 17 estilos do editor. No visual padrão, 23 personagens têm cabelo e oito têm barba/bigode; são 24 personagens com algum desses pelos. Os outros dez continuam preservados, incluindo criaturas, robô e personagens sem cabelo/barba. Suas capturas nas três vistas foram comparadas pixel a pixel e permaneceram idênticas. Personagens sem cabelo ou barba continuam assim. Não foi feita alteração global de rostos ou queixos.

## Comparação e verificações

[Galeria dos 34 personagens](revisao/pelos/), com frente, 3/4 e costas; 204 capturas comparativas e 24 capturas das expressões da barba convertidas para WebP. Base imutável: `/workspace/outputs/aprovado-a2a9445`. Capturas originais em `renders/pelos-catalogo/`. As câmeras são comparadas numericamente antes de gerar a galeria.

`tests/qualidade-pelos-acessorios.mjs` compara os 34 rostos com a base e verifica 17 penteados, 21 acessórios e cinco modalidades de barba, incluindo normais, volumes fechados, UVs, tangentes, tingimento e adesão à pele durante sorriso, abertura da boca e beijo. A exportação passou em oito GLBs representando as famílias de cabelo/barba, com 12 animações cada. As cinco prévias verificadas no Worker também passaram. Os testes técnicos não substituem a avaliação visual do usuário.

Cache de miniaturas: `menu-v24-cabelos-barbas-catalogo`.
