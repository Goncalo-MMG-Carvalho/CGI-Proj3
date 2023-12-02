precision highp float;

const int MAX_LIGHTS = 8; 

struct LightInfo { 
    vec4 pos; 
    vec3 Ia; 
    vec3 Id; 
    vec3 Is;
    int active;
}; 

struct MaterialInfo { 
    vec3 Ka; 
    vec3 Kd; 
    vec3 Ks; 
    float shininess; 
};

varying vec3 fNormal;
varying vec3 fViewer;

uniform bool uUseNormals;
uniform int uNLights; // The number of lights active or inactive
uniform LightInfo uLight[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial; // The material of the object being drawn

void main()
{
    vec3 intensity = vec3(0.0, 0.0, 0.0);

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNLights) break ; // no more lights to process
        if (uLight[i].active == 0) continue; // skip this inactive light

        vec3 L;

        if(uLight[i].pos.w == 0.0)  // if is a vector
            L = normalize(uLight[i].pos.xyz);
        else                        // if is a point
            L = normalize(uLight[i].pos.xyz + fViewer); 
        
        vec3 V = normalize(fViewer);  
        vec3 N = normalize(fNormal); 
        vec3 R = reflect(-L, N);

        vec3 ambient = uLight[i].Ia * uMaterial.Ka;
        vec3 diffuse = uLight[i].Id * uMaterial.Kd * max(dot(L,N), 0.0);
        vec3 specular = uLight[i].Is * uMaterial.Ks * pow(max(dot(R, V), 0.0), uMaterial.shininess);

        if( dot(L,N) < 0.0 ) { 
            specular = vec3(0.0, 0.0, 0.0); 
        }

        intensity += ambient + diffuse + specular;
    }
    gl_FragColor = vec4(intensity, 1.0);
}

/*
I = cor do pixel

N = vetor normal
L = angulo da luz
R = angulo de reflexão de da luz = -L


dot() = produto interno


I = SUM(i,l)(Iai*Kai + Idi*Kdi*dot(N,L) + Isi*Ksi*dot(R,V)^n
*/