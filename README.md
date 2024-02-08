# jsjq - jq with ECMAScript syntax

> it uses **eval()** to run your code, be warned (code is checked using [safe-eval](https://www.npmjs.com/package/safe-eval))

Usage with npx:
```bash
npx jsjq '.data.map(x => x*2)' '{"data": [1, 2, 3]}'
# output: [2, 4, 6]
```

Normal usage:
```bash
npm i -g jsjq 

jsjq '.data.map(x => x*2)' '{"data": [1, 2, 3]}'
```

Pipe usage:
```bash
echo '{"data": [1, 2, 3]}' | jsjq '.data.map(x => x*2)' 
```

Custom object methods (see options):
```bash
jsjq '.data.listKeys()' '{ "data": {"a": 1, "b": 2, "c": 3} }'
# output: [ 'a', 'b', 'c' ]

jsjq '.data.listValues()' '{ "data": {"a": 1, "b": 2, "c": 3} }'
# output: [ 1, 2, 3 ]

jsjq '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }'
# output: [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]
```

Options:

- **-m, --disable-custom-methods** disable the usage of custom object methods (prevents object fields override);
- **-c, --compact-output**         compact instead of pretty-printed output;
- **-r, --raw-output**             output strings without escapes and quotes;
- **-t, --type**			       print the type of the value instead of the value itself;
- **-v, --version** 		       show the version;
- **-h, --help**	               show the help;