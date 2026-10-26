# Uso: python scripts/transferir-pesos-nana.py fonte.glb vinculo.glb pesos.json destino.glb relatorio.json
import json,struct,copy,sys,numpy as np
source_path,bind_path,heat_path,output_path,report_path=sys.argv[1:]
from scipy.spatial import cKDTree
from pathlib import Path

def read(path):
 b=Path(path).read_bytes();n=struct.unpack_from('<I',b,12)[0];return json.loads(b[20:20+n]),bytearray(b[n+28:])
def accessor(g,b,i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dtype={5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']];k={'VEC3':3,'VEC4':4,'SCALAR':1,'MAT4':16}[a['type']];return np.frombuffer(b,dtype=dtype,count=a['count']*k,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],k).copy()
source,sbin=read(source_path);g,b=read(bind_path)
heat=json.load(open(heat_path));valid=[v for v in heat['vertices']if v['weights']];points=np.array([[v['position'][0],v['position'][2],-v['position'][1]]for v in valid]);prim=g['meshes'][0]['primitives'][0];pos=accessor(g,b,prim['attributes']['POSITION']);dist,idx=cKDTree(points).query(pos,k=4)
joints=g['skins'][0]['joints'];names={g['nodes'][node]['name']:i for i,node in enumerate(joints)};weights=np.zeros((len(pos),4),dtype='<f4');indices=np.zeros((len(pos),4),dtype='<u2')
for i in range(len(pos)):
 mix={};blend=1/np.maximum(dist[i],1e-6)**2;blend/=sum(blend)
 for near,k in enumerate(idx[i]):
  for name,w in valid[k]['weights'].items():
   if name not in names:raise ValueError('Bone unknown: '+name)
   joint=names[name];mix[joint]=mix.get(joint,0)+w*blend[near]
 # O rosto/cabelo não pode herdar o braço pelo ombro próximo do queixo.
 # Transição suave pescoço/cabeça, calibrada nos marcos reais desta Nana.
 y=float(pos[i,1]);x=float(pos[i,0])
 if y>.775 and (y>.81 or abs(x)<.15):
  smooth=lambda a,b: (lambda t:t*t*(3-2*t))(max(0,min(1,(y-a)/(b-a))))
  blend=smooth(.775,.81);head=smooth(.787,.814)
  mix={j:w*(1-blend)for j,w in mix.items()}
  for name,value in [('mixamorigHead',head),('mixamorigNeck',1-head)]:mix[names[name]]=mix.get(names[name],0)+blend*value
 ranked=sorted(mix.items(),key=lambda x:-x[1])[:4];total=sum(w for j,w in ranked)
 for k,(j,w)in enumerate(ranked):indices[i,k]=j;weights[i,k]=w/total
original_pos=accessor(source,sbin,source['meshes'][0]['primitives'][0]['attributes']['POSITION'])
assert np.array_equal(original_pos,pos), 'A preparação alterou as posições originais'
assert np.isfinite(weights).all() and np.max(abs(weights.sum(axis=1)-1))<1e-6

def append(data):
 while len(b)%4:b.append(0)
 view=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':len(data)});b.extend(data);return view
for name,a,component in [('JOINTS_0',indices,5123),('WEIGHTS_0',weights,5126)]:
 view=append(a.tobytes());acc=len(g['accessors']);g['accessors'].append({'bufferView':view,'componentType':component,'count':len(pos),'type':'VEC4'});prim['attributes'][name]=acc
# Mesma textura JPEG do arquivo original, sem reamostragem.
g['materials']=copy.deepcopy(source['materials']);g['images']=[]
for im in source['images']:
 old=source['bufferViews'][im['bufferView']];blob=sbin[old.get('byteOffset',0):old.get('byteOffset',0)+old['byteLength']];g['images'].append({**im,'bufferView':append(blob)})
for field in ['samplers','textures']:
 if field in source:g[field]=copy.deepcopy(source[field])
g['asset']['generator']='Atelie — rig preparado localmente; fonte Tripo';g['buffers'][0]={'byteLength':len(b)}
raw=json.dumps(g,separators=(',',':'),ensure_ascii=False).encode();raw+=b' '*((-len(raw))%4);b.extend(b'\0'*((-len(b))%4));result=struct.pack('<III',0x46546c67,2,28+len(raw)+len(b))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(b),0x004e4942)+b
Path(output_path).write_bytes(result)
report={'sourceVertices':len(pos),'proxyVertices':len(heat['vertices']),'proxyWeighted':len(valid),'sourceMotionClips':0,'preparedMotionClips':len(g.get('animations',[])),'activeJoints':len(np.unique(indices[weights>1e-6])),'skinJoints':len(joints),'sourceJoint0WeightSum':float(accessor(source,sbin,source['meshes'][0]['primitives'][0]['attributes']['WEIGHTS_0'])[:,0][accessor(source,sbin,source['meshes'][0]['primitives'][0]['attributes']['JOINTS_0'])[:,0]==0].sum()),'preparedWeightSumError':float(np.max(abs(weights.sum(axis=1)-1))),'transferDistanceMax':float(np.max(dist[:,0])),'transferDistanceMedian':float(np.median(dist[:,0])),'preparedBytes':len(result)}
Path(report_path).write_text(json.dumps(report,indent=2)+'\n');print(report)
