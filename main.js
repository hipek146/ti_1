var smoke = []
for(let i = 0; i < 4; i++) {
    smoke.push(new Image());
    smoke[i].src = `data/smoke${i + 1}.png`
}

window.onload = () => {

    const button = document.getElementById("videoButton");
    const video = document.getElementById("video");
    button.onclick = function() {
        this.innerHTML = this.innerHTML === "Ukryj wideo" ? "Odtwórz wideo" : "Ukryj wideo";
        video.style.display = this.innerHTML === "Ukryj wideo" ? "block" : "none";
    }

    const canvas1 = new Canvas(document.getElementById("canvas_1"), new Generator());
    const slider1 = document.getElementById("canvas_1_slider");
    const frequency = document.getElementById("frequency");
    const count1 = document.getElementById("count_1");
    canvas1.count(count1);
    canvas1.setGenerator(1000 / slider1.value);
    frequency.innerHTML = slider1.value;
    slider1.oninput = function() {
        canvas1.setGenerator(1000 / this.value);
        frequency.innerHTML = this.value;
      }

    const canvas2 = new Canvas(document.getElementById("canvas_2"), new FireGenerator());
    const slider2 = document.getElementById("canvas_2_slider");
    const wind = document.getElementById("wind");
    const count2 = document.getElementById("count_2");
    canvas2.count(count2);
    canvas2.generator.wind = slider2.value / 100;
    wind.innerHTML = slider2.value;
    slider2.oninput = function() {
        canvas2.generator.wind = this.value / 100;
        wind.innerHTML = this.value;
      }
}

class Particle {
    constructor(x, y, canvas, lifetime, lifetimeOscillator, mode, angle = Math.PI/2, sizeIncrement = 0, style, wind = 0, size = 12, speed) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.ctx = canvas.ctx;
        this.lifetime = lifetime + Math.random() * lifetimeOscillator;
        this.maxLifeTime = this.lifetime;
        this.size = size;
        this.speed = speed ? speed : Math.random() + 0.5;
        this.rotation = Math.random() * 2 * Math.PI;
        this.rotationIncrement = Math.random() * 0.1 - 0.05;
        this.angle = angle;
        this.mode = mode;
        this.sizeIncrement = sizeIncrement;
        this.style = style;
        this.angleIncrement = Math.random() * 0.01 - 0.005;
        this.wind = wind;
        if(style === 'fire') {
            this.color = {
                r: 220 +Math.random() * 10,
                g: 200 + Math.random() * 20 - 6 * Math.abs(250-x) - (y-270),
                b: 30 + Math.random() * 10
            };
            this.colorIncrement = {
                r: Math.random() * -0.4,
                g: Math.random() * -7 - 1,
                b: Math.random() * -1.5 - 0.2
            };
        } else {
            this.color = {
                r: Math.random() * 255,
                g: Math.random() * 255,
                b: Math.random() * 255
            };
            this.colorIncrement = {
                r: Math.random() * 6 - 3,
                g: Math.random() * 6 - 3,
                b: Math.random() * 6 - 3
            };
        }

        this.lastUpdate = performance.now();
       
    }

    update() {
        const newTime = performance.now();
        const diff = (newTime - this.lastUpdate) * 0.1;
        this.y += this.speed * Math.sin(this.angle) * diff;
        this.x += (this.speed * Math.cos(this.angle) + (this.style === 'fire' ? this.wind * (300-this.y) / 300 : 0)) * diff;
        this.lifetime -= diff;
        this.rotation +=  this.rotationIncrement * diff;
        this.size += this.sizeIncrement * diff;
        if(this.style === 'fire') {
            this.angle += this.angleIncrement;
        }
        Object.keys(this.color).forEach(key => {
            this.color[key] += this.colorIncrement[key] * diff;
            if(this.color[key] >= 255 || this.color[key] <=0) {
                if(this.style === 'fire') {
                    this.colorIncrement[key] = 0;
                } else {
                    this.colorIncrement[key] *= -1;
                }
            }
        })
        if(this.lifetime <= 0 || this.size <= 1) {
            this.dead = true;
        }

        this.lastUpdate = newTime;
    }

    drawImage() {
        const { mode, ctx, x, y, size, lifetime, maxLifeTime } = this;
        if(size <=1 )return;
        switch(mode) {
            case 'arc':
                ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
                break;
            case 'rect':
                ctx.rect(-size / 2, -size / 2, size, size);
                break;
            case 'triangle':
                ctx.moveTo(size/2,size/2);
                ctx.lineTo(0,-size/2);
                ctx.lineTo(-size/2,size/2);
                break;
            default:
                ctx.globalAlpha = lifetime / maxLifeTime / 2;
                ctx.drawImage(mode, -size/2, -size/2, size, size);
        }
        
    }

    draw() {
        const { ctx, x, y, color, lifetime, maxLifeTime, rotation, size, isImage } = this;  
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.globalAlpha = lifetime / maxLifeTime;
        ctx.beginPath();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        this.drawImage();
        ctx.fill();
        ctx.restore();
    }
};

class Generator {
    subscribe(canvas) {
        this.canvas = canvas;
    }
    generate() {
        const rand =  parseInt(Math.random() * 3);
        var mode;
        switch(rand) {
            case 0:
                mode ='arc'
                break;
            case 1:
                mode ='rect'
                break;
            case 2:
                mode ='triangle'
                break;
        }
        this.canvas.particles.push(new Particle(Math.random()*500, 0, this.canvas, 200, 200, mode));
    }

    setGenerator(time) {
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.generate();
        }, time);
    }
};

class FireGenerator extends Generator {
    constructor() {
        super();
        this.setGenerator(16);
        this.wind = 1;
    }

    generate() {
        for(let i = 0; i < 2; i++) {
            const x = 230 + 4 * this.wind + Math.random() * 50;
            const angle = 3/2 * Math.PI + Math.random() * 1 - 0.5;
            var image = parseInt(Math.random() * 4);
            image = smoke[image];
            this.canvas.particles.push(new Particle(x, 230 + Math.random() * 50, this.canvas, 200, 200, image, angle, 0.05, 'fire', this.wind ));
        }
        for(let i = 0; i < 5; i++) {
            const x = 235 + Math.random() * 30;
            const angle = 3/2 * Math.PI + Math.random() * 1 - 0.5;
            var image = parseInt(Math.random() * 4);
            image = smoke[image];
            this.canvas.particles.push(new Particle(x, 290 + Math.random() * 10, this.canvas, 200, 50, 'arc', angle, -0.01, 'fire', this.wind, 6, 0.3 + Math.random() * 0.2));
        }
    }



};


class Canvas {
    constructor(canvas, generator) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');    
        this.particles = [];
        this.generator = generator;
        this.generator.subscribe(this);
        this.draw();   
    }
    setGenerator(time) {
        this.generator.setGenerator(time);
    }

    draw = () => {
        const { ctx, canvas, particles, toCount } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((element, index) => { 
            if(element.dead) {
                particles.splice(index, 1);
            }
        });
        if(toCount) toCount.innerHTML = particles.length;
        particles.forEach((element, index) => { 
            element.draw(); 
            element.update();   
        });
        window.requestAnimationFrame(this.draw);
    }

    count(element) {
        this.toCount = element;
    }

};