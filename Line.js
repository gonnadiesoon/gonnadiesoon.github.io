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
    }

    draw = (canvasWidth, canvasHeight) => {
        let [MIN_X, MAX_X] = [this.xs, this.xe];

        this.c.lineJoin = "round";
        this.c.lineWidth = this.width;
        this.c.beginPath();

        let getCanvasCoordinates = (x, y) => {
            let test_max = y > this.maxY ? y : this.maxY;
            return [((x - MIN_X) / (MAX_X - MIN_X)) * canvasWidth, Math.abs((y / this.maxY - 1) * (canvasHeight - THUMBNAIL_VERTICAL_PADDING * 2)) + THUMBNAIL_VERTICAL_PADDING];
            //canvasHeight - 4 —— отрезок Y теперь [0, canvasHeight - 4], затем + 2 —— опускаем график на 2 пикселя, создавая padding
        };
        
        this.c.moveTo(...getCanvasCoordinates(this.xs, this.ys));
        if (this.xs < this.x[this.startIndex]) {
            //console.log(this.ys)
            this.c.lineTo(...getCanvasCoordinates(this.x[this.startIndex], this.y[this.startIndex]));
        }

        for (let i = this.startIndex + 1; i <= this.endIndex; i++) {
            this.c.lineTo(...getCanvasCoordinates(this.x[i], this.y[i]));
        }

        if (this.xe > this.x[this.endIndex]) {
            this.c.lineTo(...getCanvasCoordinates(this.xe, this.ye));
        }

        this.c.strokeStyle = this.color;
        this.c.stroke();
    }

    setTransparency = alpha => {
        this.transparency = alpha;
        this.color = this.color.replace(/\d\.?\d*\)$/, `${this.transparency})`);
    }
}

// possible states: 
"shown"
"hidden"
"appearing"
"disappearing"