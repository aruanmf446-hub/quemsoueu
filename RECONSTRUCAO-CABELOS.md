# Reconstrução dos cabelos

O usuário reprovou a qualidade do cabelo após `341259b`. Esta rodada altera a construção do cabelo e preserva os rostos, proporções corporais, barbas, roupas e iluminação. O resultado continua sujeito à avaliação visual do usuário.

## O que mudou

O principal defeito encontrado estava nas guias: curvas entre pontos de controle atravessavam o crânio. Assim, parte das mechas desaparecia dentro da cabeça e deixava a base lisa aparente. Agora o caminho inteiro é amostrado e levado à superfície externa do cabelo, com raízes entrando por baixo dela.

- Cobertura da nuca definida pela linha real de implantação do cabelo, em vez de encerrar as mechas perto da coroa. Coques e rabos também recebem mechas partindo da nuca.
- Seção arqueada com espessura inferior controlada, transição de raiz mais larga e variação de direção/comprimento nas mechas. O acabamento das fibras foi ajustado apenas nos materiais do cabelo.
- Nico e Padeiro com camadas próprias para nuca, topo e franja; o Vigilante mantém a folga sob o capuz.
- Nana com massa alongada de apoio e cachos contínuos descendo da amarração. As mechas branca e roxa continuam independentes do tingimento do restante do cabelo.
- Cortes curtos, longos, ondulados, presos e cacheados usam a construção compartilhada. São 23 personagens com cabelo; os outros 11 aparecem como controle preservado.

Os pilotos com tubos, pontas rígidas e regiões de touca descobertas foram descartados. Não foram usados retratos ou imagens geradas para substituir os modelos do jogo.

## Comparação e validação

[Galeria dos cabelos](revisao/cabelos/): 34 pares em 3/4, mais 14 pares de costas, totalizando 96 imagens. Câmeras numericamente iguais antes/depois. Os 11 controles sem cabelo permaneceram idênticos pixel a pixel.

Base: `/workspace/outputs/cabelo-reprovado-341259b`. Capturas finais: `renders/cabelos-reconstruidos/depois`. Os arquivos finais dos seis cortes curtos vêm de `nuca-final`, substituindo as capturas anteriores. Os diretórios `piloto*` não são a entrega.

A verificação compara 121 superfícies dos 34 personagens, incluindo rostos e barbas, e exercita os 17 penteados, 21 acessórios e cinco modalidades de barba. Os testes adicionais exigem apoio volumétrico na queda do rabo da Nana e mechas externas sobre a nuca/coroa do Nico. A nova cobertura inferior dos cortes curtos admite deslocamento de .18 no teste de escala; outros eixos, topo e estilos longos mantêm .12.

Onze GLBs representativos passaram com materiais, UVs, tangentes e 12 animações cada. Sete prévias foram verificadas no Worker. O relatório consolidado de exportação substitui a primeira verificação da arqueira pela versão final da nuca e inclui o corte curto masculino.

A galeria passou em desktop e celular, incluindo busca e abertura das vistas de costas.

Cache: `menu-v26-volume-cabelos-catalogo`. Testes técnicos verificam funcionamento e preservação; a aprovação estética cabe ao usuário.
