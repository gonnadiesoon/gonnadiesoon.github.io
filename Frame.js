class Frame {
    constructor(context, x1, y1, x2, y2, color, minX, maxX, minWidth) {
        this.c = context;
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
        this.color = color;
        this.minX = minX;
        this.maxX = maxX;
        this.minWidth = Math.max(minWidth, 3 * FRAME_VERTICAL_BORDER_WIDTH + 1);
    }

    draw = () => {
        this.c.fillStyle = this.color;
        this.c.fillRect(this.x1, this.y1, this.x2 - this.x1, FRAME_HORIZONAL_BORDER_WIDTH);
        this.c.fillRect(this.x2, this.y1, -FRAME_VERTICAL_BORDER_WIDTH, this.y2 - this.y1);
        this.c.fillRect(this.x1, this.y2, this.x2 - this.x1, -FRAME_HORIZONAL_BORDER_WIDTH);
        this.c.fillRect(this.x1, this.y1, FRAME_VERTICAL_BORDER_WIDTH, this.y2 - this.y1);
    }

    move = dx => {
        this.x1 += dx;
        this.x2 += dx;

        // подумай над случаем, когда при прибавлении у тебя х2 вылезает за границу
        if (this.x1 < this.minX) {
            this.x2 += this.minX - this.x1;
            this.x1 = this.minX;
        }

        if (this.x2 > this.maxX) {
            this.x1 -= this.x2 - this.maxX;
            this.x2 = this.maxX;
        }
    }

    scale = (dx, scalingBorder) => {
        //console.log("BEFORE:", this.x1)
        if (scalingBorder === "left") {
        //    console.log(this.x1 + dx, this.x2, this.minWidth)
            this.x1 += this.x2 - (this.x1 + dx) < this.minWidth ?
                dx - (this.minWidth - (this.x2 - (this.x1 + dx))) :
                dx;
        } else if (scalingBorder === "right") {
            this.x2 += (this.x2 + dx) - this.x1 < this.minWidth ?
                dx + this.minWidth - ((this.x2 + dx) - this.x1) :
                dx;
        }
        //console.log("AFTER:", this.x1)

        // если выехал за границу
        this.x1 = this.x1 < this.minX ? this.minX : this.x1;
        this.x2 = this.x2 > this.maxX ? this.maxX : this.x2;
    }
}