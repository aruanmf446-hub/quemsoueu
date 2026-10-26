# Modelos enviados para o Ateliê

## Arqueira da floresta

- Fonte: arquivo `fantasy+archer+3d+model.glb` anexado pelo usuário nesta conversa para integração ao projeto.
- Destino: `forest-archer.glb`. Binário preservado sem alterações.
- SHA-256: `1ac4f52f937a6cd5fbeafbe1398af76e7ad08dd0de697f2ad800b15b105d93e9`.
- Gerador declarado no arquivo: Tripo. Esqueleto com nomes Mixamo, 65 juntas.
- 2.587.732 bytes, 15.117 vértices, 19.077 triângulos, um material com textura JPEG 2048×2048.
- Clipes originais: `dance_04` (10,792 s), `wait` (6 s), `sob` (5,583 s).
- A normalização para o palco é feita em grupos externos em tempo de execução. Malha, textura e clipes da fonte permanecem intactos.
- Integração local sem submissão a Tripo/Mixamo e sem gasto de créditos.

## Nana exploradora — fonte e preparação local

- Fonte: `stylized female character 3d model (1).glb`, enviado pelo usuário como Nana com rig e sem movimentos.
- Original intacto: `sources/nana-explorer.glb`, 1.836.636 bytes, SHA-256 `e76c2cbf5e01fe03aeaa0d729c9ea5f94cfc813fe89ec248421e29f25003d91e`.
- Cópia preparada: `nana-explorer.glb`, 2.181.440 bytes, SHA-256 `3e9f8042191968579d34704798c22174b72c2d8908f85d61eeb0ac7a38628f42`.
- Fonte e cópia têm 13.706 vértices, 19.610 triângulos, 48 juntas e zero clipes armazenados.
- A fonte tinha quase todos os vértices no quadril. A cópia corrige o referencial do vínculo e usa pesos de calor de um proxy Blender 4.3.2 transferidos para a geometria original, com transição de cabeça/pescoço. Posições, normais, UV, índice e JPEG foram preservados exatamente.
- Cinco movimentos da biblioteca existente são adaptados no carregamento, sem geração externa; créditos CMU/cgspeed em [../motions/PROVENANCE.md](../motions/PROVENANCE.md). O GLB exportado inclui esses clipes.
- Preparação, testes e limites em [../../NANA.md](../../NANA.md).
