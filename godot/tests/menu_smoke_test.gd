extends SceneTree
## Testes do lobby e das regras centrais. Rodar com:
##   godot --headless --path godot -s res://tests/menu_smoke_test.gd
## Sai com código 0 se tudo passar, 1 se algo falhar.

const LOBBY := "res://scenes/ui/main_menu.tscn"
const ROUTES := {
	"CardStory": "res://scenes/ui/story_mode.tscn",
	"CardDuel": "res://scenes/ui/duel_mode.tscn",
	"CardSkins": "res://scenes/ui/skins.tscn",
	"CardFriends": "res://scenes/ui/friends.tscn",
	"CardSettings": "res://scenes/ui/settings.tscn",
}
const MIN_TOUCH_HEIGHT := 60.0
const GUARD := preload("res://scripts/ui/orientation_guard.gd")

var _failures := 0


func _initialize() -> void:
	_run()


func _run() -> void:
	_check(ProjectSettings.get_setting("application/run/main_scene") == LOBBY, "cena inicial é o lobby")
	_check(ProjectSettings.get_setting("display/window/handheld/orientation") == 0, "orientação do projeto é horizontal")

	await _load(LOBBY)
	_check(current_scene.find_child("TopBar", true, false) != null, "barra superior existe")
	for card_name in ROUTES:
		await _load(LOBBY)
		var card := current_scene.find_child(card_name, true, false) as Button
		_check(card != null, "%s existe" % card_name)
		if card == null:
			continue
		_check(card.custom_minimum_size.y >= MIN_TOUCH_HEIGHT, "%s tem altura de toque (>= %d)" % [card_name, MIN_TOUCH_HEIGHT])
		card.pressed.emit()
		await _settle()
		_check(current_scene.scene_file_path == ROUTES[card_name], "%s abre %s" % [card_name, ROUTES[card_name]])

	await _test_settings()
	_test_orientation()
	_test_player_data()
	await _test_character_stage()

	print("RESULTADO: %s" % ("OK" if _failures == 0 else "FALHOU com %d erro(s)" % _failures))
	quit(1 if _failures > 0 else 0)


func _test_settings() -> void:
	var original: float = _autoload("GameSettings").master_volume
	_autoload("GameSettings").set_master_volume(0.35)
	_autoload("GameSettings").load_settings()
	_check(is_equal_approx(_autoload("GameSettings").master_volume, 0.35), "volume geral persiste após recarregar")
	_autoload("GameSettings").set_master_volume(original)


func _test_orientation() -> void:
	_check(GUARD.should_block(Vector2(390, 844), true), "celular em retrato é bloqueado")
	_check(not GUARD.should_block(Vector2(844, 390), true), "celular em paisagem não é bloqueado")
	_check(not GUARD.should_block(Vector2(390, 844), false), "desktop em janela vertical não é bloqueado")


func _test_player_data() -> void:
	var coins: int = _autoload("PlayerData").coins
	_check(not _autoload("PlayerData").spend_coins(_autoload("PlayerData").coins + 1), "não gasta moedas sem saldo")
	_check(_autoload("PlayerData").coins == coins, "saldo não muda após tentativa sem saldo")
	_autoload("PlayerData").add_coins(10)
	_check(_autoload("PlayerData").coins == coins + 10, "adiciona moedas")
	_autoload("PlayerData").coins = coins
	_autoload("PlayerData").save_data()
	_autoload("PlayerData").load_data()
	_check(_autoload("PlayerData").coins == coins, "moedas persistem após recarregar")


func _test_character_stage() -> void:
	var stage: Node3D = load("res://scenes/world/character_stage.tscn").instantiate()
	root.add_child(stage)
	await _settle()
	_check(stage.show_character("forest_archer", "lobby"), "carrega GLB da Arqueira")
	var animations: PackedStringArray = stage.current_animations()
	_check(animations.size() >= 3, "Arqueira tem clipes de animação (%d)" % animations.size())
	_check(stage.show_character("nana_explorer", "lobby"), "carrega GLB da Nana")
	_check(stage.current_animations().is_empty(), "Nana sem clipes (pendência registrada)")
	stage.queue_free()
	await _settle()


func _autoload(autoload_name: String) -> Node:
	return root.get_node("/root/" + autoload_name)


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
