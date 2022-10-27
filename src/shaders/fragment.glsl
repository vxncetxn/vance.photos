precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uTransitionFactor;

varying vec2 vUv;

void main() {
    vec4 textureResult = texture2D(uTexture, vUv);
    float func;
    if (2.0 * uTime / 800.0 < 1.0)
    {
        func = -1.0 / 2.0 * pow(2.0 * uTime / 800.0, 3.0) + 1.0;
    }
    else
    {
        func = -1.0 / 2.0 * (pow((2.0 * uTime / 800.0) - 2.0, 3.0) + 2.0) + 1.0;
    }
    textureResult.a = ceil(max((vUv.y - func) * uTransitionFactor, 0.0));
    gl_FragColor = textureResult;
}