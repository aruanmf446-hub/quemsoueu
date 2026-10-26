extends SceneTree
## Teste de fumaça do menu. Rodar com:
##   godot --headless --path godot -s res://tests/menu_smoke_test.gd
## Sai com código 0 se tudo passar, 1 se algo falhar.

const MAIN_MENU := "res://scenes/ui/main_menu.tscn"
const ROUTES := {
	"StoryButton": "res://scenes/ui/story_mode.tscn",
	"DuelButton": "res://scenes/ui/duel_mode.tscn",
	"SettingsButton": "res://scenes/ui/settings.tscn",
}
const MIN_TOUCH_HEIGHT := 64.0

var _failures := 0


func _initialize() -> void:
	_run()


func _run() -> void:
	_check(ProjectSettings.get_setting("application/run/main_scene") == MAIN_MENU, "cena inicial é o MainMenu")

	await _load(MAIN_MENU)
	_check(current_scene.get_node("CenterContainer/Menu/Title").text == "Quem Sou Eu", "título é 'Quem Sou Eu'")

	for button_name in ROUTES:
		var button := current_scene.get_node("CenterContainer/Menu/" + button_name) as Button
		_check(button != null, "%s existe" % button_name)
		if button == null:
			continue
		_check(button.custom_minimum_size.y >= MIN_TOUCH_HEIGHT, "%s tem altura de toque (>= %d px)" % [button_name, MIN_TOUCH_HEIGHT])

		await _load(MAIN_MENU)
		current_scene.get_node("CenterContainer/Menu/" + button_name).pressed.emit()
		await _settle()
		_check(current_scene.scene_file_path == ROUTES[button_name], "%s abre %s" % [button_name, ROUTES[button_name]])

		current_scene.get_node("CenterContainer/Menu/BackButton").pressed.emit()
		await _settle()
		_check(current_scene.scene_file_path == MAIN_MENU, "Voltar de %s retorna ao menu" % button_name)

	print("RESULTADO: %s" % ("OK" if _failures == 0 else "FALHOU com %d erro(s)" % _failures))
	quit(1 if _failures > 0 else 0)


func _load(path: String) -> void:
	change_scene_to_file(path)
	await _settle()


func _settle() -> void:
	await process_frame
	await process_frame


func _check(condition: bool, label: String) -> void:
	if condition:
		print("  ok    - %s" % label)
	else:
		print("  FALHA - %s" % label)
		_failures += 1
