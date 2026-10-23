# Auditoria de acessórios, cabelos e barbas

Base: `8d4acea`, aprovada pelo usuário. A anatomia facial fica preservada; a revisão trata dos acessórios e dos pelos.

## Prioridades identificadas

- Nana: visor com contorno de arame, hastes frágeis e pouco recorte para o nariz.
- Nico: armação e apoios dos óculos; lentes e acabamento dos goggles.
- Artífice: engrenagem do monóculo encobrindo a maior parte do olho; corrente sem elos.
- Vigilante: máscara retangular, afastada do contorno do rosto.
- Rei e Rei pimentão: pérolas da coroa deslocadas em relação às pontas.
- Rei, Anão, Orc, Arqueiro e Guarda veterano: barba como uma casca uniforme, borda rígida e cor descendo no pescoço.
- Masculino suave: barba curta esparsa, dependente da pintura.
- Artífice e Rei pimentão: bigode e cavanhaque com aparência de peça lisa.
- Cabelos: espessura muito uniforme e base espessa, especialmente nos cortes curtos, presos e em mechas torcidas.

## Catálogo conferido

| Personagem | Cabelo | Barba | Acessórios padrão |
| --- | --- | --- | --- |
| Feminino suave | long_wavy | nenhuma | tiara, drop, tikka, flowers |
| Masculino suave | short | curta | Nenhum |
| Rei | royal | volumétrica | crown, drop |
| Cute arredondado | bun | nenhuma | studs |
| Feminino intenso | long_curly | nenhuma | drop, tikka, coral |
| Alquimista vilão | swept | nenhuma | bubbles |
| Anão aventureiro | long_braids | volumétrica | Nenhum |
| Palhaço triste | clown | nenhuma | tophat |
| Nana exploradora | lunar_curls | nenhuma | visor, hoops |
| Guardiã da Lua | court_waves | nenhuma | moon_crown, drop |
| Nico inventor | short_curls | nenhuma | glasses, goggles |
| Feiticeira rubi | hero_halfup | nenhuma | moon_crown, drop, tikka |
| Guardião da chama | hero_tousled | nenhuma | Nenhum |
| Paysandu | none | nenhuma | wolf_kit |
| Corvo rubi | none | nenhuma | raven_kit |
| Orc guerreiro | topknot | volumétrica | Nenhum |
| Cacto pistoleiro | none | nenhuma | cowboy |
| Rei pimentão | none | bigode/cavanhaque | crown |
| Pimenta bandida | none | nenhuma | Nenhum |
| Robô bolinha | none | nenhuma | Nenhum |
| Arqueira da floresta | forest_pixie | nenhuma | studs |
| Arqueiro da floresta | forest_locks | volumétrica | Nenhum |
| Guarda feminina | forest_pixie | nenhuma | Nenhum |
| Guarda jovem | hero_tousled | nenhuma | Nenhum |
| Guarda veterano | hero_veteran | volumétrica | Nenhum |
| Artífice da floresta | forest_locks | bigode/cavanhaque | monocle |
| Princesa da floresta | court_waves | nenhuma | leaf_crown, drop, flowers |
| Cowboy do deserto | none | nenhuma | frontier_hat |
| Padeiro | short_curls | nenhuma | chef_hat |
| Vigilante | short_curls | nenhuma | vigilante_hood |
| Soldado cacto | none | nenhuma | guard_helmet |
| Soldado cacto grande | none | nenhuma | guard_helmet |
| Feneco do deserto | none | nenhuma | fennec_saddle |
| Cowboy no feneco | none | nenhuma | fennec_rider |

## Alterações

Aros e filigranas usam seção metálica lisa, sem os sulcos do gerador de fios. Óculos recebem aro mais definido, apoios, articulações e terminais das hastes. Goggles ganham lentes próprias e a correia deixa de atravessar o campo das lentes. Os apoios nasais dos óculos usam material translúcido e encostam na superfície medida do nariz. O visor recebe armação azul, haste com apoio e recorte inferior para o nariz. O monóculo conserva uma abertura ampla, lente clara e corrente de elos. A máscara passa a acompanhar nariz, bochechas e queixo com acabamento das bordas. As pérolas da coroa acompanham a inclinação real de cada ponta, recuperando seu encaixe.

A barba volumétrica passa a ter guias de caimento e pontas livres, com referências à superfície para conservar a animação. O primeiro ensaio com pequenas mechas repetidas em grade foi descartado. Bigode e cavanhaque recebem mechas secundárias; a barba curta recebe distribuição mais densa. A cor da barba cheia deixa de pintar a parte inferior do pescoço. A geometria da pele, olhos, nariz e queixo não é alterada.

Os 17 penteados mantêm o estilo e as cores, com seção menos inflada, afilamento mais progressivo e cobertura de base mais fina. Sem alteração de luz, exposição, roupas ou proporções faciais. Prévias: `menu-v19-pelos-optica`.

## Validação

Validação concluída: 34 anatomias comparadas com a base, sem alteração de geometria. O teste de preservação conferiu 109 peças, atributos e morphs; a única exceção de cor é a retirada da barba pintada abaixo do limite do queixo. Os 17 penteados, 21 acessórios e cinco opções de barba passaram nas verificações de malha. Encaixe dos óculos: 240 amostras em cinco cabeças; lábios, queixos e pescoço também passaram.

As capturas cobrem os 34 visuais em 3/4. Oito barbas/bigodes foram recapturados também sem cabelo, de perfil e com sorriso/surpresa (16 poses); as outras 26 esculturas preservadas reutilizam a base. Cinco barbas cheias e as duas identidades com bigode/cavanhaque mantêm as diferenças próprias. O primeiro ensaio com pequenas mechas repetidas não é a versão entregue.

Onze GLBs (Nana, Nico, Artífice, Vigilante, Rei, Anão, Orc, Arqueiro, Guarda veterano, Rei pimentão e Masculino) preservam 12 clipes e os mapas, UVs e tangentes dos pelos. Quatro Workers e a recoloração pelos controles reais passaram. Nico foi recapturado, reexportado e conferido novamente no Worker após o refino final dos apoios nasais e da correia dos goggles. Relatórios em `exportacao/` e `exportacao-nico-final/`.

A comparação pública tem 34 personagens e 136 imagens e passou em desktop/celular, abas e busca, sem erros. Prévias `menu-v19-pelos-optica`. A avaliação técnica não representa aprovação estética nem equivalência às referências de cinema.
