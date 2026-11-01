import bpy, math, os
from mathutils import Vector
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),'v7');os.makedirs(out,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,value):
 m=bpy.data.materials.new(name);m.diffuse_color=(*([value]*3),1);return m
clay=mat('wood-clay',.52);cloth=mat('uniform-clay',.36);hair=mat('hair-clay',.16);dark=mat('recess',.11);eye=mat('eye-clay',.69)
def ell(name,p,s,m=clay):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def box(name,p,s,m=cloth):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);o.data.materials.append(m);b=o.modifiers.new('soft handcut edges','BEVEL');b.width=.025;b.segments=3;o.modifiers.new('normals','WEIGHTED_NORMAL');return o
def rod(name,a,b,r,m=clay):
 a=Vector((a[0],-a[2],a[1]));b=Vector((b[0],-b[2],b[1]));d=b-a
 bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r*.83,radius2=r,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m);return o
def surface(name,rings,m):
 verts=[];faces=[];n=40
 for y,rx,rz,zc in rings:
  for j in range(n):
   a=j*math.tau/n;verts.append((rx*math.cos(a),-(zc+rz*math.sin(a)),y))
 for k in range(len(rings)-1):
  for j in range(n):a=k*n+j;b=k*n+(j+1)%n;faces.append((a,b,b+n,a+n))
 faces.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+j for j in range(n))]);mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for f in mesh.polygons:f.use_smooth=True
 mod=o.modifiers.new('surface refinement','SUBSURF');mod.levels=2
 return o
def strand(name,points,width,m):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=width;curve.bevel_resolution=2;curve.resolution_u=12
 spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for i,(p,b) in enumerate(zip(points,spline.bezier_points)):
  b.co=(p[0],-p[2],p[1]);b.handle_left_type=b.handle_right_type='AUTO';b.radius=[.55,1,.65,.015][min(i,3)]
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
surface('tailored_blouse',[(.94,.34,.19,0),(.97,.35,.20,0),(1.1,.31,.18,0),(1.4,.30,.17,0),(1.62,.34,.17,0),(1.69,.27,.14,0),(1.72,.13,.10,0)],cloth)
surface('carved_face',[(1.79,.07,.07,.035),(1.83,.15,.14,.045),(1.95,.28,.24,.025),(2.1,.36,.295,0),(2.3,.375,.30,-.015),(2.47,.30,.255,-.035),(2.54,.14,.13,-.03),(2.55,.02,.02,-.03)],clay)
face=bpy.data.objects['carved_face']
for v in face.data.vertices:
 x,y,z=v.co;front=max(0,-y/.30)
 if y<0:
  socket=sum(math.exp(-((x-side*.145)/.085)**2-((z-2.17)/.075)**2) for side in [-1,1])
  cheek=sum(math.exp(-((x-side*.20)/.12)**2-((z-2.06)/.11)**2) for side in [-1,1])
  bridge=math.exp(-(x/.045)**2-((z-2.14)/.12)**2)
  v.co.y+=(.025*socket-.014*cheek-.023*bridge)*front
rod('neck',(0,1.71,0),(0,1.85,0),.085)
ell('hair_closed_crown',(0,2.39,-.06),(.385,.21,.30),hair)
import random
random.seed(117)
def leaf_lock(name,az,start,end,width):
 verts=[];faces=[];steps=12;around=8
 for k in range(steps+1):
  t=k/steps;theta=start+(end-start)*t;ang=az+(.36+.19*math.sin(az*3))*math.sin(t*math.pi*.8)
  radial=Vector((math.sin(theta)*math.cos(ang),math.sin(theta)*math.sin(ang),math.cos(theta)))
  center=Vector((.405*radial.x,.34*radial.y-.04,2.28+.34*radial.z))
  center+=radial*(.018+(.028+.018*math.sin(az*7))*math.sin(math.pi*t)+.035*t**4)
  tangent=Vector((-math.sin(ang),math.cos(ang),0));normal=radial
  w=width*(.25+.9*math.sin(math.pi*t))*(1-t)**.5+.0004
  for j in range(around):
   angle=j*math.tau/around;p=center+tangent*(math.cos(angle)*w)+normal*(math.sin(angle)*w*.22)
   verts.append((p.x,-p.y,p.z))
 for k in range(steps):
  for j in range(around):i=k*around+j;n=k*around+(j+1)%around;faces.append((i,n,n+around,i+around))
 faces.extend([tuple(reversed(range(around))),tuple(steps*around+j for j in range(around))]);mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(hair)
 for f in mesh.polygons:f.use_smooth=True
