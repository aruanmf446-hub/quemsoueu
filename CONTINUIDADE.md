# Continuidade — Ateliê Quem Sou Eu

## Orientação de entrega

O usuário determinou: **sempre subir o trabalho para a `main`**. Ao concluir uma rodada, validar, registrar as alterações e enviar à `main`, preservando alterações remotas e sem force push. Distinguir o envio do código da conclusão do deploy do site.

## Rodada atual — acessórios do rosto, barba e cabelo menos rígido

O usuário aprovou `8d4acea` ("Ficou muito bom") e pediu revisar quais personagens precisam de acessórios do rosto, barba e cabelo, com prioridade para barba e acessórios. **Preservar os rostos e queixos aprovados.** Não usar a nova aprovação como conclusão de que as referências de cinema foram alcançadas.

Auditoria dos 34 em [AUDITORIA-ACESSORIOS-BARBAS.md](AUDITORIA-ACESSORIOS-BARBAS.md). Prioridades: visor da Nana; óculos e goggles do Nico; monóculo do Artífice; máscara do Vigilante. Barbas: Rei, Anão, Orc, Arqueiro e Guarda veterano; curta do Masculino suave; bigode/cavanhaque do Artífice e Rei pimentão. Os 17 penteados recebem afilamento mais progressivo e cobertura menos espessa.

Base imutável `/workspace/outputs/acessorios-barbas-base-8d4acea`; artefatos `renders/acessorios-barbas/`. O monóculo tinha um disco de engrenagem com furo de apenas 42% do raio: encobria o olho. Substituído por aro aberto. O gerador de tubos dos acessórios herdava sulcos de fios: agora usa seção lisa. A barba recebe mechas de caimento, implantação animada por referência à pele e pontas livres. A cor da barba cheia deixa de descer pelo pescoço. A pele mantém posições e proporções; somente essa pintura de barba no pescoço é retirada. Não retomar modificações de mandíbula ou olhos.

O teste de adesão dos pelos agora mede a conservação do afastamento neutro durante a expressão, permitindo pontas livres em vez de exigir que todos os vértices fiquem a menos de 0,022 unidade da pele. Há também um limite de distância para detectar mechas fora do volume. `ATELIE_REFINADOS=''` no teste de identidades permite exigir zero alterações anatômicas contra uma base. Validação concluída: 109 peças anatômicas preservadas (exceto a pintura de barba removida no pescoço), 34 geometrias faciais iguais à base, 17 penteados, 21 acessórios e cinco opções de barba válidos. Capturas dos 34 visuais; oito barbas/bigodes de perfil e com 16 poses. Onze GLBs com 12 clipes e quatro Workers passaram; Nico foi reexportado e reconferido após o ajuste final dos óculos/goggles. Galeria com 34 personagens e 136 imagens passou em desktop/celular. Prévias `menu-v19-pelos-optica`. Resultado validado para envio à main sem force push; não declarar aprovação estética desta rodada antes da resposta do usuário.

## Rodada anterior aprovada — recuperação dos queixos e retomada dos cabelos (`8d4acea`)

O usuário **reprovou `22251b2`**: o mento da Arqueira ficou alongado, retangular e separado visualmente do rosto. A limitação do código a 11 perfis não torna o resultado aceitável. Não reutilizar o remapeamento mandibular dessa rodada nem o apresentar como aprovado.

Foram retirados `MANDIBLE_IDENTITIES`, o remapeamento de `makeLoft`, a extensão inferior e a substituição de `jawChinY`. A anatomia retorna exatamente à base `eeaa4f0`, anterior ao bloco. Isso recupera o contorno anterior; **não significa concluir o pedido antigo de melhorar os queixos recuados**. Olhos, nariz, boca e diferenças de identidade aprovadas anteriormente são preservados.

A retomada dos cabelos usa o gerador dos 17 penteados: seção elíptica completa e mais espessa, sulcos menores, raízes finas encaixadas na cobertura, mais cobertura dos cortes curtos e franja menos achatada na Arqueira. A linha de implantação passa continuamente pela têmpora, sem o salto do gerador anterior. Acessórios, barbas, roupas, luz e exposição não foram redesenhados. O parâmetro opcional de sulco em `groom.js` conserva o comportamento anterior para seus outros consumidores.

Prévias `menu-v18-queixos-cabelos`. Artefatos em `renders/recuperacao-cabelos/`; o antes visual é `22251b2`, o depois usa a geometria restaurada e o cabelo atual. As capturas de escultura do depois são reutilizadas da base `eeaa4f0`, cuja igualdade geométrica é verificada pelo teste de preservação. A vista 3/4 com cabelo foi recapturada em todo o catálogo. Esta rodada é recuperação da regressão e continuação do cabelo; não declarar equivalência às referências de cinema nem aprovação estética do usuário.

Validação concluída: 34 identidades recuperadas e 109 peças anatômicas iguais à base `eeaa4f0`; alterações de geometria confirmadas nos 17 penteados. Os testes de normais, continuidade labial, apoio localizado do queixo, pescoço, óculos, criaturas e identidades passaram. Cinco GLBs (Arqueira, Nico, Nana, Guardiã e Guardião) conservam 12 clipes e os mapas/UVs/tangentes dos cabelos; três Workers passaram, assim como a recoloração pelo controle real. A comparação pública retorna ao catálogo completo, com 136 imagens; a vista 3/4 com cabelo foi recapturada nos 34. Sem aprovação estética inferida dos testes. Galeria conferida em desktop e celular: 34 personagens, 136 imagens, abas e busca válidos. Rodada validada para envio à main sem force push.

## Rodada reprovada — extensão mandibular (`22251b2`)

O remapeamento estendia 0,10–0,12 unidade em 11 perfis. Os testes anteriores confirmavam a extensão e a preservação dos traços superiores, mas **não detectaram o aspecto de bloco**, depois demonstrado pelo usuário no jogo. O teste não deve exigir mais o alongamento reprovado. Histórico em [REFINO-MANDIBULA.md](REFINO-MANDIBULA.md).

## Rodada anterior, efeito insuficiente — apoio do queixo (23/10/2026)

O usuário pediu enviar tudo à main: concluído em `54a1f87`, remoto verificado. Em seguida pediu continuar: "tá ficando incrível", mas há personagens sem queixo. A direção visual anterior foi aceita para continuação; preservar olhos, nariz e boca. Foi enviada pergunta opcional sobre quais nomes, ainda sem resposta; a auditoria do catálogo apontou 15 humanos com queixo mais recuado, sobretudo Cute, Nico, Princesa, Arqueira e Guardiã.

`CHIN_IDENTITIES` em `face-identities.js` fornece projeção/largura/altura próprias para esses 15; demais 19 formas ficam iguais. O campo da pele faz a transição sob o lábio e termina antes do pescoço. O ensaio com faixa abrupta sob o lábio foi descartado em favor de uma transição larga. A anatomia acima da região conserva o relevo anterior. Não alterar novamente as proporções aprovadas para disfarçar o problema.

Base imutável `/workspace/outputs/queixo-referencia-54a1f87`; capturas em `renders/queixos/`. Antes/19 modelos preservados vêm das capturas finais de 54a1f87; os 15 alvos são recapturados. `qualidade-queixos.mjs` confirmou 450 amostras da superfície superior preservadas, projeção adicional suave nos 15 e 12 clipes em cada um. A comparação geométrica contra a base confirmou somente 15 malhas alteradas e preservação das skins. Documentação: [REFINO-QUEIXOS.md](REFINO-QUEIXOS.md). Prévias `menu-v16-apoio-queixo`. Validação concluída: 15 alvos recapturados; 450 pontos preservados; 15 malhas alteradas contra a base; continuidade labial, deformações e pescoço válidos; cinco GLBs e três Workers passaram. Sorriso/surpresa de Nico e Guardiã conferidos. Galeria com 136 imagens passou em desktop/mobile. Refinamento final pronto para envio à main sem force push. A conferência de poses revelou borda triangular na boca da surpresa do Nico e dobras marcadas no sorriso da Guardiã; reproduzidos na base 54a1f87 em `renders/queixos/poses-referencia/`, portanto anteriores à rodada dos queixos. São limitações abertas para o refino das expressões; não declarar aprovação estética dessas poses.

