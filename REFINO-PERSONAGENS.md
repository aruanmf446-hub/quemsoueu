# Revisão de escultura dos 34 personagens

Rodada de 22/10/2026: a arqueira foi revista em `7ccbaa9`; esta continuação cobre os **outros 33**, mantendo aquela revisão. As formas mudam na malha. Não houve alteração de iluminação, roupa ou material nesta rodada. A única referência visual disponível continua sendo `.github/workflows/image.jpg`.

| Personagem | Escultura trabalhada |
| --- | --- |
| Feminino suave (`feminine_soft`) | Contorno oval mais limpo, bochecha menos projetada, ponta nasal arredondada e lábios menos salientes. |
| Masculino suave (`masculine_soft`) | Queixo largo com transição menos quadrada, ponte nasal larga, olhos mais estreitos e boca mais larga. |
| Rei (`old_king`) | Queixo e mandíbula cheios, pálpebra superior pesada, ponta nasal larga e baixa e boca mais caída. |
| Infantil arredondado (`cute_round`) | Face curta e cheia, nariz de ponta larga e curta, olhos grandes com íris própria e sorriso mais largo. |
| Feminino intenso (`feminine_bold`) | Maçãs menos laterais, olhar mais estreito, ponta nasal alongada e boca assimétrica com menor projeção. |
| Alquimista vilão (`alchemist_villain`) | Contorno longo e estreito, queixo projetado, ponte adunca e ponta baixa; pálpebras e sorriso assimétricos. |
| Anão (`dwarf_bard`) | Mandíbula larga e arredondada, nariz cheio com asas largas, olhos encaixados e boca mais aberta em largura. |
| Palhaço triste (`sad_clown`) | Bochechas menos salientes, olhos inclinados para tristeza e contorno de boca mais caído. Nariz de bola preservado. |
| Nana (`nana_explorer`) | Face larga com transições mais suaves, nariz curto e cheio, olhos mais encaixados e sorriso mais largo. |
| Guardiã da Lua (`moon_guardian`) | Mandíbula delicada, maçãs menos projetadas, nariz estreito de ponta suave e abertura de olhos menos circular. |
| Nico (`nico_inventor`) | Face jovem curta, queixo um pouco mais cheio, ponta nasal baixa e curta e sorriso assimétrico mais largo. |
| Feiticeira rubi (`ruby_sorceress`) | Face alongada, queixo estreito, olhos estreitos e inclinados, ponte nasal definida e lábios menos salientes. |
| Guardião da chama (`flame_guardian`) | Queixo largo e projetado, mandíbula menos angular, olhos mais embutidos e nariz com ponta mais arredondada. |
| Lobo (`paysandu_wolf`) | Crânio e maçãs mais largos, focinho menos largo; pálpebras curvas com fechamento real sobre o globo. |
| Corvo rubi (`ruby_raven`) | Bico mais comprido, estreito e curvo; pálpebras curvas dentro das órbitas da máscara, com fechamento real. |
| Orc (`orc_warrior`) | Queixo largo, mandíbula menos quadrada, nariz amplo de ponta cheia e boca mais larga com menos relevo labial. |
| Cacto pistoleiro (`cactus_cowboy`) | Perfil de base/queixo próprio, olhos menos circulares, bochecha mais suave e boca larga assimétrica. |
| Rei pimentão (`pepper_king`) | Silhueta mais arredondada no terço médio, olhos mais afastados e estreitos, boca mais larga e maçãs mais suaves. |
| Pimenta bandida (`chili_bandit`) | Perfil mais afunilado no alto, olhos menos redondos e mais separados, sorriso mais largo e assimétrico. |
| Robô (`robot_ball`) | Laterais superiores mais estreitas, queixo mais curto e frente inferior mais cheia, com tela/borda/casco no mesmo campo de deformação. |
| Arqueira (`forest_archer_f`) | Revisão anterior mantida: mandíbula afunilada, olhos amendoados, ponta nasal curta e suave, lábios menos salientes e mais amostras na boca. |
| Arqueiro (`forest_archer_m`) | Contorno de face mais estreito, queixo projetado, nariz arredondado e boca assimétrica mais larga. |
| Guarda feminina (`forest_guard_f`) | Mandíbula larga com transição mais suave, olhos mais estreitos e encaixados e ponta nasal mais cheia. |
| Guarda jovem (`forest_guard_m`) | Face curta e larga, ponta nasal cheia, sorriso largo e olhos menos circulares. |
| Guarda veterano (`forest_guard_veteran`) | Queixo largo, ponte nasal adunca e ponta baixa, olhos estreitos com pálpebra pesada e boca mais caída. |
| Artífice (`forest_artificer`) | Face estreita, queixo projetado, ponte adunca e ponta alongada, olhos mais estreitos e sorriso torto mais largo. |
| Princesa (`forest_princess`) | Contorno curto e delicado, maçãs menos projetadas, nariz curto e cheio, olhos grandes e sorriso mais largo. |
| Cowboy do deserto (`frontier_cowboy`) | Contorno compacto próprio, olhos estreitos e afastados, boca mais larga e sorriso torto. |
| Padeiro (`bread_baker`) | Mandíbula larga arredondada, nariz cheio, maçãs menos projetadas e sorriso largo. |
| Vigilante (`bread_vigilante`) | Mesma anatomia revista do padeiro, preservando a pessoa sob a outra skin. |
| Soldado cacto (`cactus_soldier`) | Base um pouco mais larga, olhos mais afastados/estreitos, boca larga e bochechas menos salientes. |
| Soldado cacto grande (`cactus_soldier_large`) | Queixo e base largos, olhos estreitos e afastados e boca larga mais caída. |
| Feneco (`desert_fennec`) | Crânio menos largo e focinho mais cheio, maçãs compactas e pálpebras que fecham sobre o globo. |
| Cowboy no feneco (`cowboy_on_fennec`) | Mesma anatomia revista do feneco; o cavaleiro acompanha a revisão do cowboy do deserto. |

