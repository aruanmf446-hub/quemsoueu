extends Control
## Menu inicial: título e três botões principais.
## Layout recalculado ao mudar o tamanho da janela (desktop, navegador, celular).

const STORY_MODE_SCENE := "res://scenes/ui/story_mode.tscn"
const DUEL_MODE_SCENE := "res://scenes/ui/duel_mode.tscn"
const SETTINGS_SCENE := "res://scenes/ui/settings.tscn"

@onready var _menu: VBoxContainer = $CenterContainer/Menu
@onready var _title: Label = $CenterContainer/Menu/Title
@onready var _story_button: Button = $CenterContainer/Menu/StoryButton
@onready var _duel_button: Button = $CenterContainer/Menu/DuelButton
@onready var _settings_button: Button = $CenterContainer/Menu/SettingsButton


func _ready() -> void:
	_story_button.pressed.connect(_change_scene.bind(STORY_MODE_SCENE))
	_duel_button.pressed.connect(_change_scene.bind(DUEL_MODE_SCENE))
	_settings_button.pressed.connect(_change_scene.bind(SETTINGS_SCENE))
	get_viewport().size_changed.connect(_layout)
	_layout()
	_story_button.grab_focus()


func _layout() -> void:
	var viewport := get_viewport()
	var css := ResponsiveUI.visible_css_size(viewport)
	_menu.custom_minimum_size.x = ResponsiveUI.column_width(viewport, 520.0)
	_menu.add_theme_constant_override("separation", ResponsiveUI.spacing(viewport))
	_title.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.x * 0.065, 40.0, 80.0))))
	for button: Button in [_story_button, _duel_button, _settings_button]:
		ResponsiveUI.style_button(button, viewport)


func _change_scene(path: String) -> void:
	get_tree().change_scene_to_file(path)
