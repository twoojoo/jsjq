# jsjq - jq with ECMAScript syntax 

[![npm version](https://img.shields.io/npm/v/jsjq.svg)](https://www.npmjs.com/package/jsjq)
[![Test Status](https://github.com/twoojoo/jsjq/actions/workflows/test.yml/badge.svg)](https://github.com/twoojoo/jsjq/actions)
[![Release Status](https://github.com/twoojoo/jsjq/actions/workflows/release.yml/badge.svg)](https://github.com/twoojoo/jsjq/actions)

> it uses **eval()** to run your code, be warned (code is checked and run using [safe-eval](https://www.npmjs.com/package/safe-eval))

Usage with npx:
```bash
npx jsjq '.data.map(x => x*2)' '{"data": [1, 2, 3]}'
# output: [2, 4, 6]
```

Normal usage:
```bash
npm i -g jsjq 

# from JSON string
jsjq '.data.map(x => x*2)' '{"data": [1, 2, 3]}'

# from JSON file
jsjq '.data.map(x => x*2)' example.json
```

Pipe usage:
```bash
echo '{"data": [1, 2, 3]}' | jsjq '.data.map(x => x*2)' 
```

Custom object methods (may be overridden by properties with the same name):
```bash
jsjq '.data.listKeys()' '{ "data": {"a": 1, "b": 2, "c": 3} }'
# output: [ 'a', 'b', 'c' ]

jsjq '.data.listValues()' '{ "data": {"a": 1, "b": 2, "c": 3} }'
# output: [ 1, 2, 3 ]

jsjq '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }'
# output: [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]

jsjq '.data.stringify()' '{ "data": {"a": 1, "b": 2, "c": 3} }'
# output: '{"a":1,"b":2,"c":3}'

# override:
jsjq '.data.stringify()' '{ "stringify": 123 }'
# will throw an error
```

Custom array methods:
```bash
jsjq '.data.compact()' '{ "data": [1, 2, 2, 3] }'
# output: [ 1, 2, 3 ]

jsjq '.data.stringify()' '{ "data": [1, 2, 2, 3] }'
# output '[1,2,2,3]'
```

Options:

- **-c, --compact-output**         compact instead of pretty-printed output;
- **-r, --raw-output**             output strings without escapes and quotes;
- **-i, --interactive** 		   run jsjq in interactive mode (experimental)
- **-t, --type**			       print the type of the value instead of the value itself;
- **-v, --version** 		       show the version;
- **-h, --help**	               show the help;

Code check:
```bash
jsjq '.data; process.exit(1)' '{}'
# will throw an error
```
