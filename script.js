(function() {
	const HEAD_SPRITE_WIDTH = 84
	const HEAD_SPRITE_HEIGHT = 78
	const BODY_SPRITE_WIDTH = 54
	const BODY_SPRITE_HEIGHT = 45
	const TEAR_SPRITE_WIDTH = 47
	const TEAR_SPRITE_HEIGHT = 47
	const CURSOR_OFF_RADIUS = 40
	const DIRECTION_HORIZONTAL_ANGLE = 0.6
	const SHOOT_ANIMATION_DURATION = 250
	const ANIMATION_DELAY = 0.15


	function point_distance(x1, y1, x2, y2) {
		return Math.sqrt((x1 - x2)**2 + (y1 - y2)**2)
	}


	function line_angle(x1, y1, x2, y2) {
		return Math.atan2(y2 - y1, x2 - x1)
	}


	function load_image(src) {
		const image = new Image()
		image.src = src
		return image
	}


	let cursor = [document.body.clientWidth / 2, document.body.clientHeight / 2 + 1]
	document.body.onmousemove = event => {
		cursor = [event.clientX, event.clientY]
	}


	// [head sprite x position, body sprite y position]
	const Direction = {
		DOWN: [0, 1],
		RIGHT: [2, 2],
		UP: [4, 0],
		LEFT: [6, 3]
	}


	class Tear {
		static sprite = load_image("assets/tear.png")
		static speed = 600

		constructor (x, y, forward) {
			this.x = x - Tear.sprite.width / 2
			this.y = y
			this.forward = forward
		}

		is_out_of_bounds() {
			return this.x + TEAR_SPRITE_WIDTH < 0 || this.x - TEAR_SPRITE_WIDTH > window.innerWidth
			|| this.y + TEAR_SPRITE_HEIGHT < 0 || this.y - TEAR_SPRITE_HEIGHT > window.innerHeight
		}

		update(delta_time) {
			this.x += this.forward[0] * delta_time
			this.y += this.forward[1] * delta_time
		}
	}


	class Character {
		static sprite_sheet = load_image("assets/characters/isaac.png")
		static speed = 320

		constructor () {
			this.x = Math.floor(document.body.clientWidth / 2)
			this.y = Math.floor(document.body.clientHeight / 2)
			this.destination = [this.x, this.y]
			this.direction = Direction.DOWN
			this.shooting = false
			this.animation_step = 0
			this.step_time = 0
			this.tears = []
		}

		update_animation_step(delta_time) {
			this.step_time += delta_time
			if (this.step_time < ANIMATION_DELAY) {
				return
			}

			this.animation_step += 1
			if (this.animation_step == 9) {
				this.animation_step = 0
			}
			this.step_time = 0
		}

		update_direction() {
			const angle = line_angle(this.x, this.y, cursor[0], cursor[1])
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
			const distance = point_distance(this.x, this.y, cursor[0], cursor[1])
			if (distance > CURSOR_OFF_RADIUS) {
				this.destination = [cursor[0], cursor[1]]
			}
		}

		update_position(delta_time) {
			const angle = line_angle(this.x, this.y, this.destination[0], this.destination[1])
			const distance = point_distance(this.x, this.y, this.destination[0], this.destination[1])
			if (distance > 8) {
				this.x += Math.round(Math.cos(angle) * Character.speed * delta_time)
				this.y += Math.round(Math.sin(angle) * Character.speed * delta_time)
			} else {
				this.animation_step = 0
			}
		}

		update_tears(delta_time) {
			this.tears = this.tears.filter(tear => !tear.is_out_of_bounds())
			for (const tear of this.tears) {
				tear.update(delta_time)
			}
		}

		update(delta_time) {
			this.update_animation_step(delta_time)
			this.update_direction()
			this.update_destination()
			this.update_position(delta_time)
			this.update_tears(delta_time)
		}

		draw_tears(ctx) {
			for (const tear of this.tears) {
				ctx.drawImage(Tear.sprite, tear.x, tear.y)
			}
		}

		draw_head(ctx) {
			ctx.drawImage(Character.sprite_sheet,
				HEAD_SPRITE_WIDTH * (this.direction[0] + this.shooting), 0,
				HEAD_SPRITE_WIDTH, HEAD_SPRITE_HEIGHT,
				this.x - 42, this.y - 30,
				HEAD_SPRITE_WIDTH, HEAD_SPRITE_HEIGHT
			)
		}

		draw_body(ctx) {
			ctx.drawImage(Character.sprite_sheet,
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
			const angle = line_angle(this.x, this.y + 10, cursor[0], cursor[1])
			const direction = [Math.cos(angle) * Tear.speed, Math.sin(angle) * Tear.speed]
			this.tears.push(new Tear(this.x, this.y, direction))
			this.shooting = true
			setTimeout(() => this.shooting = false, SHOOT_ANIMATION_DURATION)
		}
	}


	class Renderer {
		static max_fps = 30
		static limit_fps = false

		constructor () {
			this.character = new Character()

			this.canvas = document.getElementById("canvas")
			this.canvas.onmouseup = this.character.onmouseup.bind(this.character)
			this.canvas.width = window.innerWidth
			this.canvas.height = window.innerHeight
			this.ctx = canvas.getContext("2d")

			this.last_time = 0
		}

		start() {
			requestAnimationFrame(this.render.bind(this))
		}

		render(current_time) {
			requestAnimationFrame(this.render.bind(this))

			const now = current_time / 1000
			const delta_time = Math.min(now - this.last_time, 1)
			if (Renderer.limit_fps && delta_time < 1 / Renderer.max_fps) {
				return
			}

			this.character.update(delta_time)
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
			this.character.draw(this.ctx)

			this.last_time = now
		}
	}


	window.wallpaperPropertyListener = {
		applyUserProperties: function(properties) {
			if (properties.fps) {
				Renderer.max_fps = properties.fps.value
			}
			if (properties.background) {
				if (properties.background.value) {
					document.body.style.backgroundImage = "url('file:///" + properties.background.value + "')"
				} else {
					document.body.style.backgroundImage = "url('assets/background.png')"
				}
			}
			if (properties.character_speed) {
				Character.speed = properties.character_speed.value
			}
			if (properties.tear_speed) {
				Tear.speed = properties.tear_speed.value
			}
			if (properties.background_style) {
				switch (properties.background_style.value) {
					case "fit":
						document.body.style.backgroundPosition = "center"
						document.body.style.backgroundSize = "cover"
						break
					case "fill":
						document.body.style.backgroundPosition = "center"
						document.body.style.backgroundSize = "100% 100%"
						break
					case "center":
						document.body.style.backgroundPosition = "center"
						document.body.style.backgroundSize = "auto"
						break
					case "left":
						document.body.style.backgroundPosition = "left"
						document.body.style.backgroundSize = "auto"
						break
					case "right":
						document.body.style.backgroundPosition = "right"
						document.body.style.backgroundSize = "auto"
						break
				}
			}
			if (properties.background_repeat) {
				if (properties.background_repeat.value) {
					document.body.style.backgroundRepeat = "repeat"
				} else {
					document.body.style.backgroundRepeat = "no-repeat"
				}
			}
			if (properties.character) {
				Character.sprite_sheet.src = "assets/characters/" + properties.character.value + ".png"
			}
			if (properties.fps_limiter) {
				Renderer.limit_fps = properties.fps_limiter.value
			}
		},
	}


	window.onload = () => {
		const renderer = new Renderer()
		renderer.start()
	}
})()
