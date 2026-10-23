# Nico, Nana e Vigilante: proporções e acessórios

Base reprovada: `f9b83df`. A avaliação visual desta revisão cabe ao usuário. Luz e exposição foram preservadas.

- **Nico:** menor e mais estreito na geometria; cabeça reduzida, contorno facial infantil revisto, mangas e jardineira mais finas. Altura total atual 5.5294, largura corporal .70; a altura equivale a cerca de 56% da Nana. O enquadramento e as miniaturas deixam espaço acima do personagem para comunicar sua estatura.
- **Nana:** visor panorâmico azul mais fino, hastes com apoios, gola/lapelas menores, alças mais curtas. Tênis com cabedal fechado junto à sola, língua, biqueira, atacadores, taloneira, inserções azuis e borracha fosca.
- **Vigilante:** capuz projetado para fora do crânio, com cobertura posterior e apoio nos ombros; máscara independente envolvendo nariz e boca. As orelhas continuam sendo restauradas quando o capuz é removido.

O Padeiro e os outros rostos são preservados nesta rodada. Não foi feita outra alteração global de queixos.

## Comparação e verificação

[Comparação interativa](revisao/personagens/) com frente, 3/4, costas e close facial. Nana também tem comparação dos tênis. Capturas de antes/depois usam câmeras idênticas; estão em `renders/ajustes-prioritarios/`. A base de código está em `/workspace/outputs/reprovado-f9b83df`.

O teste `tests/referencias-tres-herois.mjs` verifica proporções do Nico, cobertura real da máscara/capuz, folga do visor, cabedal cobrindo os pés, UVs, normais e animações. `tests/identidades-faciais.mjs` confirmou apenas Nico alterado e os outros 33 rostos preservados. Os quatro GLBs passaram na validação de materiais, UVs e 12 animações cada; as prévias dos três alvos passaram no Worker. Os 31 corpos e visuais padrão fora dos alvos foram comparados com a base e preservados. A galeria é verificada em desktop e celular.

Cache de miniaturas: `menu-v23-nico-menor-visor-capuz`. Envio à main e aprovação estética são estados distintos.
