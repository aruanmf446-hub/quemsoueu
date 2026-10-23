> **Rodada reprovada e retirada.** O usuário mostrou que `22251b2` formou um queixo alongado e retangular na Arqueira. O remapeamento abaixo foi removido; o contorno retorna à base `eeaa4f0`. Os testes técnicos desta rodada não constituíram aprovação estética. Continuação em [RECUPERACAO-QUEIXOS-CABELOS.md](RECUPERACAO-QUEIXOS-CABELOS.md).

# Contorno da mandíbula curta e recuada

As imagens da Princesa e Nico enviadas pelo usuário mostram que `eeaa4f0` acrescentou relevo sob o lábio, mas conservou uma silhueta inferior curta/recuada. O usuário esclareceu o escopo: corrigir todos os personagens com esse modelo de queixo, preservando os outros formatos.

## Grupo afetado

Somente estes 11 perfis recebem a correção estrutural:

| Personagem | ID |
| --- | --- |
| Feminino suave | `feminine_soft` |
| Feminino intenso | `feminine_bold` |
| Cute | `cute_round` |
| Palhaço triste | `sad_clown` |
| Nana exploradora | `nana_explorer` |
| Guardiã da Lua | `moon_guardian` |
| Nico inventor | `nico_inventor` |
| Feiticeira rubi | `ruby_sorceress` |
| Arqueira da floresta | `forest_archer_f` |
| Guarda feminina | `forest_guard_f` |
| Princesa da floresta | `forest_princess` |

Os outros 23 modelos conservam a geometria da base. O Anão, Guarda jovem e as duas skins do Padeiro mantêm o apoio da rodada anterior e ficam fora desta alteração estrutural; possuem contornos diferentes. Criaturas, vegetais e robô também ficam preservados.

## Construção

`MANDIBLE_IDENTITIES` controla a extensão inferior, a largura e a projeção de cada perfil. `makeLoft` remapeia as fatias da própria casca da mandíbula, com tangentes contínuas na união abaixo do lábio. A base cresce de 0,10 a 0,12 unidade local e se projeta formando o mento e a curva até o pescoço. O fechamento arredondado original acompanha essa remalhagem. Olhos, nariz, boca e crânio acima da união preservam a superfície anterior.

O apoio em relevo da rodada anterior fica desativado nesses 11. O primeiro ensaio de um segundo volume criou uma faixa/bloco e foi descartado. A solução final modifica uma única superfície contínua. `jawChinY` acompanha a base na ponderação da mandíbula do rig. Os controles de largura e mandíbula continuam atuando sobre as fatias originais antes do remapeamento.

## Conferência

O teste do queixo passa a medir a **altura da silhueta real da malha**, além do volume frontal. Um simples aumento de relevo como o anterior não satisfaz esse teste. Ele também confere volume mandibular, preservação da superfície acima da união, continuidade da transição e 12 clipes por alvo. Os quatro apoios antigos fora do grupo conservam suas verificações.

A comparação geométrica com `eeaa4f0` confirmou 11 malhas alteradas e 23 preservadas. Continuidade dos lábios, encaixe do pescoço e deformações são verificadas nas regiões adjacentes.

A [comparação pública](https://aruanmf446-hub.github.io/quemsoueu/revisao/) mostra somente esses 11 modelos. A aba **Perfil do queixo** permite conferir a projeção e a ligação com o pescoço usando a mesma câmera nas duas versões. As outras abas mostram cabelo/acessórios e escultura. A seleção e a contagem de imagens ficam em `revisao/manifesto.json`.

Base: `/workspace/outputs/mandibula-referencia-eeaa4f0`. Capturas: `renders/mandibula/{antes,depois}-{rosto,visual}`. Logs: `/tmp/mandibula-*.log`. Prévia invalidada com `menu-v17-contorno-mandibular`. Luz, exposição, cabelo e figurino mantêm as configurações anteriores. Os defeitos antigos de expressão registrados na rodada anterior continuam fora desta correção de contorno.

Validação final concluída: somente 11 malhas alteradas contra `eeaa4f0`, com as outras 23 preservadas. Passaram ganho de silhueta, 450 amostras superiores (11 estruturas e quatro apoios legados), continuidade labial, pescoço e deformações. Os 11 alvos foram recapturados de frente, três quartos e perfil, com e sem cabelo; a comparação de 66 imagens passou em abas, perfil, busca e celular. Quatro GLBs (Nico, Princesa, Nana e Palhaço), com mapas e 12 clipes, e três prévias de expressão no Worker passaram sem erros.
