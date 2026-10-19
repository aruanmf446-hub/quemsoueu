# Quem Sou Eu — Ateliê Facial V1

Protótipo separado do jogo principal para aprovação de anatomia facial cartoon.

## Ver no navegador
https://aruanmf446-hub.github.io/quemsoueu/

Abra `index.html` em um servidor local ou use GitHub Pages. Usa Three.js via CDN, sem Vercel, API de geração, Supabase ou serviços pagos.

## O que a V1 faz
- Gera uma cabeça 3D por código, sem reaproveitar a malha MakeHuman do jogo.
- Expõe controles de crânio, mandíbula, bochechas, olhos, nariz e boca.
- Permite rotacionar, conferir frente/perfil/3⁄4 e exportar o protótipo em GLB.
- Mantém o jogo original em `aruanmf446-hub/Quem-sou-eu` intacto.

**Limites:** isto é um piloto de volumes e proporções, NÃO uma personagem pronta de qualidade cinematográfica; não é reconstrução 3D da imagem 2D. Não possui topologia facial de animação, blendshapes, rig de face, corpo, cabelos, figurino nem materiais finais. A referência visual da princesa sereia é a direção de arte para revisão manual.

## Aprovação antes de prosseguir
Avaliar a silhueta de frente e perfil, olhos, espaço nariz-boca, maxilar e continuidade anatômica. Só depois investir em topologia de produção, rig e corpo.

## GitHub Pages
Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** se ainda não estiver ativo. O workflow em `.github/workflows/pages.yml` publica a cada commit da main.
