/** Original authored learning courtyard. Run with node; no external asset service. */
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
// GLTFExporter only needs the asynchronous Blob reader in Node.
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
  async readAsDataURL(blob) { this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`; this.onloadend?.(); }
};
const scene = new T.Scene();
const materials = {};
for (const [name,color] of Object.entries({limestone:'#D9D6C9',rock:'#aaa696',mint:'#D0E4DE',lilac:'#BEB2D6',ink:'#2D302D',timber:'#9B775A',leaf:'#99b6a3',leafLight:'#b7c8a4',chalk:'#f4f1e7',screen:'#ffffff',logo:'#ffffff'})) materials[name]=new T.MeshStandardMaterial({name, color,roughness:.88, side: name==='logo'?T.DoubleSide:T.FrontSide});
const batches=new Map();
function mesh(name,geometry,material,p,rotation=[0,0,0],scale=[1,1,1]) {
 if (material==='screen' || material==='logo') {const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++) uv.setY(i,1-uv.getY(i));}
 const m=new T.Mesh(geometry,materials[material]);m.name=name;m.position.set(...p);m.rotation.set(...rotation);m.scale.set(...scale);m.updateMatrix();
 geometry=geometry.index?geometry.toNonIndexed():geometry;geometry.applyMatrix4(m.matrix);
 if(!batches.has(material)) batches.set(material,[]);batches.get(material).push(geometry);
}
const box=(n,p,s,m,rot)=>mesh(n,new T.BoxGeometry(...s),m,p,rot);
function rod(n,a,b,r,m){const d=new T.Vector3(...b).sub(new T.Vector3(...a));const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());const e=new T.Euler().setFromQuaternion(q);mesh(n,new T.CylinderGeometry(r,r,d.length(),8),m,new T.Vector3(...a).addScaledVector(d,.5).toArray(),e.toArray().slice(0,3));}
// A shallow irregular twelve-sided rock shelf, topped by a smaller terrace.
mesh('Earth underside',new T.CylinderGeometry(2.85,2.35,.48,11),'rock',[0,-.24,0],[0,.12,0],[1,1,.75]);
mesh('Limestone terrace',new T.CylinderGeometry(2.85,2.8,.17,11),'limestone',[0,.065,0],[0,.12,0],[1,1,.75]);
// Open pavilion: curved rear wall, timber colonnade and a single gently sloped roof.
const wall=new T.Shape();
wall.absarc(0,0,1.18,0,Math.PI,false);wall.absarc(0,0,1.05,Math.PI,0,true);wall.closePath();
const curved=new T.ExtrudeGeometry(wall,{depth:1.55,bevelEnabled:false,curveSegments:20});curved.rotateX(-Math.PI/2);
mesh('Curved mineral wall',curved,'mint',[-.65,.2,-.45]);
for(const [x,z] of [[-1.78,.35],[.45,.35],[-1.6,-1.48],[.5,-1.48]]) box('Timber column',[x,1.04,z],[.09,1.8,.09],'timber');
box('Pavilion floor',[-.62,.19,-.57],[2.62,.12,2.07],'chalk');
box('Sloping lilac roof',[-.62,1.99,-.55],[2.85,.14,2.35],'lilac',[0,0,-.055]);
for(let i=0;i<13;i++) box('Roof timber edge',[-1.94+i*.22,1.887-i*.0121,.62],[.055,.085,.11],'timber');
box('Reading ledge',[-.65,.77,-1.25],[1.28,.1,.35],'timber');
for(const x of [-1.15,-.15]) box('Ledge foot',[x,.47,-1.25],[.085,.5,.23],'timber');
// Supported phone at front right. The PNG is a genuine empty welcome state.
box('Phone plinth',[1.1,.3,.72],[.8,.3,.62],'limestone');
box('Phone support',[1.1,.6,.65],[.12,.3,.08],'timber');
box('Phone frame',[1.1,1.32,.72],[.76,1.43,.11],'ink');
mesh('App screen',new T.PlaneGeometry(.68,1.32),'screen',[1.1,1.32,.781]);
// One official logo on a solid pavilion sign.
box('Pavilion sign',[-.56,1.66,.67],[.64,.33,.045],'chalk');
mesh('Official sign',new T.PlaneGeometry(.58,.27),'logo',[-.56,1.66,.697]);
// Reading bench and path: keep the middle courtyard empty.
for(const x of [-1.15,-.12]) box('Bench feet',[x,.33,1.26],[.12,.36,.43],'ink');
for(let i=0;i<3;i++) box('Bench slat',[-.635,.55,1.08+i*.16],[1.4,.085,.13],'timber');
for(const [x,z] of [[1.15,1.42],[.5,1.42],[.3,.68],[-.12,.34]]) mesh('Stepping stone',new T.CylinderGeometry(.25,.27,.06,7),'chalk',[x,.185,z],[0,x,0],[1.15,1,.75]);
// Two physical content cards, each on a weighted stand. Abstract layout only.
for(const [x,z] of [[-1.75,.76],[.1,-.68]]) {
 box('Card base',[x,.21,z],[.38,.12,.32],'limestone');box('Card stem',[x,.59,z],[.045,.68,.045],'timber');box('Content card',[x,.93,z],[.36,.45,.055],'chalk');
 box('Card swatch',[x,1.025,z+.032],[.28,.16,.013],'lilac');box('Card line',[x,.88,z+.033],[.25,.026,.014],'mint');box('Card line',[x-.025,.825,z+.033],[.2,.022,.014],'mint');
}
// An airy rear tree, deliberately outside the phone and roof sightlines.
rod('Tree trunk',[1.55,.15,-1.07],[1.48,1.98,-1.15],.075,'timber');
for(const [i,a] of [[0,[1.0,2.4,-1.3]],[1,[2.02,2.5,-1.32]],[2,[1.5,2.8,-1.05]],[3,[1.95,2.12,-.78]]]) {
 rod('Tree branch',[1.5,1.56,-1.12],a,.035,'timber');mesh('Airy foliage',new T.IcosahedronGeometry(.48,1),i%2?'leaf':'leafLight',a,[0,i*.9,.2],[1,.65,.88]);
}
box('Planting bed',[1.7,.22,-1.2],[1.02,.15,.9],'mint');
for(let i=0;i<7;i++) mesh('Moss',new T.IcosahedronGeometry(.14,0),'leaf',[1.4+(i%3)*.25,.32,-1.45+Math.floor(i/3)*.24],[0,i,0],[1,.65,1]);
for(const [material,geometries] of batches) { const merged=mergeGeometries(geometries);const obj=new T.Mesh(merged,materials[material]);obj.name=`Courtyard ${material}`;scene.add(obj); }
const buffer=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true}));
const jsonSize=buffer.readUInt32LE(12);const doc=JSON.parse(buffer.subarray(20,20+jsonSize));let bin=buffer.subarray(28+jsonSize);doc.images=[];doc.textures=[];doc.samplers=[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}];
for(const [material,file] of [['screen','welcome.png'],['logo','mark.png']]) {
 const png=await fs.readFile(path.join(root,'public/images/denkpause',file));const start=bin.length;const pad=Buffer.alloc((4-png.length%4)%4);bin=Buffer.concat([bin,png,pad]);doc.bufferViews.push({buffer:0,byteOffset:start,byteLength:png.length});doc.images.push({bufferView:doc.bufferViews.length-1,mimeType:'image/png'});doc.textures.push({sampler:0,source:doc.images.length-1});const mat=doc.materials.find(m=>m.name===material);mat.pbrMetallicRoughness.baseColorTexture={index:doc.textures.length-1};
 if(material==='logo'){mat.alphaMode='BLEND';mat.doubleSided=true;}
}
doc.buffers[0].byteLength=bin.length;let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);await fs.writeFile(path.join(root,'public/3d/worlds/denkpause-v1.glb'),Buffer.concat([header,json,bh,bin]));
console.log(`denkpause-v1.glb: ${28+json.length+bin.length} bytes, ${doc.meshes.length} material batches`);
