

class Line {
    constructor(context, xCoordinates, yCoordinates, color, width, maxY, state) {
        this.c = context;
        this.x = xCoordinates;
        this.y = yCoordinates;
        this.width = width;
        this.maxY = maxY;
        this.state = state;
        this.transparency = 1;
        this.updateStep = undefined;
        this.color = color.replace(/\d\.\d*\)$/, `${this.transparency})`);
    }

    draw = (canvasWidth, canvasHeight) => {
        const [MIN_X, MAX_X] = [this.x[1], this.x[this.x.length - 1]];

        this.c.beginPath();
        this.c.lineJoin = "round";
        this.c.lineWidth = this.width;

        let getCanvasCoordinates = (x, y) => {
            return [((x - MIN_X) / (MAX_X - MIN_X)) * canvasWidth, Math.abs((y / this.maxY - 1) * (canvasHeight - THUMBNAIL_VERTICAL_PADDING * 2)) + THUMBNAIL_VERTICAL_PADDING];
            //canvasHeight - 4 —— отрезок Y теперь [0, canvasHeight - 4], затем + 2 —— опускаем график на 2 пикселя, создавая padding
        };

        this.c.moveTo(...getCanvasCoordinates(this.x[0], this.y[0]));

        for (let i = 1; i < this.x.length; i++) {
            this.c.lineTo(...getCanvasCoordinates(this.x[i], this.y[i]));
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

