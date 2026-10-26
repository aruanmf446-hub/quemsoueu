# Quem Sou Eu — projeto Godot 4.7.2

Projeto único para Web (HTML5/WebAssembly) e Android. Renderizador Compatibility (WebGL 2), GDScript.

## Estrutura
- `scenes/ui/` — `main_menu.tscn` (cena inicial), `story_mode.tscn`, `duel_mode.tscn`, `settings.tscn` (placeholders)
- `scripts/ui/` — `main_menu.gd`, `menu_button.gd` (hover/foco/pressionado), `placeholder_screen.gd`, `responsive_ui.gd` (dimensionamento em pixels CSS)
- `themes/menu_theme.tres` — tema global dos botões e textos
- `tests/menu_smoke_test.gd` — teste automatizado da navegação

## Rodar
    godot --path godot                                  # editor
    godot --headless --path godot -s res://tests/menu_smoke_test.gd   # testes

## Exportar
    mkdir -p build/web && godot --headless --path godot --export-release "Web" build/web/index.html
    godot --headless --path godot --export-release "Android APK" build/android/quemsoueu.apk   # exige Android SDK + keystore
