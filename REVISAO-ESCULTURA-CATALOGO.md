# Revisão da escultura dos 34 personagens

A versão `acf8bc2` foi reprovada pelo usuário. Melhorar normais, UVs e exportação não resolveu os rostos genéricos nem os defeitos visíveis no jogo. Esta rodada muda a construção das formas, usando as referências como parâmetro de qualidade; não declara equivalência ao acabamento cinematográfico.

A iluminação, a exposição, os figurinos e as cores de cabelo escolhidas permanecem preservados. O rosto voltou ao escopo por solicitação explícita. Os testes antigos de igualdade da anatomia contra `37fadc2` pertencem à rodada anterior e não devem impedir esta revisão.

## Mudanças de construção

- Reesculpidos os 23 perfis humanoides: alturas do loft acompanham olhos, nariz e boca de cada identidade; terços inferiores mais compactos, narizes e maçãs com volumes próprios, contornos de mandíbula distintos.
- Corrigida a soma de ponte, ponta e asas do nariz que produzia uma cunha. Os dois lábios agora chegam à mesma superfície de repouso; a incisão profunda e os cantos pinçados foram suavizados.
- Pupilas e tamanho das íris respeitam cada identidade. As fibras e o colarete da íris usam sua paleta, eliminando a camada dourada fixa. Pálpebras compartilham as derivadas da superfície facial.
- Corrigida a sobreposição do corpo e do pescoço: a calota do corpo fica dentro da cabeça; a tampa inferior da cabeça fica dentro do corpo. Juntas, pivôs, ombros e controles de tipos físicos são preservados. Normais e oclusão do pescoço deixam de depender das diagonais irregulares da grade.
- Reconstruídos os 17 penteados com grupos principais e secundários. A linha do cabelo usa recorte interpolado; a cobertura tem UVs, tangentes e fibras. Cabelos longos têm seções convexas achatadas e ondas agrupadas; coques cacheados têm massa preenchida e irregular. Nico, Guardião da Chama e arqueira têm guias distintas, em vez da mesma franja com parâmetros ligeiramente diferentes.
- Óculos: aros sem cruzamento e distância medida contra o rosto completo; visor com casca curva fina e contorno contínuo; monóculo medido contra a superfície e lente com espessura.
- Companheiros: focinho, maçãs e arcadas mais integrados; nariz arredondado, tufos orientados e raízes enterradas na superfície. Removidas peças que atravessavam a testa. Máscara do corvo com recortes suaves. No robô, vidro fechado sem triângulos degenerados e filete geométrico contínuo no lugar da borda serrilhada por cores de vértice.
- Miniaturas: o mesmo gerador do visualizador continua sendo usado. O raster acompanha tamanho/proporção do cartão e densidade da tela (320–640 px), incluindo cartões quadrados no celular; o cache distingue dimensões. Isso melhora a definição e o aproveitamento da área dos cartões, sem substituir a escultura. O CSS já preservava a proporção por `object-fit: contain`.

## Revisão por personagem

