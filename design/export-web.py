import bpy,os,math
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'design/v7/student-gray-v7.blend'))
for o in list(bpy.data.objects):
 if o.type not in {'MESH','CURVE'} or o.hide_render or o.name=='studio_ground':bpy.data.objects.remove(o,do_unlink=True)
for o in list(bpy.data.objects):
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 if o.type=='CURVE':bpy.ops.object.convert(target='MESH')
 for mod in list(o.modifiers):
  try:bpy.ops.object.modifier_apply(modifier=mod.name)
  except:pass
 if o.type=='MESH' and len(o.data.polygons)>200:
  mod=o.modifiers.new('web reduction','DECIMATE');mod.ratio=.10;bpy.ops.object.modifier_apply(modifier=mod.name)
 # Bake world transforms before grouping in the web adapter.
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.select_set(False)
os.makedirs(os.path.join(root,'public/models'),exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public/models/student-v7.glb'),export_format='GLB',export_yup=True)