for layer in range(3):
 for i in range(32):
  az=i*math.tau/32+layer*.095+random.uniform(-.035,.035)
  front=math.sin(az)>.35
  start=.10+layer*.34;end=(1.35 if front else 1.85)+random.uniform(-.22,.19)
  leaf_lock('scalp_lock_%d_%d'%(layer,i),az,start,end,.032+random.random()*.018)
for s in [-1,1]:
 ell('ear',(s*.365,2.13,0),(.052,.09,.035));ell('ear_concha',(s*.385,2.13,.024),(.026,.057,.012),cloth);ell('eye',(s*.145,2.166,.253),(.078,.032,.011),eye);ell('iris',(s*.142,2.165,.264),(.028,.032,.005),dark)
 strand('upper_eyelid',[(s*.057,2.17,.263),(s*.105,2.193,.271),(s*.175,2.193,.258),(s*.231,2.18,.239)],.008,clay)
 strand('lower_eyelid',[(s*.057,2.17,.263),(s*.105,2.14,.271),(s*.175,2.14,.258),(s*.231,2.18,.239)],.009,clay)
 strand('brow',[(s*.075,2.25,.28),(s*.12,2.269,.28),(s*.18,2.268,.266),(s*.225,2.252,.245)],.009,hair)
 o=box('collar',(s*.115,1.67,.175),(.18,.17,.018));o.rotation_euler[1]=s*.28
ell('nose_bridge',(0,2.145,.284),(.032,.085,.018));ell('nose',(0,2.105,.307),(.033,.031,.025));ell('mouth',(0,1.996,.285),(.051,.006,.009),dark)
ell('upper_lip',(0,2.009,.28),(.047,.011,.012));ell('lower_lip',(0,1.986,.278),(.045,.012,.012))
bpy.ops.object.select_all(action='DESELECT')
parts=[o for o in bpy.data.objects if o.name in ['carved_face','nose_bridge','nose','upper_lip','lower_lip']]
for o in parts:
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 o.select_set(False)
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();face=bpy.context.object;face.name='continuous_face'
rem=face.modifiers.new('fused carved facial surface','REMESH');rem.mode='VOXEL';rem.voxel_size=.0025;bpy.ops.object.modifier_apply(modifier=rem.name)
sm=face.modifiers.new('gentle surface smoothing','SMOOTH');sm.factor=1;sm.iterations=22
for polygon in face.data.polygons:polygon.use_smooth=True
for y in [1.4,1.24,1.08]:ell('button',(0,y,.19),(.018,.018,.012),dark)
ell('neckerchief_knot',(0,1.57,.205),(.035,.035,.026));strand('neckerchief_left',[(0,1.56,.20),(-.045,1.5,.22),(-.035,1.43,.22),(-.015,1.40,.21)],.027,cloth);strand('neckerchief_right',[(0,1.56,.20),(.035,1.5,.23),(.05,1.46,.23),(.07,1.43,.22)],.024,cloth);box('breast_pocket',(.17,1.38,.174),(.13,.16,.025),cloth)
for side in [-1,1]:
 for leg in [False,True]:
  root=(side*(.19 if leg else .43),.95 if leg else 1.65,0);joint=(side*(.22 if leg else .52),.52 if leg else 1.14,.065);end=(side*(.24 if leg else .58),.18 if leg else .80,.08)
  tag=('leg' if leg else 'arm')+str(side)
  rod(tag+'_upper',root,(joint if leg else (side*.48,1.38,.04)),.13,cloth);rod(tag+'_lower',joint,end,.071)
  if not leg:rod(tag+'_exposed_upper',root,joint,.065)
  for label,p in [('root',root),('joint',joint),('end',end)]:ell(tag+'_'+label,p,(.093,.093,.093))
  if leg:
   o=surface(tag+'_shorts',[(.70,.145,.17,0),(.73,.16,.18,0),(.94,.15,.18,0),(1.0,.12,.15,0)],cloth);o.location.x=side*.19;ell(tag+'_shoe',(end[0],.135,.15),(.115,.075,.22),dark);ell(tag+'_sole',(end[0],.075,.15),(.12,.025,.225),dark);box(tag+'_shoe_strap',(end[0],.185,.12),(.22,.025,.06),cloth)
  else:
   ell(tag+'_palm',(end[0],.735,.08),(.075,.10,.04));ell(tag+'_thumb',(end[0]-side*.075,.75,.1),(.03,.065,.03))
   for j in range(4):ell(tag+'_finger'+str(j),(end[0]-.052+j*.034,.642,.08),(.015,.06,.024))
