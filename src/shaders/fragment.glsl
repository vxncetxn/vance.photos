precision highp float;

uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
    vec4 textureResult = texture2D(uTexture, vUv);
    if(vUv.y > 1.0) 
    {
        textureResult.a = 0.0;
    }
    else
    {
        textureResult.a = 1.0;
    }
    gl_FragColor = textureResult;
}