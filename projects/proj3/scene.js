import * as BUNY from '../../libs/objects/bunny.js';
import * as COW from '../../libs/objects/cow.js';

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as TORUS from '../../libs/objects/torus.js';

import { vec3 } from '../../libs/MV.js';

let scene = {

    
    // FLOOR
    scale: [2, -0.2, 2],
    translation: [0, 0, 0],
    rotationY: 0,
    shape: CUBE,
    mode: "TRIANGLES",

    camera: {
        eye: vec3(0,0,5),
        at: vec3(0,0,0),
        up: vec3(0,1,0),
        fovy: 45,
        aspect: 1, // Updated further down
        near: 0.1,
        far: 20
    },

    options: {
        wireframe: false,
        normals: true
    },

    children: [
        // FLOOR
        {
            scale: [2, -0.2, 2],
            translation: [0, 0, 0],
            rotateY: 0,
            shape: CUBE
            mode: "TRIANGLES",

            material: {
                ka: vec3(0.5, 0.5, 0.5),
                kd: vec3(0.5, 0.5, 0.5),
                ks: vec3(0.5, 0.5, 0.5),
                shininess: 1
            }
        },

        // COW
        {
            scale: [1,1,1],
            translation: [1, 0, 0],
            rotateY: 0,
            shape: COW,
        },

        // BUNNY
        {
            scale: [1,1,1],
            translation: [-1, 0, 0],
            rotateY: 0,
            shape: BUNY,
        },

        

    ],
};
export default scene;