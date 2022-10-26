#define PI 3.1415926535897932384626433832795

precision highp float;
precision highp int;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uViewportSize;
uniform float uStrength;

varying vec2 vUv;

void main() {
    vUv = uv;

    vec4 newPosition = modelViewMatrix * vec4(position, 1.0);
    newPosition.z += min(cos(newPosition.y / uViewportSize.y * PI) * uStrength * 60.0, cos(newPosition.y / uViewportSize.y * PI) * 40.0);

    gl_Position = projectionMatrix * newPosition;
}