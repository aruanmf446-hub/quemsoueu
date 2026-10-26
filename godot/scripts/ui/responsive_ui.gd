class_name ResponsiveUI
extends RefCounted
## Dimensionamento responsivo da interface.
## Os valores são pensados em pixels CSS reais (como o usuário os vê no navegador
## ou no celular) e convertidos para as unidades lógicas do Godot. Assim, botões e
## textos mantêm o mesmo tamanho físico em desktop, tablet e smartphone, em qualquer
## proporção de tela.


## Converte pixels CSS em unidades lógicas do viewport atual.
static func to_logical(viewport: Viewport, css: float) -> float:
	return css * DisplayServer.screen_get_scale() / viewport.get_stretch_transform().get_scale().x


## Tamanho visível da tela em pixels CSS.
static func visible_css_size(viewport: Viewport) -> Vector2:
	var scale := viewport.get_stretch_transform().get_scale().x / DisplayServer.screen_get_scale()
	return viewport.get_visible_rect().size * scale


## Aplica altura de toque (mínimo de 64 px CSS) e fonte proporcional à tela.
static func style_button(button: Button, viewport: Viewport) -> void:
	var css := visible_css_size(viewport)
	button.custom_minimum_size.y = to_logical(viewport, clampf(css.y * 0.1, 64.0, 96.0))
	button.add_theme_font_size_override("font_size", roundi(to_logical(viewport, clampf(css.x * 0.03, 22.0, 34.0))))


## Largura de uma coluna central de menu, em unidades lógicas.
static func column_width(viewport: Viewport, max_css: float) -> float:
	var css := visible_css_size(viewport)
	return to_logical(viewport, clampf(css.x * 0.86, 260.0, max_css))


## Espaçamento vertical entre itens de um menu, em unidades lógicas.
static func spacing(viewport: Viewport) -> int:
	return roundi(to_logical(viewport, clampf(visible_css_size(viewport).y * 0.03, 16.0, 32.0)))
