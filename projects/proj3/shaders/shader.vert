attribute vec4 vPosition;
attribute vec3 vNormal;

uniform mat4 mProjection;
uniform mat4 mModelView;
uniform mat4 mNormals;

varying vec3 fNormal;
varying vec3 fViewer;

void main()
{
    gl_Position = mProjection * mModelView * vPosition;
    
    //fNormal = (mNormals * vec4(vNormal, 0.0)).xyz;
    fNormal = mat3(mModelView) * normalize(vNormal);

    fViewer = -(mModelView * vPosition).xyz; // - position of the camera
}
