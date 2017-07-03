class Scene {
	constructor(width, height) {
		this.mouse = new THREE.Vector2(0,0);
		this.isMouseDown = false;
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.width = width;
		this.height = height;
		this.canvas.setAttribute("width", width);
		this.canvas.setAttribute("height", height);
		this.children = [];

		//this.camera = new Camera();

		this.canvas.addEventListener("mousemove", ((e) => {
			this.mouse.x = e.pageX - this.canvas.offsetLeft + this.width/2; 
			this.mouse.y = e.pageY - this.canvas.offsetTop + this.height/2;
		}).bind(this));
		this.canvas.addEventListener("mousedown", ((e) => {
			this.isMouseDown = true;
		}).bind(this));
		this.canvas.addEventListener("mouseup", ((e) => {
			this.isMouseDown = false;
		}).bind(this));
	}

	addChild(e) {
		this.children.push(e);
	}

	render() {
		this.children.forEach((el) => {
			el.render(this.ctx);
		})
	}

	simulate() {
		this.children.forEach((el) => {
			el.simulate();
		})
	}

	update() {
		this.simulate();
		this.render();
	}
}

class Powder {
	constructor(color='white',dx=0,dy=0) {
		this.color = new THREE.Color(color);
		this.velocity = new THREE.Vector2(dx,dy);
		this.mass = 1;
		this.type = 0; //0 : gas, 1 : fluid, 2 : solid, 3 : powder
	}
}

class Chunk {
	constructor(x, y) {
		this.position = new THREE.Vector2(x, y);
		this.map = [];
		for (let i=0;i<16;i++) {
			let arr = [];
			for (let j=0;j<16;j++)
				arr.push(new Powder());
			this.map.push(arr);
		}
	}
	render(ctx) {
		let data = ctx.createImageData(16, 16);
		this.map.forEach(((arr, i)=>{
			arr.forEach(((e, j)=>{
				data[(j*16+i)*4] = this.map[i][j].color.r;
				data[(j*16+i)*4+1] = this.map[i][j].color.g;
				data[(j*16+i)*4+2] = this.map[i][j].color.b;
			}).bind(this));
		}).bind(this));
		ctx.putImageData(data, this.position.x, this.position.y);
	}
	simulate() {
		let temp = [];
		this.map = [];
		for (let i=0;i<16;i++) {
			let arr = [];
			for (let j=0;j<16;j++)
				arr.push(new Powder());
			this.temp.push(arr);
		}
	}
}