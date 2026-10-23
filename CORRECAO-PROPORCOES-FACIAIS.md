# Correção das proporções faciais

O usuário reprovou `b119a58` com uma comparação de `feminine_soft`: o rosto ficou com olhos arregalados, íris enormes e proporções infantis. A rodada anterior corrigiu defeitos técnicos, mas piorou essas proporções. Esta correção não representa aprovação estética nem equivalência às referências.

## Alterações

- Os 23 perfis humanos recuperam distâncias próprias entre olhos, nariz, boca e queixo. As maçãs têm menor projeção; crianças mantêm olhos maiores, enquanto adultos e idosos têm aberturas mais contidas.
- Íris menores deixam mais esclera nos cantos. Pálpebras superiores/inferiores e sobrancelhas recebem relações próprias por identidade, reduzindo o olhar arregalado e a sobreposição entre sobrancelha e pálpebra.
- A textura da íris tem um colarete menos claro e fibras de menor contraste; os reflexos geométricos ficam menores. O mesmo gerador atende os seis vegetais e o cavaleiro da montaria.
- A oclusão por vértice deixa de medir curvatura através do fundo recuado das cavidades. A máscara da sombra sob a mandíbula passa a começar abaixo da boca; antes ela escurecia também a pálpebra inferior e o nariz.
- As prévias invalidam o cache anterior com `menu-v15-proporcoes-faciais`.

Não houve mudança da câmera de produção, iluminação, exposição, penteados, roupas, corpo ou estrutura do rig. Criaturas e robô conservam suas formas. Esta rodada ajusta os 23 rostos humanos e o acabamento compartilhado de pele/íris dos geradores afetados, sem alegar uma nova escultura dos 34.

## Exemplo da captura enviada

Medidas de `feminine_soft` em unidades locais da cabeça, antes da resolução dos controles:

| Medida | b119a58 reprovado | Correção |
| --- | ---: | ---: |
| Raio do globo ocular | 0,285 | 0,256 |
| Abertura superior/inferior | 30° / 25° | 24° / 18° |
| Ângulo da íris | 38° | 29,5° |
| Altura da boca | −0,43 | −0,61 |
| Base do queixo | −0,83 | −1,02 |
| Projeção da maçã na casca | 0,86 | 0,78 |

Essas relações descrevem uma mudança real da malha; não medem beleza ou aprovação.

## Comparação e validação

A [comparação pública](https://aruanmf446-hub.github.io/quemsoueu/revisao/) coloca `b119a58` ao lado da correção, com câmera e iluminação iguais e abas de visual completo e escultura facial. O catálogo inteiro permanece disponível para detectar efeitos compartilhados. As capturas anteriores são as imagens finais daquela versão, preservadas em `renders/correcao-rosto/antes-*`.

Referência de código imutável: `/workspace/outputs/rosto-rejeitado-b119a58`. Artefatos locais em `renders/correcao-rosto/`; logs em `/tmp/correcao-*.log`. A validação técnica inclui continuidade labial, deformações, qualidade orbital/piscada, identidades, encaixes de pescoço/óculos, cabelo/acessórios, exportação e prévias reais. Concluídos: 23 malhas humanas alteradas contra `b119a58`, com as demais formas preservadas; 29 rostos humanos/vegetais com piscada válida; 23 superfícies labiais contínuas; cinco encaixes de óculos (240 amostras) e quatro encaixes de pescoço válidos. Passaram também deformações, identidades, pele, 17 penteados, 21 acessórios e cinco barbas. Os 34 GLBs e seis prévias de expressão no Worker passaram sem erros. Os 34 personagens têm retratos e escultura com câmera fixa; a comparação pública tem 136 imagens e passou em carregamento, abas, busca e celular. O rosto enviado pelo usuário foi conferido também na resolução de sombras de produção (4096), sem mudar a configuração do aplicativo.
