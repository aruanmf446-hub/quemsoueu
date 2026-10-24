# Correção do rig rejeitado em 857cbdb

O usuário informou que as animações estavam bugadas de forma geral. A reprodução visual mostrou pontas nas axilas e roupas puxadas ao levantar os braços. Os testes iniciais verificavam pose de repouso, pesos normalizados, exportação e vértices finitos, mas permitiam deformações locais severas. Portanto, o resultado anterior não deve ser considerado aprovado.

## Correções

- A vinculação deixa de escolher um único segmento com cortes bruscos na cintura e nas axilas. Usa envelopes contínuos, até quatro influências por vértice e transições suaves entre tronco, braços e pernas.
- A redução para quatro influências também é contínua: os pesos são limiarizados pela quinta influência antes da normalização. Cortar simplesmente a quinta gerava novas mudanças bruscas.
- `joints.torsoAt` fornece as dimensões reais do tronco para proteger barrigas/cinturas largas contra influência dos braços. Essa função acrescenta metadados; não altera o campo que gera a malha de autoria.
- A mistura entre as duas pernas é mais larga na região das coxas e menor nas panturrilhas. Patas e asas têm envelopes de conexão próprios para a anatomia dos companheiros.
- As peças inferiores e cintos não recebem influência dos braços. Peças sem mangas do tronco e golas recebem vínculos próprios; o teste cobre especificamente o macacão e as duas golas do palhaço.
- `skin-components.js` identifica componentes conectados, incluindo costuras UV duplicadas. Calçados seguem seus respectivos pés, peças metálicas conservam forma rígida e objetos externos como cajados/bolsas acompanham mão ou peito. Saias longas e capas deixam de seguir pernas independentes na barra.
- A reprodução no editor recebe uma transição de 0,22 s ao trocar movimentos. Pausar congela a transição; buscar um instante aplica a pose exata. A geração de clipes conserva a pose atual do player.
- Importações versionadas de `body.js` e `body-rig.js` evitam reutilizar o rig antigo em cache.

Os 22 ossos, cinco movimentos e nomes dos clipes continuam compatíveis. Rostos, cabelos, materiais e poses A das skins foram preservados. As curvas das danças não foram redesenhadas.

## Verificação

`node tests/rig-corporal.mjs` agora mede também o estiramento de arestas do corpo nas cinco animações, aos 25/75 centésimos de segundo e a 37% da duração de cada clipe. Isso inclui o pico dos passos alternados, ausente nas verificações anteriores. O teste rejeita arestas originalmente maiores que 0,002 unidade que passem de seis vezes o comprimento original. Os 34 personagens passaram, incluindo corpo e roupas em repouso, pesos normalizados, descarte, compartilhamento dos movimentos, pausa/transição e preservação do player ao gerar clipes. As peças inferiores/cintos/calçados também são verificadas para impedir vínculos com braços, e as golas/macacão do palhaço têm regressões próprias.

`node tests/skin-components.mjs` verifica duas peças no mesmo mesh e a união lógica de tampas/costuras, sem modificar os atributos originais. `tests/animacoes-jogo.cjs` verifica GLBs reimportados e reproduzidos com AnimationMixer, além dos controles e edições em desktop/celular.

Foram reimportados GLBs de Nico, Nana, Guardiã da Lua, palhaço, cacto grande, Paysandu, corvo e robô/sereia nas rodadas de validação; as roupas corrigidas do palhaço e da Nana foram repetidas depois das mudanças de vinculação.

Artefatos locais: `renders/rig-correcao/`; comparação pública em [revisao/correcao-rig/](revisao/correcao-rig/). A galeria compara a vitória em 2,22 s com câmeras numericamente idênticas, usando a base imutável `/workspace/outputs/rig-bugado-857cbdb`. Os testes técnicos detectam os rasgos reproduzidos; a qualidade artística final continua sujeita à avaliação do usuário.
