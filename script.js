const HEAD_SPRITE_WIDTH = 84
const HEAD_SPRITE_HEIGHT = 78
const BODY_SPRITE_WIDTH = 54
const BODY_SPRITE_HEIGHT = 45
const CURSOR_OFF_RADIUS = 40
const DIRECTION_HORIZONTAL_ANGLE = 0.6
const SHOOT_ANIMATION_DURATION = 250
const ANIMATION_DELAY = 150
const CHARACTER_SPEED = 320
const TEAR_SPEED = 600


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
	static sprite = (() => {
		let sprite = new Image()
		sprite.src = "assets/tear.png"
		return sprite
	})()

	constructor (x, y, forward) {
		this.x = x - Tear.sprite.width / 2
		this.y = y
		this.forward = forward
	}

	is_out_of_bounds() {
		return this.x + Tear.sprite.width < 0 || this.x - Tear.sprite.width > window.innerWidth
		|| this.y + Tear.sprite.height < 0 || this.y - Tear.sprite.height > window.innerHeight
	}

	update(delta_time) {
		this.x += this.forward[0] * delta_time
		this.y += this.forward[1] * delta_time
	}

	draw(ctx) {
		ctx.drawImage(Tear.sprite, this.x, this.y)
	}
}


let cursor = [document.body.clientWidth / 2, document.body.clientHeight / 2 + 1]
document.body.onmousemove = event => {
	cursor = [event.clientX, event.clientY]
}


class Character {
	constructor () {
		this.sprite_sheet = new Image()
		this.sprite_sheet.src = "assets/characters/isaac.png"

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

	update_position(delta_time) {
		let angle = line_angle(this.x, this.y, this.destination[0], this.destination[1])
		let distance = point_distance(this.x, this.y, this.destination[0], this.destination[1])
		if (distance > 8) {
			this.x += Math.round(Math.cos(angle) * CHARACTER_SPEED * delta_time)
			this.y += Math.round(Math.sin(angle) * CHARACTER_SPEED * delta_time)
		} else {
			this.animation_step = 0
		}
	}

	update_tears(delta_time) {
		this.tears = this.tears.filter(tear => !tear.is_out_of_bounds())
		for (let tear of this.tears) {
			tear.update(delta_time)
		}
	}

	update(delta_time) {
		this.update_direction()
		this.update_destination()
		this.update_position(delta_time)
		this.update_tears(delta_time)
	}

	draw_tears(ctx) {
		for (let tear of this.tears) {
			tear.draw(ctx)
		}
	}

	draw_head(ctx) {
		ctx.drawImage(this.sprite_sheet,
			HEAD_SPRITE_WIDTH * (this.direction[0] + this.shooting), 0,
			HEAD_SPRITE_WIDTH, HEAD_SPRITE_HEIGHT,
			this.x - 42, this.y - 30,
			HEAD_SPRITE_WIDTH, HEAD_SPRITE_HEIGHT
		)
	}

	draw_body(ctx) {
		ctx.drawImage(this.sprite_sheet,
			BODY_SPRITE_WIDTH * this.animation_step, HEAD_SPRITE_HEIGHT + BODY_SPRITE_HEIGHT * this.direction[1],
			BODY_SPRITE_WIDTH, BODY_SPRITE_HEIGHT,
			this.x - 27, this.y + 30,
			BODY_SPRITE_WIDTH, BODY_SPRITE_HEIGHT
		)
	}

	draw(ctx)
	{
		const is_up = this.direction == Direction.UP
		if (is_up) {
			this.draw_tears(ctx)
		}
		this.draw_body(ctx)
		this.draw_head(ctx)
		if (!is_up) {
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
		this.canvas.onmouseup = this.character.onmouseup.bind(this.character)
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		this.ctx = canvas.getContext("2d")

		this.limit_fps = false
		this.max_fps = 30
		this.last_time = 0
	}

	start() {
		requestAnimationFrame(this.render.bind(this))
		setInterval(this.update_animation_step.bind(this), ANIMATION_DELAY)
	}

	render(current_time) {
		requestAnimationFrame(this.render.bind(this))

		let now = current_time / 1000
		let delta_time = Math.min(now - this.last_time, 1)
		if (this.limit_fps && delta_time < 1 / this.max_fps) {
			return
		}

		this.character.update(delta_time)
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
		this.character.draw(this.ctx)

		this.last_time = now
	}

	update_animation_step() {
		this.character.animation_step += 1
		if (this.character.animation_step == 9) {
			this.character.animation_step = 0
		}
	}
}


let renderer = new Renderer()
window.onload = () => {
	renderer.start()
}


window.wallpaperPropertyListener = {
	applyUserProperties: function(properties) {
        if (properties.fps) {
            renderer.max_fps = properties.fps.value
        }
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
			renderer.character.sprite_sheet.src = "assets/characters/" + properties.character.value + ".png"
		}
		if (properties.fps_limiter) {
			renderer.limit_fps = properties.fps_limiter.value
		}
	},
};
