extends Control
## Configurações reais: volume geral e tela cheia, persistidos por GameSettings.
## Idioma e qualidade gráfica aparecem como pendentes, sem ação.

const LOBBY_SCENE := "res://scenes/ui/main_menu.tscn"

var _volume_slider: HSlider
var _volume_value: Label
var _fullscreen: CheckBox


func _ready() -> void:
	_build()
	_volume_slider.value = GameSettings.master_volume
	_fullscreen.button_pressed = GameSettings.fullscreen
	_refresh_volume_label()
	get_viewport().size_changed.connect(_layout)
	_layout()
	_volume_slider.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_back()


func _build() -> void:
	var column := VBoxContainer.new()
	column.name = "Column"
	column.set_anchors_preset(Control.PRESET_CENTER)
	column.grow_horizontal = Control.GROW_DIRECTION_BOTH
	column.grow_vertical = Control.GROW_DIRECTION_BOTH
	column.custom_minimum_size = Vector2(640, 0)
	column.add_theme_constant_override("separation", 26)
	add_child(column)

	var title := Label.new()
	title.text = "Configurações"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 56)
	column.add_child(title)

	var volume_row := HBoxContainer.new()
	volume_row.add_theme_constant_override("separation", 20)
	column.add_child(volume_row)
	var volume_label := Label.new()
	volume_label.text = "Volume geral"
	volume_label.custom_minimum_size = Vector2(240, 0)
	volume_row.add_child(volume_label)
	_volume_slider = HSlider.new()
	_volume_slider.min_value = 0.0
	_volume_slider.max_value = 1.0
	_volume_slider.step = 0.05
	_volume_slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_volume_slider.custom_minimum_size = Vector2(0, 48)
	_volume_slider.value_changed.connect(_on_volume_changed)
	volume_row.add_child(_volume_slider)
	_volume_value = Label.new()
	_volume_value.custom_minimum_size = Vector2(80, 0)
	volume_row.add_child(_volume_value)

	_fullscreen = CheckBox.new()
	_fullscreen.text = "Tela cheia"
	_fullscreen.focus_mode = Control.FOCUS_ALL
	_fullscreen.toggled.connect(GameSettings.set_fullscreen)
	column.add_child(_fullscreen)

	for pending in ["Idioma: Português (Brasil). Outros idiomas: pendente.", "Qualidade gráfica: automática. Opções manuais: pendente."]:
		var note := Label.new()
		note.text = pending
		note.add_theme_color_override("font_color", Color(1, 1, 1, 0.55))
		column.add_child(note)

	var back := Button.new()
	back.name = "BackButton"
	back.text = "Voltar"
	back.focus_mode = Control.FOCUS_ALL
	back.set_script(load("res://scripts/ui/menu_button.gd"))
	back.pressed.connect(_back)
	column.add_child(back)


func _on_volume_changed(value: float) -> void:
	GameSettings.set_master_volume(value)
	_refresh_volume_label()


func _refresh_volume_label() -> void:
	_volume_value.text = "%d%%" % roundi(GameSettings.master_volume * 100.0)


func _layout() -> void:
	var viewport := get_viewport()
	var css := ResponsiveUI.visible_css_size(viewport)
	var column := get_node("Column") as VBoxContainer
	column.custom_minimum_size.x = ResponsiveUI.to_logical(viewport, clampf(css.x * 0.5, 360.0, 720.0))
	for label in column.find_children("*", "Label", true, false):
		if label.get_parent() is VBoxContainer and label.get_parent() == column and label.get_index() == 0:
			label.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.07, 36.0, 64.0))))
		else:
			label.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.03, 16.0, 24.0))))
	ResponsiveUI.style_button(get_node("Column/BackButton"), viewport)


func _back() -> void:
	get_tree().change_scene_to_file(LOBBY_SCENE)
