# jsjq - jq with ECMASctipt syntax

> it uses **eval()** to run your code, be warned

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

Options:

- **-c, --compact-output**    compact instead of pretty-printed output;
- **-r, --raw-output**        output strings without escapes and quotes;
- **-t, --type**			  print the type of the value instead of the value itself;
- **-v, --version** 		  show the version;
- **-h, --help**	          show the help;