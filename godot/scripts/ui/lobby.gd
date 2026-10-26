extends Control
## Lobby principal (horizontal): cenário, personagem 3D equipado, cards de modo,
## perfil, amizades SIMULADAS e barra de recursos. Layout em pixels CSS (ResponsiveUI).
## Nada aqui conecta a backend: moedas, perfil e amigos são dados locais.

const STAGE_SCENE := preload("res://scenes/world/character_stage.tscn")
const MENU_BUTTON := preload("res://scripts/ui/menu_button.gd")
const BACKGROUND_PATH := "res://assets/backgrounds/lobby_kingdoms.png"
const ICON_DIR := "res://assets/ui/icons/"

const MODE_CARDS := [
	{"id": "CardStory", "title": "Modo História", "subtitle": "Viva uma grande aventura nos quatro reinos.", "icon": "scroll", "top": Color("#f5c24e"), "bottom": Color("#8a5a12"), "scene": "res://scenes/ui/story_mode.tscn"},
	{"id": "CardDuel", "title": "Modo Duelo", "subtitle": "Desafie outros jogadores e prove suas habilidades.", "icon": "swords", "top": Color("#e8464f"), "bottom": Color("#6e1019"), "scene": "res://scenes/ui/duel_mode.tscn"},
	{"id": "CardSkins", "title": "Skins", "subtitle": "Personalize seu herói com visuais únicos.", "icon": "shirt", "top": Color("#9b5cff"), "bottom": Color("#3a1a7a"), "scene": "res://scenes/ui/skins.tscn"},
	{"id": "CardFriends", "title": "Amizades", "subtitle": "Jogue com seus amigos e forme sua equipe.", "icon": "people", "top": Color("#42c868"), "bottom": Color("#17561f"), "scene": "res://scenes/ui/friends.tscn"},
	{"id": "CardSettings", "title": "Configurações", "subtitle": "Ajuste o jogo do seu jeito.", "icon": "gear", "top": Color("#4a9cf0"), "bottom": Color("#1b3a72"), "scene": "res://scenes/ui/settings.tscn"},
]

## Amigos simulados (sem backend, sem multiplayer real).
const SIMULATED_FRIENDS := [
	{"name": "LunaSolis", "status": "No Modo História", "online": true, "color": Color("#f2b84b")},
	{"name": "DragaoAzul", "status": "No Lobby", "online": true, "color": Color("#4aa3ff")},
	{"name": "CaioRPG", "status": "Em Duelo", "online": true, "color": Color("#e5484d")},
	{"name": "MaréViva", "status": "Online", "online": true, "color": Color("#2bc3a8")},
	{"name": "EstrelaGui", "status": "No Lobby", "online": true, "color": Color("#a66bff")},
	{"name": "BrunoLeal", "status": "Offline", "online": false, "color": Color("#7a8294")},
]

var _stage: Node3D
var _background: TextureRect
var _left: VBoxContainer
var _logo: Label
var _subtitle: Label
var _cards: Array[Button] = []
var _profile_panel: PanelContainer
var _profile_name: Label
var _profile_level: Label
var _xp_bar: ProgressBar
var _coins_label: Label
var _gems_label: Label
var _top_buttons: Array[Button] = []
var _friends_panel: PanelContainer
var _friends_list: VBoxContainer
var _friends_online: Label
var _all_friends: Button
var _character_bar: HBoxContainer
var _character_label: Label
var _toast: Label
var _toast_tween: Tween


func _ready() -> void:
	_build_background()
	_build_stage()
	_build_left_column()
	_build_profile()
	_build_top_bar()
	_build_friends_panel()
	_build_character_bar()
	_build_toast()
	PlayerData.changed.connect(_refresh_player)
	get_viewport().size_changed.connect(_layout)
	_refresh_player()
	_layout()


# --- Construção -------------------------------------------------------------

