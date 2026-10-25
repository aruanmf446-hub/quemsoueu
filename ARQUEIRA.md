# Arqueira da floresta — refinamento individual

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
