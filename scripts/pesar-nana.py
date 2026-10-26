# Uso: blender -b --python scripts/pesar-nana.py -- vinculo.glb pesos.json
import bpy,json,sys
args=sys.argv[sys.argv.index("--")+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args[0],merge_vertices=True)
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
core=['Hips','Spine','Spine1','Spine2','Neck','Head']+[s+n for s in ['Left','Right'] for n in ['Shoulder','Arm','ForeArm','Hand','UpLeg','Leg','Foot','ToeBase']]
for b in arm.data.bones:b.use_deform=b.name.replace('mixamorig','').replace(':','') in core
mesh.vertex_groups.clear()
# A malha original tem superfícies abertas; uma cópia volumétrica serve só ao cálculo.
proxy=mesh.copy();proxy.data=mesh.data.copy();bpy.context.collection.objects.link(proxy);proxy.name='Proxy_Pesos';proxy.modifiers.clear();mesh.hide_set(True);mesh=proxy
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
mesh.data.remesh_voxel_size=.007
bpy.ops.object.voxel_remesh()
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
bpy.context.view_layer.update()
rows=[]
for v in mesh.data.vertices:
 p=mesh.matrix_world@v.co
 rows.append({'position':list(p),'weights':{mesh.vertex_groups[g.group].name:g.weight for g in v.groups if g.weight>1e-8}})
json.dump({'vertices':rows,'bones':[{'name':b.name,'head':list(arm.matrix_world@b.head_local),'tail':list(arm.matrix_world@b.tail_local),'deform':b.use_deform}for b in arm.data.bones]},open(args[1],'w'))
print('WEIGHTED',len(rows),'EMPTY',sum(not v['weights']for v in rows),'GROUPS',len(mesh.vertex_groups))

