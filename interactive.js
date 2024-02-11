const interactive = require("inquirer")
const safeEval = require('safe-eval')

const { Options, getOption } = require("./options")
const { CUSTOM_ARR_METHODS_NAMES, CUSTOM_OBJ_METHODS_NAMES } = require("./custom")

const grayCode = ' \x1b[90m'; //keep space at the beginning
const yellowCode = '\x1b[33m';
const resetCode = '\x1b[0m';

const funcPrefix = `[func] .`
const funcPostfix = `()`
const indexPrefix = `[idx] `
const propertyPrefix = `[prop] `

const UNAVAILABLE_ARRAY_METHODS = [
	"entries", // returns an iterator 
	"toString", // useless
	"copyWithin", // adds a "costructor" to the array
	"fill", // adds a "costructor" to the array
	"pop", // useless
	"shift", // useless
	"unshift", // useless
	"push", // useless
	"forEach", // useless
	"values", // returns an iterator 
	"keys", // returns an iterator 
	"toLocaleString" //useless
]

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
					question.choices.push(...Object.entries(current).map(([idx, v]) => `${indexPrefix}${idx}${formatKeyContent(v)}`))
					question.choices.push(...Object.getOwnPropertyNames(Array.prototype)
						.filter(p => !UNAVAILABLE_ARRAY_METHODS.includes(p))
						.filter(p => p !== "length")
						.map(p => `${funcPrefix}${p}${funcPostfix}`))

					question.choices.push("!length")
				
					if (!getOption(Options.DISABLE_CUSTOM_METHODS)) {
						for (const n of CUSTOM_ARR_METHODS_NAMES) {
							removeFromArray(question.choices, question.choices.find(x => x.startsWith(`${indexPrefix}${n}`)))
						}

						for (const n of CUSTOM_ARR_METHODS_NAMES) {
							question.choices.push(`${funcPrefix}${n}${funcPostfix}`)
						}
					}
				} else {
					//prune custom properties
					if (Object.keys(current).filter(k => !CUSTOM_OBJ_METHODS_NAMES.includes(k)).length === 0) {
						loop = false
						continue
					}

					type = "object"
					path += "."
					question.choices.push(...Object.entries(current).map(([k, v]) => `${propertyPrefix}${k}${formatKeyContent(v)}`))

					if (!getOption(Options.DISABLE_CUSTOM_METHODS)) {
						for (const n of CUSTOM_OBJ_METHODS_NAMES) {
							removeFromArray(question.choices, question.choices.find(x => x.startsWith(`${propertyPrefix}${n}`)))
						}

						for (const n of CUSTOM_OBJ_METHODS_NAMES) {
							question.choices.push(`${funcPrefix}${n}${funcPostfix}`)
						}
					}
				}

				question.message = `${yellowCode}[${type}]${resetCode} ` + path
				removeFromArray(question.choices, `${funcPrefix}constructor${funcPostfix}`)
				question.choices.sort()
				break
			case "undefined":
				loop = false
				continue
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

		if (resp == "!length") {
			loop = false
			return current.length
		}

		// process choice
		if (type == "array") {
			if (resp.startsWith(funcPrefix)) { //array method
				const funcName = pruneChoiceText(resp, funcPrefix, funcPostfix)
				const { result, fnCall } = await runFunction(current, funcName)
				current = result
				path += fnCall
			} else { // array index
				const idx = pruneChoiceText(resp, indexPrefix)
				path += `[${idx}]`
				current = current.at(idx)
			}
		} else { // object
			if (resp.startsWith(funcPrefix)) { //object method 
				const funcName = pruneChoiceText(resp, funcPrefix, funcPostfix)
				const { result, fnCall } = await runFunction(current, funcName)
				current = result
				path += fnCall
			} else { // object prperty
				const prop = pruneChoiceText(resp, propertyPrefix)
				path += `${prop}`
				current = current[prop]
			}
		}
	} while (loop) 

	return current
};

async function runFunction(object, name) {
	let body = (await interactive.prompt([{
		name: "jsjq",
		message: `${yellowCode}[func]${resetCode} ${name}():`,
		prefix: "jsjq:"
	}]))["jsjq"]

	if (name.startsWith(".")) {
		name = name.slice(1)
	}

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

function pruneChoiceText(choice, prefix, postFix = undefined) {
	const pIdx = choice.indexOf(`${grayCode}`)

	if (postFix !== undefined) {
		choice = choice.slice(undefined, -postFix.length)
	}

	if (pIdx == -1) {
		return choice.slice(prefix.length)
	}

	return choice.slice(undefined, pIdx).slice(prefix.length)
}

function formatKeyContent(content) {
	let c

	const maxLen = 30

	if (typeof content == "object") {
		const stringified = JSON.stringify(content)

		c = stringified.slice(0, maxLen)

		if (stringified.length > maxLen) {
			c += "…"
		}
	} else if (typeof content == "string") {
		c = content.slice(0, maxLen)

		if (content.length > maxLen) {
			c += "…"
		}
	} else {
		c = content
	}

	return `${grayCode}${c}${resetCode}`
}