precision highp float;

const int MAX_LIGHTS = 8; 

struct LightInfo { 
    vec4 pos; 
    vec3 Ia; 
    vec3 Id; 
    vec3 Is; 
}; 

struct MaterialInfo { 
    vec3 Ka; 
    vec3 Kd; 
    vec3 Ks; 
    float shininess; 
};

varying vec3 fNormal;
varying vec3 fCameraPos;

uniform bool uUseNormals;
uniform int uNLights; 
uniform LightInfo uLight[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial; // The material of the object being drawn


void main()
{
    vec3 c = vec3(1.0, 1.0, 1.0);

    if( uUseNormals) 
        c = 0.5 *(fNormal + vec3(1.0, 1.0, 1.0));


    float intensity;

    for (int i = 0; i < MAX_LIGHTS; i++) {
        vec3 L = normalize(fLight); 
        vec3 V = normalize(fViewer); 
        vec3 N = normalize(fNormal); 
        vec3 H = normalize(L+V);

        vec3 ambient = uLight[i].Ia/255.0 * uMaterial.Ka/255.0
        vec3 diffuse = uLight[i].Id/255.0 * uMaterial.Kd/255.0 * max(dot(N, L), 0.0);
        vec3 specular = uLight[i].Is/255.0 * uMaterial.Ks/255.0 * pow(max(dot(N, H), 0.0), uMaterial.shininess);

        /*intensity += 
            uLight[i].Ia/255.0 * uMaterial.Ka + 
            uLight[i].Id * uMaterial.Kd * max(dot(fNormal,  L), 0.0) + 
            uLight[i].Is * uMaterial.Ks * pow(max(dot(-L, V), 0.0), uMaterial.shininess);*/
    }
    c = intensity;
    gl_FragColor = vec4(c, 1.0);
}

/*
I = cor do pixel

N = vetor normal
L = angulo da luz
R = angulo de reflexão de da luz = -L


dot() = produto interno


I = SUM(i,l)(Iai*Kai + Idi*Kdi*dot(N,L) + Isi*Ksi*dot(R,V)^n
*/


/*
const int MAX_LIGHTS = 8;

varying vec4 fNormal;
varying vec3 fCamPos;

uniform mat4 mNormals;
uniform mat4 mViewNormals;

uniform mat4 mView;             
varying vec3 uView;

struct MaterialInfo {
    vec3 uKa;
    vec3 uKd;
    vec3 uKs;
    float uShininess;
};

struct LightInfo {
    vec3 uAmbient;
    vec3 uSpecular;
    vec3 uDiffuse;
    vec4 uPosition;
    
    // vec3 uAxis;
    // float uApertures;
    // float uCutoff;
};

uniform float uFovy;
uniform int uNLights;
uniform LightInfo uLights[MAX_LIGHTS];
uniform MaterialInfo uMaterial;

void main() {
    vec4 color;
    vec3 L;

    for(int i = 0; i<MAX_LIGHTS; i++) {
            L = normalize((mView * uLights[i].uPosition).xyz - fCamPos);
            vec3 V = normalize(-fCamPos);
            vec3 N = normalize( (mNormals * fNormal).xyz);
            vec3 R = reflect(-L, N);
            vec3 H = normalize(L+V);
            
            float diffuseFactor = max(dot(L, N), 0.0);
            vec3 diffuse = diffuseFactor * (uLights[i].uDiffuse/256.0 * uMaterial.uKd/256.0);
    
            float specularFactor = pow(max(dot(R,V), 0.0), uMaterial.uShininess);
            vec3 specular = specularFactor * (uLights[i].uSpecular/256.0 * uMaterial.uKs/256.0);
            

            if (dot(L, N) < 0.0)
                specularFactor = 0.0;

            float xFovy = 1.0/pow(uFovy, 2.0);

        color += vec4((uLights[i].uAmbient/256.0 * uMaterial.uKa/256.0) + xFovy*700.0 * (diffuse + specular), 1.0);
    }

    gl_FragColor = color;
}*/