## Rodada anterior — correção das proporções faciais (23/10/2026)

O usuário reprovou também `b119a58` e enviou o antes/depois de `feminine_soft`. A correção reconhece a regressão: aumentar olhos/íris e encurtar o terço médio infantilizou os adultos e criou um olhar arregalado. Não apresentar a reconstrução anterior como aprovada.

Os 23 perfis humanos têm proporções próprias corrigidas (olhos, pálpebras, íris/pupilas, nariz/boca/queixo e projeção das maçãs), preservando as diferenças entre crianças, adultos e idosos. A textura compartilhada da íris perde o anel claro exagerado; isso alcança também os seis vegetais e o cavaleiro. A oclusão da pele em `head.js` ignora vizinhos recuados das cavidades e limita a sombra de mandíbula a abaixo da boca: antes ela também pintava bolsas sob os olhos. Sem mudança de luz, exposição, cabelo, roupa, corpo ou topologia do rig.

Base imutável: `/workspace/outputs/rosto-rejeitado-b119a58`. Comparação em `renders/correcao-rosto/{antes-rosto,depois-rosto,antes-visual,depois-visual}`; os antes são as capturas finais de b119a58. A comparação pública em `revisao/` identifica explicitamente a versão reprovada. Os geradores próprios de criaturas/robô conservam as formas; não afirmar nova escultura dos 34 nesta correção. Escopo e validação: [CORRECAO-PROPORCOES-FACIAIS.md](CORRECAO-PROPORCOES-FACIAIS.md). Cache de prévias `menu-v15-proporcoes-faciais`. A avaliação estética continua aberta e o resultado não equivale às referências de produção.

A validação desta correção terminou antes da solicitação de interrupção: 34 GLBs, seis Workers e a galeria passaram; os testes de escopo confirmaram 23 malhas humanas alteradas e as outras formas preservadas. O usuário pediu enviar tudo à main e, em seguida, continuar ajustando personagens sem queixo. A pergunta sobre quais nomes está pendente; revisar mandíbula/queixo em todo o catálogo enquanto isso.

## Rodada anterior, reprovada — reconstrução após reprovação visual (23/10/2026)

O usuário reprovou `acf8bc2`: rostos genéricos/bugados no jogo e distância grande das referências; reiterou **todos os personagens**. Não repetir a conclusão de que testes de UV/normais resolvem qualidade estética. O rosto voltou explicitamente ao escopo. A direção desta revisão está em [REVISAO-ESCULTURA-CATALOGO.md](REVISAO-ESCULTURA-CATALOGO.md), com alterações por personagem. Não declarar equivalência às referências cinematográficas.

Foram reesculpidos os 23 perfis humanoides e as relações faciais dos seis vegetais; quatro companheiros receberam revisão de focinho/arcada/pelagem e o robô, da tela/bordas. Na construção compartilhada: nariz sem soma em cunha, lábios com continuidade, pupilas/íris próprias, pálpebras com normais da superfície e encaixe cabeça/pescoço corrigido (calota do corpo dentro da cabeça, tampa da cabeça dentro do corpo). Os 17 penteados foram reconstruídos com fluxo e grupos principais/secundários, recorte interpolado da linha do cabelo, cobertura com fibras e coques preenchidos. Nico, Guardião e arqueira têm guias diferentes. Óculos, visor e monóculo são medidos contra a face. Sem mudança de iluminação/exposição ou figurinos.

Prévias: `menu-v14-escultura-fidelidade`, raster adaptado ao tamanho/aspecto/DPR do cartão, cache por dimensões e descarte de respostas de Workers antigos. O Worker já usava a mesma qualidade facial e escala da cena; não era um gerador facial simplificado. Não atribuir a aparência ruim somente à resolução.

Base imutável: `/workspace/outputs/escultura-referencia-acf8bc2` (`acf8bc2`). Artefatos em `renders/reconstrucao/{antes-rosto,depois-rosto,antes-visual,depois-visual}`, com câmeras fixas. `tests/galeria-reconstrucao.py` gera a comparação pública em `revisao/`, com 34 personagens e abas com cabelo/escultura. Imagens reais do visualizador, sem geração de retratos substitutos. Os testes antigos de igualdade da anatomia no refino de pelos pertencem à rodada anterior; aqui a mudança dos rostos é intencional.

Regressões novas: `continuidade-labios.mjs`, `encaixe-pescoco.mjs`, `encaixe-oculos.mjs`, `qualidade-companheiros-esculpidos.mjs`; `identidades-faciais.mjs` inclui a tela/bordas do robô e mede mandíbula/maçã pelas alturas anatômicas atuais. `qualidade-expressao.mjs` também acompanha a nova altura nasal do anão. A suíte de seleção testa dimensões/aspecto das imagens reais, visual salvo e preservação da cena nos 34 cartões. Validação final concluída: 34 rostos/telas alterados contra `acf8bc2`; 29 corpos com controles/juntas preservados; 23 perfis com continuidade labial; 29 olhos humanos/vegetais e quatro companheiros com piscada válida. Capturas de todos os rostos (quatro vistas e três expressões), dos 34 personagens completos (três vistas, mais comprimento/expressões) e 34 GLBs com mapas/UVs/tangentes/clipes passaram. Menu real com DPR 2 passou nos 34 cartões, recuperação, trocas rápidas e quatro famílias no celular; seis expressões no Worker passaram. A galeria pública contém 136 capturas e passou em carregamento, busca, abas e mobile. Relatórios em `renders/reconstrucao/{menu,exportacao}/relatorio.json` e `galeria-verificacao.json`; logs `/tmp/reconstrucao-*.log`. As lentes tiveram opacidade/reflexo reduzidos para preservar a leitura da íris. O topete do herói foi rebaixado após aparecer como arco oco; os dois perfis afetados foram recapturados. Hashes das fontes em `renders/reconstrucao/fontes-finais.sha256`. A revisão ainda fica abaixo das referências de produção; não declarar equivalência nem aprovação estética. O acesso HTTP ao domínio do Pages foi bloqueado com 403 pelo proxy do ambiente; conferir envio via Git e distinguir de deploy confirmado.

## Rodada anterior — malha e textura de cabelos, barbas e acessórios (23/10/2026)

O usuário esclareceu que as referências são uma régua de **qualidade de malha e textura**, sem copiar os personagens nem mudar luz, rosto, penteado ou roupa. Pediu todos os personagens. A escultura facial fica para outra rodada. O refinamento desta etapa está documentado em [REFINO-PELOS-ACESSORIOS.md](REFINO-PELOS-ACESSORIOS.md), com a relação dos 34 personagens.

`src/groom.js` reúne seções fechadas, tampas com UV próprio, fluxo de fibras, normal/rugosidade/cor procedurais de 512 px, anisotropia exportável e fibras secundárias em geometria nas mechas maiores. As configurações dos 17 penteados são preservadas. No coque da Nana, corrigiu-se a direção das raízes até o coque e o encaixe das bases sob a cobertura. `src/beard.js` mantém o volume facial original, acrescenta superfície contínua às barbas e pelos curtos à barba sombreada; deltas de morph e pesos de skin vêm dos mesmos vértices da pele. Bigodes e cavanhaques têm volumes fechados seguindo seus contornos anteriores. A cor da barba sombreada acompanha agora o seletor de cabelo.

Acessórios recebem acabamento de construção: lentes curvas com espessura, juntas e aros, pesponto dos óculos de inventor, garras/assentos das pedras, faixa de coroa fechada e anilhas vazadas. Nos companheiros, UVs acompanham a pelagem/plumagem, com materiais de fibras separados; a busca por “gem” deixou de confundir “Pelagem” com pedra. Pálpebras mantêm o caminho anterior. Prévias usam `menu-v13-pelos-acabamento`.

