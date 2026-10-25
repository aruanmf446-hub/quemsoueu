"""Compõe a comparação da arqueira usando apenas capturas reais em câmeras iguais."""
import hashlib,json,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(sys.argv[1]);out=Path('revisao/arqueira');out.mkdir(parents=True,exist_ok=True)
views={'front':'Frente','three':'3/4','back':'Costas','face':'Rosto'}
before=json.loads((root/'antes/cameras.json').read_text())['forest_archer_f']
after=json.loads((root/'depois/cameras.json').read_text())['forest_archer_f']
for view in views:
 for key in ['position','target']:assert max(abs(a-b) for a,b in zip(before[view][key],after[view][key]))<1e-8,'Câmera diferente: '+view
assets=[]
for phase in ['antes','depois']:
 for view in views:
  name=f'{phase}-{view}.webp';image=Image.open(root/phase/f'forest_archer_f-{view}.png');image.save(out/name,quality=94,method=6);assets.append(name)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
sample=Image.open(out/'depois-three.webp');w,h=sample.size
sheet=Image.new('RGB',(w*2,h+75),'#102330');d=ImageDraw.Draw(sheet)
d.text((18,12),'Arqueira da floresta · refinamento individual',font=font,fill='white')
for i,phase in enumerate(['antes','depois']):
 d.text((18+i*w,44),'ANTES · ffc9f80' if phase=='antes' else 'EM REFINAMENTO · pendente de aprovação',font=font,fill='#51dbca');sheet.paste(Image.open(out/f'{phase}-three.webp'),(i*w,75))
sheet.save(out/'comparacao.jpg',quality=94);assets.append('comparacao.jpg')
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Arqueira · refinamento individual</title><style>*{box-sizing:border-box}body{margin:0;background:#102330;color:#eef5f8;font:16px/1.6 system-ui}main{max-width:1300px;margin:auto;padding:24px}a{color:#54ddcc}nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}button{background:#233d4f;border:1px solid #647b87;border-radius:8px;color:white;font:inherit;padding:9px 18px;cursor:pointer}button[aria-pressed=true]{background:#18746d}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{width:100%;height:auto;border-radius:12px}p{max-width:950px;color:#bdcdd6}@media(max-width:600px){main{padding:14px}.pair{gap:8px}figcaption{font-size:12px}}</style><main><a href="../../?personagem=forest_archer_f">Abrir a arqueira no ateliê</a><h1>Arqueira da floresta</h1><p>Refinamento individual da malha atual. A referência de direção visual é a imagem enviada pelo usuário. Esta galeria compara o ateliê antes e depois; não representa igualdade com a referência nem aprovação estética.</p><p>Cabelo com trança lateral e mais volume; blusa clara, corpete baixo de couro, mangas franzidas e tecidos assimétricos; pescoço mais curto, ombros mais largos e sardas mais finas. Os outros 33 personagens conservam suas identidades e seus visuais padrão.</p><nav>'''
page+=''.join(f'<button data-view="{v}" aria-pressed="{str(v=="three").lower()}">{label}</button>' for v,label in views.items())
page+='''</nav><div class="pair"><figure><figcaption>Antes · ffc9f80</figcaption><a id="beforeLink" href="antes-three.webp"><img id="before" src="antes-three.webp" alt="Arqueira antes"></a></figure><figure><figcaption>Em refinamento · aprovação pendente</figcaption><a id="afterLink" href="depois-three.webp"><img id="after" src="depois-three.webp" alt="Arqueira em refinamento"></a></figure></div><p>Capturas reais em frente, 3/4, costas e rosto, com câmeras iguais. <a href="manifest.json">Manifesto, arquivos e hashes</a>.</p><p>As cores por peça, os tipos físicos, a altura, o rig e os 17 clipes permanecem editáveis. A escolha deste visual não substitui a revisão artística pelo usuário.</p></main><script>document.querySelectorAll('button').forEach(b=>b.onclick=()=>{for(const phase of ['before','after']){const file=(phase==='before'?'antes':'depois')+'-'+b.dataset.view+'.webp';document.getElementById(phase).src=file;document.getElementById(phase+'Link').href=file}document.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))})</script></html>'''
(out/'index.html').write_text(page,encoding='utf-8')
report=json.loads((root/'validacao-final/relatorio.json').read_text())
assert report['worker'] and not report['errors'] and report['clips']==17 and report['swapMaxMs']<500
(out/'validacao.json').write_text(json.dumps(report,indent=2),encoding='utf-8');assets+=['index.html','validacao.json']
manifest={'personagem':'forest_archer_f','base':'ffc9f80','aprovacao':'pendente','cameraPares':4,'cameras':after,'assets':assets,'sha256':{n:hashlib.sha256((out/n).read_bytes()).hexdigest() for n in assets}}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Galeria da arqueira: 4 pares com câmera igual, 33 controles preservados e relatório de navegador incluído.')
