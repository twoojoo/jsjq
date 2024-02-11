const CUSTOM_OBJ_METHODS_NAMES = ["listValues", "listKeys", "listEntries", "stringify"]
const CUSTOM_ARR_METHODS_NAMES = ["compact", "stringify"]

function loadCustomMethods() {
	Array.prototype.compact = function () {
		return Array.from(new Set(this))
	}

	Array.prototype.stringify = function (...args) {
		return JSON.stringify(this, ...args)
	}

	Object.prototype.listKeys = function () {
		return Object.entries(this)
			.filter(([k, v]) => !(k === "constructor" && v === undefined))
			.map(([key, _]) => key)
	}

	Object.prototype.listEntries = function () {
		return Object.entries(this).filter(([k, v]) => !(k === "constructor" && v === undefined))
	}

	Object.prototype.listValues = function () {
		return Object.entries(this)
			.filter(([k, v]) => !(k === "constructor" && v === undefined))
			.map(([_, val]) => val)
	}

	Object.prototype.stringify = function (...args) {
		return JSON.stringify(this, ...args)
	}
}

module.exports = {
	CUSTOM_OBJ_METHODS_NAMES,
	CUSTOM_ARR_METHODS_NAMES,
	loadCustomMethods
}