Referência imutável: `/workspace/outputs/pelos-base` (`37fadc2`). `node tests/qualidade-pelos-acessorios.mjs /workspace/outputs/pelos-base` passou nos 34 personagens, comparando 109 peças anatômicas e seus morphs, os parâmetros/contornos dos 17 penteados, 21 opções de acessórios e cinco opções de barba. A comparação dos companheiros usa os cantos dos triângulos para permitir os novos UVs sem alterar a superfície. O teste de barba mede a aderência à pele em sorriso, mandíbula aberta e beijo. Normais de cabelo e pálpebras dos quatro companheiros também passaram. Não é medição de FPS nem equivalência à referência cinematográfica.

A galeria local é gerada por `python3 tests/galeria-pelos.py`: `renders/pelos/index.html`, com três pares por personagem, câmera e luz iguais. `tests/pelos-visuais.cjs` aceita `ATELIE_CAMERAS`, `ATELIE_COMPRIMENTO=1` para costas em corpo inteiro nos cabelos longos, `ATELIE_POSES` e `ATELIE_POSERS` para expressões. `tests/pelos-exportacao.cjs` confere os 34 GLBs, mapas/UVs/tangentes das fibras, clipes, recoloração da barba sombreada pelo controle real e cinco prévias de expressão no Worker. Validação final concluída: 102 pares dos 34 personagens, oito pares extras de comprimento e 24 imagens de expressões das barbas; 34 GLBs com mapas, UVs/tangentes e clipes preservados; recoloração pelo controle real e cinco prévias no Worker passaram, sem erros de navegador. Relatórios `renders/pelos/{depois,exportacao}/relatorio.json`; logs `/tmp/pelos-entrega-{renders,exportacao}.log`. Artefatos em `renders/pelos/`, ignorados pelo Git. Aprovação técnica não substitui a avaliação estética do usuário.

## Rodada anterior — seleção confiável e deformação da boca (23/10/2026)

O usuário disse que alguns personagens ficaram excelentes, mas outros não funcionam/não selecionam. Não identificou quais. Preservar a direção visual e não marcar identidades específicas como aprovadas sem essa indicação. Foi solicitada a identificação dos casos enquanto se verifica todo o catálogo.

Reprodução: os 34 cliques individuais carregaram modelos, mas quatro cliques rápidos enfileiravam quatro montagens do mesmo destino. `busy` agora cancela tarefas de personagens anteriores por revisão, segura novas prévias durante a montagem, trata falhas e libera o estado ocupado. `setPreset` retorna uma Promise booleana. A cabeça, o corpo, o visual e as roupas anteriores só são descartados após a próxima montagem completa; uma falha restaura a cena anterior. A liberação inclui o material próprio dos corpos vegetais.

Na pimenta (`chili_bandit`), a normal dos detalhes e a distância da cavidade à superfície faziam fileiras dos lábios ficarem para trás nos morphs. Para bocas abertas em repouso, a normal da superfície base orienta a máscara, toda a cavidade acompanha a deformação e a alteração da abertura se distribui pela altura existente. As demais identidades mantêm o caminho anterior; nenhuma escultura em repouso foi alterada. O cache das prévias foi invalidado somente para a pimenta.

`tests/qualidade-expressao.mjs` preserva a regressão do sorriso do anão e acrescenta feliz/beijo/triste da pimenta: 26.921 triângulos frontais por pose, sem inversões e com movimento efetivo. O mesmo teste falha contra `bfa8c3e`. Paredes quase de perfil são excluídas dessa projeção, pois a rotação natural dos lábios pode mudar o sinal da projeção sem inverter a superfície. A checagem inicial por produto escalar das normais deu falsos positivos em outros vegetais; não confundir isso com dobras confirmadas.

Validação concluída: `tests/selecao-personagens.cjs` passou nos 34 cartões com prévias reais antes dos cliques, quatro cliques no mesmo quadro (uma montagem), restauração após falha e as quatro famílias em 390 px; sem erros nem avisos de prévias. A pimenta passou em GLB de 30,36 MB com 12 clipes, edição de peças e Worker real de expressão. Seis imagens antes/depois foram comparadas com câmeras idênticas; os cantos da boca acompanham melhor a expressão, sem reesculpir o repouso. `tests/fluidez.cjs` passou em giro, zoom, perda de foco, retomada de fila, quatro miniaturas e preservação do visual; navegação entre quatro seções em 22,6 ms nessa execução (não é medição de FPS). O workflow `validar-menu.yml` ganhou uma suíte própria. Relatórios em `renders/selecao-personagens/` e comparação da pimenta em `renders/funcionamento-pimenta/index.html` (base `bfa8c3e`, arquivo em `/workspace/outputs/funcionamento-base`). Artefatos locais ignorados pelo Git.

## Rodada anterior — revisão individual de todo o catálogo (22/10/2026)

O usuário corrigiu o encerramento após só a arqueira: **quer todos os personagens**. Não repetir entrega de um único alvo como conclusão do pedido. Esta continuação refina os outros 33, preservando a arqueira de `7ccbaa9`; junto com ela, cobre os 34. A relação de alterações de cada personagem está em `REFINO-PERSONAGENS.md`.

Os 21 perfis humanos restantes receberam combinações próprias de contorno, profundidades, olhos, nariz, boca e detalhes de malha; o vigilante acompanha o padeiro. Os seis vegetais têm contornos/olhos/bocas próprios. Os quatro companheiros agora usam pálpebras curvas sobre o globo, com pivôs e clipes exportáveis, em vez de achatamento do olho. Lobo/feneco têm ajustes distintos de crânio e focinho, e corvo de bico. O robô recebeu contorno superior mais estreito e queixo mais compacto, aplicado igualmente ao casco, tela e borda. Nenhuma mudança de luz, roupa ou material.

Referência imutável: `/workspace/outputs/todos-individual-base` (`7ccbaa9`). Comparação em `renders/individual-todos/antes` e `depois` contra `0ca62a8`, antes também da revisão individual da arqueira; assim, os 34 pares mostram a rodada completa. As capturas anteriores de `renders/escultura-v3/depois` representam essa referência. O teste de escopo contra `7ccbaa9` verifica os 33 restantes. Os testes confirmaram 33 malhas alteradas e a malha de repouso da arqueira idêntica à referência; skins compartilhadas preservadas. Qualidade orbital passou nos 29 rostos humanos/vegetais e as pálpebras dos quatro companheiros passaram em `tests/qualidade-palpebras-companheiros.mjs` (área/orientação dos triângulos, fechamento central sem achatar o globo, piscadela unilateral e clipes).

A revisão das expressões revelou dobras perto do nariz volumoso do anão. A máscara de `morphSkin` em `head.js` agora desaparece por uma transição suave de distância, em vez do corte binário em .14. `tests/qualidade-expressao.mjs` verifica 3.758 triângulos da região nasal no sorriso; falha com o corte antigo. Isso preserva a anatomia de repouso da arqueira e corrige a deformação compartilhada. As três expressões dos 34 foram recapturadas após essa correção, usando `ATELIE_SOMENTE_POSES=1` e a câmera fixa.

A captura completa inclui quatro vistas e três expressões (feliz, surpreso, piscadela) por personagem. Depois seguem 34 GLBs com close de cabelo/acessórios e Worker/expressões/cache para arqueira, veterano, Nana, feneco e corvo. Validação concluída: 34 malhas alteradas contra `0ca62a8`; 136 pares com câmeras iguais e 102 capturas de expressões na galeria; 34 GLBs com mapas, 12 clipes nos animados e zero no robô; Worker/expressões/cache para os cinco alvos, sem erros de navegador. As pálpebras dos quatro companheiros foram revalidadas após ajustar a abertura de surpresa e a prioridade da piscada. Passaram também tipos físicos, cobertura, cactos e qualidade orbital. A revisão visual incluiu frente/perfil, expressões e enquadramentos com cabelo/acessórios dos 34. Relatórios `renders/individual-todos/{depois,validacao,worker}`, logs `/tmp/todos-{final,poses-finais,glb,worker}.log`. Galeria com aba de expressões em `renders/individual-todos/index.html`. Artefatos locais ignorados pelo Git; os scripts de geração são versionados. Subir o conjunto final para a main. Aprovação técnica não é aprovação estética.

