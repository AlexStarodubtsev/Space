#ifdef GL_ES
    precision highp float;
#endif

// Varying
varying vec2 vUV;   // uv координаты текстуры
varying vec3 vPositionW;    // позиция вершины на сцене
varying vec3 vNormalW;  // нормализованная нормаль вершины

// Refs
uniform vec3 lightPosition; // позиция источника света
uniform sampler2D diffuseTexture;   // переданная в шейдер текстура ландшафта
uniform sampler2D nightTexture; // переданная в шейдер ночная текстура

void main(void) {
    vec3 direction = lightPosition - vPositionW;
    vec3 lightVectorW = normalize(direction);

    // diffuse
    float lightDiffuse = max(0.05, dot(vNormalW, lightVectorW));
    vec3 color;
    vec4 nightColor = texture2D(nightTexture, vUV).rgba;
    vec3 diffuseColor = texture2D(diffuseTexture, vUV).rgb;
    color = diffuseColor * lightDiffuse + (nightColor.rgb * nightColor.a * pow((1.0 - lightDiffuse), 6.0));
    gl_FragColor = vec4(color, 1.0);
    //calculating
}