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

class Scene extends Node {
	constructor(ctx) {
		super();
		this.gravity = new Vector(0, 0);
		this.ctx = ctx;
	}

	draw() {
		function draw(node) {
			if (node.draw) {node.draw(this.ctx)}
			node.children.forEach((el) => {
				draw(el);
			});
		}
		draw = draw.bind(this);

		this.ctx.clearRect(0, 0, canvas.width, canvas.height);
		this.children.forEach((el) => {
			draw(el);
		})
	}

	update() {
		function update(node) {
			if (node.physicsBody) {
				node.physicsBody.applyForce(this.gravity.clone().multiplyScalar(node.physicsBody.mass));
				node.physicsBody.update();
			}
			node.children.forEach((el) => {
				update(el);
			})
		}
		update = update.bind(this)
		this.children.forEach((el) => {
			update(el);
		});
	}
}

class SpriteNode extends Node{
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
}

class ShapeNode extends SpriteNode {
	constructor(shape, color = "black") {
		super();
		this.shape = shape;
		this.color = color;
	}

	setPosition(position) {
		this.position = position;
	}

	setAngle(angle) {
		this.angle = angle;
	}

	draw(ctx) {
		let nodeStack = [this];
		let x = 0;
		let y = 0;
		let angle = 0;

		while (nodeStack[nodeStack.length - 1].parent != null) {
			nodeStack.push(nodeStack[nodeStack.length - 1].parent);
		}
		while (nodeStack.length != 0) {
			if (nodeStack[nodeStack.length - 1].position){
				x += nodeStack[nodeStack.length - 1].position.x;
				y += nodeStack[nodeStack.length - 1].position.y;
			}
			if (nodeStack[nodeStack.length - 1].angle){
				angle += nodeStack[nodeStack.length - 1].angle
			}
			nodeStack.pop();
		}
		ctx.fillStyle = this.color;
		ctx.translate(x, y);
		ctx.rotate(angle);
		this.shape.draw(ctx);
		ctx.rotate(-angle);
		ctx.translate(-x, -y);
	}
}

class Shape {
	constructor() {
	}
	draw(ctx) {
	}
}

class Rectangle extends Shape {
	constructor(height, width) {
		super();
		this.height = height;
		this.width = width;
	}
	draw(ctx) {
		ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
	}
}

class Point extends Shape {
	constructor(height, width) {
		super();

	}
}

class Circle extends Shape {
	constructor(radius) {
		super();
		this.r = radius;
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.arc(0,0,this.r,0,2*Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}

class PhysicsBody{
	constructor(shape) {
		this.shape = shape;
		this.parent = null;

		this.velocity = new Vector(0, 0);
		this.angularVelocity = 0;

		switch (this.shape.constructor.name) {
			case "Circle" :
				this.mass = this.shape.r * this.shape.r * Math.PI;
				break;
			case "Rectangle" :
				this.mass = this.shape.width * this.shape.height;
				break;
			default:
				this.mass = 0;
				break;
		}
		this.moveable = true;
	}
	update() {
		if (this.moveable) {
			this.parent.position.add(this.velocity.clone().divideScalar(30));
			this.parent.angle += this.angularVelocity;
		}
	}
	applyForce(f, at=new Vector(0,0)) {
		this.velocity.add(f.divideScalar(this.mass*30));
		this.applyTorque(at.x*f.y-at.y*f.x);
	}
	applyTorque(t) {
		this.angularVelocity += t/(this.mass*50)/30;
	}
	applyImpulse(f, at=new Vector(0,0)) {
		this.velocity.add(f.divideScalar(this.mass));
		this.applyAngularImpulse(at.x*f.y-at.y*f.x);
	}
	applyAngularImpulse(s) {
		this.angularVelocity += s/(this.mass*50);
	}
}

class Pin extends PhysicsBody {
	constructor() {

	}
}