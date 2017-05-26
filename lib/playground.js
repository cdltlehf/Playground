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

class Scene extends Node {
	constructor(ctx) {
		super();
		this.gravity = new Vector(0, 0);
		this.ctx = ctx;
		this.mouse = new Vector(0,0);
		ctx.canvas.addEventListener("mousemove", ((e) => {this.mouse.x = e.offsetX;this.mouse.y = e.offsetY;}).bind(this));
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

	simulate() {
		function simulate(node) {
			if (node.physicsBody) {
				node.physicsBody.applyForce(this.gravity.clone().multiplyScalar(node.physicsBody.mass));
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
		this.draw();
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
		let position = this.getAbsolutePosition();
		let angle = this.getAbsoluteAngle();

		ctx.fillStyle = this.color;
		ctx.translate(position.x, position.y);
		ctx.rotate(angle);
		this.shape.draw(ctx);
		ctx.rotate(-angle);
		ctx.translate(-position.x, -position.y);
	}
}

class Shape {
	constructor() {
	}
	draw(ctx) {
	}
}

class Rectangle extends Shape {
	constructor(width, height) {
		super();
		this.height = height;
		this.width = width;
	}
	draw(ctx) {
		ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
	}
}

class Point extends Shape {
	constructor() {
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

class PhysicsNode extends Node{
	constructor() {
		super();
		this.isPhysicsNode = true;

		this.velocity = new Vector(0, 0);
		this.angularVelocity = 0;
		this.mass = 1;
		this.angularMass = 1;
	}
	applyForce(f, at=new Vector(0,0)) {
		this.velocity.add(f.divideScalar(this.mass*30));
		this.applyTorque(at.x*f.y-at.y*f.x);
	}
	applyTorque(t) {
		this.angularVelocity += t/(this.angularMass)/30;
	}
	applyImpulse(f, at=new Vector(0,0)) {
		this.velocity.add(f.divideScalar(this.mass));
		this.applyAngularImpulse(at.x*f.y - at.y*f.x);
	}
	applyAngularImpulse(s) {
		this.angularVelocity += s/(this.angularMass);
	}
}

class PhysicsBody extends PhysicsNode{
	constructor(shape) {
		super();
		this.shape = shape;
		this.parent = null;

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
				break;
		}
		this.movable = true;
	}
	update() {
		if (this.movable) {
			this.parent.position.add(this.velocity.clone().divideScalar(10));
			this.parent.angle += this.angularVelocity;
		}
	}
}

class PhysicsJointPin extends PhysicsNode {
	constructor(a, b, anchor) {
		super();
		this.anchor = anchor;
		this.a = a;
		this.b = b;
		this.isJoint = true;
	}
	update() {
		let a = this.a;
		let b = this.b;
		let valueA = a.angularVelocity * (this.a.parent.position.clone().sub(this.anchor).length) * this.a.mass/50;
		let valueB = b.angularVelocity * (this.b.parent.position.clone().sub(this.anchor).length) * this.b.mass/50;

		let momentumA = (Vector.getPolarVector(valueA, this.anchor.clone().sub(a.parent.position).angle - Math.PI/2)).add(a.velocity.clone().multiplyScalar(a.mass));
		let momentumB = (Vector.getPolarVector(valueB, this.anchor.clone().sub(b.parent.position).angle - Math.PI/2)).add(b.velocity.clone().multiplyScalar(b.mass));

		b.velocity.x = 0;
		b.velocity.y = 0;
		b.angularVelocity = 0;
		
		//this.b.applyImpulse((momentumA.clone().add(momentumB).divideScalar((this.a.mass+this.b.mass)/this.a.mass)), this.anchor);
		b.applyImpulse(momentumB, this.anchor);
		this.applyImpulse(momentumB.divideScalar(b.mass));
		this.anchor.add(this.velocity.clone().divideScalar(30));
		this.parent.angle += this.angularVelocity;
	}
}