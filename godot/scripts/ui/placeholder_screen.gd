extends Control
## Tela provisória para os modos ainda não implementados.
## Volta ao menu pelo botão "Voltar", pelo toque, ou com Esc / gamepad (ui_cancel).

const MAIN_MENU_SCENE := "res://scenes/ui/main_menu.tscn"

@export var screen_title := "Em breve"

@onready var _menu: VBoxContainer = $CenterContainer/Menu
@onready var _title: Label = $CenterContainer/Menu/Title
@onready var _message: Label = $CenterContainer/Menu/Message
@onready var _back_button: Button = $CenterContainer/Menu/BackButton


func _ready() -> void:
	_title.text = screen_title
	_back_button.pressed.connect(_go_back)
	get_viewport().size_changed.connect(_layout)
	_layout()
	_back_button.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_go_back()


func _layout() -> void:
	var viewport := get_viewport()
	var css := ResponsiveUI.visible_css_size(viewport)
	_menu.custom_minimum_size.x = ResponsiveUI.column_width(viewport, 480.0)
	_menu.add_theme_constant_override("separation", ResponsiveUI.spacing(viewport))
	_title.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.x * 0.065, 40.0, 72.0))))
	_message.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.x * 0.022, 18.0, 26.0))))
	ResponsiveUI.style_button(_back_button, viewport)


func _go_back() -> void:
	get_tree().change_scene_to_file(MAIN_MENU_SCENE)
