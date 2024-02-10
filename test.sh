remove_colors() {
    local input="$1"
    local plain_string=$(echo "$input" | sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g")
    echo "$plain_string"
}

exp="[ 1, 2, 3 ]"
res=$(node . '.data.compact()' '{ "data": [1, 2, 2, 3] }')
res=$(remove_colors "$res") 
if [ "$res" != "$exp" ]; then
	echo "expected $exp, received $res" 
 	exit 1; 
fi

exp="[ 'a', 'b', 'c' ]"
res=$(node . '.data.listKeys()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
res=$(remove_colors "$res") 
if [ "$res" != "$exp" ]; then
	echo "expected $exp, received $res" 
 	exit 1; 
fi

exp="[ 1, 2, 3 ]"
res=$(node . '.data.listValues()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
res=$(remove_colors "$res") 
if [ "$res" != "$exp" ]; then
	echo "expected $exp, received $res" 
 	exit 1; 
fi

exp="[ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]"
res=$(node . '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
res=$(remove_colors "$res") 
if [ "$res" != "$exp" ]; then
	echo "expected $exp, received $res" 
 	exit 1; 
fi

echo "all tests OK!"