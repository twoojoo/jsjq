#!/bin/node

const arg = require('arg');
const fs = require('node:fs');
const path = require('node:path');
const util = require("node:util");
const safeEval = require('safe-eval')
const { createInterface } = require("node:readline");

const { clearObject, addObjectMethods } = require("./custom")
const { loadArgs, getOption, Options } = require('./options');
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


if (json !== "") {	// normal usage
	runJSJQ(query, json)
		.then(() => process.exit(0))
		.catch(err => {
			console.error("JSJQ error:", err)
			process.exit(1)
		});
} else {	// pipe usage
	(async function () {
		for await (const json of createInterface({ input: process.stdin })) {
			try {
				await runJSJQ(query, json);
			} catch (err) {
				console.error("JSJQ error:", err)
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

	// enrich object with custom methods
	addObjectMethods(OBJECT)

	// define print function based on optuons
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

	// if query is root, just print it
	if (query === ".") {
		// check interactive mode on
		if (getOption(Options.INTERACTIVE)) {
			OBJECT = await runInteractive(OBJECT)
		}

		if (OBJECT !== undefined) {
			// remoce custom methods and print
			clearObject(OBJECT)
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
			// remove custom methods and print
			clearObject(OBJECT)
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