## Checkpoint anterior — arqueira da floresta (22/10/2026)

O usuário pediu continuar melhorando **um por um**. O catálogo inteiro continua no escopo; este checkpoint começa pela arqueira (`forest_archer_f`), a única com referência visual disponível em `.github/workflows/image.jpg`. Não apresentar os outros personagens como revisados individualmente nesta passagem. Naquele checkpoint, só a arqueira tinha sido revisada; a continuação para o catálogo inteiro está registrada acima.

Na arqueira: contorno menos largo nas bochechas, mandíbula afunilada, olhos amendoados com íris menor, pálpebras mais embutidas, sobrancelhas menos arqueadas e cílios mais curtos e espaçados. A ponta nasal usa raios independentes e um campo radial suave para reduzir a curvatura aguda sem criar uma peça separada sobre a face. Ponte e asas acompanham a nova ponta. Os lábios têm menor projeção, sorriso assimétrico e mais amostras da malha ao redor da boca, sem aumentar o orçamento global de vértices. Não houve alteração de iluminação, material ou roupa.

O bloco `detail` de cada perfil permite afinar sua escultura sem transferir os ajustes para as outras identidades. `ATELIE_REFINADOS=forest_archer_f node tests/identidades-faciais.mjs /workspace/outputs/individual-base` verifica alteração da arqueira e igualdade das outras 33 malhas contra `0ca62a8`, além dos contratos já existentes. A opção só muda a comparação com uma referência; sem ela, permanece o contrato antigo de todos os rostos alterados.

Comparação local: `renders/individual-arqueira/index.html`, quatro pares com câmeras iguais, gerada por `python3 tests/galeria-identidades.py renders/individual-arqueira forest_archer_f`. A galeria continua exigindo os 34 quando a seleção não é informada. Capturas de cinco expressões em `depois/`; personagem completo e exportação em `validacao/`; Worker/expressões/cache em `worker/`. Validação concluída: as 34 identidades passaram, com somente a arqueira alterada contra `0ca62a8`; qualidade orbital e fechamento das pálpebras passaram nos 29 rostos humanos/vegetais. A arqueira passou na exportação GLB com mapas e 12 clipes, recoloração, Worker, expressões e cache, sem erros de navegador. As cinco expressões e o encaixe com cabelo/acessórios foram revisados visualmente. Artefatos locais continuam ignorados pelo Git. Nenhuma aprovação estética foi dada.

## Rodada anterior — projeção e proporções dos 34 rostos (22/10/2026)

O usuário considerou `6bb2ee9` fraco e pediu uma mudança mais forte na escultura de todos. Esta rodada altera a anatomia, sem mudanças de iluminação, roupa ou materiais. Não declarar resultado aprovado nem equivalência à referência cinematográfica.

`src/face-identities.js` separa cinco larguras do contorno e quatro profundidades absolutas (`planes`: queixo, boca, maçãs e arcada). Os perfis têm olhos menores e aberturas próprias, mandíbulas mais cheias, narizes mais projetados e diferenças de crânio/queixo. A projeção das maçãs vem principalmente do volume da cabeça, com menos relevo local. O domínio de fusão nasal foi ampliado para acomodar as novas pontas sem cortar a superfície. Dentes e língua das bocas fechadas são limitados à superfície interna; a revisão piloto revelou e corrigiu língua atravessando o queixo.

Os seis vegetais receberam proporções próprias de corpo facial, olhos e boca. Lobo e feneco têm novas relações entre crânio, olhos e focinho; o corvo tem crânio mais largo, olhos menores e bico mais longo/curvo. A deformação frontal do robô alarga as laterais inferiores e encurta o queixo, aplicada também à tela e à borda para manter o encaixe. As skins compartilhadas continuam representando a mesma pessoa.

Referência imutável desta rodada: `/workspace/outputs/escultura-v3-base` (`6bb2ee9`). Comparação em `renders/escultura-v3/antes` e `depois`, com câmeras idênticas; galeria validada em `renders/escultura-v3/index.html` (136 pares). Os testes geométricos confirmaram mudança real nas 34 malhas, continuidade nasal, interiores orais contidos, morphs/clipes e identidades compartilhadas. Passaram também qualidade orbital/fechamento das pálpebras dos 29 rostos humanos/vegetais, cactos, tipos físicos e cobertura. Os 34 GLBs passaram com mapas, 12 clipes nos animados e zero no robô; nenhum erro de navegador. Worker/expressões/cache passaram para arqueira, veterano e feneco. Foram revisadas pranchas dos 34 rostos sem cores e com cabelo/acessórios, além de cinco expressões para arqueira, veterano, feneco, soldado cacto e robô. Relatórios em `renders/escultura-v3/{depois,validacao,worker,expressoes}`. Estes artefatos são locais e ignorados pelo Git; podem ser regenerados com os scripts versionados. Isso conclui a validação técnica desta rodada, sem aprovação estética do usuário.

## Rodada anterior — qualidade orbital e fechamento das pálpebras (22/10/2026)

O usuário pediu para continuar após o checkpoint `858e2fb`. A revisão visual inicial incluiu os 34 rostos em pranchas de malha sem cores. A correção atual trata a integração entre olho e pele: a grade externa deixa de comprimir várias fileiras sobre a abertura; a malha anatômica própria desenha a borda nos 29 rostos humanos/vegetais. A esfera de apoio da pele acompanha mais de perto o raio do globo ocular. Nos companheiros, as bordas das pálpebras seguem a elipsoide real, com espessura menor.

Os retratos de expressões revelaram que a piscada completa ainda deixava frestas nos olhos grandes. `src/rig.js` agora calcula os ângulos pela posição real das bordas superior/inferior em cada identidade. `tests/qualidade-orbitas.mjs` verifica a qualidade dos triângulos e mede a posição deformada das duas bordas após blink=1. Em qualidade .6, os triângulos muito estreitos da região orbital caíram de 14.337 para 1.387 nos 29 alvos, comparando com `858e2fb`. Isso mede topologia, não aprovação estética nem equivalência cinematográfica.

Referência imutável: `/workspace/outputs/escultura-v2-base` (`858e2fb`). Comparação em `renders/orbitas/antes` e `depois`; expressões em `renders/orbitas/expressoes`. `ATELIE_POSES=feliz,bravo,surpreso,piscadela,beijo` permite capturá-las com `tests/identidades-visuais.cjs`. Preservar a orientação de publicar na main e manter todos os personagens pendentes de aprovação visual.

Validação concluída: qualidade orbital e fechamento central das pálpebras nos 29 alvos; identidades, morphs e clipes dos 34; cactos com boca/olhos livres da chapelaria; 34 GLBs com mapas e 12 clipes nos animados (zero no robô), sem erros de navegador; Worker/expressões/cache para arqueira, veterano e feneco. Galeria com 136 pares e câmeras idênticas em `renders/orbitas/index.html`. Capturas adicionais de cinco expressões para arqueira, veterano, feneco, soldado cacto e robô. Revisão visual incluiu pranchas de todos os rostos e enquadramentos com cabelo/acessórios. Aprovação técnica não significa aprovação estética.

As validações pendentes da passagem anterior terminaram: 34 retratos, 34 GLBs e Worker/expressões/cache para arqueira, veterano e feneco, sem erros registrados. Seus relatórios estão em `renders/escultura-v2/`.

## Rodada anterior — reconstrução dos volumes faciais após reprovação (22/10/2026)

O usuário **reprovou `499cf81`**: ainda via rostos genéricos e distantes da referência. Não apresentar a rodada anterior como solução aceita. A autorização continua sendo mudar a anatomia dos **34 personagens**, com foco na malha do rosto.

