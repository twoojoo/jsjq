#!/bin/node

const arg = require('arg');
const fs = require('node:fs');
const path = require('node:path');
const util = require("node:util");

const Options = {
	COMPACT_OUTPUT: ["-c", "--compact-output", Boolean, "compact instead of pretty-printed output"],
	RAW_OUTPUT: ["-r", "--raw-output", Boolean, "output strings without escapes and quotes"],
	VERSION: ["-v", "--version", Boolean, "show the version"],
	HELP: ["-h", "--help", Boolean, "show the help"]
}

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

const print = getOption(Options.COMPACT_OUTPUT) === true
	? (x) => process.stdout.write(getOption(Options.RAW_OUTPUT) 
		? typeof x == "object" 
			? util.inspect(x, { compact: true, colors: false, depth: null }).replace(/(\s|\r\n|\n|\r)/gm, "") + "\n"
			: x.toString()
		: util.inspect(x, { compact: true, colors: true, depth: null }).replace(/(\s|\r\n|\n|\r)/gm, "") + "\n"
	) 
	: getOption(Options.RAW_OUTPUT) 
		? (x) => typeof x == "object" 
			? process.stdout.write(util.inspect(x, null, null, true) + "\n") 
			: process.stdout.write(x.toString() + "\n") 
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