func _build_background() -> void:
	_background = TextureRect.new()
	_background.set_anchors_preset(Control.PRESET_FULL_RECT)
	_background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	if ResourceLoader.exists(BACKGROUND_PATH):
		_background.texture = load(BACKGROUND_PATH)
	else:
		# Fallback enquanto o painel de arte não existe (ver assets/backgrounds/README.md).
		var gradient := Gradient.new()
		gradient.colors = PackedColorArray([Color("#2a4d7a"), Color("#f0a658"), Color("#0c1530")])
		gradient.offsets = PackedFloat32Array([0.0, 0.55, 1.0])
		var texture := GradientTexture2D.new()
		texture.gradient = gradient
		texture.fill_from = Vector2(0, 0)
		texture.fill_to = Vector2(0, 1)
		_background.texture = texture
	add_child(_background)


func _build_stage() -> void:
	var container := SubViewportContainer.new()
	container.set_anchors_preset(Control.PRESET_FULL_RECT)
	container.stretch = true
	var viewport := SubViewport.new()
	viewport.own_world_3d = true
	viewport.transparent_bg = true
	viewport.handle_input_locally = false
	container.add_child(viewport)
	add_child(container)
	_stage = STAGE_SCENE.instantiate()
	viewport.add_child(_stage)
	_stage.show_character(PlayerData.equipped, "lobby")


func _build_left_column() -> void:
	_left = VBoxContainer.new()
	_left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_left.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	add_child(_left)

	_logo = Label.new()
	_logo.text = "QUEM SOU EU"
	_logo.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	_logo.add_theme_color_override("font_color", Color("#ffd86b"))
	_logo.add_theme_color_override("font_outline_color", Color("#3a1a05"))
	_logo.add_theme_constant_override("outline_size", 10)
	_logo.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.6))
	_logo.add_theme_constant_override("shadow_offset_y", 6)
	_left.add_child(_logo)

	var subtitle := Label.new()
	subtitle.name = "Subtitle"
	subtitle.text = "MENU PRINCIPAL"
	subtitle.add_theme_color_override("font_color", Color("#e9eef5"))
	_left.add_child(subtitle)
	_subtitle = subtitle

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 16)
	_left.add_child(spacer)

	for data in MODE_CARDS:
		var card := _make_card(data)
		_left.add_child(card)
		_cards.append(card)


func _make_card(data: Dictionary) -> Button:
	var hit := Button.new()
	hit.name = data.id
	hit.flat = true
	hit.focus_mode = Control.FOCUS_ALL
	hit.set_script(MENU_BUTTON)
	hit.pressed.connect(_open.bind(data.scene))
	hit.add_theme_stylebox_override("focus", _card_focus_style())

	var body := _card_panel(data.top, data.bottom)
	hit.add_child(body)

	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 18)
	hit.add_child(row)

	var icon := TextureRect.new()
	icon.name = "Icon"
	icon.texture = load(ICON_DIR + data.icon + ".svg")
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(icon)

	var texts := VBoxContainer.new()
	texts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	texts.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	texts.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(texts)

	var title := Label.new()
	title.name = "Title"
	title.text = data.title
	title.add_theme_color_override("font_color", Color("#fff6dc"))
	title.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.7))
	title.add_theme_constant_override("outline_size", 4)
	texts.add_child(title)

	var subtitle := Label.new()
	subtitle.name = "Subtitle"
	subtitle.text = data.subtitle
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle.add_theme_color_override("font_color", Color(1, 1, 1, 0.85))
	texts.add_child(subtitle)

	var arrow := Label.new()
	arrow.name = "Arrow"
	arrow.text = ">"
	arrow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	arrow.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	arrow.add_theme_color_override("font_color", Color("#fff6dc"))
	row.add_child(arrow)
	return hit


