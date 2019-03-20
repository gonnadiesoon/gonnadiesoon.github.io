// RequestAnimationFrame polyfill
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

let xhr = new XMLHttpRequest();
xhr.open('GET', 'chart_data.json');
xhr.send();
xhr.onreadystatechange = function () {
    if (this.readyState != 4) return;

    if (this.status != 200) {
        alert('Error: ' + (this.status ? this.statusText : 'запрос не удался'), "/n Input data might be missing.");
    } else {
        let chart_data = JSON.parse(xhr.responseText);

        let
            HORIZONTAL_MARGIN_RATIO = 0.03;
        THUMBNAIL_LINE_WIDTH = 1.4 / window.devicePixelRatio,
            THUMBNAIL_CANVAS_HEIGHT_RATIO = 0.075 //0.06318082788671024,
        THUMBNAIL_BACKGROUND_COLOR = "rgba(245, 249, 251, 0.75)",
            THUMBNAIL_BORDER_COLOR = "rgba(222, 235, 243, 0.85)",
            THUMBNAIL_VERTICAL_PADDING = 5 / window.devicePixelRatio,
            FRAME_RATIO = 0.267661692,
            FRAME_VERTICAL_BORDER_WIDTH = 4,
            FRAME_HORIZONAL_BORDER_WIDTH = FRAME_VERTICAL_BORDER_WIDTH / 4;

        // for proper canvas width
        chart_data.map(() => {
            let canvas = document.createElement("canvas");
            document.querySelector("main").appendChild(canvas);
            let [canvasWidth, canvasHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                Math.ceil(THUMBNAIL_CANVAS_HEIGHT_RATIO * document.documentElement.clientHeight)
            ];

            canvas.height = canvasHeight * window.devicePixelRatio;
            canvas.width = canvasWidth * window.devicePixelRatio;
            canvas.style.height = canvasHeight + 'px';
            canvas.style.width = canvasWidth + 'px';
        });

        // chart_data is taken from chart_data.js
        chart_data.map((current_input, index_of_chart) => {
            let lines = {
                y: [],
                x: undefined
            };

            let xLabel, lineLabels = [];

            // находим подписи для линий и х
            for (const key in current_input.types) {
                if (current_input.types.hasOwnProperty(key)) {
                    if (current_input.types[key] === "line") {
                        lineLabels.push(key);
                    } else if (current_input.types[key] === "x") {
                        xLabel = key;
                    }
                }
            }

            // сортируем входные данные на y[n]-координаты и x-координаты
            current_input.columns.map(column => {
                if (lineLabels.includes(column[0])) {
                    lines.y.push(column);
                } else if (xLabel === column[0]) {
                    lines.x = column;
                }
            });

            //CANVAS INIT
            let canvas = document.querySelectorAll("canvas")[index_of_chart];
            let [canvasWidth, canvasHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                Math.ceil(THUMBNAIL_CANVAS_HEIGHT_RATIO * document.documentElement.clientHeight)
            ];

            canvas.height = canvasHeight * window.devicePixelRatio;
            canvas.width = canvasWidth * window.devicePixelRatio;
            canvas.style.height = canvasHeight + 'px';
            canvas.style.width = canvasWidth + 'px';


            // Adding checkbuttons
            let checkbuttons = [];
            lines.y.map((line, index) => {
                let currentCheckbutton = createCheckButton(current_input.names[line[0]], current_input.colors[line[0]], line[0]);

                if (index > 0) {
                    checkbuttons[checkbuttons.length - 1].after(currentCheckbutton);
                } else {
                    canvas.after(currentCheckbutton);
                }

                checkbuttons.push(currentCheckbutton);
            });
            checkbuttons[checkbuttons.length - 1].style.marginRight = '0';

            //CONTEXT INIT
            let c = canvas.getContext('2d');
            c.scale(window.devicePixelRatio, window.devicePixelRatio);

            //CANVAS STATE
            let canvasState = {
                mousedown: false,
                mouseX: undefined,
                frameScalingBorder: "",
                frameScaling: false,
                frameMoving: false,

                stopFrame() {
                    this.mousedown = false;
                    this.mouseX = undefined;
                    this.frameMoving = false;
                    this.frameScaling = false;
                    this.frameScalingBorder = '';
                },

                checkedLines: {},
                MAX_Y: undefined,
                updateMAX_Y() {
                    this.MAX_Y = lines.y
                        .filter(line => canvasState.checkedLines[line[0]])
                        .reduce((currentMaxY, yCoordinates) => {
                            return Math.max(Math.max(...yCoordinates.slice(1)), currentMaxY);
                        }, 0);
                }
            }
            lineLabels.map(label => {
                canvasState.checkedLines[label] = true;
            });
            canvasState.updateMAX_Y();

            let frame = new Frame(
                c,
                canvasWidth * (1 - Math.max(FRAME_RATIO, (1 / (lines.x.length - 1)) * 6)),
                0,
                canvasWidth,
                canvasHeight,
                THUMBNAIL_BORDER_COLOR,
                0,
                canvasWidth,
                (1 / (lines.x.length - 1)) * 6 * canvasWidth //берем 6 отрезков, получаем 7 точек в худшем случае, который хэндлится строгим отображением на основном графике
            );

            window.addEventListener("resize", event => {
                THUMBNAIL_LINE_WIDTH = 1.4 / window.devicePixelRatio;
                THUMBNAIL_VERTICAL_PADDING = 5 / window.devicePixelRatio;

                [canvasWidth, canvasHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                    Math.ceil(THUMBNAIL_CANVAS_HEIGHT_RATIO * document.documentElement.clientHeight)
                ];

                canvas.height = canvasHeight * window.devicePixelRatio;
                canvas.width = canvasWidth * window.devicePixelRatio;
                canvas.style.height = canvasHeight + 'px';
                canvas.style.width = canvasWidth + 'px';
                c.scale(window.devicePixelRatio, window.devicePixelRatio);

                frame = new Frame(
                    c,
                    canvasWidth * (1 - Math.max(FRAME_RATIO, (1 / (lines.x.length - 1)) * 6)),
                    0,
                    canvasWidth,
                    canvasHeight,
                    THUMBNAIL_BORDER_COLOR,
                    0,
                    canvasWidth,
                    (1 / (lines.x.length - 1)) * 6 * canvasWidth //берем 6 отрезков, получаем 7 точек в худшем случае, который хэндлится строгим отображением на основном графике
                );
            });

            //FRAME INTERACTING
            canvas.addEventListener("mousedown", ({
                clientX,
                clientY
            }) => {
                clientX -= canvas.offsetLeft;
                console.log(clientX, frame.x1, frame.x2);
                console.log("clientY:", clientY, "offsetTop:", canvas.offsetTop, "y1 and y2:", frame.y1, frame.y2)
                canvasState.mousedown = true;
                canvasState.mouseX = clientX;
                canvasState.mouseInitialX = clientX;
            });

            canvas.addEventListener("touchstart", event => {
                let clientX = event.changedTouches[event.changedTouches.length - 1].clientX - canvas.offsetLeft;
                canvasState.mousedown = true;
                canvasState.mouseX = clientX;
                canvasState.mouseInitialX = clientX;
            });

            document.addEventListener("mouseup", event => {
                canvasState.stopFrame();
            });

            canvas.addEventListener("mouseout", event => {
                canvasState.stopFrame();
            });

            document.addEventListener("touchend", event => {
                canvasState.stopFrame();
            });

            document.addEventListener("touchcancel", event => {
                canvasState.stopFrame();
            });

            canvas.addEventListener("mousemove", ({
                clientX
            }) => {
                clientX -= canvas.offsetLeft;


                if (canvasState.mousedown) {

                    if (canvasState.mouseX < frame.x2 && canvasState.mouseX > frame.x1 || canvasState.frameScaling || canvasState.frameMoving) {
                        if (canvasState.frameMoving) {
                            frame.move(clientX - canvasState.mouseX);
                        } else if (canvasState.frameScaling) {
                            frame.scale(clientX - canvasState.mouseX, canvasState.frameScalingBorder);
                        } else if (canvasState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && canvasState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {
                            frame.move(clientX - canvasState.mouseX);
                            canvasState.frameMoving = true;
                        } else if (!(canvasState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && canvasState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH)) {
                            if (canvasState.mouseX <= frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {

                                canvasState.frameScalingBorder = "left";
                            } else if (canvasState.mouseX >= frame.x2 - FRAME_VERTICAL_BORDER_WIDTH) {
                                canvasState.frameScalingBorder = "right";
                            }

                            frame.scale(clientX - canvasState.mouseX, canvasState.frameScalingBorder);
                            canvasState.frameScaling = true;
                        }

                        canvasState.mouseX = clientX;
                    }
                }
            });

            canvas.addEventListener("touchmove", event => {
                event.preventDefault();

                let clientX = event.changedTouches[event.changedTouches.length - 1].clientX - canvas.offsetLeft;
                let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                let clientY = event.changedTouches[event.changedTouches.length - 1].clientY + scrollTop - canvas.offsetTop;

                if (clientY > canvasHeight || clientY < 0) canvasState.stopFrame(); //- удобнее?

                if (canvasState.mousedown) {

                    if (canvasState.mouseX < frame.x2 && canvasState.mouseX > frame.x1 || canvasState.frameScaling || canvasState.frameMoving) {
                        if (canvasState.frameMoving) {
                            frame.move(clientX - canvasState.mouseX);
                        } else if (canvasState.frameScaling) {
                            frame.scale(clientX - canvasState.mouseX, canvasState.frameScalingBorder);
                        } else if (canvasState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && canvasState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {
                            frame.move(clientX - canvasState.mouseX);
                            canvasState.frameMoving = true;
                        } else if (!(canvasState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && canvasState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH)) {
                            if (canvasState.mouseX <= frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {

                                canvasState.frameScalingBorder = "left";
                            } else if (canvasState.mouseX >= frame.x2 - FRAME_VERTICAL_BORDER_WIDTH) {
                                canvasState.frameScalingBorder = "right";
                            }

                            frame.scale(clientX - canvasState.mouseX, canvasState.frameScalingBorder);
                            canvasState.frameScaling = true;
                        }

                        canvasState.mouseX = clientX;
                    }
                }
            });

            //CHECKBUTTONS
            for (let i = 0; i < checkbuttons.length; i++) {
                checkbuttons[i].addEventListener("change", event => {
                    let lineLabel = event.target.getAttribute("data-line-label");
                    canvasState.checkedLines[lineLabel] = event.target.checked;
                    canvasState.updateMAX_Y();
                })
            }

            
            let thumbnailLines = {};
            for (let i = 0; i < lines.y.length; i++) {
                thumbnailLines[lines.y[i][0]] = new Line(
                    c,
                    lines.x.slice(1),
                    lines.y[i].slice(1),
                    hex2rgba(current_input.colors[lines.y[i][0]]),
                    THUMBNAIL_LINE_WIDTH,
                    canvasState.MAX_Y,
                    "shown"
                );
            }

            function drawChart() {
                for (const label in thumbnailLines) {
                    if (thumbnailLines.hasOwnProperty(label) && thumbnailLines[label].state) {
                        thumbnailLines[label].draw(canvasWidth, canvasHeight);
                    }
                }

                c.fillStyle = THUMBNAIL_BACKGROUND_COLOR;
                c.fillRect(0, 0, frame.x1, canvasHeight);
                c.fillRect(frame.x2, 0, canvasWidth, canvasHeight);

                // Drawing frame
                frame.draw();
            }

            function animate() {
                c.clearRect(0, 0, canvasWidth, canvasHeight);
                drawChart();
                requestAnimationFrame(animate);
            }

            animate();
        });
    }
}

