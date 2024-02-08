#!/bin/node

const arg = require('arg');
const fs = require('node:fs');
const util = require("node:util")

const args = arg({
	"-r": Boolean,
	"--raw-output": Boolean
})

const query = args._[0]
const json = args._[1]

if (!query) throw Error("missing query argument")
if (!json) throw Error("missing json argument")
if (!query.startsWith(".")) throw Error("query must start with a \".\"")

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

const print = args["-r"] === true || args["--raw-output"] === true 
	? (x) => process.stdout.write(typeof x == "object" ? JSON.stringify(x) : x.toString())
	: (x) => process.stdout.write(util.inspect(x, null, null, true) + "\n") 

if (query === ".") {
	print(OBJECT)
	process.exit(0)
}

const result = eval(`OBJECT${query};`)

if (result !== undefined) {  
	print(result)
}

function isValidFilePath(filePath) {
	try {
		return fs.statSync(filePath).isFile();
	} catch (error) {
		return false;
	}
}