## Corpo do card: base colorida, aro de luz nas bordas, brilho na metade superior e sombra.
func _card_panel(top: Color, bottom: Color) -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var shadow := Panel.new()
	shadow.set_anchors_preset(Control.PRESET_FULL_RECT)
	shadow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var shadow_style := StyleBoxFlat.new()
	shadow_style.bg_color = Color(0, 0, 0, 0.0)
	shadow_style.shadow_color = Color(0, 0, 0, 0.55)
	shadow_style.shadow_size = 14
	shadow_style.shadow_offset = Vector2(0, 8)
	shadow.add_theme_stylebox_override("panel", shadow_style)
	root.add_child(shadow)

	var base := Panel.new()
	base.name = "Base"
	base.set_anchors_preset(Control.PRESET_FULL_RECT)
	base.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var base_style := StyleBoxFlat.new()
	base_style.bg_color = bottom.lerp(top, 0.35)
	base_style.border_color = top.lightened(0.35)
	base_style.set_border_width_all(3)
	base_style.set_corner_radius_all(20)
	base_style.content_margin_left = 18
	base_style.content_margin_right = 18
	base.add_theme_stylebox_override("panel", base_style)
	root.add_child(base)

	var gloss := Panel.new()
	gloss.set_anchors_preset(Control.PRESET_TOP_WIDE)
	gloss.anchor_bottom = 0.5
	gloss.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var gloss_style := StyleBoxFlat.new()
	gloss_style.bg_color = Color(1, 1, 1, 0.14)
	gloss_style.set_corner_radius_all(18)
	gloss.add_theme_stylebox_override("panel", gloss_style)
	root.add_child(gloss)
	return root


func _card_focus_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.draw_center = false
	style.set_border_width_all(4)
	style.border_color = Color("#ffd166")
	style.set_corner_radius_all(22)
	return style


func _build_profile() -> void:
	_profile_panel = PanelContainer.new()
	_profile_panel.add_theme_stylebox_override("panel", _dark_panel_style(16))
	add_child(_profile_panel)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	_profile_panel.add_child(row)

	var avatar := Panel.new()
	avatar.custom_minimum_size = Vector2(64, 64)
	avatar.add_theme_stylebox_override("panel", _circle_style(Color("#f2b84b")))
	row.add_child(avatar)

	var texts := VBoxContainer.new()
	row.add_child(texts)
	_profile_name = Label.new()
	_profile_name.add_theme_color_override("font_color", Color("#ffd166"))
	texts.add_child(_profile_name)
	_profile_level = Label.new()
	_profile_level.add_theme_color_override("font_color", Color("#dfe7f5"))
	texts.add_child(_profile_level)
	_xp_bar = ProgressBar.new()
	_xp_bar.show_percentage = false
	_xp_bar.custom_minimum_size = Vector2(0, 10)
	texts.add_child(_xp_bar)


func _build_top_bar() -> void:
	var bar := HBoxContainer.new()
	bar.name = "TopBar"
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_theme_constant_override("separation", 10)
	bar.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	add_child(bar)

	var coins := _resource_chip("coin")
	_coins_label = coins.get_meta("label")
	bar.add_child(coins)
	var gems := _resource_chip("gem")
	_gems_label = gems.get_meta("label")
	bar.add_child(gems)

	bar.add_child(_top_icon_button("mail", "Caixa de mensagens (simulada)", _show_toast.bind("Caixa de mensagens: nenhuma mensagem nova (simulado).")))
	bar.add_child(_top_icon_button("people", "Amizades", _open.bind("res://scenes/ui/friends.tscn")))
	bar.add_child(_top_icon_button("gear", "Configurações", _open.bind("res://scenes/ui/settings.tscn")))


func _resource_chip(icon: String) -> PanelContainer:
	var chip := PanelContainer.new()
	chip.add_theme_stylebox_override("panel", _dark_panel_style(14))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	chip.add_child(row)
	var texture := TextureRect.new()
	texture.texture = load(ICON_DIR + icon + ".svg")
	texture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	row.add_child(texture)
	var label := Label.new()
	label.name = "Value"
	row.add_child(label)
	chip.set_meta("label", label)
	chip.set_meta("icon", texture)
	return chip


