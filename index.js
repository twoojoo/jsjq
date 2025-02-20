#!/usr/bin/env node

const arg = require('arg');
const fs = require('node:fs');
const path = require('node:path');
const util = require("node:util");
const safeEval = require('safe-eval')
const { createInterface } = require("node:readline");

const { loadArgs, getOption, Options } = require('./options');
const { loadCustomMethods } = require("./custom")
const runInteractive = require('./interactive');

const args = loadArgs()

if (getOption(Options.HELP)) {
	printHelp()
	process.exit(0)
}

if (getOption(Options.VERSION)) {
	const pJSON = require(path.join(__dirname, "./package.json"))
	console.log(pJSON.version)
	process.exit(0)
}

// parse args
const query = args._[0]
let json = args._[1] || ""

// check query
if (!query) throw Error("missing query argument")
if (!query.startsWith(".") && !query.startsWith("[")) 
	throw Error("query must start with either \".\" or \"[\"")

loadCustomMethods()

if (json !== "") {	// normal usage
	runJSJQ(query, json)
		.then(() => process.exit(0))
		.catch(err => {
			console.error("jsjq error:", err)
			process.exit(1)
		});
} else {	// pipe usage
	if (getOption(Options.INTERACTIVE)) {
		throw Error("can't use interactive mode without a direct input (json file or json string")
	}

	(async function () {
		for await (const json of createInterface({ input: process.stdin })) {
			try {
				await runJSJQ(query, json);
			} catch (err) {
				console.error("jsjq error:", err)
			}
		}
	})();
}

async function runJSJQ(query, json) {
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

	// if query is root, just print it
	if (query === ".") {
		// check interactive mode on
		if (getOption(Options.INTERACTIVE)) {
			OBJECT = await runInteractive(OBJECT)
		}

		if (OBJECT !== undefined) {
			print(OBJECT)
		}
	
		return
	}

	// build and run query	
	const code = `OBJECT${query};`
	let result = safeEval(code, { OBJECT })

	// process query result
	if (result !== undefined) {  
		// check interactive mode on
		if (getOption(Options.INTERACTIVE)) {
			result = await runInteractive(result)
		}

		if (result !== undefined) {
			print(result)
		}
	}
}

function isValidFilePath(filePath) {
	try {
		return fs.statSync(filePath).isFile();
	} catch (error) {
		return false;
	}
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

function print(x) {
	const raw = getOption(Options.RAW_OUTPUT)
	const type = getOption(Options.TYPE) 
	const compact = getOption(Options.COMPACT_OUTPUT)

	let out

	if (type) out = getTypeOf(x) 
	else if (x === null && raw) out = "null"
	else if (x === null) out = null
	else if (compact) {
		if (raw) {
			if (typeof x == "object") {
				out = util.inspect(x, { compact: true, colors: false, depth: null }).replace(/(\s|\r\n|\n|\r)/gm, "")
			} else {
				out = x.toString()
			}
		} else out = util.inspect(x, { compact: true, colors: true, depth: null }).replace(/(\s|\r\n|\n|\r)/gm, "")
	} else {
		if (raw) {
			if (typeof x == "object") {
				out = util.inspect(x, null, null, true)
			} else {
				out = x.toString()	
			}
		} else out = util.inspect(x, null, null, true)
	}

	process.stdout.write(out + "\n")
}