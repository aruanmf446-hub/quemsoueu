extends Node
## Dados locais do jogador. Não há backend: valores vêm de user://save.cfg
## (ou de DEFAULTS na primeira execução). Moedas e cristais são simulados localmente.

signal changed

const SAVE_PATH := "user://save.cfg"
const DEFAULTS := {
	"nickname": "AventureiroBR",
	"level": 28,
	"xp": 620,
	"xp_to_next": 1000,
	"coins": 2350,
	"gems": 180,
	"equipped": "forest_archer",
}

var nickname := ""
var level := 1
var xp := 0
var xp_to_next := 1
var coins := 0
var gems := 0
var equipped := ""


func _ready() -> void:
	load_data()


func load_data() -> void:
	var cfg := ConfigFile.new()
	var has_file := cfg.load(SAVE_PATH) == OK
	nickname = _read(cfg, has_file, "nickname")
	level = _read(cfg, has_file, "level")
	xp = _read(cfg, has_file, "xp")
	xp_to_next = _read(cfg, has_file, "xp_to_next")
	coins = _read(cfg, has_file, "coins")
	gems = _read(cfg, has_file, "gems")
	equipped = _read(cfg, has_file, "equipped")
	changed.emit()


func save_data() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("player", "nickname", nickname)
	cfg.set_value("player", "level", level)
	cfg.set_value("player", "xp", xp)
	cfg.set_value("player", "xp_to_next", xp_to_next)
	cfg.set_value("player", "coins", coins)
	cfg.set_value("player", "gems", gems)
	cfg.set_value("player", "equipped", equipped)
	cfg.save(SAVE_PATH)


func add_coins(amount: int) -> void:
	coins += amount
	_after_change()


## Retorna false (sem descontar) se não houver saldo suficiente.
func spend_coins(amount: int) -> bool:
	if amount > coins:
		return false
	coins -= amount
	_after_change()
	return true


func set_equipped(character_id: String) -> void:
	equipped = character_id
	_after_change()


func _after_change() -> void:
	save_data()
	changed.emit()


func _read(cfg: ConfigFile, has_file: bool, key: String) -> Variant:
	return cfg.get_value("player", key, DEFAULTS[key]) if has_file else DEFAULTS[key]