func _top_icon_button(icon: String, tooltip: String, action: Callable) -> Button:
	var button := Button.new()
	button.flat = true
	button.icon = load(ICON_DIR + icon + ".svg")
	button.expand_icon = true
	button.tooltip_text = tooltip
	button.focus_mode = Control.FOCUS_ALL
	button.set_script(MENU_BUTTON)
	button.pressed.connect(action)
	button.add_theme_stylebox_override("normal", _dark_panel_style(14))
	button.add_theme_stylebox_override("hover", _dark_panel_style(14))
	button.add_theme_stylebox_override("pressed", _dark_panel_style(14))
	button.add_theme_stylebox_override("focus", _card_focus_style())
	_top_buttons.append(button)
	return button


func _build_friends_panel() -> void:
	_friends_panel = PanelContainer.new()
	_friends_panel.add_theme_stylebox_override("panel", _dark_panel_style(20))
	add_child(_friends_panel)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	_friends_panel.add_child(column)

	var header := HBoxContainer.new()
	column.add_child(header)
	var title := Label.new()
	title.text = "Amizades"
	title.add_theme_color_override("font_color", Color("#fff6dc"))
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	_friends_online = Label.new()
	_friends_online.add_theme_color_override("font_color", Color("#7cf59a"))
	header.add_child(_friends_online)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(scroll)
	_friends_list = VBoxContainer.new()
	_friends_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_friends_list.add_theme_constant_override("separation", 8)
	scroll.add_child(_friends_list)
	for friend in SIMULATED_FRIENDS:
		_friends_list.add_child(_friend_row(friend))

	var all_friends := Button.new()
	all_friends.name = "AllFriends"
	all_friends.text = "Ver todos os amigos"
	all_friends.focus_mode = Control.FOCUS_ALL
	all_friends.set_script(MENU_BUTTON)
	all_friends.pressed.connect(_open.bind("res://scenes/ui/friends.tscn"))
	column.add_child(all_friends)
	_all_friends = all_friends

	var note := Label.new()
	note.text = "Lista simulada. Sem multiplayer real nesta versão."
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note.add_theme_color_override("font_color", Color(1, 1, 1, 0.5))
	column.add_child(note)


func _friend_row(friend: Dictionary) -> PanelContainer:
	var row_panel := PanelContainer.new()
	row_panel.add_theme_stylebox_override("panel", _dark_panel_style(12))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	row_panel.add_child(row)

	var avatar := Panel.new()
	avatar.custom_minimum_size = Vector2(44, 44)
	avatar.add_theme_stylebox_override("panel", _circle_style(friend.color))
	row.add_child(avatar)

	var texts := VBoxContainer.new()
	texts.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(texts)
	var name_label := Label.new()
	name_label.text = friend.name
	texts.add_child(name_label)
	var status := Label.new()
	status.text = friend.status
	status.add_theme_color_override("font_color", Color("#7cf59a") if friend.online else Color("#8b93a7"))
	texts.add_child(status)

	var invite := Button.new()
	invite.text = "+"
	invite.disabled = not friend.online
	invite.focus_mode = Control.FOCUS_ALL
	invite.set_script(MENU_BUTTON)
	invite.pressed.connect(_show_toast.bind("Convite simulado enviado para %s." % friend.name))
	row.add_child(invite)
	return row_panel


func _build_character_bar() -> void:
	_character_bar = HBoxContainer.new()
	_character_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	_character_bar.add_theme_constant_override("separation", 12)
	_character_bar.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	add_child(_character_bar)

	var previous := Button.new()
	previous.text = "<"
	previous.focus_mode = Control.FOCUS_ALL
	previous.set_script(MENU_BUTTON)
	previous.pressed.connect(_cycle_character.bind(-1))
	_character_bar.add_child(previous)

	_character_label = Label.new()
	_character_label.custom_minimum_size = Vector2(260, 0)
	_character_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_character_bar.add_child(_character_label)

	var next := Button.new()
	next.text = ">"
	next.focus_mode = Control.FOCUS_ALL
	next.set_script(MENU_BUTTON)
	next.pressed.connect(_cycle_character.bind(1))
	_character_bar.add_child(next)


