# Monta pranchas dos renders reais, sem alterar as imagens de origem.
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, html, sys, zipfile
root=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'renders'/'tipos-fisicos')
labels={'feminine_soft':'Sereia pérola','masculine_soft':'Falcoeiro','old_king':'Rei','cute_round':'Cute','feminine_bold':'Sereia rubi','alchemist_villain':'Alquimista','dwarf_bard':'Anão aventureiro','sad_clown':'Palhaço','orc_warrior':'Orc','cactus_cowboy':'Cacto','pepper_king':'Rei pimentão','chili_bandit':'Pimenta','robot_ball':'Robô (casco inalterado)'}
builds={'magro':'Magro','padrao':'Padrão','gordo':'Gordo','musculoso':'Musculoso'}
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
f=lambda size:ImageFont.truetype(font,size)
def filename(id,b,cloth,view):
 complete=f'{id}-{b}-sem-completo-{view}.png'
 return complete if cloth=='sem' and (root/complete).exists() else f'{id}-{b}-{cloth}-{view}.png'

sections=[];thumbs=[]
for id,label in labels.items():
 paths=[root/f'{id}-{b}-{cloth}-{v}.png' for cloth,v in [('com','front'),('sem','front'),('com','side'),('sem','side')] for b in builds]
 if not all(p.exists() for p in paths):continue
 panel=Image.new('RGB',(1320,1700),'#f4f1f3');d=ImageDraw.Draw(panel);d.text((24,12),label,fill='#30232d',font=f(26))
 for j,(cloth,view) in enumerate([('com','front'),('sem','front'),('com','side'),('sem','side')]):
  rowlabel=('Frente' if view=='front' else 'Perfil')+' · '+('com roupa' if cloth=='com' else 'sem roupa')
  d.text((15,54+j*407),rowlabel,fill='#4f424b',font=f(18))
  for i,(b,blabel) in enumerate(builds.items()):
   im=Image.open(root/filename(id,b,cloth,view)).convert('RGB');im.thumbnail((318,365));panel.paste(im,(i*330+(330-im.width)//2,90+j*407))
   d.text((i*330+125,76+j*407),blabel,fill='#30232d',font=f(15))
 panel.save(root/f'prancha-{id}.jpg',quality=94)
 thumbs.append((id,label))
 rows=[]
 for cloth,view in [('com','front'),('sem','front'),('com','side'),('sem','side')]:
  imgs=''.join(f'<a href="{filename(id,b,cloth,view)}"><img loading="lazy" src="{filename(id,b,cloth,view)}" alt="{html.escape(label)}: {blabel}, {view}, {cloth} roupa"></a>' for b,blabel in builds.items())
  rows.append(f'<h3>{"Frente" if view=="front" else "Perfil"} · {"Com roupa" if cloth=="com" else "Sem roupa"}</h3><div class="grid">{imgs}</div>')
 sections.append(f'<section id="{id}"><h2>{html.escape(label)}</h2><div class="grid labels">'+''.join(f'<b>{x}</b>' for x in builds.values())+'</div>'+''.join(rows)+f'<p><a href="prancha-{id}.jpg">Abrir prancha completa</a></p></section>')
(root/'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tipos físicos — Ateliê</title><style>body{font:16px system-ui;background:#f4f1f3;color:#30232d;margin:24px}a{color:#77435b}nav{display:flex;flex-wrap:wrap;gap:12px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.grid img{width:100%;display:block}.labels{position:sticky;top:0;background:#f4f1f3;padding:12px 0;text-align:center}section{margin-top:40px;border-top:1px solid #ddd}h3{font-size:15px;margin-bottom:8px}p{line-height:1.6}</style><h1>Tipos físicos</h1><p>Magro · Padrão · Gordo · Musculoso. Frente e perfil, com e sem roupa. Clique numa imagem para abrir na resolução original. Nas sereias, a vista sem roupa mostra também a variante humana com pernas; as imagens da base usada pela cauda continuam na pasta. O robô mantém o casco original.</p><nav>'''+''.join(f'<a href="#{id}">{html.escape(label)}</a>' for id,label in thumbs)+'</nav>'+''.join(sections)+'</html>',encoding='utf8')
# Visão geral das silhuetas sem roupa, em quatro colunas e uma linha por personagem.
for cloth in ['com','sem']:
 overview=Image.new('RGB',(1280,50+len(thumbs)*360),'#f4f1f3');d=ImageDraw.Draw(overview)
 for i,b in enumerate(builds.values()):d.text((i*320+100,10),b,fill='#30232d',font=f(22))
 for j,(id,label)in enumerate(thumbs):
  d.text((10,52+j*360),label,fill='#30232d',font=f(18))
  for i,b in enumerate(builds):
   im=Image.open(root/filename(id,b,cloth,'front')).convert('RGB');im.thumbnail((310,325));overview.paste(im,(i*320+(320-im.width)//2,80+j*360))
 overview.save(root/f'visao-geral-{cloth}.jpg',quality=94)
with zipfile.ZipFile(root.parent/'tipos-fisicos.zip','w',zipfile.ZIP_DEFLATED)as z:
 for p in sorted(root.iterdir()):
  if p.is_file():z.write(p,'tipos-fisicos/'+p.name)
print(f'{len(thumbs)} personagens; galeria e pranchas em {root}')