| Personagem | Construção revisada |
| --- | --- |
| Feminino suave | Queixo curto em coração, maçãs cheias, olhos mais abertos, nariz curto e lábios contínuos; ondas em camadas. |
| Masculino suave | Mandíbula larga com transição arredondada, terço médio compacto e ponte nasal definida; corte curto em volumes. |
| Rei | Mandíbula pesada, pálpebras de maturidade, ponta nasal larga e barba acompanhando a pele; cabelo real em camadas. |
| Cute arredondado | Face curta e redonda, maçãs amplas, pupilas grandes e nariz pequeno; coque reconstruído. |
| Feminino intenso | Contorno mais afilado, maçãs largas, olhos inclinados e lábios cheios; cachos em grupos. |
| Alquimista vilão | Mantido rosto comprido e estreito, mas com nariz fundido à face, boca sem pinçamento e olhar próprio; cabelo para trás. |
| Anão aventureiro | Face larga e compacta, nariz arredondado volumoso, maçãs e sorriso próprios; cabelo e tranças reconstruídos. |
| Palhaço triste | Maçãs redondas, olhos caídos distintos, boca triste com superfície contínua; cachos laterais sobre massa preenchida. |
| Nana exploradora | Face larga e curta, nariz mais amplo e lábios mais cheios; coque cacheado preenchido/irregular, raízes sobre o couro cabeludo e visor curvo. |
| Guardiã da Lua | Face em coração, nariz curto, íris castanha e olhar mais aberto; ondas achatadas e agrupadas. |
| Nico inventor | Face infantil compacta, pupilas grandes e castanhas, nariz curto, óculos ajustados; cachos curtos em S com submechas. |
| Feiticeira rubi | Queixo afilado, olhos inclinados, nariz e boca assimétrica próprios; ondas e coque irregular. |
| Guardião da chama | Mandíbula forte e curta, ponte nasal mais definida e olhos próprios; topete elevado com fluxo lateral. |
| Paysandu | Focinho, arcada e maçãs integrados; nariz arredondado, raízes de pelagem enterradas, sem fragmentos na testa. |
| Corvo rubi | Recortes da máscara suavizados, plumagem de cabeça/peito/costas assentada na superfície, raízes escondidas. |
| Orc guerreiro | Mandíbula muito larga, nariz baixo e amplo, lábio inferior cheio e arcada pesada; coque reconstruído. |
| Cacto pistoleiro | Curvatura do vegetal, abertura das pálpebras e proporção das íris revistas, preservando olhar sonolento. |
| Rei pimentão | Gomos e curva da cabeça refinados, olhos maiores e pálpebras envolventes, preservando bigode/cavanhaque. |
| Pimenta bandida | Curva do vegetal e olhos mais abertos; boca aberta e suas expressões preservadas e revalidadas. |
| Robô bolinha | Tela curva com avesso/parede e centro sem triângulos de área zero; borda contínua e encaixes chanfrados. |
| Arqueira da floresta | Face curta, maçãs altas, queixo pequeno, olhos inclinados e sorriso próprio; corte assimétrico com trança exposta. |
| Arqueiro da floresta | Face oval, mandíbula mais estreita, nariz e sorriso próprios; mechas torcidas reconstruídas. |
| Guarda feminina | Mandíbula mais cheia que a arqueira, maçãs largas e olhar distinto; corte em camadas. |
| Guarda jovem | Queixo mais largo, bochechas mais cheias e sorriso jovem; topete próprio. |
| Guarda veterano | Terço inferior mais longo que o jovem, arcada pesada e pálpebras baixas; corte de veterano e barba acompanhando expressões. |
| Artífice da floresta | Face estreita, ponte nasal mais longa e sorriso assimétrico; mechas torcidas e monóculo afastado da pele. |
| Princesa da floresta | Face jovem e curta, maçãs arredondadas e olhos mais abertos; ondas reconstruídas. |
| Cowboy do deserto | Curva do cacto e olhos/pálpebras próprios, preservando sobrancelhas e sorriso assimétrico. |
| Padeiro | Face larga e compacta, bochechas cheias, nariz arredondado e sorriso próprio; cachos reconstruídos. |
| Vigilante | Compartilha a escultura do padeiro por ser a mesma identidade; conserva capuz/máscara. |
| Soldado cacto | Coluna e cúpula suavizadas, olhos e pálpebras envolvidos, preservando expressão militar. |
| Soldado cacto grande | Cabeça larga própria, arcada mais pesada e abertura ocular diferente do soldado menor. |
| Feneco do deserto | Focinho/arcada integrados, nariz arredondado, tufos mais curtos e raízes enterradas. |
| Cowboy no feneco | Mesmas correções do feneco e do cowboy, preservando a identidade compartilhada da montaria e do cavaleiro. |

## Comparação e validação

Referência imutável: `/workspace/outputs/escultura-referencia-acf8bc2`. Capturas locais em `renders/reconstrucao/`, com câmera e luz iguais por personagem. A galeria pública é gerada por `python3 tests/galeria-reconstrucao.py`: `revisao/index.html`, com versões com cabelo e de escultura facial. As imagens são capturas do visualizador, comprimidas em WebP; não são imagens geradas para substituir os modelos 3D.

A verificação contra a referência confirmou alteração das 34 malhas de rosto/tela e preservação das skins compartilhadas. Passaram a continuidade labial dos 23 perfis, as pálpebras dos 29 humanos/vegetais, o sorriso na região nasal e a boca da pimenta; 29 corpos mantiveram juntas, encaixe e controles. Os testes de pescoço reproduzem a sobreposição antiga e verificam o novo encaixe. Os testes de óculos amostram os aros reais por raios contra a face. Os companheiros verificam raízes escondidas, volumes fechados e pálpebras; o robô não tem mais triângulos degenerados na tela. Normais e costuras dos 17 penteados também passaram.

Capturas finais concluídas: três vistas dos 34 personagens, vistas extras de comprimento e expressões; mais frente/três quartos/perfil/escultura e três expressões por personagem sem cabelo. Os 34 GLBs passaram com mapas, UVs/tangentes e 12 clipes nos animados (zero no robô). Seis prévias de expressão no Worker passaram, incluindo Nico e Nana após o ajuste das lentes. O menu real passou nos 34 cartões com DPR 2, trocas rápidas, recuperação após falha e as quatro famílias no celular. A comparação pública passou na busca, troca de abas, carregamento das 136 imagens e layout móvel. Relatórios em `renders/reconstrucao/{menu,exportacao}/relatorio.json` e `galeria-verificacao.json`.

A revisão visual cobriu todos os rostos e personagens completos, além de closes em resolução de sombras de produção para Nico e Guardiã. Há avanço na construção, mas o acabamento ainda fica abaixo das referências. Não tratar estas verificações como aprovação estética.
