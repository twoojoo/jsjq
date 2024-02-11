const arg = require("arg")

let args = {}

const Options = {
	COMPACT_OUTPUT: ["-c", "--compact-output", Boolean, "compact instead of pretty-printed output"],
	RAW_OUTPUT: ["-r", "--raw-output", Boolean, "output strings without escapes and quotes"],
	TYPE: ["-t", "--type", Boolean, "print the type of the value instead of the value itself"],
	INTERACTIVE: ["-i", "--interactive", Boolean, "run jsjq in interactive mode (experimental)"],
	VERSION: ["-v", "--version", Boolean, "show the version"],
	HELP: ["-h", "--help", Boolean, "show the help"]
}

module.exports.Options = Options

module.exports.getOption = (option) => {
	for (const n of option.slice(undefined, -2)) {
		if (args[n] !== undefined) {
			return args[n]
		}
	}	

	return false
}

module.exports.loadArgs = () => {
	const argOptions = Object.values(Options).reduce((opts, o) => {
		o.slice(undefined, -2).forEach(name => { 
			const optKind = o[o.length - 2]
			opts[name] = optKind
		})
		return opts
	}, {})

	args = arg(argOptions)

	return args
}
