# Cabelos, barbas e acessórios — refinamento de qualidade

Referência técnica: `37fadc2`. As imagens enviadas pelo usuário servem como régua de qualidade de malha e textura; não são modelos para copiar. Nesta etapa ficam preservados os penteados, as identidades, o rosto, a iluminação e os figurinos existentes.

## Alterações

- Cabelos: mechas com avesso e bordas fechadas, tampas com UVs próprios, pontas contínuas e moldura que acompanha o fluxo sem saltos. Seções esculpidas, sulcos longitudinais e mapas de cor, normal e rugosidade de fibras, com brilho anisotrópico exportável. Fibras secundárias em geometria acompanham as mechas maiores. Os parâmetros dos 17 penteados permanecem iguais; no coque da Nana, o fluxo das raízes foi corrigido para ir do couro cabeludo ao coque, com as bases escondidas sob a cobertura. Camadas internas recebem menos subdivisões que a superfície visível.
- Barbas: superfície contínua sobre o volume original, com fibras orientadas e relevo discreto; pelos curtos na barba sombreada. Bigodes e cavanhaques conservam seus contornos e passam a usar volumes fechados e texturas de fibras, acompanhando expressões e mandíbula. A superfície da barba e os pelos curtos copiam os deltas e pesos dos vértices de origem da pele, evitando descolamento durante a animação.
- Acessórios: tubos fechados e mais suaves, parede na faixa da coroa, lentes curvas com espessura, aros e juntas dos óculos, correia com pesponto, assentos e garras das pedras, microtextura de metal/couro/tecido e anilhas vazadas com chanfros.
- Companheiros: pelagem e plumagem com UVs seguindo cada mecha, costuras suaves e materiais de fibras separados da superfície anatômica. Equipamentos mantêm seus desenhos. Corrigida também a classificação de materiais: “Pelagem” estava sendo reconhecida como pedra pela busca parcial por “gem”, deixando de receber a microtextura.
- Prévias: cache atualizado para não reapresentar as imagens antigas.

## Catálogo conferido

| Personagem | Penteado existente | Barba escolhida | Acessórios existentes |
| --- | --- | --- | --- |
| Feminino suave (`feminine_soft`) | Longo ondulado | default | Tiara, Brinco gota, Joia de testa, Flores |
| Masculino suave (`masculine_soft`) | Curto | default | Nenhum |
| Rei (`old_king`) | Real | full | Coroa, Brinco gota |
| Cute arredondado (`cute_round`) | Coque | default | Ponto de luz |
| Feminino intenso (`feminine_bold`) | Cachos volumosos | default | Brinco gota, Joia de testa, Coral |
| Alquimista vilão (`alchemist_villain`) | Para trás | default | Coroa de bolhas |
| Anão aventureiro (`dwarf_bard`) | Longo com tranças | default | Nenhum |
| Palhaço triste (`sad_clown`) | Cachinhos de palhaço | default | Cartola |
| Nana exploradora (`nana_explorer`) | Cachos presos | default | Visor azul, Argola |
| Guardiã da Lua (`moon_guardian`) | Ondas de corte | default | Coroa lunar, Brinco gota |
| Nico inventor (`nico_inventor`) | Curto cacheado | none | Óculos redondos, Óculos de inventor |
| Feiticeira rubi (`ruby_sorceress`) | Ondas com coque | default | Coroa lunar, Brinco gota, Joia de testa |
| Guardião da chama (`flame_guardian`) | Topete de herói | none | Nenhum |
| Paysandu (`paysandu_wolf`) | Careca | default | Equipamento de Paysandu |
| Corvo rubi (`ruby_raven`) | Careca | default | Equipamento do corvo |
| Orc guerreiro (`orc_warrior`) | Coque guerreiro | default | Nenhum |
| Cacto pistoleiro (`cactus_cowboy`) | Careca | default | Chapéu de cowboy |
| Rei pimentão (`pepper_king`) | Careca | default | Coroa |
| Pimenta bandida (`chili_bandit`) | Careca | default | Nenhum |
| Robô bolinha (`robot_ball`) | Careca | default | Nenhum |
| Arqueira da floresta (`forest_archer_f`) | Curto em camadas | none | Ponto de luz |
| Arqueiro da floresta (`forest_archer_m`) | Mechas torcidas | default | Nenhum |
| Guarda feminina (`forest_guard_f`) | Curto em camadas | none | Nenhum |
| Guarda jovem (`forest_guard_m`) | Topete de herói | none | Nenhum |
| Guarda veterano (`forest_guard_veteran`) | Corte de veterano | default | Nenhum |
| Artífice da floresta (`forest_artificer`) | Mechas torcidas | default | Monóculo esmeralda |
| Princesa da floresta (`forest_princess`) | Ondas de corte | none | Coroa de folhas, Brinco gota, Flores |
| Cowboy do deserto (`frontier_cowboy`) | Careca | none | Chapéu de viajante do deserto |
| Padeiro (`bread_baker`) | Curto cacheado | none | Chapéu de padeiro |
| Vigilante (`bread_vigilante`) | Curto cacheado | none | Capuz e máscara do vigilante |
| Soldado cacto (`cactus_soldier`) | Careca | none | Elmo do soldado |
| Soldado cacto grande (`cactus_soldier_large`) | Careca | none | Elmo do soldado |
| Feneco do deserto (`desert_fennec`) | Careca | default | Sela e bolsas do feneco |
| Cowboy no feneco (`cowboy_on_fennec`) | Careca | default | Cowboy montado no feneco |

## Validação

`tests/qualidade-pelos-acessorios.mjs /workspace/outputs/pelos-base` confirmou a preservação de 109 peças anatômicas e seus morphs nos 34 personagens (atributos originais nos humanoides; posições, normais e cores por canto de triângulo nos companheiros, que receberam novos UVs), os 17 penteados com configurações iguais e contornos gerais preservados, 21 acessórios do catálogo humanoide e cinco opções de barba. A qualidade de normais e fechamento é verificada separadamente. A captura final cobre os 34 personagens em três vistas (102 pares), oito vistas extras de comprimento e 24 imagens de expressões das barbas. Os 34 GLBs passaram com mapas, UVs e tangentes das fibras; os animados preservam 12 clipes e o robô zero. Recoloração da barba sombreada pelo controle real e cinco prévias de expressão no Worker também passaram, sem erros de navegador. Relatório: `renders/pelos/exportacao/relatorio.json`.

Comparação local em `renders/pelos/index.html`, três vistas por personagem com câmera e luz iguais. Os artefatos locais não entram na main; entram os geradores, testes e documentação. Aprovação técnica não substitui avaliação de qualidade pelo usuário.
