"""Compara capturas reais do Ateliê. Redimensiona para a prancha sem retocar as imagens."""
from pathlib import Path
from html import escape
from PIL import Image, ImageDraw, ImageFont
import json, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'renders/refinamento')
labels={
'paysandu_wolf':'Paysandu','nana_explorer':'Nana exploradora','moon_guardian':'Guardiã da Lua','nico_inventor':'Nico inventor','ruby_sorceress':'Feiticeira rubi','ruby_raven':'Corvo rubi',
'forest_archer_f':'Arqueira da floresta','forest_archer_m':'Arqueiro da floresta','forest_guard_f':'Guarda feminina','forest_guard_m':'Guarda jovem','forest_guard_veteran':'Guarda veterano','forest_artificer':'Artífice da floresta','forest_princess':'Princesa da floresta',
'frontier_cowboy':'Cowboy do deserto','desert_fennec':'Feneco do deserto','cowboy_on_fennec':'Cowboy no feneco','bread_baker':'Padeiro','bread_vigilante':'Vigilante','cactus_soldier':'Soldado cacto','cactus_soldier_large':'Soldado cacto grande'}
views={'front':'Frente','three':'3/4','back':'Costas'}
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
articles=[]
for id,label in labels.items():
    cards=[]
    for view,title in views.items():
        paths=[root/folder/f'{id}-{view}.png' for folder in ['antes','depois']]
        if not all(p.exists() for p in paths): raise FileNotFoundError(f'Comparação incompleta: {id}/{view}')
        imgs=[Image.open(p).convert('RGB') for p in paths]
        if imgs[0].size!=imgs[1].size: raise ValueError('As capturas precisam da mesma resolução')
        w,h=imgs[0].size
        sheet=Image.new('RGB',(2*w,h+76),'#0c1a28');d=ImageDraw.Draw(sheet)
        d.text((18,9),f'{label} · {title}',fill='white',font=font)
        for i,(img,caption) in enumerate(zip(imgs,['ANTES · f4f1d7b','RODADA ATUAL · aguardando sua aprovação'])):
            sheet.paste(img,(i*w,76));d.text((i*w+18,43),caption,fill='#35d6d4',font=small)
        name=f'comparacao-{id}-{view}.jpg';sheet.save(root/name,quality=93)
        cards.append(f'<figure data-view="{view}"><a href="{name}"><img loading="lazy" src="{name}" alt="{escape(label)}: antes e depois, {title}"></a><figcaption>{title}</figcaption></figure>')
    articles.append(f'<article data-label="{escape(label.lower())}"><h2>{escape(label)}</h2>'+''.join(cards)+'</article>')
# Pranchas de consulta rápida: frente, 3/4 e costas de cada personagem em uma imagem.
for id,label in labels.items():
    thumbw=280;thumbh=round(Image.open(root/'antes'/f'{id}-front.png').height*thumbw/Image.open(root/'antes'/f'{id}-front.png').width)
    sheet=Image.new('RGB',(thumbw*6,thumbh+90),'#0c1a28');d=ImageDraw.Draw(sheet);d.text((18,12),label+' · pendente de aprovação',fill='white',font=font)
    for j,(view,title) in enumerate(views.items()):
        for i,folder in enumerate(['antes','depois']):
            img=Image.open(root/folder/f'{id}-{view}.png').convert('RGB');img.thumbnail((thumbw,thumbh),Image.Resampling.LANCZOS);x=(j*2+i)*thumbw;sheet.paste(img,(x,90));d.text((x+10,57),title+' · '+('antes' if i==0 else 'atual'),fill='#35d6d4',font=small)
    sheet.save(root/f'prancha-{id}.jpg',quality=93)
groups={'reino-lua':list(labels)[:6],'floresta':list(labels)[6:13],'deserto':list(labels)[13:]}
for name,ids in groups.items():
    tw=210;th=round(Image.open(root/'antes'/f'{ids[0]}-three.png').height*tw/Image.open(root/'antes'/f'{ids[0]}-three.png').width)
    cellh=th+68;sheet=Image.new('RGB',(tw*4,cellh*((len(ids)+1)//2)+52),'#0c1a28');d=ImageDraw.Draw(sheet)
    d.text((15,14),'Ateliê · '+name.replace('-',' ').title()+' · aguardando aprovação',fill='white',font=font)
    for j,id in enumerate(ids):
        x=(j%2)*tw*2;y=(j//2)*cellh+52;d.text((x+10,y+5),labels[id],fill='white',font=small)
        for k,folder in enumerate(['antes','depois']):
            d.text((x+k*tw+10,y+29),'ANTES' if k==0 else 'ATUAL',fill='#35d6d4',font=small)
            img=Image.open(root/folder/f'{id}-three.png').convert('RGB');img.thumbnail((tw,th),Image.Resampling.LANCZOS);sheet.paste(img,(x+k*tw,y+56))
    sheet.save(root/f'resumo-{name}.jpg',quality=94)
(root/'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ateliê — refinamento em avaliação</title><style>body{background:#0c1a28;color:#edf3fa;font:16px system-ui;margin:24px}header{position:sticky;top:0;background:#0c1a28;padding:12px 0;z-index:2}img{width:100%;border-radius:12px}article{margin:40px 0;max-width:1300px}figure{margin:18px 0}a{color:#35d6d4}button,input{font:inherit;background:#1b3145;border:1px solid #4c687f;color:white;border-radius:8px;padding:9px;margin:4px}button[aria-pressed=true]{background:#207a7a}h1{font-size:28px}h2{font-size:21px}figcaption{color:#afc3d5}figure[hidden],article[hidden]{display:none}</style><header><h1>Refinamento dos 20 personagens</h1><p>Antes à esquerda (f4f1d7b), rodada atual à direita. Mesma câmera em cada comparação. Nenhum personagem foi aprovado ou retirado da fila.</p><div><input id="search" placeholder="Buscar personagem" aria-label="Buscar personagem"><button data-view="front" aria-pressed="true">Frente</button><button data-view="three" aria-pressed="false">3/4</button><button data-view="back" aria-pressed="false">Costas</button><button data-view="all" aria-pressed="false">Todas</button></div></header>'''+''.join(articles)+'''<script>let view='front';function filter(){const q=document.getElementById('search').value.toLocaleLowerCase('pt-BR');document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.label.includes(q));document.querySelectorAll('figure').forEach(f=>f.hidden=view!=='all'&&f.dataset.view!==view)}document.querySelectorAll('button').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));filter()});document.getElementById('search').oninput=filter;filter();</script></html>''',encoding='utf8')
print(f'{len(labels)*len(views)} comparações e {len(labels)} pranchas geradas em {root}')
