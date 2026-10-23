# Identidades de Nana, Nico e Vigilante — rodada reprovada

**Situação:** `c2baedb` foi reprovado pelo usuário: roupas, rosto e aparência distantes das referências. As descrições abaixo registram a tentativa anterior e não representam aprovação visual. A revisão posterior inclui corpo e figurino; veja `REVISAO-PERSONAGENS-COMPLETOS.md`.

## Pedido e escopo

O usuário anexou três pranchas nesta conversa: Nana, Nico e o par Padeiro/Vigilante. Pediu corrigir a identidade desses três, que não se pareciam com os personagens desejados. Esta rodada parte de `5c8c2a3` e altera Nana, Nico e Vigilante, com atualização do Padeiro por ser a mesma pessoa na referência e no modelo. Os outros 30 visuais são preservados.

## Direção por personagem

- **Nana:** rosto mais oval, olhos amendoados e sobrancelhas mais próximas dos olhos; redução do volume infantil das bochechas. Rabo alto lateral, com cachos em cascata atrás da orelha, mecha clara e acentos violetas em materiais próprios. Visor com maior curvatura lateral, aro fino e azul mais próximo da prancha. A mecha clara mantém sua cor ao tingir o cabelo principal.
- **Nico:** olhos e distância entre eles equilibrados, sobrancelhas mais próximas dos olhos e base do rosto mais cheia. Mechas curtas sobrepostas com volumes e direções diferentes; castanho mais escuro. Armação redonda escura e goggles posicionados mais alto e inclinados sobre o cabelo.
- **Vigilante:** rosto de jovem adulto, com bochechas menos largas, olhos menores, nariz mais estreito e contorno mais definido. Mantém exatamente a mesma anatomia do Padeiro. O capuz tem ponta projetada para a frente, bordas em tom ferrugem e costura; a máscara cobre o nariz e acompanha o queixo sem marcar os lábios. As orelhas ficam ocultas enquanto o capuz está equipado e reaparecem ao retirá-lo.

A intervenção é em anatomia, cabelo e acessórios reais. Iluminação, exposição, corpos e figurinos foram preservados. Não há retratos substituindo os modelos. Prévias: `menu-v20-nana-nico-vigilante`.

## Conferência

A primeira versão do cabelo ainda conservava a aparência de coque da Nana e franjas rígidas. Os ensaios com cachos curtos em C repetidos também foram descartados. A versão entregue usa grupos de mechas com caimento próprio e um volume lateral em cascata na Nana. Os ensaios de máscara plana foram substituídos por uma superfície curva até o queixo.

Base imutável: `/workspace/outputs/tres-referencias-base-5c8c2a3`. Capturas e relatórios locais: `renders/tres-referencias/`. O antes da comparação é a vista 3/4 de `5c8c2a3`. Os quatro alvos foram recapturados com e sem cabelo, em vários ângulos, e em sorriso/surpresa. As 30 comparações preservadas reutilizam as capturas da base; a igualdade dos visuais foi verificada contra os geradores atuais. A galeria abre com Nana, Nico, Vigilante e Padeiro, mantendo os 34 personagens disponíveis.

## Validação

- Quatro geometrias faciais alteradas contra a base; os outros 30 rostos preservados.
- Comparação dos 30 visuais restantes: parâmetros de aparência, atributos de malha, transformações, visibilidade e propriedades dos materiais iguais à base.
- Modelos reais dos quatro alvos: atributos finitos, normais unitárias e UV/tangentes dos materiais de fios. Mechas clara/violeta da Nana presentes; armação própria do Nico presente; ocultação/restauração das orelhas testada ao trocar o capuz.
- Testes do catálogo, encaixe dos óculos, continuidade dos lábios, queixos, pescoço e identidade compartilhada Padeiro/Vigilante passaram.
- Quatro GLBs com 12 clipes; mapas, UVs e tangentes preservados. Três Workers e recoloração pelo controle real passaram.
- Galeria com 34 personagens, 136 imagens, prioridade dos quatro alvos, abas, busca e celular válidos.

Os modelos continuam sendo uma aproximação procedural das pranchas; esta rodada não deve ser apresentada como reprodução fiel da qualidade cinematográfica. A aprovação estética das novas identidades depende da avaliação do usuário. Falhas antigas de abertura da boca em certas expressões não são resolvidas por esta rodada.