Esta rodada substitui os multiplicadores do molde herdado por contornos absolutos de queixo, mandíbula, maçãs e têmpora, com proporções de crânio independentes. Olhos têm aberturas mais arredondadas, pálpebras com anéis anatômicos próprios e volumes orbitais mais largos. Narizes fundem ponte, ponta e asas por campos suaves; lábios têm transições contínuas e bocas com larguras/sorrisos próprios. Não houve mudança de iluminação nem figurino.

Correções observadas nos retratos: retirar o deslocamento residual da união suave que desenhava linhas retas no campo nasal; adaptar a cavidade oral à superfície e à largura de cada mandíbula, evitando que apareça pelas bochechas. Companheiros ganharam proporções distintas de olhos/focinho e boca projetada na superfície real. Robô ganhou borda curva da tela com topologia própria. Skins da mesma pessoa continuam compartilhando a anatomia.

Referência de comparação: `499cf81`, cópia imutável em `/workspace/outputs/rostos-reprovados`. Capturas em `renders/escultura-v2/antes` e `depois`; a galeria segue o mesmo contrato de 34 personagens, quatro vistas e câmeras iguais. Testes geométricos agora verificam também cavidade oral dentro da superfície e continuidade do volume nasal. A validação e a revisão final das capturas estão em andamento; **nenhum personagem tem aprovação estética**.

### Passagem para outro chat, solicitada pelo usuário

Checkpoint de implementação, sem aprovação estética. Passaram: `identidades-faciais.mjs /workspace/outputs/rostos-reprovados` (34 malhas alteradas, skins compartilhadas, morphs/clipes, cavidade oral e continuidade nasal), `deserto-identidades.mjs`, `cactos-hero.mjs`, `cobertura.mjs`, `tipos-fisicos.mjs`, qualidade de pele/superfícies/corpo/cabelo/tecido e `git diff --check`. A revisão piloto de arqueira, feminino intenso, feneco e robô está em `renders/escultura-v2/revisao`.

No momento da passagem, o processo iniciado no terminal ainda captura a versão final dos 34 em lotes. Depois executa, em sequência, a montagem da galeria, 34 GLBs com `visuais.cjs` e Worker/expressões/cache para arqueira, veterano e feneco. **Não declarar essas etapas concluídas sem consultar os resultados.** Logs: `/tmp/escultura-retratos-finais.log`, `/tmp/escultura-glb.log` e `/tmp/escultura-worker.log`; relatórios esperados: `renders/escultura-v2/depois/relatorio.json`, `validacao/reports.json` e `worker/relatorio.json`. Terminal original: sessão `41492`; servidor local na porta 8000. Se o ambiente for outro, os renders/logs ignorados pelo Git não estarão presentes: regenerar a referência `499cf81` e as comparações usando os scripts versionados.

O acesso a GitHub Pages e à API de Actions foi bloqueado pela rede deste ambiente com 403. Isso não demonstra falha do site. Código enviado à main, execução de Actions e site atualizado são estados distintos; verificar o deploy quando houver acesso.

## Rodada anterior — escultura e identidade dos rostos (22/10/2026)

O usuário autorizou **refinar a malha e diferenciar os rostos de todos os 34 personagens**, incluindo as bases antigas. O pedido é aproximar a anatomia e a escultura facial da linguagem da referência, sem substituir isso por iluminação, textura ou organização de roupa. A referência disponível é `.github/workflows/image.jpg`; as demais não estão disponíveis neste checkout. Não declarar fidelidade a imagens não consultadas nem aprovação estética.

`src/face-identities.js` define contorno de mandíbula/queixo, volume das maçãs, proporções do crânio, abertura/curvatura das pálpebras, nariz/ponte nasal, íris e volumes dos lábios por identidade. O gerador aceita larguras próprias de queixo/bochecha e ponte nasal em relevo; a amostragem da malha concentra anéis nas pálpebras e boca sem aumentar o orçamento global de vértices. O bloco que sobrescrevia os três rostos de cacto por uma única anatomia saiu de `head.js` e passou aos presets independentes. Lobo, feneco, corvo e casco facial do robô também receberam escultura própria. Padeiro/vigilante e feneco/montaria conservam a mesma pessoa em suas skins.

Comparação desta rodada: commit de partida `892e611`, retratos em `renders/identidades/antes` e `depois`, com frente, três quartos, perfil e malha sem cores. Cabelo, acessórios e figurino são ocultos só nas capturas de diagnóstico. `tests/identidades-faciais.mjs /copia/da/referencia` verifica mudança real das 34 malhas, diferenciação anatômica, geometrias válidas, morphs e clipes; `tests/galeria-identidades.py` exige os 34 personagens e câmeras/tamanhos idênticos. Comparações antigas de hash contra versões anteriores devem detectar estas mudanças intencionais de rosto.

Validação local concluída: as 34 malhas mudaram em relação a `892e611`; as identidades compartilhadas das skins foram preservadas. Os 34 GLBs passaram, com mapas presentes e os mesmos clipes (12 nos animados, zero no robô). Worker real, expressões e cache passaram para arqueira, guarda veterano e feneco. Passaram os testes de tipos físicos/juntas/pescoço, a repetição dos cactos com novas silhuetas, identidade do deserto, cobertura padrão e qualidade de cabelo/pele/superfícies/tecido/pelagem. Galeria validada com 136 pares, incluindo malha sem cores, em `renders/identidades/index.html`. Relatórios em `renders/identidades/validacao` e `worker`. Nenhum personagem foi marcado como aprovado esteticamente.

## Rodada anterior — qualidade técnica de todos os 34 personagens (22/10/2026)

O usuário esclareceu que quer **qualidade de textura e malha em todos**, sem concentrar o trabalho no desenho de um personagem. A referência `.github/workflows/image.jpg` foi sincronizada da `main`; as tentativas locais de redesenhar rosto, cabelo, figurino e iluminação foram retiradas. Esta rodada atua nos geradores compartilhados, preservando proporções, silhuetas, cores e rig. As exigências históricas de preservar os 13 modelos anteriores continuam valendo para o desenho; suas normais e superfícies também recebem as correções técnicas solicitadas agora.

Mudanças: normais contínuas nas toucas/mechas e nas costuras de penas/pelagem/cauda; normais da face externa e avesso do tecido preservadas após recorte; poros da pele filtrados pelo tamanho de pixel e relevo calculado no espaço da superfície; mapas PBR procedurais de 512 px com mipmaps/anisotropia para tecido, couro, metal, polímero e pelagem. UV1 de microdetalhe independente do UV de cor/estampa. Projeção por face preserva triângulos e normais; as transições entre eixos ainda não equivalem a um unwrap artístico manual. Cache de miniaturas versionado globalmente.

Verificações específicas: `tests/qualidade-cabelo.mjs`, `qualidade-tecido.mjs`, `qualidade-corpo.mjs`, `qualidade-pele.mjs` e `qualidade-superficies.mjs`. Os testes de cabelo/pele aceitam uma cópia do `src` anterior como argumento para confirmar a preservação dos atributos de geometria. `tests/visuais.cjs` agora também verifica UV1, normal maps e rugosidade nos GLBs. O shader procedural de poros/SSS continua próprio do visualizador; o GLB leva os materiais PBR suportados, sem prometer equivalência completa do shader.

Capturas e relatórios desta rodada ficam em `renders/qualidade-superficies/`. Aprovação estética, publicação na main/site e qualidade cinematográfica final continuam separadas da validação técnica.

Validação local concluída: 34 GLBs com normal/rugosidade e UV1, 68 capturas, zero erros de navegador; clipes faciais preservados (12 nos personagens animados, robô sem clipes). Worker real, cores, slots/cache e GLB passaram para `forest_archer_f` e `desert_fennec` em `renders/qualidade-worker/relatorio.json`. Os cinco testes técnicos passaram; cabelo verificou 17 estilos/38 malhas e 1.436 grupos de costura, mantendo todos os atributos exceto normais/tangentes idênticos à referência. Cobertura padrão: sete alvos, 86.388 vértices e zero falhas; cobertura adicional da arqueira: 15.701 vértices e zero falhas. `git diff --check` passou. Sem publicação remota nesta rodada.

