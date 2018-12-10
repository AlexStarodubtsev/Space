// глобальные переменные
var config = {
    // Earth
    EARTH_RADIUS: 25, //радиус земли 6371302 m
    EARTH_V: 300, // количество сегментов
    EARTH_ROTATION: 0.01, // шаг вращения Земли
    // Moon
    MOON_RADIUS:  50 / 2, //радиус луны 1737100 m
    MOON_V: 25, // количество сегментов
    MOON_ROTATION: 0.02, //шаг вращения Луны
    // FPS
    showFps: true,
    fpsContainer: null,
    // Environment
    ENV_H: 26, //высота атмосферы
    // Sun
    SUN_RADIUS: 120, // радиус Солнца
    SUN_V: 15, // колич. сегментов
    // Dust
    DUST: 10000, // количество частиц

};


//проверяем, поддерживается ли работа фреймворка
if (BABYLON.Engine.isSupported()) {
    var canvas = document.getElementById("canvas"); //находим канвас, в котором будем рисовать сцену
    var engine = new BABYLON.Engine(canvas, true); //создаем движок; Второй аргумент включает / отключает поддержку сглаживания (antialias)
    var scene = new BABYLON.Scene(engine); //создаем сцену


    // --- создаем камеру, которая вращается вокруг заданной цели (это может быть меш или точка) --- //
    // Parameters: name, alpha, beta, radius, target position, scene
    // target position = нач. координаты камеры
    var camera = new BABYLON.ArcRotateCamera("Camera",Math.PI/2 ,Math.PI/2,1, new BABYLON.Vector3(270, 0, 200), scene);
    scene.activeCamera = camera; //задаем сцене активную камеру, т.е. ту через которую мы видим сцену
    camera.attachControl(canvas, true); //добавляем возможность управления камерой


    // --- создаем SkyBox --- //
    var skybox = BABYLON.Mesh.CreateBox("universe", 10000.0, scene);

    var skyboxMaterial = new BABYLON.StandardMaterial("universe", scene); // создаем материал
    skyboxMaterial.backFaceCulling = false; //Включаем видимость меша изнутри
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/universe/universe", scene); //задаем текстуру скайбокса как текстуру отражения
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE; //настраиваем скайбокс текстуру так, чтобы грани были повернуты правильно друг к другу
    skyboxMaterial.disableLighting = true; //отключаем влияние света
    skybox.material = skyboxMaterial; //задаем матерал мешу


    // --- создаем Землю --- //
    var earth = BABYLON.Mesh.CreateSphere("earth", config.EARTH_V, config.EARTH_RADIUS, scene, true);
    earth.position = new BABYLON.Vector3(350.0, 0.0, 0.1); // задаем позицию на сцене
    earth.rotation.z = Math.PI; // перевернуть Землю на 180 по OZ
    /**
     * TODO: https://github.com/BabylonJS/Babylon.js/blob/master/src/Mesh/babylon.mesh.ts
     * Modifies the mesh geometry according to a displacement map.
     * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.
     * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
     * @param url is a string, the URL from the image file is to be downloaded.
     * @param minHeight is the lower limit of the displacement.
     * @param maxHeight is the upper limit of the displacement.
     * @param onSuccess is an optional Javascript function to be called just after the mesh is modified. It is passed the modified mesh and must return nothing.
     * @param uvOffset is an optional vector2 used to offset UV.
     * @param uvScale is an optional vector2 used to scale UV.
     * @param forceUpdate defines whether or not to force an update of the generated buffers. This is useful to apply on a deserialized model for instance.
     * @returns the Mesh.
     */
    //earth.applyDisplacementMap("textures/earth/earth-height.png", 0, 1); //применяем карту высот - смещение => от 0 для черных фрагментов до 1 для белых


    // --- Источник света --- //
    //создаем точечный источник света в точке 0,0,0
    var lightSourceMesh = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0.0, 0.0, 0.0), scene);
    /*цвет света*/
    lightSourceMesh.diffuse = new BABYLON.Color3(1,1,1);
    lightSourceMesh.intensity = 1; // интенсивность излучения (1 - дефолт)

    // Материал Земли
    var earthMat = new BABYLON.ShaderMaterial("earthMat", scene, "./shaders/shaderEarth",
        {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldViewProjection", "diffuseTexture", "nightTexture"]
        });
    var diffuseTexture = new BABYLON.Texture("textures/earth/earth-diffuse.jpg", scene);
    var nightTexture = new BABYLON.Texture("textures/earth/earth-night-o21.png", scene);

    earthMat.setVector3("vLightPosition", lightSourceMesh.position); //задаем позицию источника света
    earthMat.setTexture("diffuseTexture", diffuseTexture); //задаем базовую текстуру ландшафта материалу
    earthMat.setTexture("nightTexture", nightTexture);//задаем ночную текстуру материалу
    earthMat.backFaceCulling = true;
    earth.material = earthMat;




    // --- создаем Луну --- //
    var moon = BABYLON.Mesh.CreateSphere("moon", config.MOON_V, config.MOON_RADIUS, scene);    //Луна
    //moon.parent = earth;                                                            //задаем родителя Землю
    moon.position = new BABYLON.Vector3(100.0, 0, 0, 0.0);                         //задаем позицию луны
    var moonMat = new BABYLON.StandardMaterial("moonMat", scene); //Материал Луны
    moonMat.diffuseTexture = new BABYLON.Texture("textures/moon/moon.jpg", scene); //задаем текстуру планеты
    moonMat.bumpTexture = new BABYLON.Texture("textures/moon/moon_bump.jpg", scene); //карта нормалей
    moonMat.specularTexture = new BABYLON.Texture("textures/moon/moon_spec.jpg", scene); // карта освещения
    moon.material = moonMat; //задаем материал

    // Show FPS
    if (config.showFps) {
        config.fpsContainer = document.createElement('div');
        config.fpsContainer.id = 'fps';
        document.body.appendChild(config.fpsContainer);
    }
    // Правильный render canvas при resize окна браузера
    window.addEventListener('resize', function () {
        engine.resize();
    });

    // --- создаем атмосферу Земли --- //
    var cloudsMat = new BABYLON.ShaderMaterial("cloudsMat", scene, "./shaders/shaderClouds",
        {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldViewProjection", "cloudsTexture", "lightPosition", "cameraPosition"],
            needAlphaBlending: true
        });

    var cloudsTexture = new BABYLON.Texture("textures/earth/earth-c.jpg", scene);

    cloudsMat.setTexture("cloudsTexture", cloudsTexture);
    cloudsMat.setVector3("cameraPosition", BABYLON.Vector3.Zero());
    cloudsMat.backFaceCulling = false;

    var cloudsMesh = BABYLON.Mesh.CreateSphere("clouds", config.EARTH_V, config.ENV_H , scene, true);
    cloudsMesh.material = cloudsMat;
    cloudsMesh.rotation.z = Math.PI;
    cloudsMesh.parent = earth;

    // --- создаем Солнце --- //
    var sun = BABYLON.Mesh.CreateSphere("sun", config.SUN_V, config.SUN_RADIUS, scene, true);

    // --- создаем материал для Солнца --- //
    var sunMat = new BABYLON.StandardMaterial("sunMat", scene);
    //создаем процедурную текстуру (128 - это разрешение)
    var fireTexture = new BABYLON.FireProceduralTexture("fire", 128, scene);
    //задаем 6 основных цветов
    fireTexture.fireColors = [
        new BABYLON.Color3(1.0,0.7,0.3),
        new BABYLON.Color3(1.0,0.7,0.3),
        new BABYLON.Color3(1.0,0.5,0.0),
        new BABYLON.Color3(1.0,0.5,0.0),
        new BABYLON.Color3(1.0,1.0,1.0),
        new BABYLON.Color3(1.0,0.5,0.0),
    ];

    //задаем материалу emissiveTexture
    sunMat.emissiveTexture = fireTexture;

    sun.material = sunMat; //присваиваем материал
    sun.parent = lightSourceMesh; //прикрепляем Солнце к источнику света
    //camera.target = sun; //Задаем точку вращения камеры (вокруг Земли)

    //создаем эффект god rays (name, pixel ratio, camera, целевой меш, quality, метод фильтрации, engine, флаг reusable)
    //var sunEffect = new BABYLON.VolumetricLightScatteringPostProcess('sunEffect', 1.0, camera, sun, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
    //sunEffect.exposure = 0.95;
    //sunEffect.decay = 0.96815;
    //sunEffect.weight = 0.78767;
    //sunEffect.density = 1.0;
    /*Раскомментируйте чтобы инициировать нужный эффект*/
    //       var postProcess = new BABYLON.BlackAndWhitePostProcess("bandw", 1.0, null, null, engine, true); //black and white
    //        var postProcess = new BABYLON.BlurPostProcess("Horizontal blur", new BABYLON.Vector2(1.5, 0), 1.0, 1.0, null, null, engine, true); //blur
    //        var postProcess = new BABYLON.FxaaPostProcess("fxaa", 1.0, null, null, engine, true); //fxaa
    /*добавляем эффект к камере*/
    //        camera.attachPostProcess(postProcess);

    var moonEllipticParams;
    ({
        init: function() {
            moonEllipticParams = this;
            this.delta = config.MOON_ROTATION; //смещение по углу (рад.)
            this.focus = 1.1; //множитель удлинения траектории по оси
            this.angle = 0; //начальный угол
            /*центр вращения*/
            this.x = earth.position.x;
            this.y = earth.position.y;
            this.z = earth.position.z;
            //радиус вращения
            this.r = BABYLON.Vector2.Distance(new BABYLON.Vector2(moon.position.x,moon.position.z), new BABYLON.Vector2(0.0, 0.0))
        }
    }).init();
    function getNewEllipticPosition(p) {
        p.angle += p.delta;
        return new BABYLON.Vector3(p.r * Math.sin(p.angle), p.y, p.focus*p.r * Math.cos(p.angle));
    }
    var earthCircleParams;
    ({
        init:function () {
            earthCircleParams=this;
            this.delta=config.EARTH_ROTATION;
            this.focus=1;
            this.angle=0;
            this.x=0;
            this.y=0;
            this.z=0;
            this.r = BABYLON.Vector2.Distance(new BABYLON.Vector2(earth.position.x, earth.position.z), new BABYLON.Vector2(0.0,0.0))

        }
    }).init();
    function getNewCirclePosition(p) {
        p.angle+=p.delta;
        return new BABYLON.Vector3(p.r * Math.sin(p.angle), p.y,  p.focus * p.r * Math.cos(p.angle));

    }

    // --- генерируем космическую пыль
    var spriteManagerDust = new BABYLON.SpriteManager("dustManager", "textures/particle32.png", config.DUST, 32, scene);
    function generateSpaceDust() {
        for (var i = 0; i < config.DUST; i++) {
            var dust = new BABYLON.Sprite("dust", spriteManagerDust); //саоздаем спрайт
            dust.position.x = Math.random() * 1000 - 500; //случайная позиция x
            dust.position.z = Math.random() * 1000 - 500;//случайная позиция y
            dust.position.y = Math.random() * 1000 - 500;//случайная позиция z
            dust.size = 0.7; //задаем размер - 0.2 от максимального
        }
    }
    generateSpaceDust();
    Const_R=Math.pow((384.4/250),2);
    var moon_m=10.736;
    var earth_m=59.72;
    G=6.67408;
    var gravitationParams;
    ({
        init:function () {
            gravitationParams=this;
            this.R= BABYLON.Vector3.Distance(new BABYLON.Vector3(earth.position.x, earth.position.y, earth.position.z), new BABYLON.Vector3(moon.position.x, moon.position.y, moon.position.z));
            this.r=new BABYLON.Vector3(earth.position.x-moon.position.x, earth.position.y-moon.position.y, earth.position.z-earth.position.z);
            if (moon.position.x<earth.position.x)
            {
                this.earth_a=-G*(moon_m/(Const_R*this.R*this.R));
                this.moon_a=G*(earth_m/(Const_R*this.R*this.R));
            }
            else
            {
                this.earth_a=G*(moon_m/(Const_R*this.R*this.R));
                this.moon_a=-G*(earth_m/(Const_R*this.R*this.R));
            }

            //this.moon_a=this.R;



        }
    }).init();
    function getNewPosition (x,obj, t, a){

        return new BABYLON.Vector3(2*obj.position.x-x+a*t*t, 0.0, 0.0 );
    }


   // console.log(gravitationParams.earth_a);
   // инициируем перерисовку
    x_m=moon.position.x;
    x_e=earth.position.x;
    t=1/50000;
    v_moon=0.0001;
    v_earth=0.0001;
    engine.runRenderLoop(function () {
        scene.render(); //перерисовываем сцену (60 раз в секунду)

        var shaderMaterial = scene.getMaterialByName("cloudsMat");
        shaderMaterial.setVector3("cameraPosition", scene.activeCamera.position);
        shaderMaterial.setVector3("lightPosition", lightSourceMesh.position);
        //
        //console.log(earth.position);
        k=0;
            console.log(gravitationParams.moon_a);
        //console.log(gravitationParams.moon_a);
      //  console.log(moon.position.x)
        //earth.rotation.y+= config.EARTH_ROTATION; //поворот на 0.001 радиана
        //moon.rotation.y += config.MOON_ROTATION;

        while(k<100000)
        {
             k+=1;
           //t=1/gravitationParams.moon_a;
             gravitationParams.init();
            // // if (gravitationParams.R<0.1 && gravitationParams.r.x/moon.position.x>0)
            //  {
            //     moon.position.x+=gravitationParams.r.x;
            //     earth.position.x-=gravitationParams.r.x;
            //      console.log(moon.position.x,v_moon, t)
            //
            //  }
            // else {
                 //console.log(v_moon, gravitationParams.r.x, moon.position.x);
                // t = 1 / (5*gravitationParams.R * gravitationParams.R);


                 v_moon += gravitationParams.moon_a * t;
                 v_earth += gravitationParams.earth_a * t;

                 moon.position.x = moon.position.x + v_moon * t;
                 earth.position.x = earth.position.x + v_earth * t;
             }
              // x_m=moon.position.x;
              // x_e=earth.position.x;

               //t=1/10000;
              // earth.position.x=earth.position.x+v_earth*t;
              // moon.position.x=moon.position.x+v_moon*t;

            // }
            // if (gravitationParams.R*2<=config.EARTH_RADIUS+config.MOON_RADIUS-2)
            // {
            //
            //     var p=moon_m*v_moon+v_earth*earth_m;
            //     var Ek=moon_m*v_moon*v_moon+v_earth*earth_m*v_earth;
            //     Ek=Ek*0.95;
            //     var D=Math.pow((2*p*moon_m),2)-4*(Math.pow(moon_m,2)+moon_m*earth_m)*(p*p-Ek*earth_m);
            //
            //
            //     var u_moon=(-2*p*moon_m-Math.sqrt(D))/(2*(Math.pow(moon_m,2)+moon_m*earth_m));
            //
            //     var u_earth=(p-moon_m*u_moon)/earth_m;
            //     v_moon=u_moon;
            //     v_earth=u_earth;
            //
            // }



            // else
            // {
            //     x_earth_dop = earth.position.x;
            //     x_moon_dop = moon.position.x;
            //     moon.position = getNewPosition(x_m, moon, t, gravitationParams.moon_a);
            //     earth.position = getNewPosition(x_e, earth, t, gravitationParams.earth_a);
            //     x_m = x_moon_dop;
            //     x_e = x_earth_dop;
            //     v_earth = (x_e - earth.position.x)/t;
            //     v_moon = (x_m - moon.position.x)/t
            // }

        //}
      //  console.log(v_moon);
        // v_earth+=gravitationParams.earth_a/60;


         //
        //  earth.rotation.y+= config.EARTH_ROTATION; //поворот на 0.001 радиана

        // console.log(moon.position.x)
        //


        // show Fps
        if (config.showFps) {
            config.fpsContainer.innerHTML = engine.getFps().toFixed() + ' fps';
        }
    });
}