func _build_toast() -> void:
	_toast = Label.new()
	_toast.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast.modulate.a = 0.0
	add_child(_toast)


# --- Comportamento ----------------------------------------------------------

func _open(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)


func _cycle_character(step: int) -> void:
	var ids: Array = _stage.character_ids()
	var index := ids.find(PlayerData.equipped)
	var next_id: String = ids[posmod(index + step, ids.size())]
	PlayerData.set_equipped(next_id)
	_stage.show_character(next_id, "lobby")
	_refresh_player()


func _refresh_player() -> void:
	_coins_label.text = _format_number(PlayerData.coins)
	_gems_label.text = _format_number(PlayerData.gems)
	_profile_name.text = PlayerData.nickname
	_profile_level.text = "Nível %d" % PlayerData.level
	_xp_bar.max_value = PlayerData.xp_to_next
	_xp_bar.value = PlayerData.xp
	_character_label.text = _stage.CHARACTERS[PlayerData.equipped].name
	_friends_online.text = "%d online" % SIMULATED_FRIENDS.filter(func(f): return f.online).size()


func _show_toast(message: String) -> void:
	_toast.text = message
	if _toast_tween:
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_property(_toast, "modulate:a", 1.0, 0.15)
	_toast_tween.tween_interval(2.2)
	_toast_tween.tween_property(_toast, "modulate:a", 0.0, 0.4)


func _format_number(value: int) -> String:
	var text := str(value)
	var result := ""
	while text.length() > 3:
		result = "." + text.substr(text.length() - 3) + result
		text = text.substr(0, text.length() - 3)
	return text + result


# --- Layout -----------------------------------------------------------------

