import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {componentBindings} from '../src/skin-components.js';
// Um mesh com duas botas/cilindros: tampas e costuras UV continuam na mesma peça.
const a=new THREE.CylinderGeometry(.2,.25,1,16,4).translate(-1,0,0),b=a.clone().translate(2,0,0),g=mergeGeometries([a,b]);let groups=0;
const binding=componentBindings(g,new THREE.Matrix4(),part=>{groups++;return part.center.x<0?'L':'R'});
assert.equal(groups,2);for(let i=0;i<g.attributes.position.count;i++)assert.equal(binding(i),g.attributes.position.getX(i)<0?'L':'R');
assert.equal(g.getAttribute('skinIndex'),undefined,'Classificação alterou a geometria de autoria');
a.dispose();b.dispose();g.dispose();console.log('OK: peças desconectadas e costuras/tampas soldadas somente para classificação.');
