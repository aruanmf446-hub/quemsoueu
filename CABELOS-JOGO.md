# Cabelos estilizados para jogo

O usuário enviou exemplos de cabelos do Fortnite e pediu adaptar as bases existentes. A rodada e24a297 foi considerada inconsistente: excesso de detalhe e aspecto rígido em alguns cortes. Esta adaptação prioriza volumes legíveis no jogo, mantendo penteados, cores, rostos e proporções.

- Removidas as fibras geométricas finíssimas sobrepostas às mechas. Os sulcos agora são mais largos e rasos, com menos repetição.
- Reduzidos segmentos e amostras das seções, preservando a projeção das guias sobre o crânio, cobertura da nuca e raízes integradas.
- Menos agrupamentos redundantes nas massas de cachos. A Nana mantém o rabo lateral e as mechas coloridas, com menos mechas puxadas e espirais mais abertas.
- Material exclusivo do cabelo com microtextura e brilho direcional mais discretos. O material compartilhado da barba, iluminação, acessórios e roupas não foram alterados.
- Cache de prévias atualizado para `menu-v27-cabelos-estilizados`.

## Verificação

`node tests/qualidade-pelos-acessorios.mjs /workspace/outputs/cabelo-base-e24a297`: 34 personagens, 121 superfícies de rosto/barba preservadas, 17 penteados, 21 acessórios e cinco modos de barba. O teste conserva as tolerâncias de contorno anteriores. `node tests/referencias-tres-herois.mjs`: proporções do Nico, visor da Nana e máscara/capuz do Vigilante preservados.

Comparando os 17 penteados no mesmo encaixe de cabeça, a soma passa de 3.555.026 para 1.621.262 triângulos: redução de 54,4%, com redução individual entre 45,2% e 68,9%. Isto mede a geometria do cabelo, não o personagem inteiro nem a taxa de quadros do jogo. Relatório local: `renders/cabelos-jogo/validacao/malhas.json`.

Cinco exportações GLB verificadas (Nana, Nico, Vigilante, Guardiã da Lua e Feminino intenso), com materiais, UVs, tangentes e 12 animações cada. Três caminhos de prévia no Worker verificados: Nana, Nico e Guardiã da Lua. Relatório local: `renders/cabelos-jogo/exportacao/relatorio.json`.

[Galeria de comparação](revisao/cabelos-jogo/): nove exemplos em 3/4 e de costas, 36 imagens, base e24a297. Capturas reais do editor usando o mesmo procedimento de câmera. Busca, imagens e layout verificados em desktop e celular. Os testes atestam funcionamento e preservação, não aprovação estética.