## Retomada após interrupção — 22/10/2026

- Na revisão dos jobs, a execução `39775739335` encontrou dois vértices da gola do `bread_vigilante` magro descobertos; o ajuste em `src/hero-bread.js` foi salvo na `main` (commit `ddfd956`). A execução `39778404376` confirmou **zero falhas** para o vigilante magro, gordo e musculoso, mas apontou 11 vértices sem cobertura no `cactus_soldier` magro, nos ombros/parte alta do tórax.
- O colete aberto do soldado recebeu extensão localizada da gola e da cava em `src/hero-frontier.js` (commit `9cd7742`), **ainda pendente de validação** pela execução `39779445530`. Não reduzir a exigência de cobertura e não marcar o personagem aprovado sem revisão do usuário.
- O workflow `.github/workflows/galeria-herois.yml` (commit `1b3d78e`) produz 60 pares de frente/3/4/costas a partir da referência `77e1b9e` e do código atual, inclui Guardião da chama e enquadramento independente ampliado do Nico, valida as câmeras e publica JPGs na branch `capturas-atelie`, sob `/capturas/herois/`. Primeira execução: `39779098457`; **não declarar a galeria publicada até o job passar**. Uma execução de comparações iniciada antes de um novo ajuste pode representar o commit anterior; registrar o SHA na revisão.
- Aprovado tecnicamente não significa aprovado visualmente. Preservar todos os 20 itens pendentes no README, modelos antigos, 12 clipes, cache e renderização sem redução de qualidade. Após o job do deserto, prosseguir pelos próximos pontos sem cobertura e pela revisão dos renders e sela do cowboy.


Repositório: `aruanmf446-hub/quemsoueu`, branch `main`.
Site: https://aruanmf446-hub.github.io/quemsoueu/

## Prioridade atual — reconstrução fiel às referências (22/10/2026)

O usuário reprovou a rodada `77e1b9e`, pediu qualidade máxima e checkpoints frequentes na `main`. A reconstrução dos **20 novos personagens** está em andamento, com uma nova referência masculina adicionada como `flame_guardian` (também pendente). É autorizado refinar rosto, cabelo, proporções e equipamentos **destas novas identidades**, preservando os 13 personagens anteriores. Nenhum item pode ser removido ou marcado aprovado sem concordância explícita do usuário.

Arquivos novos: `hero-frontier.js`, `hero-forest.js`, `hero-lunar.js`, `hero-bread.js`, `hero-kit.js`, `hero-material.js`, `hero-hair.js`, `hero-studio.js`, `cactus-headgear.js`, `companion-detail.js`. `outfits.js` oferece os geradores e encaminha os novos estilos. A geometria antiga permanece no caminho anterior. Os coletes novos podem solicitar `garment(...,{mesh:false})` para usar seus campos e uma cava paramétrica limpa. O teste de cobertura dos novos estilos consulta as regiões dos próprios recortes de tecido, sem diminuir os testes históricos dos antigos.

Checkpoint parcial: hash13 e teste específico dos três cactos passaram; matriz27 conjuntos no corpo feminino suave passou; quatro companheiros passaram em browser/GLB12clipes/Worker. **A suíte completa está em execução e os renders ainda estão sendo revisados.** Não declarar igualdade com as referências. Logs temporários `/tmp/hero-figurinos-final.log`, renders em `/workspace/outputs/hero*`. Antes de considerar uma entrega final, concluir cobertura nos builds, cores/slots/cache, GLB, console e frente/3/4/costas/rosto de todos. Câmeras dos testes agora desligam damping para impedir capturas antes de atingir a vista correta; `ATELIE_BASE_URL` e `ATELIE_SOURCE_ROOT` permitem renderizar a referência `77e1b9e` em servidor separado.

## Etapa atual — refinamento dos 20 personagens

O usuário autorizou refinar todos os personagens das listas do README e determinou: **só retirar ou marcar um item depois de sua concordância explícita**. Manter as 20 caixas desmarcadas. Aprovação de testes não equivale a aprovação visual.

Rodada atual: companheiros com focinhos/pelagem/penas e equipamento próprios; montaria com sela, alforjes e cavaleiro; novas camadas de camisas/coletes, corpetes e saias, ombreiras sobrepostas, acabamento de botas e mochilas; chapéus, capuz, máscara e coroa de folhas. `src/detail.js` reúne as geometrias de mechas, fitas, emblemas, fivelas e engrenagens. Os geradores antigos de corpo, cabeça e rig humano não foram modificados. Correções finais: cavas realmente sem mangas nos coletes, capa considerando a camada externa e lenços com altura medida pela escala da cabeça. `tests/reino-lua.cjs` verifica que a roupa não encobre os olhos dos cactos nos dois portes.

`tests/refino-renders.cjs` captura frente/3/4/costas de todos os 20 e salva a câmera. `ATELIE_CAMERAS` reutiliza as câmeras da referência; `tests/galeria-refinamento.py` monta a comparação e as pranchas individuais. Referência desta rodada: **f4f1d7b**. Materiais e detalhes continuam exportáveis e recoloríveis por slot; cache de miniaturas versionado.

Uma execução de navegador em paralelo atingiu o limite de memória do ambiente; usar `tests/refino-lotes.cjs` para limitar cada navegador a quatro personagens e não abrir várias baterias de exportação ao mesmo tempo. O modo `ATELIE_SEM_CAPTURAS=1` separa a validação das capturas comparativas.

Validação final em 21/10/2026: suíte completa de figurinos (26 conjuntos × 28 corpos; 84 casos de cobertura, 1.280.495 vértices, zero falhas), seguida de repetição dos quatro conjuntos dos últimos ajustes em seis corpos (18 casos, 420.346 vértices, zero falhas). Os 20 novos passaram no navegador, com Worker, cores, cache abaixo de 500 ms e GLB/12 clipes; sem erros de console. Os 13 anteriores passaram na regressão do navegador e na comparação por hash com a referência. Capturas comparativas: 60 pares com câmera idêntica, 20 pranchas e três resumos. Artefatos locais em `/workspace/outputs/refinamento`; o ZIP de entrega inclui apenas a galeria final e relatórios, sem capturas intermediárias. **Todos os 20 permanecem pendentes de aprovação visual.**

Avaliando estes renders, continuar os ajustes indicados pelo usuário. Não declarar que as referências de qualidade cinematográfica foram alcançadas; locomoção, cavalgada e efeitos mágicos continuam fora desta rodada.

## Etapa concluída — menu FIFA/PES

O ateliê tem interface azul-marinho/turquesa com categoria → subcategoria → opções por cartões com **prévias 3D reais da aparência atual antes de clicar ou passar o mouse**:

- **Personagem:** Humanos, Criaturas, Vegetais, Robôs.
- **Corpo:** Tipo físico (Magro, Padrão, Gordo, Musculoso), Ajuste de peso e músculo.
- **Aparência:** Pele, Cabelo, Barba.
- **Roupas:** Conjuntos completos, Parte de cima, Parte de baixo, Calçado, Capa e manto, Cinto, Extras.
- **Acessórios:** Cabeça, Orelhas, Testa, Enfeite de cabelo, Rosto.
- **Expressões:** Expressões prontas, Olhos e olhar, Boca e sorriso, Sobrancelhas, Piscar e falar.

Câmera (corpo, rosto, frente, perfil, 3/4, costas), mostrar corpo, restaurar visual e exportar GLB continuam junto da visualização. Cores da roupa só aparecem na peça aberta, em seção expansível, e apenas nos canais usados. O menu mantém escolhas e identidade de cada personagem.

## Regras a preservar

Português do Brasil no código, comentários, interface e atendimento. Three.js 0.180, JavaScript puro, import map CDN, sem build, sem assets de modelo externos, sem APIs de geração ou cobrança.

