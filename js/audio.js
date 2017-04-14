/**
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <christian@orange-coding.net> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return.
 * ----------------------------------------------------------------------------
 **/
!(function () {
    var audioVisualization = new function () {

        //html nodes
        var stats, container;

        //Scene vars
        var camera, scene, renderer, geometry;

        var colors = [];

        //Screen details
        var screenWidth = window.innerWidth,
            screenHeight = window.innerHeight;

        //Half screen details
        var halfWidth = screenWidth / 2,
            halfHeight = screenHeight / 2;

        //Mouse position
        var mouseX = 0,
            mouseY = 0;

        //Particles
        var particleCount = 63;
        var particle, particles, material;

        //Audio
        var fft,
            context = new AudioContext(),
            sourceNode,
            analyser = context.createAnalyser(),
            scriptProcessor,
            processedAudioData;


        var a = 0, b = 0;
        return {
            init: function () {
                container = document.createElement('div');
                container.setAttribute("id", "visframe");

                document.body.appendChild(container);

                //Hook up the mouse-wheel events
                document.addEventListener('mousemove', this.mousemove, false);
                document.addEventListener('DOMMouseScroll', this.wheel, false);
                document.addEventListener('mousewheel', this.wheel, false);


                //Create Stats instance for logging the performance/framerate
                stats = new Stats();
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.top = '0';
                stats.domElement.style.right = '0';
                container.appendChild(stats.domElement);

                //WebAudio Stuff
                analyser.fftSize = 2048;
                // setup a javascript node
                scriptProcessor = context.createScriptProcessor(2048, 1, 1);
                fft = new FFT(2048, context.sampleRate);
                // connect to destination, else it isn't called
                scriptProcessor.connect(context.destination);
                // create a buffer source node
                sourceNode = context.createBufferSource();
                sourceNode.connect(analyser);
                sourceNode.connect(context.destination);

                // load the specified sound
                var loadSound = function (url) {
                    var request = new XMLHttpRequest();
                    request.open('GET', url, true);
                    request.responseType = 'arraybuffer';

                    // When loaded decode the data
                    request.onload = function () {
                        OC.fadeOut("downloadAnimation");
                        // decode the data
                        context.decodeAudioData(request.response, function (buffer) {
                            // when the audio is decoded play the sound
                            playSound(buffer);
                        }, function error() {
                            //TODO More docu
                            console.log("Error Loading Song.")
                        });
                    };
                    request.send();
                };

                function playSound(buffer) {
                    sourceNode.buffer = buffer;
                    sourceNode.start(0);
                    audioVisualization.startAnimation();
                }

                loadSound("audio/sadRobot.ogg");

                //while playing, analyse the bytes
                scriptProcessor.onaudioprocess = function (e) {
                    var fb = e.inputBuffer;

                    var dataArray = new Uint8Array(fb.length);
                    analyser.getByteTimeDomainData(dataArray);

                    fft.forward(dataArray);
                    processedAudioData = fft.spectrum;
                };


                //Create a new scene
                scene = new THREE.Scene();

                //Create the camera
                //(Field of vision, Aspect ratio, nearest point, farest point)
                camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2500);
                //Set the cameras z-axis position
                camera.position.y = 150;
                camera.position.z = 800;


                scene.add(camera);
                //Create a new renderer
                renderer = new THREE.WebGLRenderer({clearAlpha: 1});
                //Set the render size to size of the browser
                renderer.setSize(window.innerWidth, window.innerHeight);


                //Used to draw the circle
                var circleBot = 0;
                geometry = new THREE.Geometry();
                var sprite = THREE.ImageUtils.loadTexture("gfx/particle.png");

                var createVertex = function (circleBot, counter) {
                    var vertex = new THREE.Vector3();

                    vertex.x = Math.sin(circleBot) * 80 * x;
                    vertex.y = 0;
                    vertex.z = Math.cos(circleBot) * 80 * x;

                    return vertex;
                };


                //create the inner rings
                var counter = 0;
                for (var x = 1; x < 5; x++) {
                    for (var i = 0; i < particleCount; i++) {
                        var vertex = createVertex(circleBot, counter);

                        geometry.vertices.push(vertex);

                        colors[counter] = new THREE.Color(0xffffff);
                        colors[counter].setHSV(( vertex.x + 1000 ) / 2000, 1, 1);
                        circleBot += 0.1;
                        counter++;
                    }
                }

                //create the 2 outer rings
                for (var x = 0; x < 2; x++) {
                    for (var i = 0; i < particleCount; i++) {
                        var vertex = createVertex(circleBot, counter);
                        geometry.vertices.push(vertex);

                        colors[counter] = new THREE.Color(0xffffff);
                        colors[counter].setHSV(( vertex.x + 1000 ) / 2000, 1, 1);
                        circleBot += 0.1;
                        counter++;
                    }
                }


                geometry.colors = colors;

                material = new THREE.ParticleBasicMaterial({size: 30, map: sprite, vertexColors: true});

                particles = new THREE.ParticleSystem(geometry, material);
                particles.sortParticles = true;

                scene.add(particles);

                //Add the rendered view to the body
                container.appendChild(renderer.domElement);


            },
            //if the mouse is moved, change the camera view (will be done within the animate function )
            mousemove: function (e) {
                //X position = current mouse - half width
                mouseX = e.clientX - halfWidth;
                //Y position = current mouse - half height
                mouseY = e.clientY - halfHeight;
            },

            wheel: function (e) {
                //Wheel change to 0
                var delta = 0;
                if (!e) {
                    var e = window.event;
                }
                //Look for wheel data
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (window.opera) {
                        delta = -delta;
                    }
                } else if (e.detail) {
                    delta = -e.detail / 3;
                }
                //Now we have wheel data do something with it
                if (delta) {
                    audioVisualization.wheelzoom(delta);
                }
            },
            //zoom in/out the animation
            wheelzoom: function (delta) {
                //Change the zoom value depending on delta
                camera.position.z -= (delta * 60);
            },


            //animates the 3d visualization
            //will be called every single time, the (audio)signal has been processed
            startAnimation: function () {

                if(processedAudioData){
                stats.begin();
                //fft.spectrum.length contains an array of audio data
                camera.position.x += (mouseX - camera.position.x) * 0.05;
                camera.position.y += (-mouseY - camera.position.y) * 0.05;
                camera.position.x += ( mouseX - camera.position.x ) * 0.5;
                camera.lookAt(scene.position);


                for (var i in geometry.vertices) {
                    var particle = geometry.vertices[i];

                    if (i < geometry.vertices.length - (2 * particleCount)) {
                        //inner ring
                        particle.y = (processedAudioData[i] * 8);

                    } else {
                        //outer ring
                        if (i > geometry.vertices.length - (particleCount + 1)) {
                            particle.z = 0;
                            particle.y = Math.sin(a) * 80 * 5;
                            particle.x = Math.cos(a) * 80 * 5;
                            a += 0.1;
                        } else {
                            particle.z = Math.cos(b) * 80 * 4;
                            particle.y = Math.sin(b) * 80 * 5;
                            particle.x = Math.sin(b) * 80 * 5;
                            b -= 0.1;
                        }
                    }

                }

                renderer.render(scene, camera);
                stats.end();
                }
              requestAnimationFrame(audioVisualization.startAnimation);


            }
        }
    }();
    audioVisualization.init();
}());
