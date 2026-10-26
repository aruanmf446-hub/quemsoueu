"""Publica comparações reais/sincronizadas das cinco animações da Nana."""
import hashlib,json,os,subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1]
source=Path(os.environ.get('ATELIE_RENDERS','/workspace/outputs/nana-contatos-video'))
dest=root/'revisao/nana-contatos'
labels={'lobby':'Lobby','defeat':'Derrota','victory':'Vitória','dance_floss':'Macarena','dance_shuffle':'Dança retrô'}
before=json.loads((source/'videos-antes.json').read_text())
after=json.loads((source/'videos-depois.json').read_text())
for filename,digest in after['sourceHashes'].items():
 assert hashlib.sha256((root/filename).read_bytes()).hexdigest()==digest,f'Captura antiga: {filename}'
assert before['baseline']=='8c44e5b'
assert before['sourceHashes']['assets/characters/nana-explorer.glb']==after['sourceHashes']['assets/characters/nana-explorer.glb']
assert before['errors']==after['errors']==[]
assert before['shadows']==after['shadows']==False
dest.mkdir(parents=True,exist_ok=True)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def run(args):return subprocess.check_output(args,text=True)
def probe(file):
 return json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=width,height,r_frame_rate,nb_read_frames,duration','-of','json',str(file)]))['streams'][0]
rows=[]
for ident,label in labels.items():
 a=next(r for r in before['rows'] if r['id']==ident)
 b=next(r for r in after['rows'] if r['id']==ident)
 for key in ['frames','width','height','fps','duration','camera','target','closeTime']:
  assert a[key]==b[key],(ident,key)
 for row in [a,b]:
  file=source/row['file'];p=probe(file)
  assert int(p['nb_read_frames'])==row['frames']
  assert (p['width'],p['height'])==(row['width'],row['height'])
  assert p['r_frame_rate']=='24/1'
  subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
 output=dest/f'comparacao-{ident}.mp4'
 filters=f"[0:v]drawtext=fontfile={font}:text='Antes':x=12:y=12:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=5[a];[1:v]drawtext=fontfile={font}:text='Depois':x=12:y=12:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=5[b];[a][b]hstack=inputs=2[v]"
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source/a['file']),'-i',str(source/b['file']),'-filter_complex',filters,'-map','[v]','-an','-c:v','libx264','-crf','21','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],check=True)
 p=probe(output);assert int(p['nb_read_frames'])==a['frames'];assert p['width']==a['width']*2 and p['height']==a['height']
 subprocess.run(['ffmpeg','-v','error','-i',str(output),'-f','null','-'],check=True)
 im=Image.new('RGB',(800,560));draw=ImageDraw.Draw(im);f=ImageFont.truetype(font,20)
 for i,phase in enumerate(['antes','depois']):
  frame=Image.open(source/f'{phase}-{ident}-close.png').convert('RGB');assert frame.size==(400,560)
  im.paste(frame,(400*i,0));draw.rectangle((400*i+6,6,400*i+110,37),fill=(13,28,40));draw.text((400*i+14,9),'Antes' if i==0 else 'Depois',font=f,fill='white')
 im.save(dest/f'contato-{ident}.webp',quality=90)
 rows.append({**b,'file':output.name,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'decoded':True})
sections=[]
for row in rows:
 ident=row['id'];label=labels[ident];duration=f"{row['duration']:g}"
 sections.append(f'''<section><h2>{label}</h2><figure><div class="labels"><b>Antes · 8c44e5b</b><b>Depois · mãos e punhos</b></div><video controls muted playsinline {'loop ' if ident in ['lobby','dance_floss','dance_shuffle'] else ''}preload="metadata" aria-label="Comparação de {label}: antes à esquerda, depois à direita" src="{row['file']}"></video><figcaption>{duration} segundos · {row['frames']} quadros por versão.</figcaption></figure><details><summary>Ampliar o contato em {row['closeTime']:.2f} s</summary><img loading="lazy" width="800" height="560" src="contato-{ident}.webp" alt="Detalhe da pose de {label}, antes à esquerda e depois à direita"></details></section>''')
html='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nana — mãos nas cinco animações</title><style>*{box-sizing:border-box}body{margin:0;background:#0c1d2b;color:#e8f1f4;font:16px/1.6 system-ui}main{max-width:900px;margin:auto;padding:24px}h1{line-height:1.15}a{color:#3fe1da}p,small{color:#b9cbd6}section{margin:36px 0 48px}figure{margin:12px 0}video,img{display:block;width:100%;height:auto;background:#aaa5a2;border-radius:12px}figcaption{padding:8px 0}.labels{display:grid;grid-template-columns:1fr 1fr;text-align:center;gap:16px;margin:8px 0}summary{cursor:pointer;padding:10px 0;color:#3fe1da}details img{margin-top:8px}@media(max-width:560px){main{padding:16px}h1{font-size:28px}.labels{font-size:13px}}</style><main><h1>Nana: mãos nas cinco animações</h1><p>Comparação da posição das mãos, da folga junto ao corpo e da passagem ao lado do rosto. Mesma malha, textura, pesos e câmera. Pernas, quadril, tronco e cabeça conservam suas trilhas.</p><p><a href="../../?personagem=nana_explorer&amp;v=nana-contatos-1">Abrir a Nana no Ateliê</a> · <a href="../../NANA.md">Implementação e limites</a></p><p>Antes e depois estão no mesmo vídeo, sincronizados quadro a quadro. Use os controles para reproduzir, pausar e comparar qualquer instante. Os detalhes abaixo ampliam poses reais do mesmo movimento.</p>'''+''.join(sections)+'''<small>Capturas reais do Ateliê a 24 fps, 400 × 560 por lado. Sombras desativadas apenas nestas capturas de revisão. Os controles de vídeo são nativos do navegador. A aprovação visual continua pendente; estas comparações não comprovam ausência de todo contato em qualquer ângulo.</small></main></html>'''
(dest/'index.html').write_text(html)
(dest/'videos.json').write_text(json.dumps({'baseline':'8c44e5b','rows':rows,'sourceHashes':after['sourceHashes'],'beforeSourceHashes':before['sourceHashes'],'shadows':False,'errors':[]},ensure_ascii=False,indent=2))
print(json.dumps({'gallery':str(dest),'videos':len(rows),'framesPerVersion':sum(r['frames'] for r in rows),'decodedAll':True}))