func _layout() -> void:
	var viewport := get_viewport()
	var css := ResponsiveUI.visible_css_size(viewport)
	var margin := ResponsiveUI.to_logical(viewport, clampf(css.x * 0.03, 16.0, 48.0))

	# Coluna de cards à esquerda.
	var left_width := ResponsiveUI.to_logical(viewport, clampf(css.x * 0.3, 300.0, 520.0))
	_left.offset_left = margin
	_left.offset_top = margin
	_left.offset_right = margin + left_width
	_left.offset_bottom = -margin
	_left.add_theme_constant_override("separation", roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.015, 8.0, 18.0))))
	_logo.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.075, 40.0, 76.0))))
	var short_screen := css.y < 480.0
	var card_css := clampf(css.y * 0.123, 48.0, 80.0) if short_screen else clampf(css.y * 0.14, 66.0, 104.0)
	var card_height := ResponsiveUI.to_logical(viewport, card_css)
	var title_font := roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.042, 18.0, 30.0)))
	var subtitle_font := roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.024, 12.0, 17.0)))
	var icon_size := card_height * 0.62
	for card in _cards:
		card.custom_minimum_size = Vector2(0, card_height)
		var row: HBoxContainer = card.get_child(1)
		(row.get_node("Icon") as TextureRect).custom_minimum_size = Vector2(icon_size, icon_size)
		(row.get_node("Icon") as TextureRect).size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		var texts := row.get_child(1)
		(texts.get_node("Title") as Label).add_theme_font_size_override("font_size", title_font)
		var subtitle_label := texts.get_node("Subtitle") as Label
		subtitle_label.add_theme_font_size_override("font_size", subtitle_font)
		subtitle_label.visible = not short_screen
		(row.get_node("Arrow") as Label).add_theme_font_size_override("font_size", title_font)

	# Perfil centralizado acima do personagem.
	var compact := css.x < 1100.0
	var stage_x := 0.62 if compact else 0.5
	var profile_width := ResponsiveUI.to_logical(viewport, clampf(css.x * 0.22, 220.0, 340.0))
	var profile_font := roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.03, 14.0, 22.0)))
	var top_size := ResponsiveUI.to_logical(viewport, clampf(css.y * 0.06, 34.0, 54.0))
	_profile_panel.anchor_left = stage_x
	_profile_panel.anchor_right = stage_x
	_profile_panel.offset_left = -profile_width * 0.5
	_profile_panel.offset_right = profile_width * 0.5
	_profile_panel.offset_top = margin + top_size + 16 if compact else margin
	_profile_panel.custom_minimum_size.x = profile_width
	_profile_name.add_theme_font_size_override("font_size", profile_font + 4)
	_profile_level.add_theme_font_size_override("font_size", profile_font)

	# Barra de recursos e atalhos no canto superior direito.
	var top_font := roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.032, 15.0, 24.0)))
	var top_bar := get_node("TopBar") as HBoxContainer
	top_bar.offset_right = -margin
	top_bar.offset_top = margin
	top_bar.offset_left = -ResponsiveUI.to_logical(viewport, clampf(css.x * 0.3, 360.0, 620.0) if not compact else clampf(css.x * 0.5, 300.0, 480.0))
	top_bar.offset_bottom = margin + top_size + 16
	for chip in top_bar.get_children():
		if chip is PanelContainer:
			(chip.get_meta("icon") as TextureRect).custom_minimum_size = Vector2(top_size * 0.7, top_size * 0.7)
			(chip.get_meta("label") as Label).add_theme_font_size_override("font_size", top_font)
		elif chip is Button:
			chip.custom_minimum_size = Vector2(top_size, top_size)

	# Painel de amizades à direita.
	var friends_width := ResponsiveUI.to_logical(viewport, clampf(css.x * 0.24, 300.0, 420.0))
	_friends_panel.visible = not compact
	_friends_panel.anchor_left = 1.0
	_friends_panel.anchor_right = 1.0
	_friends_panel.anchor_top = 0.2
	_friends_panel.anchor_bottom = 0.86
	_friends_panel.offset_left = -friends_width - margin
	_friends_panel.offset_right = -margin
	_friends_panel.custom_minimum_size.x = friends_width

	# Troca de personagem na base do palco.
	_character_bar.anchor_left = stage_x
	_character_bar.anchor_right = stage_x
	var bar_half := ResponsiveUI.to_logical(viewport, 130.0 if compact else 220.0)
	_character_bar.offset_left = -bar_half
	_character_bar.offset_right = bar_half
	_character_bar.offset_bottom = -margin
	_character_bar.offset_top = -margin - top_size
	for button in _character_bar.get_children():
		if button is Button:
			button.custom_minimum_size = Vector2(top_size, top_size)
	_character_label.add_theme_font_size_override("font_size", top_font)
	_subtitle.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.y * 0.028, 14.0, 22.0))))
	ResponsiveUI.style_button(_all_friends, viewport)
	_all_friends.add_theme_font_size_override("font_size", roundi(ResponsiveUI.to_logical(viewport, clampf(css.x * 0.018, 15.0, 22.0))))

	_toast.offset_left = -ResponsiveUI.to_logical(viewport, 360.0)
	_toast.offset_right = ResponsiveUI.to_logical(viewport, 360.0)
	_toast.offset_top = -margin - top_size - ResponsiveUI.to_logical(viewport, 56.0)
	_toast.offset_bottom = _toast.offset_top + top_size
	_toast.add_theme_font_size_override("font_size", top_font)


func _dark_panel_style(radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.09, 0.18, 0.82)
	style.border_color = Color(0.55, 0.7, 1.0, 0.35)
	style.set_border_width_all(2)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	style.shadow_color = Color(0, 0, 0, 0.4)
	style.shadow_size = 8
	return style


func _circle_style(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = Color(1, 1, 1, 0.8)
	style.set_border_width_all(2)
	style.set_corner_radius_all(64)
	return style
