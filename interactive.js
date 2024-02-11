const interactive = require("inquirer")
const safeEval = require('safe-eval')

module.exports = runInteractive

async function runInteractive(OBJECT) {
	let loop = true
	let current = OBJECT
	let path = ""
	let type

	do {
		const question = {
			name: "jsjq",
			type: "list",
			prefix: "jsjq:"
		}

		switch (typeof current) {
			case "bigint":
			case "number":
			case "boolean":
			case "string":
				loop = false // cant go deeper -> !print
				continue
			case "object":
				question.choices = ["!print"]

				if (Array.isArray(current)) {
					if (current.length === 0) {
						loop = false
						continue
					}

					type = "array"
					question.choices.push(...Object.keys(current).map(idx => `[idx] ${idx}`))
					question.choices.push(...Object.getOwnPropertyNames(Array.prototype).map(p => `[fn] ${p}`))
				} else {
					type = "object"
					path += "."
					question.choices.push(...Object.keys(current).map(k => `[prop] ${k}`))
				}

				question.message = `[${type}] ` + path
				removeFromArray(question.message, "[fn] constructor")
				question.choices.sort()
				break
			default:
				throw Error("unexpected type: " + typeof current)
		}

		// select property/index/function
		let resp = (await interactive.prompt([question]))["jsjq"]

		// check print macro
		if (resp == "!print") {
			loop = false
			continue
		}

		// process choice
		if (type == "array") {
			if (resp.startsWith("[fn]")) { //array method
				const fnName = resp.slice("[fn] ".length)

				const { result, fnCall } = await runFunction(current, fnName)
				current = result
				path += fnCall
			} else { // array index
				const idx = resp.slice("[idx] ".length)
				path += `[${idx}]`
				current = current[idx]
			}
		} else { // object
			const prop = resp.slice("[prop] ".length)
			path += `${prop}`
			current = current[prop]
		}
	} while (loop) 

	return current
};

// (async function () {
// 	const result = await runInteractive({
// 		hello: "world",
// 		array: [1, 2, 3, { hello: "again" }, "kjfjnsdfjn", false, [1, 2, 3], []]
// 	})

// 	console.log(result)
// })();

async function runFunction(object, name) {
	let body = (await interactive.prompt([{
		name: "jsjq",
		message: `[fn] ${name}():`,
		prefix: "jsjq:"
	}]))["jsjq"]

	let fnCall = `.${name}(${body})`
	const code = `OBJECT${fnCall}`

	return {
		result: safeEval(code, { OBJECT: object }),
		fnCall
	}
}

function removeFromArray(arr, value) {
	const index = arr.indexOf(value);
	if (index !== -1) {
		arr.splice(index, 1);
	}
}