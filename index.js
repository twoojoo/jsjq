#!/bin/node

const arg = require('arg');
const fs = require('node:fs');
const path = require('node:path');
const util = require("node:util");

const Options = {
	COMPACT_OUTPUT: ["-c", "--compact-output", Boolean, "compact instead of pretty-printed output"],
	RAW_OUTPUT: ["-r", "--raw-output", Boolean, "output strings without escapes and quotes"],
	TYPE: ["-t", "--type", Boolean, "print the type of the value instead of the value itself"],
	VERSION: ["-v", "--version", Boolean, "show the version"],
	HELP: ["-h", "--help", Boolean, "show the help"]
}

const CUSTOM_METHODS = ["listValues", "listKeys", "listEntries"]

const argOptions = Object.values(Options).reduce((opts, o) => {
	o.slice(undefined, -2).forEach(name => { 
		const optKind = o[o.length - 2]
		opts[name] = optKind
	})
	return opts
}, {})

const args = arg(argOptions)

if (getOption(Options.HELP)) {
	printHelp()
	process.exit(0)
}
if (getOption(Options.VERSION)) {
	const pJSON = require(path.join(__dirname, "./package.json"))
	console.log(pJSON.version)
	process.exit(0)
}


const query = args._[0]
const json = args._[1]

if (!query) throw Error("missing query argument")
if (!json) throw Error("missing json argument")
if (!query.startsWith(".") && !query.startsWith("[")) 
	throw Error("query must start with either \".\" or \"[\"")

const isJsonFile = isValidFilePath(json)

let OBJECT
let kind
try {
	kind = isJsonFile ? "file" : "string"
	OBJECT = isJsonFile
		? JSON.parse(fs.readFileSync(json).toString())
		: JSON.parse(json)
} catch (_) {
	throw Error(kind + " is an invalid JSON")
}

addObjectMethods(OBJECT)

const print = getOption(Options.TYPE) 
	? (x) => process.stdout.write(getTypeOf(x) + "\n") 
	: getOption(Options.COMPACT_OUTPUT)
		? (x) => process.stdout.write(getOption(Options.RAW_OUTPUT) 
			? typeof x == "object" 
				? util.inspect(x, { compact: true, colors: false, depth: null }).replace(/(\s|\r\n|\n|\r)/gm, "") + "\n"
				: x.toString() + "\n"
			: util.inspect(x, { compact: true, colors: true, depth: null }).replace(/(\s|\r\n|\n|\r)/gm, "") + "\n"
		) 
		: getOption(Options.RAW_OUTPUT) 
			? (x) => typeof x == "object" 
				? process.stdout.write(util.inspect(x, null, null, true) + "\n") 
				: process.stdout.write(x.toString() + "\n") 
			: (x) => process.stdout.write(util.inspect(x, null, null, true) + "\n") 

if (query === ".") {
	clearObject(OBJECT)
	print(OBJECT)
	process.exit(0)
}

const result = eval(`OBJECT${query};`)

if (result !== undefined) {  
	clearObject(OBJECT)
	print(result)
}

function isValidFilePath(filePath) {
	try {
		return fs.statSync(filePath).isFile();
	} catch (error) {
		return false;
	}
}

function getOption(name) {
	return args[name[0]]
}

function printHelp() {
	const pJSON = require(path.join(__dirname, "./package.json"))
	console.log(pJSON.name, "-", pJSON.version, "(by", pJSON.author + ")")
	console.log()
	console.log(pJSON.description)
	console.log()
	console.log(`usage:`)
	console.log(`\tjsjq <query> <JSON string | file path> [...options]`)
	console.log()
	console.log(`example:`)
	console.log(`\tjsjq '.data.map(x => x*2)' '{"data": [1, 2, 3]}' --compact-output`)
	console.log()
	console.log("options:")
	console.log("\t" + Object.values(Options).map(x => {
		const names = x.slice(undefined, -2).map(n => n.toString())
		const desc = x[x.length - 1]
		return names.join(", ") + "\t" + desc + ";"
	}).join("\n\t"))

}

/**add array to the set of types*/
function getTypeOf(x) {
	let type = typeof x

	if (type == "object" && Array.isArray(x)) {
		type = "array"
	} 

	return type
}

/**add custom objet methods*/
function addObjectMethods(obj, path = "") {
	if (typeof obj !== "object") {
		return
	}

	if (Array.isArray(obj)) {
		for (const idx in obj) {
			const newPath = path + `[${idx}]`
			addObjectMethods(obj[idx], newPath)	
		}
	} else {
		if (obj.listKeys === undefined) {
			obj.listKeys = () => {
				return Object.keys(obj).filter((key) => !CUSTOM_METHODS.includes(key))
			} 
		} else {
			console.error("failed to set listKeys method at ", path)
		}

		if (obj.listEntries === undefined) {
			obj.listEntries = () => {
				return Object.entries(obj).filter(([key, _]) => !CUSTOM_METHODS.includes(key))
			} 
		} else {
			console.error("failed to set ListEntries method at ", path)
		}

		if (obj.listValues === undefined) {
			obj.listValues = () => {
				return Object.entries(obj).filter(([key, _]) => !CUSTOM_METHODS.includes(key)).map(([_, val]) => val)
			} 
		} else {
			console.error("failed to set ListValues method at ", path)
		}

		for (const prop in obj) {
			if (CUSTOM_METHODS.includes(prop)) continue

			path += "." + prop
			addObjectMethods(obj[prop], path)	
		}
	}
}

/**cleanup custom methods*/
function clearObject(obj) {
	if (typeof obj !== "object") {
		return
	}

	if (Array.isArray(obj)) {
		for (const idx in obj) {
			clearObject(obj[idx])	
		}
	} else {
		for (const key of CUSTOM_METHODS) {
			delete obj[key]
		}

		for (const prop in obj) {
			clearObject(obj[prop])	
		}
	} 
} 