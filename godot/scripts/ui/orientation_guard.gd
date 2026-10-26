extends CanvasLayer
## Jogo exclusivamente na horizontal. Em celular na vertical, cobre a tela com uma
## mensagem pedindo para girar o aparelho. Autoload: vale para todas as cenas.

const MESSAGE := "Gire o celular para jogar na horizontal"

var _panel: Control


## Bloqueia apenas em dispositivo touch quando a área visível está em retrato.
static func should_block(size: Vector2, touch: bool) -> bool:
	return touch and size.y > size.x


func _ready() -> void:
	layer = 128
	process_mode = Node.PROCESS_MODE_ALWAYS
	_panel = _build_panel()
	add_child(_panel)
	get_viewport().size_changed.connect(_refresh)
	_refresh()


func is_blocking() -> bool:
	return _panel.visible


func _refresh() -> void:
	var touch := OS.has_feature("mobile") or (OS.has_feature("web") and DisplayServer.is_touchscreen_available())
	_panel.visible = should_block(get_viewport().get_visible_rect().size, touch)


func _build_panel() -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	root.visible = false

	var background := ColorRect.new()
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.color = Color(0.04, 0.06, 0.13, 1.0)
	root.add_child(background)

	var label := Label.new()
	label.set_anchors_preset(Control.PRESET_FULL_RECT)
	label.text = MESSAGE
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 40)
	root.add_child(label)
	return root