Os 23 humanoides usam perfis próprios de curvatura nasal, projeção da boca, pálpebras e distribuição de vértices. As skins da mesma identidade compartilham os dados anatômicos. As novas pálpebras dos quatro companheiros usam malhas curvas e pivôs animados, preservando o volume da esclera durante a piscada; seus movimentos fazem parte dos clipes GLB.

A máscara de deformação dos rostos passou a desaparecer de forma contínua perto do nariz, barba e silhueta. Isso evita fileiras que paravam bruscamente no sorriso. `tests/qualidade-expressao.mjs` verifica essa regressão na região nasal do anão.

## Verificação

Referência desta continuação: `7ccbaa9`, cópia local em `/workspace/outputs/todos-individual-base`. `identidades-faciais.mjs` compara os 33 alvos e exige a arqueira inalterada. Galeria em `renders/individual-todos/index.html`: quatro vistas por personagem com câmera igual antes/depois, comparando a rodada completa contra `0ca62a8` (antes da revisão da arqueira). Três expressões adicionais por personagem: feliz, surpreso e piscadela. `tests/qualidade-palpebras-companheiros.mjs` verifica orientação/área dos triângulos, fechamento central, preservação do globo e animações das pálpebras nos quatro companheiros.

Validação concluída: 34 malhas alteradas contra `0ca62a8`, 136 pares de comparação e 102 capturas finais de expressões; 34 GLBs com mapas e os clipes preservados; Worker/expressões/cache para arqueira, veterano, Nana, feneco e corvo, sem erros de navegador. Tipos físicos, cobertura, cactos, pálpebras e regressão do sorriso passaram. A revisão visual incluiu todos os 34, em frente/perfil, expressões e com cabelo/acessórios. Os resultados de testes são verificações técnicas; não representam aprovação estética.
