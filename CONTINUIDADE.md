# Prompt para continuar no ChatGPT

Continue o desenvolvimento de `aruanmf446-hub/quemsoueu`, branch `main`. Leia este arquivo e o README. O usuário pediu para publicar o trabalho intermediário agora e transferir a conclusão para outro chat. Não reverta o menu nem o trabalho anterior de tipos físicos.

## Objetivo atual

Concluir a organização do editor no estilo FIFA/PES: categoria → subcategoria → opções por cartões com **prévias reais da skin atual, visíveis antes de clicar ou passar o mouse**. O usuário aprovou a estrutura e um mockup azul-marinho com seleção turquesa.

Categorias implementadas:

- Personagem → Humanos / Criaturas / Vegetais / Robôs.
- Corpo → Tipo físico (Magro, Padrão, Gordo, Musculoso) / Ajuste de peso e músculo (arrastar).
- Aparência → Pele / Cabelo / Barba.
- Roupas → Conjuntos / Parte de cima / Parte de baixo / Calçado / Capa e manto / Cinto / Extras.
- Acessórios → Cabeça / Orelhas / Testa / Enfeite de cabelo / Rosto.
- Expressões → Prontas / Olhos e olhar / Boca e sorriso / Sobrancelhas / Piscar e falar.

Câmera, Mostrar corpo, Restaurar visual e Exportar GLB ficam sempre junto da visualização. Foi acrescentada a vista Costas. As cores aparecem apenas na peça ou no slot aberto; as cores da roupa estão em uma seção expansível e filtradas pelos canais efetivamente usados.

## Regras

Português do Brasil na conversa, interface e comentários. Three.js 0.180, JavaScript puro, import map CDN, sem build, sem assets externos nem APIs de terceiros. Não alterar rosto, rig, blendshapes, clipes, corpo, cabelo, acessórios, proporções nem roupas nesta etapa: o trabalho é a organização da interface e suas prévias. Os módulos de geometria existentes não foram modificados. Preservar cores ao vivo, combinações válidas, cache e exportação GLB.

## Implementação intermediária já na main

- `index.html`: integra a navegação, anota os botões com descritores de prévia, preserva os controles e métodos existentes. Exportação continua pelo mesmo código. A área de renderização desconta a barra inferior, evitando cortar os pés. Adiciona `savedLook(id)` no debug.
- `src/editor.js`: monta cabeçalho, categorias e navegação; reaproveita os controles existentes, escondendo as outras seções. Disponível em `window.__atelie.editor`.
- `src/editor.css`: tema e layout responsivo.
- `src/previews.js`: IntersectionObserver para gerar os cartões próximos da área visível; fila em Worker; cache de URLs em memória e blobs no IndexedDB. Imagens WebP procedurais, não arquivos baixados.
- `src/preview-worker.js`: uma segunda cena Three.js, OffscreenCanvas, textura de íris/tela por canvas local. Reutiliza cabeça/corpo/look/roupa entre tarefas quando possível. Usa os mesmos geradores; corpo da miniatura usa célula .05, rosto quality 1 para representar as expressões.
- `src/preview-spec.js`: cópia da escolha que será renderizada e chave normalizada, para clicar em um tipo físico não invalidar as outras imagens.
- Workers não leem import maps: `previews.js` resolve o grafo de módulos em memória com URLs Blob e o mesmo mapeamento de Three.js. A expressão regular só reconhece imports/exports no começo de linha. **Não ampliar indiscriminadamente a regex**: os addons de Three.js têm exemplos de import em comentários que podem introduzir falsas dependências circulares.
- Navegadores sem Worker/OffscreenCanvas mostram mensagem; os botões continuam aplicando a opção.

## Estado de validação — seja honesto

- `node --check` dos módulos novos e scripts editados passou; `git diff --check` passou.
- `node tests/figurinos.mjs` foi executado até o fim. Log em `/tmp/figurinos-menu.log`, incluindo os 36 casos de cobertura dos builds sem falhas registradas. Os geradores geométricos não mudaram.
- Smoke test de Chromium/SwiftShader mostrou os quatro cartões Magro/Padrão/Gordo/Musculoso gerados e a cena principal preservada. Estatísticas: 4 imagens, fila vazia, worker pronto, sem falha. Captura em `/workspace/outputs/menu-smoke.png`. Script temporário `/workspace/atelie-tests/menu-smoke.cjs`.
- **A suíte completa de interface ainda NÃO terminou nem foi aprovada.** `tests/menu-previas.cjs` foi criado e iniciado, mas a execução foi interrompida para publicar imediatamente, conforme solicitação do usuário. Não tratar interrupção como aprovação ou como defeito de código.
- `tests/visuais.cjs` e `tests/visuais-tipos.cjs` foram adaptados para selecionar as categorias antes de clicar nos controles agora ocultos. Essa adaptação ainda precisa ser executada e revisada. O teste de personagem pausa as miniaturas para isolar seus testes geométricos; o teste novo verifica as miniaturas separadamente.
- Não houve validação estética completa, nem capturas de cada subcategoria, nem nova rodada completa de exportação no estado final deste menu.

## Próximas ações concretas

1. Conferir a main e continuar a partir dela; verificar o deploy do Pages.
2. Executar `node tests/menu-previas.cjs` com servidor na porta 8000. Corrigir o que falhar, especialmente fila/cache ao trocar subcategoria, miniaturas de todas as opções e mobile. O teste usa `context.route` para o CDN, pois os workers também precisam do Three.js local. Pode levar vários minutos para renderizar todos os cartões.
3. Conferir visualmente frente/3-4 dos 13 personagens e exportação, usando `node tests/visuais.cjs`, corrigindo os seletores de navegação do teste se necessário. Não modificar a geometria para corrigir problemas de interface.
4. Rever se os closes mostram bem brincos/joias e se os controles e mensagens para robô/vegetais fazem sentido. Melhorar enquadramento da miniatura se necessário.
5. Conferir que os quatro tipos físicos ficam simultaneamente visíveis, as prévias não aplicam opções à cena e o cache funciona após clicar e recarregar. As cores não devem remontar corpo ou cabeça.
6. Gerar e entregar ao usuário capturas de **cada subcategoria**. `tests/menu-previas.cjs` já gera uma galeria em `renders/menu/index.html` quando termina. Copiar para `/workspace/outputs/` para entrega; os renders são ignorados no Git.
7. Atualizar README e este estado, fazer commits pequenos em português, push main, verificar Pages. O visual depende da avaliação do usuário.

## Ambiente e acessos

Repositório local `/workspace/quemsoueu`. Dependências em `node_modules` apontam para `/workspace/atelie-tests/node_modules`: Three.js 0.180 e Playwright. Chromium `/usr/bin/chromium`, SwiftShader. Servidor `python3 -m http.server 8000` pode já estar ativo; log `/tmp/atelie-http.log`. GitHub CLI e git autenticados.

Produção: https://aruanmf446-hub.github.io/quemsoueu/
Workflow `.github/workflows/pages.yml` publica a cada push na main. Não é necessário novo pedido de permissão para concluir o trabalho autorizado.

Há um stash antigo chamado `Refinamento de roupas em andamento antes dos tipos físicos`: **não aplicar nem descartar**, não pertence a esta etapa.
