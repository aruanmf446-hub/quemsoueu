# Arqueira — modelo GLB enviado

A escolha posterior do usuário foi aproveitar `fantasy+archer+3d+model.glb`. A arqueira padrão no editor usa agora esse arquivo; a implementação procedural anterior permanece no código e no histórico. A aprovação estética continua pendente.

## Integração atual

- Arquivo original intacto em `assets/characters/forest-archer.glb`, 2.587.732 bytes, 19.077 triângulos, 15.117 vértices, textura JPEG 2048², 65 juntas, três clipes (`wait`, `sob`, `dance_04`).
- Catálogo `src/imported-character.js`: caminho relativo à base do site, normalização uniforme para 7 unidades, sola em −5,2, capacidades e mapeamento dos clipes. Serve tanto ao editor quanto ao Worker. Buffer em cache; cada instância tem cena/rig/materiais independentes.
- O editor mantém altura, câmera, vistas e exportação; pausa, posição, velocidade e esqueleto funcionam com os clipes nativos. A exportação cria uma instância independente, conserva a malha/rig/textura e grava a altura, sem parar a animação que está na tela.
- Download atrasado não substitui a seleção mais recente. Falha de carregamento preserva o ator anterior e permite nova tentativa. Trocar de volta a um personagem procedural recupera seus controles e cinco movimentos.
- O menu explica as capacidades ausentes. Não há morphs de peso/músculo, separação de roupas/cabelo ou rig facial neste GLB. Não fabricar resultados desses controles por escala grosseira ou recoloração global da textura.

Teste: `node tests/modelos-importados.cjs`, com servidor na porta 8000. Inspeciona nove poses, dados finitos, três alturas com apoio dos pés, controle de capacidades, GLB exportado/reimportado com 65 juntas/3 clipes/19.077 triângulos, Worker, desktop/celular, seleção concorrente e retorno ao gerador. Capturas/relatório em `renders/importados/` por padrão (`ATELIE_RENDERS` altera a pasta).

## Próximas etapas para o jogo

Validar esta integração visual antes de migrar outros personagens. Cada novo modelo precisa ter origem registrada, escala/frente/sola conferidas, capacidade real declarada e animações verificadas. Personalização modular requer corpo completo, peças separadas, encaixes, pesos compatíveis e variações de corpo aplicadas também às roupas. Expressões requerem morphs/ossos faciais preparados; movimentos compartilhados precisam de retargeting entre as poses e esqueletos. Esta primeira integração não adiciona essas capacidades nem resolve colisões de tecido em todos os quadros do arquivo original.

Nenhum crédito Tripo foi usado. A lista do README permanece pendente até aprovação explícita do usuário.

---

## Histórico do refinamento procedural anterior


Base: `ffc9f80`, em 25/10/2026. O usuário escolheu refinar a malha atual do Ateliê. A referência enviada orienta silhueta, cabelo, linho, couro e camadas. A comparação apresenta renders do projeto; a aprovação artística continua pendente.

[Comparar frente, 3/4, costas e rosto](revisao/arqueira/). [Abrir a personagem](https://aruanmf446-hub.github.io/quemsoueu/?personagem=forest_archer_f).

- **Cabelo:** estilo separado `archer_braid`, com volume na coroa/nuca, franja diagonal e três cordões entrelaçados. Os penteados compartilhados permanecem disponíveis.
- **Corpo e rosto:** ombros mais largos, cintura menos estreita e pescoço mais curto só na arqueira. Cabeça e altura total mantidas. Sardas mais finas e blush mais discreto; anatomia facial e blendshapes mantidos.
- **Roupa:** `forest_huntress` usa os campos `garment`, `envelope`, `trousers` e `beltOn`. Blusa clara acima de um corpete baixo, mangas franzidas, short sob tecidos assimétricos, lenço e capa curta. Arco, aljava, bolsas, braçadeiras e botas continuam separados nos seis slots.
- **Funcionamento:** cores ao vivo, peso/músculo, altura e cinco movimentos preservados. Cache de vínculos só para o figurino novo, sem alterar os pesos calculados. Máscaras de pele diferenciam as combinações de peças.

## Validação desta rodada

Cobertura de 43.056 vértices nos builds magro, gordo e musculoso, sem falhas. Tipos físicos preservam juntas/pescoço entre builds e volume crescente. O rig passou com 26 ossos; maior estiramento da arqueira: 2,709×, abaixo do limite existente de 6×. Controle da guarda feminina e seus figurinos preservados.

O navegador verificou peças, cores, cache, cinco movimentos, Worker e GLB de 17 clipes com 11 blendshapes faciais. Maior troca em cache: 136,3 ms nesta execução Chromium/SwiftShader. GLB: 63,72 MiB. A verificação de poses finitas não equivale a uma simulação de colisão de tecido em todos os quadros.

Os 33 presets, proporções corporais e visuais padrão fora do alvo foram comparados com a base; dois figurinos compartilhados também foram comparados por hash. Dados de movimentos e rig facial não foram modificados. A pendência histórica de cobertura da Nana fica fora desta rodada.

Comandos usados:

```sh
node tests/arqueira-preservacao.mjs /copia/da/base-ffc9f80
node tests/arqueira-rig-cache.mjs
ATELIE_PERSONAGENS=forest_archer_f ATELIE_COBERTURA_TIPOS=1 node tests/cobertura.mjs
ATELIE_PERSONAGENS=forest_archer_f ATELIE_FIGURINOS=forest_huntress node tests/figurinos.mjs
RIG_IDS=forest_archer_f,forest_guard_f node tests/rig-corporal.mjs
node tests/arqueira-refino.cjs
node tests/altura-previas.cjs
python3 tests/publicar-arqueira.py /pasta/das/capturas
```

**A arqueira permanece na fila do README. Só a concordância explícita do usuário encerra seu refinamento.**
