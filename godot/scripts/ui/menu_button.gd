extends Button
## Botão de menu com resposta visual a mouse, toque e teclado.
## Hover/foco aumentam levemente; pressionar encolhe. As cores vêm do tema.

const HOVER_SCALE := Vector2(1.04, 1.04)
const PRESSED_SCALE := Vector2(0.96, 0.96)
const TWEEN_TIME := 0.12

var _hovered := false
var _down := false
var _tween: Tween


func _ready() -> void:
	_update_pivot()
	resized.connect(_update_pivot)
	mouse_entered.connect(_on_hover.bind(true))
	mouse_exited.connect(_on_hover.bind(false))
	focus_entered.connect(_refresh_scale)
	focus_exited.connect(_refresh_scale)
	button_down.connect(_on_down.bind(true))
	button_up.connect(_on_down.bind(false))


func _update_pivot() -> void:
	pivot_offset = size * 0.5


func _on_hover(value: bool) -> void:
	_hovered = value
	_refresh_scale()


func _on_down(value: bool) -> void:
	_down = value
	_refresh_scale()


func _refresh_scale() -> void:
	var target := Vector2.ONE
	if _down:
		target = PRESSED_SCALE
	elif _hovered or has_focus():
		target = HOVER_SCALE

	if _tween:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(self, "scale", target, TWEEN_TIME).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
