# Revisão de personagem completo

## Rodada após a reprovação de c4673ef

`c4673ef` também foi reprovado pelo usuário. A rodada atual usa essa versão como antes da comparação. As mudanças desta vez são:

- Mechas do Nico/Padeiro/Vigilante com seção abaulada, afunilamento gradual e fibras que seguem a curva principal; cachos redondos na massa lateral da Nana. Ensaios com escamas e mechas flutuantes foram descartados.
- Nico com terço inferior mais curto, menor projeção do apoio do queixo, sobrancelhas mais próximas dos olhos e armação menor. Nana e o par Padeiro/Vigilante receberam revisão de pálpebras e boca. A córnea menos opaca evita lavar a cor da íris; o material da pele tem menos verniz.
- Capuz construído por seções de largura e profundidade próprias, abertura apoiada na face e cachecol descendo sobre os ombros. Manto mais curto e irregular.
- Pregas modeladas no campo das calças, maior continuidade do volume da cargo, mapas de albedo/relevo/rugosidade nos tecidos e couro, luvas com pontas dos dedos livres no Nico.

Comparação: [revisao/personagens/](revisao/personagens/). Base: `/workspace/outputs/reprovado-c4673ef`. Capturas finais: `renders/segunda-revisao/after`. A luz e a exposição são as mesmas. Os testes de exportação verificam também os mapas de roupa e suas coordenadas UV no GLB. O teste dos óculos usa as dimensões medidas da armação e confere o aro completo contra o rosto, respeitando o novo tamanho.

A avaliação estética continua aberta. Os testes abaixo verificam integridade e regressões, não a qualidade cinematográfica das referências.

## Histórico: tentativa c4673ef, reprovada

A versão `c2baedb` foi reprovada: roupas, rosto e aparência não correspondiam às referências. Esta rodada inclui corpo e figurino, que tinham ficado fora da tentativa anterior. Nana, Nico e Vigilante são os alvos; o Padeiro recebe a mesma anatomia do Vigilante e revisão do figurino da prancha compartilhada.

- **Nana:** proporção de cabeça maior no conjunto, tronco mais curto, jaqueta preta mais curta e aberta, barriga exposta, mangas mais volumosas, calça cargo mais ampla e comprida, bolsos maiores e tênis mais baixos. O cabelo lateral recebe massa contínua, cachos mais espessos e mechas branca/violeta. Nariz mais cheio, olhos e boca revistos.
- **Nico:** corpo mais compacto, pescoço menos exposto, mãos e tênis proporcionais à figura infantil. Jardineira com peitoral mais largo, alças maiores, lavagem no denim, barra mais baixa e bolsos maiores. Cabelo com elevação e comprimentos variados, olhos com pupilas maiores e armação redonda menor.
- **Vigilante:** corpo de jovem com proporções próprias, mangas acima dos antebraços, sobrecasaca cobrindo os ombros, correias mais largas, menos contornos dourados no peito e cachecol sobreposto entre máscara e gola. Capuz com menor volume atrás e abertura mais estreita.
- **Padeiro:** mesma face/corpo do Vigilante, camisa com botões exposta, avental preso à cintura, mangas dobradas no cotovelo, calça mais ampla e chapéu mais baixo e irregular sobre faixa laranja.

As modificações são em geometria e materiais reais. Luz e exposição foram preservadas. Não há imagens geradas substituindo os personagens. O cache de prévias foi invalidado para atualizar os cartões.

## Comparação e limites

[Comparação dos quatro personagens](revisao/personagens/) com frente, corpo em 3/4, costas e close, usando as mesmas câmeras da base reprovada. Os arquivos locais ficam em `renders/ref-personagem`; a base imutável está em `/workspace/outputs/reprovado-c2baedb`.

O acabamento procedural continua distante da riqueza de escultura e materiais das pranchas. Esta revisão não deve ser descrita como reprodução fiel ou aprovação estética. A geometria do cabelo ainda tem leitura de mechas modeladas, e vários equipamentos continuam simplificados. O objetivo desta entrega é corrigir o escopo e tornar as mudanças de conjunto comparáveis.

## Verificação

`referencias-tres-herois.mjs` verifica os quatro modelos vestidos, atributos, índices, UVs, cobertura do peito, preservação da pele e 12 clipes faciais. Também verifica troca de cor nas mechas e retirada/recolocação do capuz. `identidades-faciais.mjs` compara a base: quatro rostos alterados e 30 preservados. Os testes de pescoço, óculos, lábios e apoio do queixo verificam as emendas. A exportação verifica os quatro GLBs e três Workers reais. A galeria verifica todas as imagens e vistas em desktop e celular.

Esses testes verificam funcionamento e regressões. Não medem semelhança artística.