**Não modificar geometria, rosto, rig, blendshapes, clipes, corpo, cabelo, acessórios, proporções nem modelagem de roupas sem autorização nova.** Nunca reverter o trabalho de tipos físicos, figurinos ou menu. Preservar cores ao vivo, combinações válidas, cache e exportação GLB. Não aplicar nem descartar o stash histórico `Refinamento de roupas em andamento antes dos tipos físicos`.

## Arquivos da etapa

- `index.html`: integração do editor e seus controles originais; cena e exportação mantidas.
- `src/editor.js`: categorias/subcategorias, seleção e visibilidade de controles; `window.__atelie.editor`.
- `src/editor.css`: design responsivo em azul-marinho/turquesa.
- `src/previews.js`: fila lazy via IntersectionObserver, Worker, URLs em memória, cache persistente IndexedDB, chave por aparência; invalidação específica das prévias de brincos.
- `src/preview-spec.js`: copia escolha e visual para renderização sem tocar o personagem principal.
- `src/preview-worker.js`: cena própria Three.js/OffscreenCanvas com geradores já existentes. Miniatura de brincos usa câmera 3/4 lateral e enquadramento com margem.
- `src/fabric.js`: correção apenas de cópia dos índices de tecido, substituindo `ids.push(...faces)` por laço equivalente. **As mesmas faces, posição e orientação** são preservadas; evita `Maximum call stack size exceeded` quando há muitos índices no Worker.
- `tests/menu-previas.cjs`: percorre todo o catálogo, confere miniaturas e cenário independente, grava imagens, verifica cache, mobile, controles e GLB; em falha salva diagnóstico e captura.
- `tests/visuais.cjs`, `tests/visuais-tipos.cjs`, `tests/figurinos.mjs`: regressão 3D, rig, roupas, tipos físicos e GLBs.
- `.github/workflows/validar-menu.yml`: três suítes em GitHub Actions com Chromium/Playwright e relatórios PNG; `validar-tipos.yml`: 52 combinações de personagem/tipo físico e GLB.
- `.github/workflows/publicar-capturas.yml`: só após validação bem-sucedida gera galeria HTML e publica PNGs na branch isolada `capturas-atelie`.
- `.github/workflows/pages.yml`: inclui a galeria validada no Pages sob `/capturas/`, sem acrescentar binários à branch `main`.

**Import maps e Workers:** `previews.js` resolve imports em URLs blob, usando a regex limitada a imports/exports no começo da linha. Não ampliar a regex indiscriminadamente: comentários em addons do Three.js têm exemplos de imports falsos.

## Resultados medidos em 20/10/2026

**Validação completa aprovada** na execução https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39499185385 :

- **26 telas de subcategoria**, com **118 miniaturas reais renderizadas**; imagens de 26 telas e 6 estados especiais (mobile e mudanças de personagem).
- **144 imagens** encontradas no cache persistente, teste de cache após recarga concluído.
- Os quatro tipos físicos aparecem simultaneamente sem precisar hover/clicar, e prévias não aplicam alterações ao personagem.
- Controles de peso/músculo, expressões, cores ao vivo, troca de personagem, câmera e mobile 390 px sem rolagem horizontal passaram.
- GLB do teste de menu preservou os **12 clipes faciais**; teste visual aprovado nos **13 personagens** (frente/3/4), com GLB, rig, materiais, acessórios e roupas. Robô tem casco e exportação própria.
- `tests/figurinos.mjs` passou, incluindo os **36 casos de cobertura** geométrica.
- A suíte adicional `tests/visuais-tipos.cjs` passou em https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39501492507 — **52 GLBs (13 × 4 tipos físicos)**, identidade do rosto e rig preservadas. Essa execução não gerou 224 imagens repetidas (`ATELIE_CAPTURAR=0`), mas verificou todas as exportações.

**Histórico do defeito corrigido:** duas miniaturas da seleção Humanos (anão e palhaço) falharam no Worker por exceder o número máximo de argumentos de `Array.push(...faces)`, não por problema de geometria. Copiar os mesmos índices com laço resolveu; a rodada completa posterior passou.

**Atenção:** a aprovação técnica não é a aprovação estética definitiva do usuário. Ele ainda pode pedir ajustes de UI/câmera, mantendo o modelo 3D intacto.

## Capturas e produção

Aplicação: https://aruanmf446-hub.github.io/quemsoueu/
Galeria geral: https://aruanmf446-hub.github.io/quemsoueu/capturas/
**Todas as 26 subcategorias:** https://aruanmf446-hub.github.io/quemsoueu/capturas/menu/index.html
**13 personagens, frente/3/4:** https://aruanmf446-hub.github.io/quemsoueu/capturas/personagens/index.html

Cada imagem abre individualmente, sem precisar baixar ZIP. A branch `capturas-atelie` guarda os arquivos, a `main` permanece apenas código, testes, documentação e workflows. Também há artefatos de cada suíte no GitHub Actions.

## Continuação segura

Não há mais pendências de testes do menu de base ou dos 52 GLBs. Para qualquer ajuste solicitado no futuro, ler o estado atual da `main`, preservar os módulos de modelagem e executar novamente os testes em GitHub Actions; entregar screenshots novos e verificar o Pages.

O trabalho pode ser executado por GitHub Actions mesmo quando o terminal local `/workspace/quemsoueu` não estiver disponível. Em outros ambientes, clonar a branch `main` e rodar servidor estático `python3 -m http.server 8000`, Three.js 0.180, Playwright e Chromium. Os scripts assumem Chromium em `/usr/bin/chromium`.

**Design é de propriedade do usuário:** direção estética cartoon 3D estilizado, comparação com referências, e escolha do visual precisam de revisão humana.

## Nova prioridade — fluidez com qualidade visual preservada

A integração com o jogo foi adiada pelo usuário; **não** desenvolver loja, skins comerciais ou integração com o jogo nesta fase. O foco do Ateliê é resposta fluida sem diminuir resolução, densidade geométrica, sombras, iluminação, rig, materiais ou qualidade de exportação.

Mudanças implementadas em 20/10/2026:

- `src/previews.js`: o agendador das miniaturas ganhou `hold(motivo, ativo)` e estado `waitingForInteraction` em `stats()`. Enquanto há um gesto no canvas, somente a **próxima tarefa do Worker** é adiada; uma geração já em andamento prossegue até terminar. Fila, cache e imagens produzidas são mantidos.
- `src/editor.js`: pausa de agendamento de novos trabalhos durante rotação por mouse/toque, zoom (até 220 ms após o último scroll), perda de foco e aba em segundo plano. Retomada ao fim do gesto; nenhum ajuste de renderização do personagem.
- `src/previews.js`: uma única cópia do estado-base por atualização dos cartões, preservando os visuais individuais dos personagens.
- `tests/fluidez.cjs` e `.github/workflows/validar-fluidez.yml`: suíte específica de interação usando Playwright, além das verificações existentes.
- `README.md`: documentação da estratégia sem queda de fidelidade.

**Regressão aprovada:** o CI do menu, modelos e geometria já passou para o código de `src/editor.js` e `src/previews.js` modificados, na execução https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39504990256 . Esses testes cobrem todas as 26 subcategorias e as 118 prévias, rig, 13 personagens, GLB, cache e 36 casos geométricos.

