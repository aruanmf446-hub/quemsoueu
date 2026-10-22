# Continuidade — Ateliê Quem Sou Eu

## Orientação de entrega

O usuário determinou: **sempre subir o trabalho para a `main`**. Ao concluir uma rodada, validar, registrar as alterações e enviar à `main`, preservando alterações remotas e sem force push. Distinguir o envio do código da conclusão do deploy do site.

## Escopo atual — qualidade técnica de todos os 34 personagens (22/10/2026)

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
