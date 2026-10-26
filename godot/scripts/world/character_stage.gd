extends Node3D
## Palco 3D independente da interface: carrega só o personagem equipado, sob demanda,
## toca a animação do estado (lobby, vitória, derrota) e gira com arrasto (mouse ou toque).

const CHARACTERS := {
	"forest_archer": {
		"name": "Arqueira da Floresta",
		"path": "res://assets/characters/forest-archer.glb",
		"clips": {"menu": "wait", "lobby": "wait", "victory": "dance_04", "defeat": "sob"},
	},
	"nana_explorer": {
		"name": "Nana Exploradora",
		"path": "res://assets/characters/nana-explorer.glb",
		# Pendência real: o GLB da Nana não traz clipes de animação.
		"clips": {},
	},
}
const TARGET_HEIGHT := 2.0
const DRAG_SENSITIVITY := 0.008

@onready var _pivot: Node3D = $Pivot
@onready var _camera: Camera3D = $Camera3D

var _character: Node3D
var _player: AnimationPlayer
var _character_id := ""
var _dragging := false
var _spin := 0.0


func _ready() -> void:
	_camera.look_at(Vector3(0.0, 1.0, 0.0), Vector3.UP)


static func character_ids() -> Array:
	var ids := CHARACTERS.keys()
	ids.sort()
	return ids


func current_character_id() -> String:
	return _character_id


func current_animations() -> PackedStringArray:
	return _player.get_animation_list() if _player else PackedStringArray()


## Carrega o GLB do personagem (removendo o anterior) e inicia a animação do estado.
func show_character(character_id: String, state := "lobby") -> bool:
	if not CHARACTERS.has(character_id):
		push_error("Personagem desconhecido: %s" % character_id)
		return false
	var packed := load(CHARACTERS[character_id].path) as PackedScene
	if packed == null:
		push_error("Não foi possível carregar %s" % CHARACTERS[character_id].path)
		return false
	var scene := packed.instantiate() as Node3D
	if scene == null:
		return false

	if _character:
		_character.queue_free()
	_character = scene
	_character_id = character_id
	_pivot.add_child(scene)
	_player = null
	for node in scene.find_children("*", "AnimationPlayer", true, false):
		_player = node
	_fit_to_stage(scene)
	play_state(state)
	return true


func play_state(state: String) -> void:
	if _player == null:
		return
	var clip: String = CHARACTERS[_character_id].clips.get(state, "")
	for animation_name in _player.get_animation_list():
		if clip != "" and String(animation_name).ends_with(clip):
			var animation := _player.get_animation(animation_name)
			animation.loop_mode = Animation.LOOP_LINEAR if state in ["menu", "lobby"] else Animation.LOOP_NONE
			_player.play(animation_name)
			return


## Escala e centraliza o personagem para que a altura seja TARGET_HEIGHT, com os pés no chão.
func _fit_to_stage(scene: Node3D) -> void:
	var box := AABB()
	var first := true
	for mesh in scene.find_children("*", "MeshInstance3D", true, false):
		var local_box: AABB = mesh.get_aabb()
		var relative := _transform_relative(mesh, scene)
		var transformed := relative * local_box
		box = transformed if first else box.merge(transformed)
		first = false
	if first or box.size.y <= 0.0:
		return
	var factor := TARGET_HEIGHT / box.size.y
	scene.scale = Vector3.ONE * factor
	scene.position = Vector3(-box.get_center().x * factor, -box.position.y * factor, -box.get_center().z * factor)


func _transform_relative(node: Node3D, root: Node3D) -> Transform3D:
	var result := Transform3D.IDENTITY
	var current: Node = node
	while current and current != root:
		if current is Node3D:
			result = current.transform * result
		current = current.get_parent()
	return result


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		_dragging = event.pressed
	elif event is InputEventScreenTouch:
		_dragging = event.pressed
	elif event is InputEventMouseMotion and _dragging:
		_rotate_by(event.relative.x)
	elif event is InputEventScreenDrag:
		_rotate_by(event.relative.x)


func _rotate_by(dx: float) -> void:
	_spin += dx * DRAG_SENSITIVITY
	_pivot.rotation.y = _spin
