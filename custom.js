const { getOption, Options } = require("./options")

const CUSTOM_OBJ_METHODS_NAMES = ["listValues", "listKeys", "listEntries", "stringify"]
const CUSTOM_ARR_METHODS_NAMES = ["compact", "stringify"]

/**add custom objet methods*/
function addObjectMethods(obj, path = "") {
	if (getOption(Options.DISABLE_CUSTOM_METHODS)) {
		return
	}

	if (typeof obj !== "object" || obj === null) {
		return
	}

	if (Array.isArray(obj)) {
		for (const idx in obj) {

			obj.compact = () =>  Array.from(new Set(obj))

			obj.stringify = (...args) => JSON.stringify(obj, ...args)

			const newPath = path + `[${idx}]`
			addObjectMethods(obj[idx], newPath)	
		}
	} else {
		obj.listKeys = () => Object.entries(obj)
			.filter(([key, _]) => !CUSTOM_OBJ_METHODS_NAMES.includes(key))
			.filter(([k, v]) => !(k === "constructor" && v === undefined))
			.map(([key, _]) => key)

		obj.listEntries = () => Object.entries(obj)
			.filter(([key, _]) => !CUSTOM_OBJ_METHODS_NAMES.includes(key))
			.filter(([k, v]) => !(k === "constructor" && v === undefined))

		obj.listValues = () => Object.entries(obj)
			.filter(([key, _]) => !CUSTOM_OBJ_METHODS_NAMES.includes(key))
			.filter(([k, v]) => !(k === "constructor" && v === undefined))
			.map(([_, val]) => val)

		obj.stringify = (...args) => JSON.stringify(obj, ...args) 
		
		for (const prop in obj) {
			if (CUSTOM_OBJ_METHODS_NAMES.includes(prop)) continue

			path += "." + prop
			addObjectMethods(obj[prop], path)	
		}
	}
}

/**cleanup custom methods*/
function clearObject(obj) {
	if (getOption(Options.DISABLE_CUSTOM_METHODS)) {
		return
	}

	if (typeof obj !== "object" || obj === null) {
		return
	}

	if (Array.isArray(obj)) {
		for (const key of CUSTOM_ARR_METHODS_NAMES) {
			delete obj[key]
		}

		for (const idx in obj) {
			clearObject(obj[idx])	
		}
	} else {
		for (const key of CUSTOM_OBJ_METHODS_NAMES) {
			delete obj[key]
		}

		for (const prop in obj) {
			clearObject(obj[prop])	
		}
	} 
}

module.exports = {
	CUSTOM_OBJ_METHODS_NAMES,
	CUSTOM_ARR_METHODS_NAMES,
	addObjectMethods,
	clearObject
}