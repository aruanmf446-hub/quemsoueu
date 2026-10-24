# Acabamento compartilhado dos cabelos

O usuário reprovou o resultado de `4920be1` por parecer plástico e esclareceu que as skins estão quase prontas. O objetivo desta rodada é uma superfície estilizada aceitável para jogo, sem redesenhar os penteados individualmente.

A mudança fica na seção das mechas e nos materiais: menor espessura e abaulamento, sulcos mais rasos, mapas direcionais com frequências mais largas e reflexão especular reduzida. Guias, distribuição de mechas, penteados e cores base não mudam. O número de triângulos permanece igual ao da rodada anterior. Rostos, corpos, roupas, acessórios e iluminação não foram editados.

`groomSurface` aceita `stylized`, usado somente por `hero-hair.js`. A configuração padrão dos pelos mantém exatamente os mapas anteriores, preservando as barbas. A base do cabelo e as mechas coloridas recebem o acabamento correspondente. Mapas e materiais são exportáveis; não há substituição das malhas por imagens. Cache de prévias: `menu-v28-acabamento-cabelo`.

## Verificações

- `node tests/qualidade-pelos-acessorios.mjs /workspace/outputs/cabelo-base-4920be1`: 34 personagens, 121 superfícies de rosto e barba preservadas, 17 penteados, 21 acessórios, cinco modos de barba. Mesmas tolerâncias de contorno da rodada anterior.
- `node tests/referencias-tres-herois.mjs`: preservados o tamanho do Nico, encaixe do visor da Nana e a máscara/capuz do Vigilante.
- Comparação dos mapas padrão de `groomMaterial` com a base: albedo, normal e rugosidade idênticos byte a byte; parâmetros do material padrão iguais.
- Cinco GLBs: Nana, Nico, Arqueira, Guardiã da Lua e Feminino intenso, com UVs, tangentes, mapas e 12 animações cada. Três prévias no Worker: Nana, Nico e Guardiã da Lua.

[Comparação](revisao/acabamento-cabelo/): seis exemplos em close antes/depois e com corpo inteiro atual no editor, 18 imagens. Câmeras de close verificadas numericamente. Testes técnicos não significam aprovação estética.

Capturas locais: `renders/cabelo-acabamento/`. Base imutável: `/workspace/outputs/cabelo-base-4920be1`. As duas capturas anteriores de Guardiã da Lua e Feminino intenso foram refeitas na base imutável para conservar seus metadados de câmera; os outros quatro exemplos usam as capturas verificadas da rodada anterior.
