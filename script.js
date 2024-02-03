const HEAD_SPRITE_SIZE = [84, 78]
const BODY_SPRITE_SIZE = [54, 45]
const CURSOR_OFF_RADIUS = 40
const DIRECTION_HORIZONTAL_ANGLE = 0.6
const SHOOT_ANIMATION_DURATION = 250
const DRAW_DELAY = 15
const ANIMATION_DELAY = 150
const CHARACTER_SPEED = 5
const TEAR_SPEED = 8


function point_distance(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2)**2 + (y1 - y2)**2)
}


function line_angle(x1, y1, x2, y2) {
	return Math.atan2(y2 - y1, x2 - x1)
}


// value => [head sprite x position, body sprite y position]
const Direction = {
	DOWN: [0, 1],
	RIGHT: [2, 2],
	UP: [4, 0],
	LEFT: [6, 3]
}


class Tear {
	constructor (x, y, forward) {
		this.sprite = new Image()
		this.sprite.src = "assets/tear.png"

		this.x = x - this.sprite.width / 2
		this.y = y
		this.forward = forward
	}

	is_out_of_bounds() {
		return this.x + this.sprite.width < 0 || this.x - this.sprite.width > window.innerWidth
		|| this.y + this.sprite.height < 0 || this.y - this.sprite.height > window.innerHeight
	}

	update() {
		this.x += this.forward[0]
		this.y += this.forward[1]
	}

	draw(ctx) {
		ctx.drawImage(this.sprite, this.x, this.y)
	}
}


let cursor = [document.body.clientWidth / 2, document.body.clientHeight / 2 + 1]
document.body.onmousemove = event => {
	cursor = [event.clientX, event.clientY]
}


class Character {
	constructor () {
		this.sprite_sheet = new Image()
		this.sprite_sheet.src = "assets/isaac.png"

		this.x = Math.floor(document.body.clientWidth / 2)
		this.y = Math.floor(document.body.clientHeight / 2)
		this.destination = [this.x, this.y]
		this.direction = Direction.DOWN
		this.shooting = false
		this.animation_step = 0
		this.tears = []
	}


	update_direction() {
		let angle = line_angle(this.x, this.y, cursor[0], cursor[1])
		if (Math.abs(Math.cos(angle)) > DIRECTION_HORIZONTAL_ANGLE) {
			if (Math.cos(angle) > 0) {
				this.direction = Direction.RIGHT
			} else {
				this.direction = Direction.LEFT
			}
		} else {
			if (Math.sin(angle) > 0) {
				this.direction = Direction.DOWN
			} else {
				this.direction = Direction.UP
			}
		}
	}

	update_destination() {
		let distance = point_distance(this.x, this.y, cursor[0], cursor[1])
		if (distance > CURSOR_OFF_RADIUS) {
			this.destination = [cursor[0], cursor[1]]
		}
	}

	update_position() {
		let angle = line_angle(this.x, this.y, this.destination[0], this.destination[1])
		let distance = point_distance(this.x, this.y, this.destination[0], this.destination[1])
		if (distance > CHARACTER_SPEED * 2) {
			this.x += Math.round(Math.cos(angle) * CHARACTER_SPEED)
			this.y += Math.round(Math.sin(angle) * CHARACTER_SPEED)
		} else {
			this.animation_step = 0
		}
	}

	update_tears() {
		for (let tear of this.tears) {
			tear.update()
			if (tear.is_out_of_bounds()) {
				this.tears.splice(this.tears.indexOf(tear), 1)
			}
		}
	}

	update() {
		this.update_direction()
		this.update_destination()
		this.update_position()
		this.update_tears()
	}

	draw_tears(ctx) {
		for (let tear of this.tears) {
			tear.draw(ctx)
		}
	}

	draw_head(ctx) {
		ctx.drawImage(this.sprite_sheet,
			HEAD_SPRITE_SIZE[0] * (this.direction[0] + this.shooting), 0,
			...HEAD_SPRITE_SIZE,
			this.x - 42, this.y - 30,
			...HEAD_SPRITE_SIZE,
		)
	}

	draw_body(ctx) {
		ctx.drawImage(this.sprite_sheet,
			BODY_SPRITE_SIZE[0] * this.animation_step, HEAD_SPRITE_SIZE[1] + BODY_SPRITE_SIZE[1] * this.direction[1],
			...BODY_SPRITE_SIZE,
			this.x - 27, this.y + 30,
			...BODY_SPRITE_SIZE
		)
	}

	draw(ctx)
	{
		if (this.direction == Direction.UP) {
			this.draw_tears(ctx)
		}
		this.draw_body(ctx)
		this.draw_head(ctx)
		if (this.direction != Direction.UP) {
			this.draw_tears(ctx)
		}
	}

	onmouseup(_) {
		let angle = line_angle(this.x, this.y + 10, cursor[0], cursor[1])
		let direction = [Math.cos(angle) * TEAR_SPEED, Math.sin(angle) * TEAR_SPEED]
		this.tears.push(new Tear(this.x, this.y, direction))
		this.shooting = true
		setTimeout(() => this.shooting = false, SHOOT_ANIMATION_DURATION)
	}
}


class Renderer {
	constructor () {
		this.character = new Character()

		this.canvas = document.getElementById("canvas")
		this.canvas.onmouseup = this.onmouseup.bind(this)
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		this.ctx = canvas.getContext("2d")
	}

	start() {
		setInterval(this.render.bind(this), DRAW_DELAY)
		setInterval(this.update_animation_step.bind(this), ANIMATION_DELAY)
	}

	update_animation_step() {
		this.character.animation_step += 1
		if (this.character.animation_step == 9) {
			this.character.animation_step = 0
		}
	}

	render() {
		this.character.update()
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		this.character.draw(this.ctx)
	}

	onmouseup(event) {
		this.character.onmouseup(event)
	}
}


let renderer = new Renderer()
renderer.start()


window.wallpaperPropertyListener = {
	applyUserProperties: function(properties) {
		if (properties.background) {
			if (properties.background.value) {
				document.body.style.backgroundImage = "url('file:///" + properties.background.value + "')";
			} else {
				document.body.style.backgroundImage = "url('assets/background.png')";
			}
		}
		if (properties.background_style) {
			switch (properties.background_style.value) {
				case "fit":
					document.body.style.backgroundSize = "cover";
					break;
				case "fill":
					document.body.style.backgroundSize = "100% 100%";
					break;
				case "center":
					document.body.style.backgroundSize = "auto";
					break;
			}
		}
		if (properties.background_repeat) {
			if (properties.background_repeat.value) {
				document.body.style.backgroundRepeat = "repeat";
			} else {
				document.body.style.backgroundRepeat = "no-repeat";
			}
		}
		if (properties.character) {
			switch (properties.character.value) {
				case "isaac":
					renderer.character.sprite_sheet.src = "assets/isaac.png"
					break;
				case "cain":
					renderer.character.sprite_sheet.src = "assets/cain.png"
					break;
			}
		}
	},
};
