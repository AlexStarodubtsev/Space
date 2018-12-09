#ifdef GL_ES
    precision highp float;
#endif

// Varying
varying vec2 vUV;   // uv координаты текстуры
varying vec3 vPositionW;    // позиция вершины на сцене
varying vec3 vNormalW;  // нормализованная нормаль вершины

// Refs
uniform vec3 lightPosition; // позиция источника света
uniform vec3 cameraPosition;    // позиция камеры в мире
uniform sampler2D cloudsTexture;   // переданная в шейдер текстура атмосферы

// Чтобы правильно отобразить центр и края сферы нам нужна функция преломления (коэфф. Френеля)
// показывает когда надо рисовать краевую подсветку
float computeFresnelTerm(vec3 viewDirection, vec3 normalW, float bias, float power)
{
    float fresnelTerm = pow(bias + dot(viewDirection, normalW), power);
    return clamp(fresnelTerm, 0.0, 1.0);
}

void main(void) {
    // Camera
    vec3 camDirection = cameraPosition - vPositionW;
    vec3 viewDirectionW = normalize(camDirection); //Нормализованный вектор взгляда от камеры до вершины

    // Light
    vec3 direction = lightPosition - vPositionW; //Направление от источника света до вершины
    vec3 lightVectorW = normalize(direction); //Получение нормализованного вектора

    // Lighting
    //Получаем косинус между направлением нормали вершины и направлением "луча света" вершину
    float lightDiffuse = max(0.0, dot(vNormalW, lightVectorW)); //рассчитываем коэффициент освещенности от 0 до 1

    vec3 color = texture2D(cloudsTexture, vUV).rgb; //получаем RGB составляющую цвета текселя по переданной UV координате из текстуры

    // определяем альфа составляющую
    // В текстуре нет альфа составляющей и прозрачная часть меша должна рассчитываться из цветовой. Поэтому получаем цвет текселя и присваиваем альфа составляющей значение красной составляющей. Мы могли бы взять любую другую, т.к. текстура черно-белая и они все равны.
    float globalAlpha = clamp(color.r, 0.0, 1.0);

    // Fresnel Term
    // Меняя bias и power - можно изменять эффект преломления (последние 2)
    float fresnelTerm = computeFresnelTerm(viewDirectionW, vNormalW, 0.72, 5.0);

    float resultAlpha; //результирующая альфа составляющая

    if (fresnelTerm < 9.95) {
        //это краевая, подсвечиваемая зона сферы
        float envDiffuse = clamp(pow(fresnelTerm - 0.92, 0.5) * 2.0, 0.0, 1.0); //коэффициент рассеивания для смягчения границы перехода между центральной частью и частью сияния
        resultAlpha = fresnelTerm * dot(vNormalW, lightVectorW); //получаем прозрачность умножая коэффициент Френеля на косинус мешду светом и взглядом на вершину
        color = color / 2.0 + vec3(0.0,0.4,0.8); //уменьшаем базовый текстурный цвет на 4 и прибавляем голубой
    }
    else {
        //это центр сферы, должен демонстрировать
        resultAlpha = fresnelTerm * globalAlpha * lightDiffuse;
    }


    // Эффект заката
    float backLightCos = dot(viewDirectionW, lightVectorW); //косинус между вектором взгляда на вершину и вектором луча света
    float cosConst = 0.9; // граница расчета эффекта заката. 0.9 => угол в ~(155 - 205) градусов
    //если угол между вектором взгляда и лучом света  ~(155 - 205) градусов
    if (backLightCos < -cosConst) {
       //Обработка свечения с обратной стороны
       float sunHighlight = pow(backLightCos+cosConst, 2.0); //коэффициент подсветки
       if (fresnelTerm < 0.9) {
           //если это край атмосферы (подсвечиваемая часть) то для нее такой расчет
           sunHighlight *= 65.0; //увеличиваем коэффициент подсветки заката
           float envDiffuse = clamp(pow(fresnelTerm - 0.92, 0.5) * 2.0, 0.0, 1.0);
           resultAlpha = sunHighlight; //устанавливаем его как прозрачность
           color *= lightDiffuse; //умножаем основной цвет на коэффициент освещенности
           color.r += sunHighlight; //увеличиваем красную составляющую на коэффициант подсветки заката
           color.g += sunHighlight / 2.0; //увеливаем зеленую составляющую на тот же коэффициент но в 2 раза меньше (чтобы был оранжевый цвет)
           gl_FragColor = vec4(color, resultAlpha);
           return;
       }
//       else {
//           //свечение центральной части сферы
//           sunHighlight *= 95.0; //увеличиваем коэффициент подсветки заката
//           sunHighlight *= 1.0 + dot(vNormalW, lightVectorW); //уменьшить (dot(vNormalW, lightVectorW) < 0.0) свечение при приближении к центр сферы (ограничиваем свечение краями, иначе - подсветим то что не может быть подсвечено)
//           color = vec3(sunHighlight,sunHighlight / 2.0,0.0);
//           resultAlpha = sunHighlight; //устанавливаем его как прозрачность
//           gl_FragColor = vec4(color, resultAlpha);
//           return;
//       }
    }

    //  умножаем цвет фрагмента на коэффициент освещенности, чтобы сделать облака в теневой части темнее.
    gl_FragColor = vec4(color*lightDiffuse, resultAlpha);
}