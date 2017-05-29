class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}
	sub(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}
	clone() {
		return new Vector(this.x, this.y);
	}
	divideScalar(s) {
		this.x /= s;
		this.y /= s;
		return this;
	}
	multiplyScalar(s) {
		this.x *= s;
		this.y *= s;
		return this;
	}
	distanceTo(v) {
		return Math.sqrt((this.x-v.x)*(this.x-v.x) + (this.y-v.y) * (this.y-v.y));
	}
	get angle() {
		return Math.atan2(this.y, this.x);
	}
	get length() {
		return Math.sqrt(this.x*this.x + this.y * this.y)
	}
	static getPolarVector(r, angle) {
		return new Vector(Math.cos(angle) * r, Math.sin(angle) * r);
	}
}

class Node {
	constructor() {
		this.parent = null;
		this.children = [];
	}

	addChild(node) {
		this.children.push(node);
		node.parent = this;
	}
}

class PhysicsWorld extends Node {
	constructor() {
		super();
		this.gravity = new Vector(0, 0);
	}
}

class Scene extends Node {
	constructor(width, height) {
		super();
		this.mouse = new Vector(0,0);
		this.isMouseDown = false;
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.width = width;
		this.height = height;
		this.canvas.setAttribute("width", width);
		this.canvas.setAttribute("height", height);
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
		this.physicsWorld = new PhysicsWorld();
	}

	render() {
		function render(node) {
			if (node.render) {node.render(this.ctx)}
			node.children.forEach((el) => {
				render(el);
			});
		}
		render = render.bind(this);

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.children.forEach((el) => {
			render(el);
		})
	}

	simulate() {
		function simulate(node) {
			if (node.physicsBody) {
				node.physicsBody._applyAcc(this.physicsWorld.gravity);
				node.physicsBody.update();
			}
			node.children.forEach((el) => {
				simulate(el);
			})
		}
		simulate = simulate.bind(this)
		this.children.forEach((el) => {
			if(el.isJoint) {
				el.update();
			}
		});
		this.children.forEach((el) => {
			simulate(el);
		});
	}

	update() {
		this.simulate();
		this.render();
	}
}

class SpriteNode extends Node {
	constructor() {
		super();
		this.position = new Vector(0, 0);
		this.angle = 0;
		this.physicsBody = null;
	}

	setPhysicsBody(physicsBody) {
		this.physicsBody = physicsBody;
		this.physicsBody.parent = this;
	}

	getAbsolutePosition() {
		let nodeStack = [this];
		let position = new Vector(0, 0);

		let top = () => {return nodeStack[nodeStack.length - 1]};

		while (top().parent != null) {
			nodeStack.push(top().parent);
		}
		while (nodeStack.length != 0) {
			if (top().position){
				position.add(top().position);
			}
			nodeStack.pop();
		}
		return position;
	}

	getAbsoluteAngle() {
		let nodeStack = [this];
		let angle = 0;

		let top = () => {return nodeStack[nodeStack.length - 1]};

		while (top().parent != null) {
			nodeStack.push(top().parent);
		}
		while (nodeStack.length != 0) {
			if (top().angle){
				angle += top().angle
			}
			nodeStack.pop();
		}
		return angle;
	}

	setPosition(x, y) {
		this.position.x=x;
		this.position.y=y;
	}
}

class Shape {
	constructor() {
	}
	render(ctx) {
	}
}

class ShapeNode extends SpriteNode {
	constructor(shape, color = "black") {
		super();
		this.shape = shape;
		this.color = color;
	}

	setAngle(angle) {
		this.angle = angle;
	}

	render(ctx) {
		let position = this.getAbsolutePosition();
		let angle = this.getAbsoluteAngle();

		ctx.fillStyle = this.color;
		ctx.translate(position.x, position.y);
		ctx.rotate(angle);
		this.shape.render(ctx);
		ctx.rotate(-angle);
		ctx.translate(-position.x, -position.y);
	}
}

class Field {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.value = [];
		for (let i = 0; i < this.height; i++) {
			this.value.push([]);
			for (let j = 0; j<this.width; j++) {
				this.value[i].push(0);
			}
		}
	}
	setValue(f=(p, v) => {return 0}) {
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j<this.width; j++) {
				this.value[i][j] = f(new Vector(j, i), this.value[i][j]);
			}
		}
	}
	addValue(f=(p, v) => {return 0}) {
		for (let i = 0; i <this.height; i++) {
			for (let j = 0; j<this.width; j++) {
				this.value[i][j] += f(new Vector(j, i), this.value[i][j]);
			}
		}
	}
}

class ScalarField extends Field {
	constructor(width, height) {
		super(width, height);
		this.isScalarField = true;
		this.value = [];
		for (let i = 0; i < this.height; i++) {
			this.value.push([]);
			for (let j = 0; j<this.width; j++) {
				this.value[i].push(0);
			}
		}
	}

	getGradient() {
		let vf = new VectorField(this.width, this.height);
		vf.setValue(((p) => {
			let x = p.x;
			let y = p.y;
			let sx = (x-1)<0?0:x-1;
			let ex = (x+1)>this.width-1?this.width-1:x+1;
			let sy = (y-1)<0?0:y-1;
			let ey = (y+1)>this.height-1?this.height-1:y+1;

			//console.log(this.value[ey][x] - this.value[sy][x])
			return new Vector(this.value[y][ex] - this.value[y][sx], this.value[ey][x] - this.value[sy][x]);
		}).bind(this));
		return vf;
	}
}

