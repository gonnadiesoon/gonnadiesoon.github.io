class Line {
    constructor(context, xCoordinates, yCoordinates, startIndex, endIndex, color, width, maxY, xs = xCoordinates[1], ys = yCoordinates[1], xe = xCoordinates[xCoordinates.length - 1], ye = yCoordinates[yCoordinates.length - 1]) {
        this.c = context;
        this.x = xCoordinates;
        this.y = yCoordinates;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.width = width;
        this.maxY = maxY;
        this.state = "shown";
        this.transparency = 1;
        this.updateStep = undefined;
        this.color = color.replace(/\d\.\d*\)$/, `${this.transparency})`);
        this.xs = xs;
        this.ys = ys;
        this.xe = xe;
        this.ye = ye;
        this.stepsCount = 0;
    }

    draw = (canvasWidth, canvasHeight) => {
        let [MIN_X, MAX_X] = [this.xs, this.xe];

        this.c.lineJoin = "round";
        this.c.lineWidth = this.width;
        this.c.beginPath();

        let getCanvasCoordinates = (x, y, index) => {
            if (index) {
                return [((x - MIN_X) / (MAX_X - MIN_X)) * canvasWidth, (1 - y / ((this.state === "disappearing" ? 1 / (1 + 0.003*this.stepsCount) : 1 + 0.003*(10-this.stepsCount)) * this.maxY)) * (canvasHeight - THUMBNAIL_VERTICAL_PADDING * 2) + THUMBNAIL_VERTICAL_PADDING];
            }

            return [((x - MIN_X) / (MAX_X - MIN_X)) * canvasWidth, (1 - y / this.maxY) * (canvasHeight - THUMBNAIL_VERTICAL_PADDING * 2) + THUMBNAIL_VERTICAL_PADDING];
            //canvasHeight - 4 —— отрезок Y теперь [0, canvasHeight - 4], затем + 2 —— опускаем график на 2 пикселя, создавая padding
            //
        };

        this.c.moveTo(...getCanvasCoordinates(this.xs, this.ys));
        if (this.xs < this.x[this.startIndex]) {
            //console.log(this.ys)
            this.c.lineTo(...getCanvasCoordinates(this.x[this.startIndex], this.y[this.startIndex]));
        }

        for (let i = this.startIndex + 1; i <= this.endIndex; i++) {
            if (this.y[i] > this.y[i - 1] && i + 1 <= this.endIndex && this.y[i] > this.y[i + 1] && (this.state === "disappearing" || this.state === "appearing")) {
                this.c.lineTo(...getCanvasCoordinates(this.x[i], this.y[i], i));
            } else {
                this.c.lineTo(...getCanvasCoordinates(this.x[i], this.y[i]));
            }
        }

        if (this.xe > this.x[this.endIndex]) {
            this.c.lineTo(...getCanvasCoordinates(this.xe, this.ye));
        }

        this.c.strokeStyle = this.color;
        this.c.stroke();
    }

    setTransparency = alpha => {
        console.log(alpha);
        this.transparency = alpha;
        this.color = this.color.replace(/\d\.?\d*\)$/, `${this.transparency})`);
    }

}

// possible states: 
"shown"
"hidden"
"appearing"
"disappearing"

"появляется с прозрачностью и без"
"исчезает тоже с ней или без"