**Teste extra de gestos APROVADO:** execução https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39507159296 . Verificou eventos reais de mouse, rotação, zoom, liberação após perder foco, retomada da fila, navegação entre quatro subcategorias, renderização das quatro miniaturas de corpo e preservação do estado visual. O tempo de navegação dessas quatro subcategorias foi 16,7 ms sob Chromium/SwiftShader nesta execução; não representa FPS ou latência de todas as máquinas. Os erros das tentativas anteriores decorreram de eventos de ponteiro simulados incorretamente e espera por cartões fora da área visível; a versão final do teste usa mouse real e rolagem individual de cartões. O último deploy do Pages para a `main` também passou (https://github.com/aruanmf446-hub/quemsoueu/actions/runs/39507390583). Nenhuma pendência técnica aberta nesta entrega; avaliação de fluidez no dispositivo final continua sendo uma etapa de aceitação, não um teste já realizado.

A versão publicada mantém exatamente os mesmos parâmetros do renderizador WebGL original: **nada de reduzir qualidade para conseguir FPS**. Avaliar os ganhos reais no dispositivo do usuário antes de atribuir qualquer percentual de aceleração. Quando precisar prosseguir, priorizar testes de interação, tempo de resposta e fluidez do menu, sem mexer no conteúdo visual.

## Solicitação posterior — roupas respeitando o tipo físico

O usuário reprovou a folga excessiva das roupas no orc magro e o cós/volume da cauda da sereia. Esta etapa foi iniciada sobre `8655440`, preservando os avanços de menu e fluidez. As alterações ficam em `src/outfits.js` (limite de queda do contorno, folga proporcional, saiote mais próximo, cauda medida no corpo), `src/previews.js` (nova versão das imagens em cache) e testes/documentação. Não alterar o corpo para fazer a roupa caber. As prévias já preservam `look.build`; a causa do volume era o cálculo da roupa, não a perda da seleção de peso.

Novos testes: `tests/ajuste-roupas.mjs` (incluído em figurinos) e `tests/encaixe-roupas.cjs` (comparação com `8655440`, frente/perfil/3-4, corpo idêntico, GLB). Conferir os resultados da entrega mais recente antes de retomar outra etapa estética.

Verificação do encaixe (20/10/2026): 36 casos de cobertura, 386.486 vértices e zero falhas; 12 casos adicionais de limites de folga. Foram comparados dez casos de orc/sereias em frente, perfil e 3/4, com o corpo idêntico ao da referência. Os 13 personagens passaram na regressão visual e de GLB; 700 trocas de peças e cores, maior p95 em cache de 18 ms nesta execução, sem erros de console. As prévias reais do catálogo preservaram o orc magro. A aprovação estética final continua com o usuário.

Galeria reproduzível: `python3 tests/galeria-encaixe.py renders/encaixe` (Pillow). Nesta execução, arquivos em `/workspace/outputs/encaixe-roupas/`; produção publica pela main. Rosto, corpo, rig, cabelo, acessórios e proporções não foram modificados.

## Correção posterior — controles do corpo e peso

O usuário relatou que Magro/Gordo e Peso não produziam mudança visível. A medição dos controles confirmou a variação real das cinturas nos corpos originais; foram reproduzidos três estados de falha de visualização na versão `60f7e90`: aplicar após close do rosto, aplicar com o corpo oculto e entrar em Corpo após editar o rosto. A correção no `index.html` e `src/editor.js` enquadra/mostra o corpo ao usar os controles, preserva os cartões durante o toque, confirma o valor final em `change` e mostra feedback de aplicação. A causa específica no dispositivo do usuário ainda depende de sua confirmação; não afirmar que o gerador de corpos estava quebrado.

Não modificar as roupas nesta etapa: o usuário pediu para ignorar esse tópico caso o encaixe já estivesse validado. Os geradores de corpo, cabeça, rig, cabelo e acessórios também permanecem intactos. Novos testes `tests/controles-corpo.cjs` e `tests/corpo-visivel.cjs`, incluídos no CI do menu, medem cintura real após cliques/toques, arraste, visibilidade e GLB. Artefatos locais em `/workspace/outputs/controles-corpo/`.


## Reino da Lua — novas identidades

Pedido: criar versões simples das seis referências, separando malha, rosto, corpo e acessórios. IDs novos: `paysandu_wolf`, `nana_explorer`, `moon_guardian`, `nico_inventor`, `ruby_sorceress`, `ruby_raven`. Não substituir os personagens originais. Humanos derivados de presets e proporções existentes; Nico usa a base infantil sem seios. Quatro conjuntos `lunar_*` usam os mesmos geradores de caimento e slots. Dois estilos de cabelo derivados, coroa lunar, óculos de inventor e visor entram no catálogo.

Os companheiros têm gerador próprio em `src/companions.js`, com grupos separados e rig simples de expressões (12 clipes, sem morphs humanos). Equipamento opcional e cores ao vivo em Acessórios → Cabeça; malha de ave/quadrúpede não recebe roupa ou tipo físico humano. Sem transformação demoníaca ou efeitos de partículas nesta etapa. `tests/reino-lua.cjs` gera os renders e valida Worker/GLB; `tests/figurinos.mjs` inclui as novas identidades e os corpos novos.


Validação: seis novos modelos com GLB de 12 clipes e Worker real, sem erros de console; 18 conjuntos e 16 corpos na suíte geométrica, 48 casos de cobertura / 535.572 vértices / zero falhas. A jardineira do Nico usa um recorte deslocado da malha da própria camisa, não uma parede SDF fina. A máscara do corvo sai com o equipamento. Renders locais: `/workspace/outputs/reino-lua/` (frente, 3/4, costas, rosto e base sem equipamento). Avaliação estética continua com o usuário.


## Floresta — novas referências para refinar depois

Criadas sete primeiras versões reaproveitando o Ateliê e manter todas na lista de refinamento do README: arqueira, arqueiro, guarda feminina, guarda jovem, guarda veterano, artífice e princesa. IDs `forest_archer_f`, `forest_archer_m`, `forest_guard_f`, `forest_guard_m`, `forest_guard_veteran`, `forest_artificer`, `forest_princess`. Dados e símbolos em `src/forest.js`; quatro figurinos com o encaixe existente, equipamento no slot Extras e monóculo no catálogo de acessórios. Manter os personagens anteriores e o rig intactos. Os detalhes finos das referências ficam para depois; aprovação visual depende do usuário.

Validação local: `tests/figurinos.mjs` passou em 22 conjuntos × 23 corpos; cobertura de 69 casos / 904.506 vértices / zero falhas. `ATELIE_SOMENTE_RENDERS=1 node tests/visuais.cjs` passou nos 26 personagens. `tests/floresta.cjs` verifica os sete novos personagens com cinco capturas por modelo, GLB, expressões, Worker, cores e cache. Renders locais: `/workspace/outputs/floresta/`; todos os novos modelos continuam sem aprovação estética.


## Deserto — identidades e variações para refinar depois

Novos IDs: `frontier_cowboy`, `desert_fennec`, `cowboy_on_fennec`, `bread_baker`, `bread_vigilante`, `cactus_soldier`, `cactus_soldier_large`. Todos estão na fila do README. Preservar cowboy/feneco independentes e a combinação por equipamento do feneco. Padeiro/vigilante usam o mesmo rosto e corpo, mas visuais separados. Soldados normal/grande usam dois portes novos; não modificar proporções de personagens anteriores. Dados em `src/frontier.js`; roupas nos geradores existentes; feneco e montagem em `src/companions.js`. Corpo sentado é estático; o rosto do cavaleiro reutiliza o rig humano, com nomes prefixados no GLB. Não há cavalgada nem efeitos. Teste e renders: `node tests/deserto.cjs`.

Verificação das skins do deserto: 26 conjuntos nos 28 corpos humanoides; 84 casos de cobertura consultaram 1.280.495 vértices, sem falhas. Juntas, encaixe do pescoço e volume crescente nos tipos físicos passaram; a malha do soldado grande é mais alta e larga que a normal. As sete novas skins exportaram GLB com 12 clipes, geraram prévias no Worker e passaram na troca de peças e cores em cache abaixo de 500 ms. A regressão de navegador (`ATELIE_SOMENTE_RENDERS=1`) reúne frente e 3/4 dos 33 personagens, sem erros de console. Há também costas, rosto e base sem equipamento dos sete novos. Todos continuam pendentes de refinamento e aprovação visual.

A montagem recebe `opts.buildRider` de `buildHead`; preservar essa fábrica, sem importar `head.js` em `companions.js`, para evitar ciclos no carregador de módulos do Worker. Artefatos locais: `/workspace/outputs/deserto/` (35 capturas, galeria e relatórios), com regressão dos 33 em `regressao/`.
