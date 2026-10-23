# Apoio do queixo e transição mandibular

> Registro da rodada `eeaa4f0`, considerada insuficiente pelo usuário. A correção estrutural do grupo afetado está em [REFINO-MANDIBULA.md](REFINO-MANDIBULA.md).

Após o envio de `54a1f87` à main, o usuário aprovou a direção visual e pediu continuar corrigindo personagens sem queixo. A revisão mantém as proporções anteriores dos olhos, nariz e boca.

O diagnóstico da superfície mostrou maior recuo sob o lábio em Cute, Nico, Princesa da Floresta, Arqueira e Guardiã da Lua. O reforço é localizado: volume mais alto e largo sob o lábio, com largura/projeção próprias por identidade e transições suaves para a mandíbula e para a superfície original. O pescoço, a base do rosto e a posição da boca permanecem iguais; não é um alongamento global da cabeça.

Os 15 alvos são Feminino suave, Cute, Feminino intenso, Anão bardo, Palhaço triste, Nana, Guardiã da Lua, Nico, Feiticeira rubi, Arqueira, Guardiã da floresta, Guardião jovem, Princesa, Padeiro e Vigilante. Crianças têm apoio arredondado; os demais preservam suas larguras e contornos próprios. Os oito humanos com mandíbula já projetada, os seis vegetais, as criaturas e o robô conservam suas formas. Padeiro e Vigilante compartilham a mesma anatomia.

`CHIN_IDENTITIES` controla profundidade, largura e altura do apoio. `head.js` mistura esse relevo com o campo anterior somente abaixo do lábio. O primeiro ensaio criou uma faixa visível sob o lábio; foi substituído por uma transição maior, conferida de frente, em três quartos e de perfil. Prévias usam `menu-v16-apoio-queixo`.

## Verificação

- `qualidade-queixos.mjs`: 15 volumes com projeção adicional e transições contínuas; 450 pontos de superfície acima do queixo preservados; 12 clipes em cada alvo.
- `identidades-faciais.mjs` contra `54a1f87`: somente as 15 malhas selecionadas alteradas; outras 19 formas e skins compartilhadas preservadas.
- Continuidade labial, deformações e encaixe do pescoço verificam as regiões adjacentes.
- Capturas anteriores/atuais com câmeras iguais em `renders/queixos/{antes,depois}-{rosto,visual}`; os 19 modelos preservados reutilizam as capturas da versão de referência.

Base de código: `/workspace/outputs/queixo-referencia-54a1f87`. Logs `/tmp/queixos-*.log`; comparação publicada em `revisao/`. A avaliação visual continua sendo parte do refinamento; os testes medem preservação e funcionamento.

Validação final concluída: cinco GLBs (Nico, Guardiã da Lua, Anão, Nana e Princesa) com mapas e 12 clipes, três prévias de expressão no Worker e capturas de sorriso/surpresa para Nico e Guardiã, sem erros. A galeria de 136 imagens passou em carregamento, abas, busca e celular. Os 15 alvos foram recapturados com cabelo e como escultura; os 19 preservados reutilizam imagens da referência. Continuidade labial, deformação e quatro encaixes de pescoço passaram.

Limitação observada na revisão visual: a abertura da boca na surpresa do Nico tem bordas trianguladas, e o sorriso da Guardiã ainda marca as dobras faciais. As mesmas capturas foram reproduzidas na base `54a1f87` e confirmam esses defeitos anteriores ao refino dos queixos. Referências em `renders/queixos/poses-referencia/`; não considerar as expressões esteticamente aprovadas apenas por exportarem sem erros.
