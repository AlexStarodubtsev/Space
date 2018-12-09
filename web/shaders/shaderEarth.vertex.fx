#ifdef GL_ES
    precision highp float;
#endif

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
// при умножении вектора координат на которую мы получаем вершину в глобальной системе координат (относительно центра сцены, а не относительно центра модели)
uniform mat4 world;
// матрица 4 на 4, матрица мира-вида-проекции. После умножения на нее вершина перемещается в нужное положение относительно камеры, т.е свое конечное положение.
uniform mat4 worldViewProjection;

// Varying
varying vec2 vUV;   // координату текселя
varying vec3 vPositionW;    // позиция вершины в глобальной системе координат
varying vec3 vNormalW;  // нормализованная нормаль вершины

void main(void) {
    vec4 outPosition = worldViewProjection * vec4(position, 1.0);
    gl_Position = outPosition;
    vPositionW = vec3(world * vec4(position, 1.0));
    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
    vUV = uv;
}