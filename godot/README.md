# Quem Sou Eu — projeto Godot 4.7.2

Projeto único para Web (HTML5/WebAssembly, WebGL 2) e Android. Somente horizontal.
Renderizador Compatibility, GDScript.

## Estado do lobby (o que é real e o que não é)

Funcional e testado no navegador:
- Lobby horizontal com cards Modo História, Modo Duelo, Skins, Amizades e Configurações.
- Navegação por mouse, toque e teclado (Enter e Esc) até cada cena.
- Personagem 3D carregado sob demanda (só o equipado), com clipe `wait` no lobby. Arrastar gira o personagem.
- Troca de personagem atualiza o modelo e o perfil.
- Moedas e cristais locais, persistidos em `user://save.cfg`.
- Configurações reais: volume geral e tela cheia, persistidos em `user://settings.cfg`.
- Tela de orientação: em celular na vertical cobre o jogo com a mensagem para girar.

Interfaces simuladas (sem backend, sem multiplayer real):
- Lista de amigos, status online e convites (`SIMULATED_FRIENDS` em `scripts/ui/lobby.gd`).
- Caixa de mensagens (toast).
- Moedas e cristais são saldo local, não compra real.

Pendências reais:
- Arte de fundo `assets/backgrounds/lobby_kingdoms.png` não existe; o lobby usa gradiente de fallback.
- Só há 2 personagens (Arqueira da Floresta e Nana). A Nana não tem clipes de animação; a Arqueira tem `wait`, `dance_04` e `sob`. Faltam 8 dos 10 personagens iniciais.
- Modo História, Modo Duelo, Ateliê de Skins e a tela completa de Amizades são placeholders.
- Idioma e qualidade gráfica ainda não são opções.
- Cloudflare R2 não está conectado (nenhuma dependência de API, token ou serviço externo).
- Export Android não foi gerado neste ambiente (falta Android SDK, Java e keystore de debug).

## Estrutura
- `scenes/ui/main_menu.tscn` — cena inicial (lobby, `scripts/ui/lobby.gd`).
- `scenes/world/character_stage.tscn` — palco 3D isolado da interface.
- `scenes/ui/story_mode.tscn`, `duel_mode.tscn`, `skins.tscn`, `friends.tscn` — placeholders.
- `scenes/ui/settings.tscn` — configurações reais.
- `scripts/core/` — autoloads `PlayerData` e `GameSettings`.
- `scripts/ui/` — lobby, botões, configurações, tela de orientação (`OrientationGuard`), dimensionamento (`ResponsiveUI`).
- `scripts/world/character_stage.gd` — carregamento do GLB, animações, rotação.
- `assets/characters/` — GLBs copiados de `assets/characters/` do repositório (o Godot só importa arquivos dentro do projeto).
- `assets/ui/icons/` — ícones SVG.
- `tests/menu_smoke_test.gd` — 31 checagens (navegação, orientação, persistência, GLB).

## Rodar e testar
    godot --path godot                                                # editor
    godot --headless --path godot -s res://tests/menu_smoke_test.gd   # testes

## Exportar
    mkdir -p build/web && godot --headless --path godot --export-release "Web" build/web/index.html
    mkdir -p build/android && godot --headless --path godot --export-debug "Android APK" build/android/quemsoueu.apk   # exige Android SDK, Java e keystore
