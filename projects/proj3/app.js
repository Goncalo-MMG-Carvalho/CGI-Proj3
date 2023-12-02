import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize } from '../../libs/MV.js';

import * as dat from '../../libs/dat.gui.module.js';

import * as BUNNY from '../../libs/objects/bunny.js';
import * as COW from '../../libs/objects/cow.js';
import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as TORUS from '../../libs/objects/torus.js';

import { modelView, loadIdentity, loadMatrix, pushMatrix, popMatrix, multMatrix, multTranslation, multScale, multRotationX, multRotationY, multRotationZ } from '../../libs/stack.js';

import scene from './scene.js';

const FLOOR_COLOR = vec4(0.5, 0.5, 0.5, 1.0);

function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');

    /** @type WebGLRenderingContext */
    const gl = setupWebGL(canvas);

    // Init Objects
    BUNNY.init(gl);
    COW.init(gl);
    CUBE.init(gl);
    CYLINDER.init(gl);
    PYRAMID.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);


    const program = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader.frag']);
    const wireframeProgram = buildProgramFromSources(gl, shaders['wireframe.vert'], shaders['wireframe.frag']);

    const floorObject = {
        name: "Floor",
        position: { x: 0, y: -0.1, z: 0 }, // [0, -0.1, 0]
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 4, y: 0.2, z: 4 }, //[4, -0.2, 4]
        material: {
            Ka: [99, 207, 140],
            Kd: [99, 207, 140],
            Ks: [0, 0, 0],
            shininess: 100
        }
    }

    let object1 = {
        name: "Bunny",
        position: { x: 1, y: 0.5, z: 1 }, // Default position
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        material: {
            Ka: [233, 192, 234],
            Kd: [10, 10, 2],
            Ks: [50, 50, 50],
            shininess: 100
        }
    };

    let object2 = {
        name: "Cow",
        position: { x: 1, y: 0.5, z: -1 }, // Default position 
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        material: {
            Ka: [193, 92, 85],
            Kd: [10, 10, 2],
            Ks: [50, 50, 50],
            shininess: 100
        }
    };

    let object3 = {
        name: "Cube",
        position: { x: -1, y: 0.5, z: 1 }, // Default position 
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        material: {
            Ka: [63, 224, 26],
            Kd: [10, 10, 2],
            Ks: [50, 50, 50],
            shininess: 100
        }
    };

    let object4 = {
        name: "Sphere",
        position: { x: -1, y: 0.5, z: -1 }, // Default position
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        material: {
            Ka: [22, 109, 3],
            Kd: [10, 10, 2],
            Ks: [50, 50, 50],
            shininess: 100
        }
    };

    // Camera  
    let camera = {
        eye: vec3(0, 0, 5),
        at: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        fovy: 45,
        aspect: 1, // Updated further down
        near: 0.1,
        far: 20
    }

    // Options
    let options = {
        backface_culling: false,
        depthtest: true,
        show_lights: true,
        animation: false,
    }

    // Active object properties
    let transform = { ...object1 } // Object.assign({}, object1);
    let activeObject = "1";
    let activeWireframe = false;

    // Light settings
    let lights = [
        { // light1
            position: { x: 3, y: 0, z: 0, w: 1},
            ambient: [255, 255, 255],
            diffuse: [255, 255, 255],
            specular: [255, 255, 255],
            directional: true,
            active: true,
        },

        { // light2
            position: { x: 0, y: 3, z: 0, w: 0},
            ambient: [255, 255, 255],
            diffuse: [255, 255, 255],
            specular: [255, 255, 255],
            directional: false,
            active: false,
        },

        { // light3
            position: { x: 0, y: 0, z: 3, w: 0},
            ambient: [255, 255, 255],
            diffuse: [255, 255, 255],
            specular: [255, 255, 255],
            directional: false,
            active: false,
        },
    ];

    //
    // CONTROLS GUI
    // - Top right corner
    //

    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "backface_culling"); // Backface culling
    optionsGui.add(options, "depthtest"); // Z-Buffer
    optionsGui.add(options, "show_lights"); // Show lights as spheres
    optionsGui.add(options, "animation"); // Animate lights

    const cameraGui = gui.addFolder("camera");

    cameraGui.add(camera, "fovy").min(1).max(100).step(1).listen();
    cameraGui.add(camera, "aspect").min(0).max(10).step(0.01).listen().domElement.style.pointerEvents = "none";

    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.near = Math.min(camera.far - 0.5, v);
    });

    cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.far = Math.max(camera.near + 0.5, v);
    });

    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).step(0.05).listen().domElement.style.pointerEvents = "none";
    eye.add(camera.eye, 1).step(0.05).listen().domElement.style.pointerEvents = "none";
    eye.add(camera.eye, 2).step(0.05).listen().domElement.style.pointerEvents = "none";

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).listen().domElement.style.pointerEvents = "none";
    at.add(camera.at, 1).step(0.05).listen().domElement.style.pointerEvents = "none";
    at.add(camera.at, 2).step(0.05).listen().domElement.style.pointerEvents = "none";

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).listen().domElement.style.pointerEvents = "none";
    up.add(camera.up, 1).step(0.05).listen().domElement.style.pointerEvents = "none";
    up.add(camera.up, 2).step(0.05).listen().domElement.style.pointerEvents = "none";

    const lightsGui = gui.addFolder("lights");

    for (let i = 0; i < lights.length; i++) {
        let light = lights[i];

        const lightGui = lightsGui.addFolder(`Light ${i + 1}`);
        
        const lightPosition = lightGui.addFolder("position");
        lightPosition.add(light.position, "x").step(0.05).listen()
        lightPosition.add(light.position, "y").step(0.05).listen()
        lightPosition.add(light.position, "z").step(0.05).listen()


        lightGui.addColor(light, "ambient").listen();
        lightGui.addColor(light, "diffuse").listen();
        lightGui.addColor(light, "specular").listen();
        lightGui.add(light, "directional").listen();
        lightGui.add(light, "active").listen();
    }

    //
    // OBJECTS GUI
    // - Top left corner
    //

    let objectsGui;
    function renderObjectsGui() {

        objectsGui = new dat.GUI()
        objectsGui.domElement.id = "object-gui";
        objectsGui.add(transform, "name", ["Bunny", "Cow", "Cube", "Cylinder", "Pyramid", "Sphere", "Torus"]).listen()

        const guiTransforms = objectsGui.addFolder("transform");

        const guiPosition = guiTransforms.addFolder("position");
        guiPosition.add(transform.position, "x").listen();
        guiPosition.add(transform.position, "y").listen().domElement.style.pointerEvents = "none";
        guiPosition.add(transform.position, "z").listen();

        const guiRotation = guiTransforms.addFolder("rotation");
        guiRotation.add(transform.rotation, "x").listen().domElement.style.pointerEvents = "none";
        guiRotation.add(transform.rotation, "y").listen();
        guiRotation.add(transform.rotation, "z").listen().domElement.style.pointerEvents = "none";

        const guiScale = guiTransforms.addFolder("scale");
        guiScale.add(transform.scale, "x").listen();
        guiScale.add(transform.scale, "y").listen();
        guiScale.add(transform.scale, "z").listen();

        const guiMaterial = guiTransforms.addFolder("material");
        guiMaterial.addColor(transform.material, "Ka").listen();
        guiMaterial.addColor(transform.material, "Kd").listen();
        guiMaterial.addColor(transform.material, "Ks").listen();
        guiMaterial.add(transform.material, "shininess").listen().min(0).max(300).step(1);
    }

    renderObjectsGui();

    //
    // Utilities
    //


    // matrices
    let mView, mProjection;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.78, 0.78, 0.78, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enables Z-buffer depth test

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function (event) {


        if (!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
            const factor = 1 - event.deltaY / 1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
        }
        else if (event.metaKey || event.ctrlKey) {
            // move camera forward and backwards (shift)

            const offset = event.deltaY / 1000;

            const dir = normalize(subtract(camera.at, camera.eye));

            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));

            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if (event.ctrlKey) {
                camera.at[0] = ca[0];
                camera.at[1] = ca[1];
                camera.at[2] = ca[2];
            }
        }
    });

    function inCameraSpace(m) {
        const mInvView = inverse(mView);

        return mult(mInvView, mult(m, mView));
    }

    canvas.addEventListener('mousemove', function (event) {
        if (down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if (dx != 0 || dy != 0) {
                // Do something here...

                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5 * length(d), axis);

                let eyeAt = subtract(camera.eye, camera.at);
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

                eyeAt = mult(inCameraSpace(rotation), eyeAt);
                newUp = mult(inCameraSpace(rotation), newUp);

                console.log(eyeAt, newUp);

                camera.eye[0] = camera.at[0] + eyeAt[0];
                camera.eye[1] = camera.at[1] + eyeAt[1];
                camera.eye[2] = camera.at[2] + eyeAt[2];

                camera.up[0] = newUp[0];
                camera.up[1] = newUp[1];
                camera.up[2] = newUp[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
            }

        }
    });

    canvas.addEventListener('mousedown', function (event) {
        down = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        gl.clearColor(0.2, 0.0, 0.0, 1.0);
    });

    canvas.addEventListener('mouseup', function (event) {
        down = false;
        gl.clearColor(0.78, 0.78, 0.78, 1.0);
    });

    function saveBack() {
        switch (activeObject) {
            case "1":
                object1 = { ...transform }
                break;
            case "2":
                object2 = { ...transform }
                break;
            case "3":
                object3 = { ...transform }
                break;
            case "4":
                object4 = { ...transform }
                break;
        }
    }

    window.addEventListener("keypress", (evt) => {
        switch (evt.key) {
            case "1":
                console.log("Activating object 1")
                saveBack();
                activeObject = "1";
                transform = { ...object1 } // JSON.parse(JSON.stringify(object1)) // Object.assign({}, object1);
                activeWireframe = true;
                break;
            case "2":
                console.log("Activating object 2")
                saveBack();
                activeObject = "2";
                transform = { ...object2 } // Object.assign({}, object2);
                activeWireframe = true;
                break;
            case "3":
                console.log("Activating object 3")
                saveBack();
                activeObject = "3";
                transform = { ...object3 } // Object.assign({}, object3);
                activeWireframe = true;
                break;
            case "4":
                console.log("Activating object 4")
                saveBack();
                activeObject = "4";
                transform = { ...object4 } // Object.assign({}, object4);
                activeWireframe = true;
                break;
        }
        objectsGui.destroy();
        renderObjectsGui();

        console.log(transform);
    })

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function uploadModelView(material)
    {
        
        gl.useProgram(program);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));

        for(let i = 0; i < lights.length; i++) {
            
            //this segment of code is done before to potencially deactivate the light in the shader, 
            //as the shader saves, the light info from frame to frame 
            const active = gl.getUniformLocation(program, `uLight[${i}].active`);
            gl.uniform1i(active, lights[i].active ? 1 : 0);
            
            if (!lights[i].active) {
                continue;
            }

            const Pos = gl.getUniformLocation(program, `uLight[${i}].pos`);
            const Ia  = gl.getUniformLocation(program, `uLight[${i}].Ia` );
            const Id  = gl.getUniformLocation(program, `uLight[${i}].Id` );
            const Is  = gl.getUniformLocation(program, `uLight[${i}].Is` );
            //const active = gl.getUniformLocation(program, `uLight[${i}].active` );

            let curLightPos = vec4(lights[i].position.x, lights[i].position.y, lights[i].position.z, lights[i].position.w);
            gl.uniform4fv(Pos, curLightPos);
            gl.uniform3fv(Ia, flatten(vec3(lights[i].ambient.map(x => x / 255))));
            gl.uniform3fv(Id, flatten(vec3(lights[i].diffuse.map(x => x / 255))));
            gl.uniform3fv(Is, flatten(vec3(lights[i].specular.map(x => x / 255))));
            //gl.uniform1i(active, lights[i].active ? 1 : 0);
        }
        
        const uNLights = gl.getUniformLocation(program, "uNLights");
        gl.uniform1i(uNLights, lights.length);

        const Ka = gl.getUniformLocation(program, "uMaterial.Ka");
        const Kd = gl.getUniformLocation(program, "uMaterial.Kd");
        const Ks = gl.getUniformLocation(program, "uMaterial.Ks");
        const Shininess = gl.getUniformLocation(program, "uMaterial.shininess");

        gl.uniform3fv(Ka, flatten(vec3(material.Ka.map(function(x) { return x/255 }))));
        gl.uniform3fv(Kd, flatten(vec3(material.Kd.map(function(x) { return x/255 }))));
        gl.uniform3fv(Ks, flatten(vec3(material.Ks.map(function(x) { return x/255 }))));
        gl.uniform1f(Shininess, material.shininess/300);
    }

    /* TODO função para desenhar os objetos da cena através do json
    function drawObjects(obj) { // Uses the scene json
        pushMatrix();
        obj.scale ?? multScale(obj.scale);
        obj.translation ?? multTranslation(obj.translation);
        obj.rotationX ?? multRotationX(obj.rotationX);
        obj.rotationY ?? multRotationY(obj.rotationY);
        obj.rotationZ ?? multRotationZ(obj.rotationZ);

        uploadModelView();
        if (obj.mode === "TRIANGLES") {
            obj.shape.draw(gl, program, gl.TRIANGLES);
        }

        for (const child of obj.children) {
            drawObjects(child);
        }

        popMatrix();
    }*/

    function drawObject(obj) { // doesn't use scene json
        multTranslation([obj.position.x, obj.position.y, obj.position.z]);
        multRotationX(obj.rotation.x);
        multRotationY(obj.rotation.y);
        multRotationZ(obj.rotation.z);
        multScale([obj.scale.x, obj.scale.y, obj.scale.z]);

        uploadModelView(obj.material);

        let type = fromNameGetType(obj.name);
        type.draw(gl, program, gl.TRIANGLES);
    }


    function drawWireFrameObject(WIREFRAME_OFFSET = 0.01) {
        console.log("Drawing wireframe object", transform.name)
        
        // Apply transformations
        multTranslation([transform.position.x, transform.position.y, transform.position.z]);
        multRotationX(transform.rotation.x);
        multRotationY(transform.rotation.y);2
        multRotationZ(transform.rotation.z);
        multScale([transform.scale.x + WIREFRAME_OFFSET, transform.scale.y + WIREFRAME_OFFSET, transform.scale.z + WIREFRAME_OFFSET]);

        // Upload Model View
        gl.useProgram(wireframeProgram);
        gl.uniformMatrix4fv(gl.getUniformLocation(wireframeProgram, "mModelView"), false, flatten(modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(wireframeProgram, "mProjection"), false, flatten(mProjection));

        // Draw
        const type = fromNameGetType(transform.name);
        type.draw(gl, wireframeProgram, gl.LINES);
    }

    function fromNameGetType(name) {
        switch (name) {
            case "Bunny":
                return BUNNY;
            case "Cow":
                return COW;
            case "Cube":
                return CUBE;
            case "Cylinder":
                return CYLINDER;
            case "Pyramid":
                return PYRAMID;
            case "Sphere":
                return SPHERE;
            case "Torus":
                return TORUS;
            case "Floor":
                return CUBE;        
        }
    }

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        options.depthtest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);       //Enable/disable z-buffer
        options.backface_culling ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);   //Enable/disable backface culling

        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);
        loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);


        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(modelView())));

        gl.uniform1i(gl.getUniformLocation(program, "uUseNormals"), options.normals);
        //gl.clearColor(0.78, 0.78, 0.78, 1.0)

        saveBack();
        

        pushMatrix();
        /**/drawObject(floorObject);
        popMatrix();

        pushMatrix();
        /**/drawObject(object1);
        popMatrix();

        pushMatrix();
        /**/drawObject(object2);
        popMatrix();

        pushMatrix();
        /**/drawObject(object3);
        popMatrix();

        pushMatrix();
        /**/drawObject(object4);
        popMatrix();

        if (activeWireframe) {1
            pushMatrix();
            /**/drawWireFrameObject();
            popMatrix();
        }
            // drawObjects(scene);
    }
}

const urls = ['shader.vert', 'shader.frag', 'wireframe.vert', 'wireframe.frag'];

loadShadersFromURLS(urls).then(shaders => setup(shaders));