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
varying vec3 fViewer;

uniform bool uUseNormals;
uniform int uNLights; // The number of lights active or inactive
uniform LightInfo uLight[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial; // The material of the object being drawn
uniform mat4 mView;
uniform mat4 mViewNormals;

// varying mat4 fModelView;

void main()
{
    vec4 tempColor = vec4(0.0, 0.0, 0.0, 1.0);

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNLights) {
            break ; // no more lights to process
        }

        vec3 L;

        if(uLight[i].pos.w == 0.0)  // if is a vector
            L = normalize((mViewNormals * uLight[i].pos).xyz);
        else                        // if is a point
            L = normalize((mView * uLight[i].pos).xyz + fViewer);
        

        vec3 V = normalize(fViewer);
        vec3 N = normalize(fNormal);
        vec3 H = normalize(L + V);

        vec3 ambient = uLight[i].Ia * uMaterial.Ka;
        vec3 diffuse = uLight[i].Id * uMaterial.Kd * max(dot(L,N), 0.0);
        
        vec3 specular;
        if( dot(L,N) < 0.0 ) { 
            specular = vec3(0.0, 0.0, 0.0); 
        }
        else {
            specular = uLight[i].Is * uMaterial.Ks * pow(max(dot(N, H), 0.0), uMaterial.shininess);
        }
        
        tempColor += vec4(ambient + diffuse + specular, 0);
    }
    gl_FragColor = tempColor;
}

/*
I = cor do pixel

N = vetor normal
L = angulo da luz
R = angulo de reflexão de da luz = -L


dot() = produto interno


I = SUM(i,l)(Iai*Kai + Idi*Kdi*dot(N,L) + Isi*Ksi*dot(R,V)^n
*/


