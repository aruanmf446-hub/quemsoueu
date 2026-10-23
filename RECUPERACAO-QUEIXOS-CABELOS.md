# Recuperação dos queixos e continuação dos cabelos

## Problema e resultado

O ajuste `22251b2` transformou a região inferior do rosto em um bloco alongado. Foi removida a extensão e a reprojeção de toda a faixa mandibular. O gerador da cabeça, os perfis faciais e a resolução dos parâmetros retornam à base `eeaa4f0`, preservando as diferenças de identidade e o refinamento facial anterior. Trata-se da retirada de uma regressão; os queixos originalmente recuados ainda podem precisar de refino localizado após avaliação do usuário.

## Cabelos

Os 17 penteados compartilham as correções de construção:

- seção elíptica completa, com profundidade mínima nas mechas que antes eram lâminas;
- sulcos mais rasos;
- raízes afinadas e assentadas na cobertura, reduzindo tampas aparentes;
- implantação contínua entre testa, têmporas e nuca;
- mais camadas laterais nos cortes curtos; franja da Arqueira mais estreita, espessa e ondulada.

As tranças e os cordões mantêm a seção própria. O parâmetro de intensidade de sulco preserva o valor antigo quando omitido, para não alterar as barbas e outros consumidores. Não há mudança na iluminação, exposição, figurinos ou desenho dos acessórios.

## Conferência e limites

As capturas usam o jogo real, com câmeras iguais antes e depois. O antes vem de `22251b2`; o depois com cabelo é recapturado. A escultura sem cabelo do depois reutiliza `eeaa4f0`, com igualdade dos rostos verificada por comparação de geometria. Artefatos locais: `renders/recuperacao-cabelos/`. Prévias: `menu-v18-queixos-cabelos`.

Validação técnica: 34 identidades e 109 peças anatômicas comparadas com a base; 17 penteados com geometria alterada e normais válidas; 21 acessórios e cinco barbas válidos; continuidade labial, apoio localizado, pescoço, óculos e criaturas conferidos. Cinco GLBs (Arqueira, Nico, Nana, Guardiã e Guardião) preservam 12 clipes, mapas, UVs e tangentes; três Workers e a recoloração pelo controle real passaram. A galeria mostra 34 personagens e 136 imagens. Os testes não decidem aprovação estética. A qualidade continua em refinamento e não corresponde ainda às imagens de referência.
