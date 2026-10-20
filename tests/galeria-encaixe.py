"""Pranchas e galeria de comparação, sem alterar o conteúdo dos renders."""
from pathlib import Path
from html import escape
from PIL import Image, ImageDraw
import json, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'renders/encaixe')
items=[]
priority={'orc-magro-casual-front':0,'sereia-perola-side':1}
for after in sorted((root/'depois').glob('*.png'),key=lambda p:(priority.get(p.stem,2),p.stem)):
    before=root/'antes'/after.name
    if not before.exists(): continue
    images=[Image.open(p).convert('RGB') for p in [before,after]]
    w,h=images[0].size
    sheet=Image.new('RGB',(w*2,h+50),'#0c1a28');draw=ImageDraw.Draw(sheet)
    for i,(img,label) in enumerate(zip(images,['ANTES — 8655440','DEPOIS — encaixe no tipo físico'])):
        sheet.paste(img,(i*w,50));draw.text((i*w+25,18),label,fill='white')
    filename='comparacao-'+after.stem+'.jpg'
    sheet.save(root/filename,quality=94)
    items.append('<article><h2>'+escape(after.stem.replace('-',' · '))+'</h2><a href="'+filename+'"><img loading="lazy" src="'+filename+'"></a></article>')
menu='<p><a href="menu-orc-magro.png">Ver as prévias do orc magro no catálogo</a></p>' if (root/'menu-orc-magro.png').exists() else ''
extras=[]
for folder in ['personagens']:
    for image in sorted((root/folder).glob('*.png')):
        link=folder+'/'+image.name
        extras.append('<a href="'+escape(link)+'"><img loading="lazy" src="'+escape(link)+'"></a>')
(root/'index.html').write_text('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ateliê — encaixe das roupas</title><style>body{background:#0c1a28;color:#edf3fa;font:16px system-ui;margin:24px}img{max-width:100%;border-radius:12px}article{margin:36px 0}a{color:#39e4df}h2{font-size:18px}</style><h1>Encaixe das roupas no corpo</h1><p>Antes à esquerda; depois à direita. Mesmos personagens e tipos físicos. Frente, perfil e 3/4.</p>'+menu+''.join(items)+'<h2>Personagens atuais — frente e 3/4</h2>'+''.join(extras)+'</html>',encoding='utf8')
print(f'{len(items)} comparações geradas em {root}')
