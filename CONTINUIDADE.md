# Continuidade — Ateliê Quem Sou Eu

Repositório: `aruanmf446-hub/quemsoueu`, branch `main`.
Site: https://aruanmf446-hub.github.io/quemsoueu/

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

**Teste extra de gestos:** https://github.com/aruanmf446-hub/quemsoueu/actions/workflows/validar-fluidez.yml . A suíte nova foi ajustada para não exigir eventos artificiais de `setPointerCapture` e para respeitar o carregamento preguiçoso (`IntersectionObserver`). Conferir o resultado da execução mais recente antes de reportá-la como aprovada. Não confundir falha de teste de captura sintética com defeito do render 3D.

A versão publicada mantém exatamente os mesmos parâmetros do renderizador WebGL original: **nada de reduzir qualidade para conseguir FPS**. Avaliar os ganhos reais no dispositivo do usuário antes de atribuir qualquer percentual de aceleração. Quando precisar prosseguir, priorizar testes de interação, tempo de resposta e fluidez do menu, sem mexer no conteúdo visual.