box('backpack',(0,1.36,-.29),(.46,.55,.18));box('backpack_flap',(0,1.57,-.40),(.48,.19,.035))
for s in [-1,1]:box('strap',(s*.23,1.40,.19),(.045,.64,.025),dark)
# Wrinkles are broad silhouette changes, not applied surface decoration.
body=bpy.data.objects['tailored_blouse']
for v in body.data.vertices:
 x,y,z=v.co
 if .97<z<1.5:v.co.y+=.009*math.sin(z*23+x*13)*math.sin(x*9)
for o in list(bpy.data.objects):
 if o.name.startswith('strap'):
  o.hide_render=True
for side in [-1,1]:
 strand('shoulder_strap',[(side*.22,1.18,.19),(side*.25,1.58,.18),(side*.24,1.71,-.02),(side*.22,1.4,-.40)],.022,cloth)
 for y in [1.2,1.52]:box('strap_buckle',(side*.23,y,.204),(.06,.07,.018),clay)
 # Two-link carved fingers establish knuckles and varied finger lengths.
 for j in range(4):
  x=side*.58-.052+j*.034;length=[.047,.065,.061,.045][j]
  rod('finger_proximal',(x,.68,.08),(x,.64,.10),.014)
  rod('finger_distal',(x,.64,.10),(x,.64-length,.12),.012)
  ell('knuckle',(x,.64,.10),(.017,.017,.017))
for o in list(bpy.data.objects):
 if '_finger' in o.name:o.hide_render=True
# Replace rigid block details with shaped garment panels.
def panel(name,coords,m):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata([(x,-z,y) for x,y,z in coords],[],[tuple(range(len(coords)))]);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 solid=o.modifiers.new('fabric thickness','SOLIDIFY');solid.thickness=.012
 bevel=o.modifiers.new('rounded sewn edge','BEVEL');bevel.width=.012;bevel.segments=3
 return o
for o in list(bpy.data.objects):
 if o.name.startswith(('collar','breast_pocket')):o.hide_render=True
 if o.name.startswith('leg') and o.name.endswith('_upper'):o.data.materials.clear();o.data.materials.append(clay);o.scale.x*=.65;o.scale.y*=.65
 if o.name.startswith('arm') and o.name.endswith('_upper'):
  for f in o.data.polygons:f.use_smooth=True
  bevel=o.modifiers.new('sleeve soft edge','BEVEL');bevel.width=.014;bevel.segments=3
for side in [-1,1]:
 panel('sailor_collar',[(side*.04,1.57,.212),(side*.26,1.68,.15),(side*.18,1.75,.04),(side*.085,1.73,.10)],cloth)
 strand('collar_piping',[(side*.05,1.59,.218),(side*.14,1.64,.19),(side*.24,1.69,.16),(side*.18,1.74,.07)],.006,clay)
 # Sculpt the trouser folds into the subdivided surface.
 o=bpy.data.objects['leg'+str(side)+'_shorts'];bpy.context.view_layer.objects.active=o
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 for v in o.data.vertices:
  x,y,z=v.co
  v.co.y+=.014*math.sin(z*44+side*x*16)*math.exp(-((z-.86)/.11)**2)
  v.co.x+=.008*math.sin(z*31+x*13)
 cuff=surface('trouser_cuff',[(.695,.151,.176,0),(.705,.156,.18,0),(.735,.156,.18,0),(.745,.15,.173,0)],cloth);cuff.location.x=side*.19
 sock=surface('rumpled_sock',[(.18,.077,.075,.075),(.20,.084,.08,.075),(.24,.075,.073,.075),(.27,.084,.077,.075),(.31,.077,.07,.07),(.34,.08,.075,.07)],cloth);sock.location.x=side*.24
 for h in [.22,.265,.315]:
  strand('sock_fold',[(side*.24-.065,h,.11),(side*.24-.035,h+.008,.15),(side*.24+.035,h-.008,.15),(side*.24+.065,h,.1)],.008,clay)
 ell('shoe_heel',(side*.24,.135,-.015),(.105,.075,.085),cloth)
 box('shoe_buckle',(side*.24+side*.092,.18,.12),(.025,.045,.065),clay)
 # Sleeve seam follows the actual sleeve end.
 strand('sleeve_cuff',[(side*.39,1.39,.07),(side*.46,1.37,.17),(side*.54,1.38,.13),(side*.59,1.4,.03)],.009,clay)
 panel('pocket',[(.10,1.46,.18),(.25,1.46,.13),(.24,1.31,.15),(.17,1.285,.18),(.10,1.31,.19)],cloth) if side==1 else None
