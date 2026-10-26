extends Node
## Configurações reais do jogo (áudio e tela cheia), persistidas em user://settings.cfg.
## Idioma e qualidade gráfica ainda não têm implementação e não aparecem como opções ativas.

signal changed

const SAVE_PATH := "user://settings.cfg"

var master_volume := 0.8
var fullscreen := false


func _ready() -> void:
	load_settings()
	apply_audio()


func load_settings() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) == OK:
		master_volume = clampf(cfg.get_value("audio", "master", master_volume), 0.0, 1.0)
		fullscreen = cfg.get_value("video", "fullscreen", fullscreen)


func save_settings() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("audio", "master", master_volume)
	cfg.set_value("video", "fullscreen", fullscreen)
	cfg.save(SAVE_PATH)


func set_master_volume(value: float) -> void:
	master_volume = clampf(value, 0.0, 1.0)
	apply_audio()
	save_settings()
	changed.emit()


func set_fullscreen(enabled: bool) -> void:
	fullscreen = enabled
	apply_fullscreen()
	save_settings()
	changed.emit()


func apply_audio() -> void:
	var bus := AudioServer.get_bus_index("Master")
	AudioServer.set_bus_mute(bus, master_volume <= 0.001)
	AudioServer.set_bus_volume_db(bus, linear_to_db(maxf(master_volume, 0.001)))


func apply_fullscreen() -> void:
	# Na Web a troca de tela cheia só funciona após um gesto do usuário.
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if fullscreen else DisplayServer.WINDOW_MODE_WINDOWED)
