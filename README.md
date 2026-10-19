# Quem Sou Eu — Ateliê Facial · Head V2

Protótipo separado do jogo principal para aprovar a anatomia facial de personagens cartoon 3D. A V2 é a base de **cabeça/rosto** (sem cabelo, corpo ou figurino) já preparada para originar vários personagens.

## Ver no navegador
https://aruanmf446-hub.github.io/quemsoueu/

Para rodar localmente, sirva a pasta com qualquer servidor estático (ex.: `python3 -m http.server`) e abra `index.html`. Os módulos ES não funcionam abrindo o arquivo direto (`file://`). Usa Three.js via CDN, sem build, Vercel, API de geração, Supabase ou serviços pagos.

## O que a V2 faz
- **Malha única do rosto**: crânio, mandíbula, queixo, nariz, lábios, bochechas e pálpebras são esculpidos na mesma malha (sem blocos soltos). A pele envolve o globo ocular e a abertura do olho é recortada na própria malha.
- **Olhos**: globo com íris texturizada (procedural), córnea, brilhos, pálpebra superior/inferior com borda arredondada e linha de cílios (com *flick* no preset feminino).
- **3 presets** com identidade própria, trocados por botões:
  - `feminine_soft` — queixo suave, olhos amendoados com cílios, sobrancelha arqueada, lábios cheios.
  - `masculine_soft` — mandíbula mais estruturada, sobrancelha firme, nariz mais reto.
  - `cute_round` — rosto redondo, olhos grandes e baixos, bochechas cheias, sorriso doce.
- **Ajuste fino** por sliders (largura do crânio, bochechas, mandíbula, olhos, distância entre olhos, nariz, boca), aplicados por cima do preset. Trocar de preset zera os sliders. Durante o arraste é usada uma malha de prévia mais leve; ao soltar volta a malha completa.
- **Câmera**: rotação livre, zoom e botões Frente / Perfil / 3/4.
- **Exportação GLB** da cabeça (≈3,4 MB, 23 malhas nomeadas: `Head_Skin`, `Eye_L/R` com `Sclera`/`Iris`/`Cornea`, `Brow_L/R`, `Ear_*`, `Neck`…).

## Estrutura
```
index.html        interface, cena e exportação
src/presets.js    dados dos 3 presets + aplicação dos sliders
src/head.js       geração procedural da cabeça (perfil, relevo facial, olhos, etc.)
```
Para criar um novo preset, adicione uma entrada em `PRESETS` (`src/presets.js`) e inclua o id em `PRESET_ORDER` e em `SUBS` (`index.html`).

## Limites desta versão
Base de rosto, não personagem final: não há cabelo, corpo, figurino, blendshapes, rig facial nem topologia de produção (a malha é uma grade procedural densa, não *edge loops* de animação). Pele com cor por vértice, sem textura pintada. A referência visual da princesa sereia é a direção de arte para revisão manual, não um resultado reproduzido.

## GitHub Pages
Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** se ainda não estiver ativo. O workflow em `.github/workflows/pages.yml` publica a cada commit da main.
