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
        THUMBNAIL_LINE_WIDTH = 1 / window.devicePixelRatio,
            THUMBNAIL_RATIO = 0.075 //0.06318082788671024,
        THUMBNAIL_BACKGROUND_COLOR = "rgba(245, 249, 251, 0.75)",
            THUMBNAIL_BORDER_COLOR = "rgba(222, 235, 243, 0.85)",
            THUMBNAIL_VERTICAL_PADDING = 5 / window.devicePixelRatio,
            THUMBNAIL_LINES_TRANSPARENCY_STEP = 1 / 10,
            CHART_LINES_TRANSPARENCY_STEP = 1 / 10,
            FRAME_RATIO = 0.267661692,
            FRAME_VERTICAL_BORDER_WIDTH = 4,
            FRAME_HORIZONAL_BORDER_WIDTH = FRAME_VERTICAL_BORDER_WIDTH / 4,
            CHART_RATIO = 0.5,
            CHART_LINE_WIDTH = 2;

        // for proper thumbnail width
        chart_data.map(() => {
            let main = document.querySelector("main");

            let chart = document.createElement("canvas");
            chart.classList.add("chart");

            let [chartWidth, chartHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                Math.ceil(CHART_RATIO * document.documentElement.clientHeight)
            ];
            chart.height = chartHeight * window.devicePixelRatio;
            chart.width = chartWidth * window.devicePixelRatio;
            chart.style.height = chartHeight + 'px';
            chart.style.width = chartWidth + 'px';

            let thumbnail = document.createElement("canvas");
            thumbnail.classList.add("thumbnail");

            let [thumbnailWidth, thumbnailHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                Math.ceil(THUMBNAIL_RATIO * document.documentElement.clientHeight)
            ];
            thumbnail.height = thumbnailHeight * window.devicePixelRatio;
            thumbnail.width = thumbnailWidth * window.devicePixelRatio;
            thumbnail.style.height = thumbnailHeight + 'px';
            thumbnail.style.width = thumbnailWidth + 'px';

            main.appendChild(chart);
            main.appendChild(thumbnail);
        });

        // chart_data is taken from chart_data.js
        chart_data.map((current_input, index_of_chart) => {
            //if (index_of_chart !== 0) return;
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

            // определяем равноудалены ли X
            let XS_ARE_EQUIDISTANT = lines.x.every((value, index, x) => {
                if (index > 1) {
                    return x[index] - x[index - 1] > 0;
                }
                return true;
            });

            //chart INIT
            let chart = document.querySelectorAll(".chart")[index_of_chart];
            let [chartWidth, chartHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                Math.ceil(CHART_RATIO * document.documentElement.clientHeight)
            ];

            chart.height = chartHeight * window.devicePixelRatio;
            chart.width = chartWidth * window.devicePixelRatio;
            chart.style.height = chartHeight + 'px';
            chart.style.width = chartWidth + 'px';


            //chart context INIT
            let cc = chart.getContext('2d');
            cc.scale(window.devicePixelRatio, window.devicePixelRatio);

            //thumbnail INIT
            let thumbnail = document.querySelectorAll(".thumbnail")[index_of_chart];
            let [thumbnailWidth, thumbnailHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                Math.ceil(THUMBNAIL_RATIO * document.documentElement.clientHeight)
            ];

            thumbnail.height = thumbnailHeight * window.devicePixelRatio;
            thumbnail.width = thumbnailWidth * window.devicePixelRatio;
            thumbnail.style.height = thumbnailHeight + 'px';
            thumbnail.style.width = thumbnailWidth + 'px';

            //thumbnail context INIT
            let c = thumbnail.getContext('2d');
            c.scale(window.devicePixelRatio, window.devicePixelRatio);

            // Adding checkbuttons
            let checkbuttons = [];
            lines.y.map((line, index) => {
                let currentCheckbutton = createCheckButton(current_input.names[line[0]], current_input.colors[line[0]], line[0]);

                if (index > 0) {
                    checkbuttons[checkbuttons.length - 1].after(currentCheckbutton);
                } else {
                    thumbnail.after(currentCheckbutton);
                }

                checkbuttons.push(currentCheckbutton);
            });
            checkbuttons[checkbuttons.length - 1].style.marginRight = '0';

            //thumbnail STATE
            let thumbnailState = {
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
                        .filter(line => thumbnailState.checkedLines[line[0]])
                        .reduce((currentMaxY, yCoordinates) => {
                            return Math.max(Math.max(...yCoordinates.slice(1)), currentMaxY);
                        }, 0);
                },
            }
            lineLabels.map(label => {
                thumbnailState.checkedLines[label] = true;
            });
            thumbnailState.updateMAX_Y();

            let frame = new Frame(
                c,
                thumbnailWidth * (1 - Math.max(FRAME_RATIO, (1 / (lines.x.length - 1)) * 6)),
                0,
                thumbnailWidth,
                thumbnailHeight,
                THUMBNAIL_BORDER_COLOR,
                0,
                thumbnailWidth,
                (1 / (lines.x.length - 2)) * 6 * thumbnailWidth //берем 6 отрезков, получаем 7 точек в худшем случае, который хэндлится строгим отображением на основном графике
            );

            //LINES
            let thumbnailLines = {};
            let chartLines = {};
            for (let i = 0; i < lines.y.length; i++) {
                thumbnailLines[lines.y[i][0]] = new Line(
                    c,
                    lines.x,
                    lines.y[i],
                    1,
                    lines.x.length - 1,
                    hex2rgba(current_input.colors[lines.y[i][0]]),
                    THUMBNAIL_LINE_WIDTH,
                    thumbnailState.MAX_Y
                );

                chartLines[lines.y[i][0]] = new Line(
                    cc,
                    lines.x,
                    lines.y[i],
                    undefined,
                    undefined,
                    hex2rgba(current_input.colors[lines.y[i][0]]),
                    CHART_LINE_WIDTH,
                    undefined
                );
            }

            //chart STATE
            let chartState = {
                xs: undefined,
                ys: undefined,
                xe: undefined,
                ye: undefined,
                index_of_x1: undefined,
                index_of_x2: undefined,
                updateXInterval() {
                    let approximate_x1 = ((frame.x1 / thumbnailWidth) * (lines.x[lines.x.length - 1] - lines.x[1])) + lines.x[1];
                    let approximate_x2 = ((frame.x2 / thumbnailWidth) * (lines.x[lines.x.length - 1] - lines.x[1])) + lines.x[1];
                    let index_of_x1 = undefined,
                        index_of_x2 = undefined;

                    //console.log("APPRXNT X1:", approximate_x1)
                    // if (XS_ARE_EQUIDISTANT) {
                    // index_of_x1 = frame.x1 === 0 ? 1 : Math.ceil((frame.x1 / thumbnailWidth) * (lines.x.length));
                    // index_of_x2 = Math.floor((frame.x2 / thumbnailWidth) * (lines.x.length));
                    // } else {
                    for (let i = 1; i < lines.x.length && index_of_x1 === undefined; i++) {
                        index_of_x1 = approximate_x1 <= lines.x[i] ? i : index_of_x1;
                    }
                    for (let i = lines.x.length - 1; i > 0 && index_of_x2 === undefined; i--) {
                        index_of_x2 = approximate_x2 >= lines.x[i] ? i : index_of_x2;
                    }
                    //}
                    //console.log(index_of_x1, index_of_x2)

                    this.index_of_x1 = index_of_x1;
                    this.index_of_x2 = index_of_x2;

                    if (index_of_x1 !== 1 && approximate_x1 !== lines.x[index_of_x1]) {
                        this.xs = approximate_x1;

                        for (const label in chartLines) {
                            if (chartLines.hasOwnProperty(label)) {
                                chartLines[label].xs = this.xs;
                                let [x1, y1, x2, y2] = [lines.x[index_of_x1 - 1],
                                    chartLines[label].y[index_of_x1 - 1],
                                    lines.x[index_of_x1],
                                    chartLines[label].y[index_of_x1]
                                ];
                                //    console.log("x1:", x1, "y1:", y1, "x2:", x2, "y2:", y2, 'xs:', this.xs);

                                chartLines[label].ys = y1 === y2 ? y2 : ((x1 * y2 - x2 * y1) + (y1 - y2) * this.xs) / (x1 - x2);
                                // console.log("Y_START:", chartLines[label].ys, "Y1:", chartLines[label].y[index_of_x1]);
                            }
                        }
                    } else {
                        this.xs = lines.x[index_of_x1];
                        for (const label in chartLines) {
                            if (chartLines.hasOwnProperty(label)) {
                                chartLines[label].ys = chartLines[label].y[index_of_x1];
                                //console.log("Y_START:", chartLines[label].ys, "Y1:", chartLines[label].y[index_of_x1]);
                            }
                        }
                    }

                    if (index_of_x2 !== lines.x.length - 1 && approximate_x2 !== lines.x[index_of_x2]) {
                        this.xe = approximate_x2;

                        for (const label in chartLines) {
                            if (chartLines.hasOwnProperty(label)) {
                                chartLines[label].xe = this.xe;
                                let [x1, y1, x2, y2] = [lines.x[index_of_x2],
                                    chartLines[label].y[index_of_x2],
                                    lines.x[index_of_x2 + 1],
                                    chartLines[label].y[index_of_x2 + 1]
                                ];
                                // console.log("x1:", x1, "y1:", y1, "x2:", x2, "y2:", y2, 'xe:', this.xe);
                                chartLines[label].ye = y1 === y2 ? y2 : ((x1 * y2 - x2 * y1) + (y1 - y2) * this.xe) / (x1 - x2);
                                //console.log("Y_END:", chartLines[label].ye, "Y2:", chartLines[label].y[index_of_x2]);
                            }
                        }
                    } else {
                        this.xe = lines.x[index_of_x2];
                        for (const label in chartLines) {
                            if (chartLines.hasOwnProperty(label)) {
                                chartLines[label].ye = chartLines[label].y[index_of_x2];
                                //console.log("Y_END:", chartLines[label].ye, "Y2:", chartLines[label].y[index_of_x2]);
                            }
                        }
                    }

                    for (const label in chartLines) {
                        if (chartLines.hasOwnProperty(label)) {
                            chartLines[label].startIndex = this.index_of_x1;
                            chartLines[label].endIndex = this.index_of_x2;
                        }
                    }
                },
                MAX_Y: undefined,
                updateMAX_Y(initLines) {
                    this.MAX_Y = lines.y
                        .filter(line => thumbnailState.checkedLines[line[0]])
                        .reduce((currentMaxY, yCoordinates) => {
                            let temporary_MaxY;
                            if (this.index_of_x2 === yCoordinates.length - 1) {
                                temporary_MaxY = Math.max(Math.max(...yCoordinates.slice(this.index_of_x1)), currentMaxY);
                            } else {
                                temporary_MaxY = Math.max(Math.max(...yCoordinates.slice(this.index_of_x1, this.index_of_x2 + 1)), currentMaxY);
                            }

                            let label = yCoordinates[0];

                            if (chartLines[label].ys > temporary_MaxY) {
                                temporary_MaxY = chartLines[label].ys;
                            }
                            if (chartLines[label].ye > temporary_MaxY) {
                                temporary_MaxY = chartLines[label].ye;
                            }
                            //console.log("label:", label, temporary_MaxY);


                            return temporary_MaxY;
                        }, 0);

                    //console.log("MAX_Y:", this.MAX_Y);
                    if (initLines) {
                        for (const label in chartLines) {
                            if (chartLines.hasOwnProperty(label)) {
                                chartLines[label].maxY = this.MAX_Y;
                            }
                        }
                    }
                }
            }
            chartState.updateXInterval();
            chartState.updateMAX_Y(true);


            window.addEventListener("resize", event => {
                THUMBNAIL_LINE_WIDTH = 1.4 / window.devicePixelRatio;
                THUMBNAIL_VERTICAL_PADDING = 5 / window.devicePixelRatio;

                [thumbnailWidth, thumbnailHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                    Math.ceil(THUMBNAIL_RATIO * document.documentElement.clientHeight)
                ];

                thumbnail.height = thumbnailHeight * window.devicePixelRatio;
                thumbnail.width = thumbnailWidth * window.devicePixelRatio;
                thumbnail.style.height = thumbnailHeight + 'px';
                thumbnail.style.width = thumbnailWidth + 'px';
                c.scale(window.devicePixelRatio, window.devicePixelRatio);

                CHART_LINE_WIDTH = THUMBNAIL_LINE_WIDTH * 2;

                [chartWidth, chartHeight] = [Math.ceil(document.documentElement.clientWidth * (1 - 2 * HORIZONTAL_MARGIN_RATIO)),
                    Math.ceil(CHART_RATIO * document.documentElement.clientHeight)
                ];

                chart.height = chartHeight * window.devicePixelRatio;
                chart.width = chartWidth * window.devicePixelRatio;
                chart.style.height = chartHeight + 'px';
                chart.style.width = chartWidth + 'px';
                cc.scale(window.devicePixelRatio, window.devicePixelRatio);

                frame = new Frame(
                    c,
                    thumbnailWidth * (1 - Math.max(FRAME_RATIO, (1 / (lines.x.length - 1)) * 6)),
                    0,
                    thumbnailWidth,
                    thumbnailHeight,
                    THUMBNAIL_BORDER_COLOR,
                    0,
                    thumbnailWidth,
                    (1 / (lines.x.length - 2)) * 6 * thumbnailWidth //берем 6 отрезков, получаем 7 точек в худшем случае, который хэндлится строгим отображением на основном графике
                );
            });

            //FRAME INTERACTING
            thumbnail.addEventListener("mousedown", ({
                clientX,
                clientY
            }) => {
                clientX -= thumbnail.offsetLeft;
                //console.log(clientX, frame.x1, frame.x2);
                //console.log("clientY:", clientY, "offsetTop:", thumbnail.offsetTop, "y1 and y2:", frame.y1, frame.y2)
                thumbnailState.mousedown = true;
                thumbnailState.mouseX = clientX;
                thumbnailState.mouseInitialX = clientX;
            });

            thumbnail.addEventListener("touchstart", event => {
                let clientX = event.changedTouches[event.changedTouches.length - 1].clientX - thumbnail.offsetLeft;
                thumbnailState.mousedown = true;
                thumbnailState.mouseX = clientX;
                thumbnailState.mouseInitialX = clientX;
            });

            document.addEventListener("mouseup", event => {
                thumbnailState.stopFrame();
            });

            thumbnail.addEventListener("mouseout", event => {
                thumbnailState.stopFrame();
            });

            document.addEventListener("touchend", event => {
                thumbnailState.stopFrame();
            });

            document.addEventListener("touchcancel", event => {
                thumbnailState.stopFrame();
            });

            thumbnail.addEventListener("mousemove", ({
                clientX
            }) => {
                clientX -= thumbnail.offsetLeft;


                if (thumbnailState.mousedown) {

                    if (thumbnailState.mouseX < frame.x2 && thumbnailState.mouseX > frame.x1 || thumbnailState.frameScaling || thumbnailState.frameMoving) {
                        if (thumbnailState.frameMoving) {
                            frame.move(clientX - thumbnailState.mouseX);
                        } else if (thumbnailState.frameScaling) {
                            frame.scale(clientX - thumbnailState.mouseX, thumbnailState.frameScalingBorder);
                        } else if (thumbnailState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && thumbnailState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {
                            frame.move(clientX - thumbnailState.mouseX);
                            thumbnailState.frameMoving = true;
                        } else if (!(thumbnailState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && thumbnailState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH)) {
                            if (thumbnailState.mouseX <= frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {

                                thumbnailState.frameScalingBorder = "left";
                            } else if (thumbnailState.mouseX >= frame.x2 - FRAME_VERTICAL_BORDER_WIDTH) {
                                thumbnailState.frameScalingBorder = "right";
                            }

                            frame.scale(clientX - thumbnailState.mouseX, thumbnailState.frameScalingBorder);
                            thumbnailState.frameScaling = true;
                        }

                        chartState.updateXInterval();
                        chartState.updateMAX_Y();
                        thumbnailState.mouseX = clientX;
                    }
                }
            });

            thumbnail.addEventListener("touchmove", event => {
                event.preventDefault();

                let clientX = event.changedTouches[event.changedTouches.length - 1].clientX - thumbnail.offsetLeft;
                let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                let clientY = event.changedTouches[event.changedTouches.length - 1].clientY + scrollTop - thumbnail.offsetTop;

                if (clientY > thumbnailHeight || clientY < 0) thumbnailState.stopFrame(); //- удобнее?

                if (thumbnailState.mousedown) {

                    if (thumbnailState.mouseX < frame.x2 && thumbnailState.mouseX > frame.x1 || thumbnailState.frameScaling || thumbnailState.frameMoving) {
                        if (thumbnailState.frameMoving) {
                            frame.move(clientX - thumbnailState.mouseX);
                        } else if (thumbnailState.frameScaling) {
                            frame.scale(clientX - thumbnailState.mouseX, thumbnailState.frameScalingBorder);
                        } else if (thumbnailState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && thumbnailState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {
                            frame.move(clientX - thumbnailState.mouseX);
                            thumbnailState.frameMoving = true;
                        } else if (!(thumbnailState.mouseX < frame.x2 - FRAME_VERTICAL_BORDER_WIDTH && thumbnailState.mouseX > frame.x1 + FRAME_VERTICAL_BORDER_WIDTH)) {
                            if (thumbnailState.mouseX <= frame.x1 + FRAME_VERTICAL_BORDER_WIDTH) {

                                thumbnailState.frameScalingBorder = "left";
                            } else if (thumbnailState.mouseX >= frame.x2 - FRAME_VERTICAL_BORDER_WIDTH) {
                                thumbnailState.frameScalingBorder = "right";
                            }

                            frame.scale(clientX - thumbnailState.mouseX, thumbnailState.frameScalingBorder);
                            thumbnailState.frameScaling = true;
                        }

                        chartState.updateXInterval();
                        chartState.updateMAX_Y();
                        thumbnailState.mouseX = clientX;
                    }
                }
            });

            //CHECKBUTTONS
            for (let i = 0; i < checkbuttons.length; i++) {
                checkbuttons[i].addEventListener("change", event => {
                    let lineLabel = event.target.getAttribute("data-line-label");
                    thumbnailState.checkedLines[lineLabel] = event.target.checked;
                    thumbnailLines[lineLabel].state = thumbnailState.checkedLines[lineLabel] ? "appearing" : "disappearing";
                    thumbnailState.updateMAX_Y();
                    chartLines[lineLabel].state = thumbnailState.checkedLines[lineLabel] ? "appearing" : "disappearing";
                    chartState.updateMAX_Y();

                    //console.log(thumbnailLines, thumbnailState.MAX_Y)

                })
            }


            let [initialThumbnailMaxY, chartOldMaxY] = [thumbnail.MAX_Y, chartState.MAX_Y];

            function drawThumbnail() {
                lineLabels.map(label => {
                    if (thumbnailLines[label].state === "shown") {
                        if (thumbnailLines[label].maxY !== thumbnailState.MAX_Y) {
                            thumbnailLines[label].updateStep = thumbnailLines[label].updateStep === undefined || ((thumbnailState.MAX_Y - thumbnailLines[label].maxY) / thumbnailLines[label].updateStep) < 0 ? //второе условие - если пошли в другую сторону
                                Math.trunc((thumbnailState.MAX_Y - thumbnailLines[label].maxY) / 10) : thumbnailLines[label].updateStep;

                            if (Math.abs(thumbnailState.MAX_Y - thumbnailLines[label].maxY) < Math.abs(thumbnailLines[label].updateStep)) {
                                thumbnailLines[label].maxY = thumbnailState.MAX_Y;
                                thumbnailLines[label].updateStep = undefined;
                                //console.log(thumbnailLines[label].maxY, thumbnailState.MAX_Y, thumbnailLines[label].updateStep)

                            } else {
                                thumbnailLines[label].maxY += thumbnailLines[label].updateStep;
                                //console.log(thumbnailLines[label].maxY, thumbnailState.MAX_Y, thumbnailLines[label].updateStep)
                            }
                        }
                    } else if (thumbnailLines[label].state === "appearing") {
                        thumbnailLines[label].maxY = thumbnailState.MAX_Y;
                        if (thumbnailLines[label].transparency < 1) {
                            thumbnailLines[label].setTransparency((thumbnailLines[label].transparency * 10 + THUMBNAIL_LINES_TRANSPARENCY_STEP * 10) / 10);
                        } else {
                            thumbnailLines[label].state = "shown";
                        }
                    } else if (thumbnailLines[label].state === "disappearing") {
                        if (thumbnailLines[label].transparency > 0) {
                            thumbnailLines[label].setTransparency((thumbnailLines[label].transparency * 10 - THUMBNAIL_LINES_TRANSPARENCY_STEP * 10) / 10);
                        } else {
                            thumbnailLines[label].state = "hidden";
                        }
                    }

                    if (chartLines[label].state === "shown") {
                        if (chartLines[label].maxY !== chartState.MAX_Y) {
                            if (chartState.MAX_Y !== chartOldMaxY) {
                                chartOldMaxY = chartState.MAX_Y;
                                for (const label in chartLines) {
                                    if (chartLines.hasOwnProperty(label)) {
                                        chartLines[label].updateStep = (chartOldMaxY - chartLines[label].maxY) / 10;
                                    }
                                }
                            }

                            chartLines[label].updateStep = chartLines[label].updateStep === undefined || ((chartOldMaxY - chartLines[label].maxY) / chartLines[label].updateStep) < 0 ?
                                (chartOldMaxY - chartLines[label].maxY) / 10 : chartLines[label].updateStep;

                            if (Math.abs(chartOldMaxY - chartLines[label].maxY) < Math.abs(chartLines[label].updateStep) || Math.abs(chartLines[label].updateStep) === 0) {
                                chartLines[label].maxY = chartOldMaxY;
                                chartLines[label].updateStep = undefined;
                                //console.log(chartLines[label].maxY, chartOldMaxY, chartLines[label].updateStep)
                            } else {
                                chartLines[label].maxY += chartLines[label].updateStep;
                                //consogitle.log("UPDATING:", chartLines[label].maxY, chartOldMaxY, chartLines[label].updateStep)
                            }
                        }
                    }

                    else if (chartLines[label].state === "appearing") {
                        if (chartLines[label].transparency < 1) {
                            chartLines[label].setTransparency((chartLines[label].transparency * 10 + CHART_LINES_TRANSPARENCY_STEP * 10) / 10);
                            chartLines[label].stepsCount = chartLines[label].transparency / CHART_LINES_TRANSPARENCY_STEP;
                            chartLines[label].dMx = chartLines[label].maxY * 0.05;
                            chartLines[label].maxY += chartLines[label].dMx;
                        } else {
                            //chartLines[label].maxY = chartState.MAX_Y;
                            //chartLines[label].dMx = undefined;
                            chartLines[label].state = "shown";
                        }
                    }

                    else if (chartLines[label].state === "disappearing") {
                        if (chartLines[label].transparency > 0) {
                            chartLines[label].setTransparency((chartLines[label].transparency * 10 - CHART_LINES_TRANSPARENCY_STEP * 10) / 10);
                            chartLines[label].stepsCount = chartLines[label].transparency / CHART_LINES_TRANSPARENCY_STEP;
                            chartLines[label].dMx = chartLines[label].maxY * 0.05;
                            chartLines[label].maxY -= chartLines[label].dMx;
                        } else {
                            chartLines[label].state = "hidden";
                        }
                    }

                    thumbnailLines[label].draw(thumbnailWidth, thumbnailHeight);
                    chartLines[label].draw(chartWidth, chartHeight);
                })

                c.fillStyle = THUMBNAIL_BACKGROUND_COLOR;
                c.fillRect(0, 0, frame.x1, thumbnailHeight);
                c.fillRect(frame.x2, 0, thumbnailWidth, thumbnailHeight);

                // Drawing frame
                frame.draw();
            }

            function animate() {
                c.clearRect(0, 0, thumbnailWidth, thumbnailHeight);
                cc.clearRect(0, 0, chartWidth, chartHeight);
                drawThumbnail();
                requestAnimationFrame(animate);
            }

            animate();
        });
    }
}