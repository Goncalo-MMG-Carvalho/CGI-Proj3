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

    let object1 = {
        name: "Bunny",
        position: { x: 1, y: 0.5, z: 1 }, // Default position
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        material: {
            Ka: [233, 192, 234],
            Kd: [200, 200, 200],
            Ks: [200, 200, 200],
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
            Kd: [200, 200, 200],
            Ks: [200, 200, 200],
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
            Kd: [200, 200, 200],
            Ks: [200, 200, 200],
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
            Kd: [200, 200, 200],
            Ks: [200, 200, 200],
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
        wireframe: false,
        normals: false,
        backfaceCulling: false,
        depthtest: true
    }

    // Active object properties
    let transform = { ...object1 } // Object.assign({}, object1);
    let activeObject = "1";

    // Light settings
    let lights = {
        light1: {
            position: { x: 0, y: 0, z: 0 },
            ambient: [255, 0, 0],
            diffuse: [255, 0, 0],
            specular: [255, 0, 0],
            directional: false,
            active: true,
        },
        light2: {
            position: { x: 0, y: 0, z: 0 },
            ambient: [255, 0, 0],
            diffuse: [255, 0, 0],
            specular: [255, 0, 0],
            directional: false,
            active: true,
        },
        light3: {
            position: { x: 0, y: 0, z: 0 },
            ambient: [255, 0, 0],
            diffuse: [255, 0, 0],
            specular: [255, 0, 0],
            directional: false,
            active: true,
        },
    }

    //
    // CONTROLS GUI
    // - Top right corner
    //

    const gui = new dat.GUI();

    gui.add(options, "backfaceCulling");
    gui.add(options, "depthtest"); // Z-Buffer

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "wireframe");
    optionsGui.add(options, "normals");

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

    const light1Gui = lightsGui.addFolder("light 1");

    const light1Position = light1Gui.addFolder("position");
    light1Position.add(lights.light1.position, "x").step(0.05).listen().domElement.style.pointerEvents = "none";
    light1Position.add(lights.light1.position, "y").step(0.05).listen().domElement.style.pointerEvents = "none";
    light1Position.add(lights.light1.position, "z").step(0.05).listen().domElement.style.pointerEvents = "none";

    light1Gui.addColor(lights.light1, "ambient").listen();
    light1Gui.addColor(lights.light1, "diffuse").listen();
    light1Gui.addColor(lights.light1, "specular").listen();
    light1Gui.add(lights.light1, "directional").listen();
    light1Gui.add(lights.light1, "active").listen();

    const light2Gui = lightsGui.addFolder("light 2");

    const light2Position = light2Gui.addFolder("position");
    light2Position.add(lights.light2.position, "x").step(0.05).listen().domElement.style.pointerEvents = "none";
    light2Position.add(lights.light2.position, "y").step(0.05).listen().domElement.style.pointerEvents = "none";
    light2Position.add(lights.light2.position, "z").step(0.05).listen().domElement.style.pointerEvents = "none";

    light2Gui.addColor(lights.light2, "ambient").listen();
    light2Gui.addColor(lights.light2, "diffuse").listen();
    light2Gui.addColor(lights.light2, "specular").listen();
    light2Gui.add(lights.light2, "directional").listen();
    light2Gui.add(lights.light2, "active").listen();

    const light3Gui = lightsGui.addFolder("light 3");

    const light3Position = light3Gui.addFolder("position");
    light3Position.add(lights.light3.position, "x").step(0.05).listen().domElement.style.pointerEvents = "none";
    light3Position.add(lights.light3.position, "y").step(0.05).listen().domElement.style.pointerEvents = "none";
    light3Position.add(lights.light3.position, "z").step(0.05).listen().domElement.style.pointerEvents = "none";

    light3Gui.addColor(lights.light3, "ambient").listen();
    light3Gui.addColor(lights.light3, "diffuse").listen();
    light3Gui.addColor(lights.light3, "specular").listen();
    light3Gui.add(lights.light3, "directional").listen();


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

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
                break;
            case "2":
                console.log("Activating object 2")
                saveBack();
                activeObject = "2";
                transform = { ...object2 } // Object.assign({}, object2);
                break;
            case "3":
                console.log("Activating object 3")
                saveBack();
                activeObject = "3";
                transform = { ...object3 } // Object.assign({}, object3);
                break;
            case "4":
                console.log("Activating object 4")
                saveBack();
                activeObject = "4";
                transform = { ...object4 } // Object.assign({}, object4);
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


    function uploadModelView() {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }


    function uploadModelView(material)
    {
        gl.useProgram(program);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));

        for(let i = 0; i< lights.length ;i++){
            const uShininess = gl.getUniformLocation(program, "uMaterial.uShininess");
            const uKa = gl.getUniformLocation(program, "uMaterial.uKa");
            const uKd = gl.getUniformLocation(program, "uMaterial.uKd");
            const uKs = gl.getUniformLocation(program, "uMaterial.uKs");
            const uNLights = gl.getUniformLocation(program, "uNLights");
            const uFovy = gl.getUniformLocation(program, "uFovy"); 

            const uPosition = gl.getUniformLocation(program, `uLights[${i}].uPosition`); 
            const uAmbient = gl.getUniformLocation(program, `uLights[${i}].uAmbient`); 
            const uSpecular = gl.getUniformLocation(program, `uLights[${i}].uSpecular`); 
            const uDiffuse = gl.getUniformLocation(program, `uLights[${i}].uDiffuse`);

            gl.uniform3fv(uKa, flatten(vec3(material.Ka)));
            gl.uniform3fv(uKd, flatten(vec3(material.Kd)));
            gl.uniform3fv(uKs, flatten(vec3(material.Ks)));
            gl.uniform1f(uShininess, material.shininess);
            gl.uniform1f(uFovy, camera.fovy);
            gl.uniform1f(uNLights, 3);

            gl.uniform3fv(uAmbient, flatten(vec3(lights[i].ambient)));
            gl.uniform3fv(uSpecular, flatten(vec3(lights[i].specular)));
            gl.uniform3fv(uDiffuse, flatten(vec3(lights[i].diffuse)));
            gl.uniform4fv(uPosition,lights[i].position);
            gl.uniform3fv(uAxix,lights[i].axis);
            gl.uniform1f(uApertures,lights[i].apertures);
            gl.uniform1f(uCutoff,lights[i].cutoff);
        }
    }


    function drawFloor() {
        multTranslation([0, -0.1, 0]);
        multScale([4, -0.2, 4]);
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
    }

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
        }
    }

    function drawObject(obj) { // doesn't use scene
        multTranslation([obj.position.x, obj.position.y, obj.position.z]);
        multRotationX(obj.rotation.x);
        multRotationY(obj.rotation.y);
        multRotationZ(obj.rotation.z);
        multScale([obj.scale.x, obj.scale.y, obj.scale.z]);

        uploadModelView(/*obj.material*/); // uncomment object material when done

        let type = fromNameGetType(obj.name);
        type.draw(gl, program, gl.TRIANGLES);
    }

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        options.depthtest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);       //Enable/disable z-buffer
        options.backfaceCulling ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);   //Enable/disable backface culling

        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);
        loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);


        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(modelView())));

        gl.uniform1i(gl.getUniformLocation(program, "uUseNormals"), options.normals);

        saveBack();

        pushMatrix();
        /**/drawFloor();
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

        // drawObjects(scene);
    }
}

const urls = ['shader.vert', 'shader.frag'];

loadShadersFromURLS(urls).then(shaders => setup(shaders));