for h in [1.13,1.24,1.35]:
 box('bag_padded_rib',(0,h,-.397),(.40,.07,.045),cloth)
strand('bag_handle',[(-.10,1.66,-.29),(-.07,1.73,-.29),(.07,1.73,-.29),(.10,1.66,-.29)],.013,cloth)
# Broad hem band, fitted to the blouse instead of a floating bar.
surface('blouse_hem',[(.94,.338,.19,0),(.95,.35,.20,0),(.985,.35,.20,0),(1.0,.335,.19,0)],cloth)
# Articulated axle-and-clevis joints replace oversized spherical placeholders.
def axle(name,p,radius,length,material):
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius,depth=length,location=(p[0],-p[2],p[1]),rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name;o.data.materials.append(material)
 bevel=o.modifiers.new('axle edge','BEVEL');bevel.width=.006;bevel.segments=3
 for f in o.data.polygons:f.use_smooth=True
 return o
for side in [-1,1]:
 for leg in [False,True]:
  tag=('leg' if leg else 'arm')+str(side);p=(side*(.22 if leg else .52),.52 if leg else 1.14,.065)
  bpy.data.objects[tag+'_joint'].hide_render=True
  axle(tag+'_hinge_core',p,.065,.105,clay)
  for offset in [-.068,.068]:
   axle(tag+'_hinge_cheek',(p[0]+offset,p[1],p[2]),.072,.027,cloth)
  axle(tag+'_hinge_pin',p,.025,.17,clay)
  # Smooth carved limbs with subtle longitudinal facets retained only in silhouette.
  for suffix in ['_lower','_exposed_upper']:
   o=bpy.data.objects.get(tag+suffix)
   if o:
    for f in o.data.polygons:f.use_smooth=True
    b=o.modifiers.new('carved rim rounding','BEVEL');b.width=.007;b.segments=3
 # Wrist ball size follows the hand rather than the elbow.
 wrist=bpy.data.objects['arm'+str(side)+'_end'];wrist.scale*=.48
 palm=bpy.data.objects['arm'+str(side)+'_palm'];palm.scale.x*=.82
 # Shoe toe cap and welt follow the existing toe volume.
 strand('toe_cap_seam',[(side*.24-.09,.13,.23),(side*.24-.06,.18,.25),(side*.24+.06,.18,.25),(side*.24+.09,.13,.23)],.004,cloth)
for o in list(bpy.data.objects):
 if o.name.startswith('scalp_lock'):
  # Small uneven lift at the ends breaks the helmet outline.
  for v in o.data.vertices:
   if v.co.z<2.35:
    v.co.x+=.008*math.sin(v.co.z*33+v.co.x*17)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.3,.3,.3)
bpy.ops.mesh.primitive_plane_add(size=200);bpy.context.object.name='studio_ground';bpy.context.object.data.materials.append(mat('ground',.22))
for pos,power,size in [((3,-4,6),650,5),((-3,-1,4),450,4),((0,3,5),700,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);bpy.context.object.data.energy=power;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=size;bpy.context.object.rotation_euler=(Vector((0,0,1.4))-bpy.context.object.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=3.05;scene.camera=cam
for name,pos in [('front',(0,-7,1.4)),('side',(7,0,1.4)),('back',(0,7,1.4)),('three-quarter',(4,-6,2.5)),('top',(0,-.1,8))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,1.35))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(out,'gray-'+name+'.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=1.13;cam.location=(1,-4,2.25);cam.rotation_euler=(Vector((0,0,2.2))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(out,'head-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'student-gray-v7.blend'))