class VectorField extends Field {
	constructor(width, height) {
		super(width, height);
		this.isVectorField = true;
		this.value = [];
		for (let i = 0; i < this.height; i++) {
			this.value.push([]);
			for (let j = 0; j<this.width; j++) {
				this.value[i].push(new Vector(0, 0));
			}
		}
	}
	setValue(f=(p, v) => {return 0}) {
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j<this.width; j++) {
				this.value[i][j] = f(new Vector(j, i), this.value[i][j].clone());
			}
		}
	}
	addValue(f=(p, v) => {return 0}) {
		for (let i = 0; i <this.height; i++) {
			for (let j = 0; j<this.width; j++) {
				this.value[i][j].add(f(new Vector(j, i), this.value[i][j].clone()));
			}
		}
	}
}

class FieldNode extends SpriteNode{
	constructor(field) {
		super();
		this.field = field;
	}
	render(ctx) {
		let data = ctx.createImageData(this.field.width, this.field.height);
		let getHex = (n) => {return (n+1)/2*255;}
		let field = this.field;
		if (field.isScalarField) {
			for(let i = 0; i < data.data.length; i+=4) {
				let x = parseInt((i/4)/field.width);
				let y = parseInt((i/4)%field.width);
				let hex = getHex(field.value[x][y]);

				data.data[i] = hex;
				data.data[i+1] = hex;
				data.data[i+2] = hex;
				data.data[i+3] = 255;
			}
		} else {
			for(let i = 0; i < data.data.length; i+=4) {
				let x = parseInt((i/4)/field.width);
				let y = parseInt((i/4)%field.width);
				let hexR = getHex(field.value[x][y].x);
				let hexG = getHex(field.value[x][y].y);
				let hexB = getHex(0)

				data.data[i] = hexR;
				data.data[i+1] = hexG;
				data.data[i+2] = hexB;
				data.data[i+3] = 255;
			}
		}
		ctx.putImageData(data, this.position.x, this.position.y);
	}
}

class GraphNode extends SpriteNode {
	constructor(width, height, rangeX = {min: 0, max:1}, rangeY = {min: 0, max:1}) {
		super();
		this.rangeX = rangeX;
		this.rangeY = rangeY;

		this.width = width;
		this.height = height;

		this.values = [];
	}

	setRangeX(min, max) {
		this.rangeX = {min: min, max:max};
	}
	setRangeY(min, max) {
		this.rangeY = {min: min, max:max};
	}

	render(ctx) {
		let canvas = document.createElement("canvas");
		canvas.setAttribute("width", this.width);
		canvas.setAttribute("height", this.height);

		let tempCtx = canvas.getContext("2d");

		tempCtx.fillStyle = "black";
		tempCtx.fillRect(0, 0, this.width, this.height);

		function xMap(x) {
  		return (x - this.rangeX.min) * this.width/(this.rangeX.max - this.rangeX.min);
		}
		function yMap(y) {
  		return (y - this.rangeY.min) * this.height/(this.rangeY.max - this.rangeY.min);
		}

		xMap = xMap.bind(this);
		yMap = yMap.bind(this);

		this.values.forEach(((e) => {
			tempCtx.beginPath();
			e.forEach(((e, n) => {
				if (n == 0) {
					tempCtx.moveTo(xMap(n), yMap(e));
				} else {
					tempCtx.lineTo(xMap(n), yMap(e));
				}
			}).bind(this));
			tempCtx.strokeStyle = "#00ff00";
			tempCtx.stroke();
			tempCtx.closePath();
		}).bind(this));
		ctx.putImageData(tempCtx.getImageData(0, 0, this.width, this.height), this.position.x, this.position.y);
	}
}

class Rectangle extends Shape {
	constructor(width, height) {
		super();
		this.height = height;
		this.width = width;
	}
	render(ctx) {
		ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
	}
}

class Point extends Shape {
	constructor() {
		super();
	}
	render(ctx) {}
}

class Circle extends Shape {
	constructor(radius) {
		super();
		this.r = radius;
	}
	render(ctx) {
		ctx.beginPath();
		ctx.arc(0,0,this.r,0,2*Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}

class PhysicsBody extends Node{
	constructor(shape) {
		super();
		this.shape = shape;
		this.parent = null;

		this.velocity = new Vector(0, 0);
		this.angularVelocity = 0;
		this.mass = 0;
		this.angularMass = 0;

		switch (this.shape.constructor.name) {
			case "Circle" :
				this.mass = this.shape.r * this.shape.r * Math.PI;
				break;
			case "Rectangle" :
				this.mass = this.shape.width * this.shape.height;
				this.angularMass = this.mass*(this.shape.width*this.shape.width+this.shape.height*this.shape.height)/12
				break;
			default:
				this.mass = 0;
				this.angularMass = 0;
				break;
		}
		this.movable = true;
	}
	update() {
		if (this.movable) {
			this.parent.position.add(this.velocity.clone().divideScalar(30));
			this.parent.angle += this.angularVelocity/30;
		}
	}
	applyForce(f, at=new Vector(0,0)) {
		this.velocity.add(f.clone().divideScalar(this.mass*30));
		this.applyTorque(at.x*f.y-at.y*f.x);
	}
	applyTorque(s) {
		this.angularVelocity += s/this.angularMass/30;
	}
	applyImpulse(f, at=new Vector(0,0)) {
		this.velocity.add(f.clone().divideScalar(this.mass));
		this.applyAngularImpulse(at.x*f.y - at.y*f.x);
	}
	applyAngularImpulse(s) {
		this.angularVelocity += s/(this.angularMass);
	}
	_applyAcc(f) {
		this.velocity.add(f.clone().divideScalar(30));
	}
	_applyVelocity(f) {
		this.velocity.add(f);
	}
	_applyAngularAcc(s) {
		this.angularVelocity += s/30;
	}
	_applyAngularVelocity(s) {
		this.angularVelocity += s;
	}
}
