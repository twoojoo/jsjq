remove_colors() {
    local input="$1"
    local plain_string=$(echo "$input" | sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g")
    echo "$plain_string"
}

check_test() {
	res=$(remove_colors "$res") 
	if [ "$res" != "$exp" ]; then
		printf "ERROR at \"$test\": \n\texpected \"$exp\",\n\treceived \"$res\"\n" 
	 	exit 1; 
	fi
}

test="array compact"
exp="[ 1, 2, 3 ]" 
res=$(node . '.data.compact()' '{ "data": [1, 2, 2, 3] }')
check_test

test="object listKeys"
exp="[ 'a', 'b', 'c' ]"
res=$(node . '.data.listKeys()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
check_test

test="object listValues"
exp="[ 1, 2, 3 ]"
res=$(node . '.data.listValues()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
check_test

test="object listEntries"
exp="[ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]"
res=$(node . '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
check_test

test="object.listEntries()"
exp="[ [ 'a', 1 ], [ 'b', 2     ], [ 'c', 3 ] ]"
res=$(node . '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
check_test

test="number type"
exp="number"
res=$(node . '.data[0]' '{ "data": [1, 2, 3] }' -t)
check_test

test="string type"
exp="string"
res=$(node . '.data[0]' '{ "data": ["1", "2", "3"] }' -t)
check_test

test="array type"
exp="array"
res=$(node . '.data' '{ "data": [1, 2, 3] }' -t)
check_test

test="object type"
exp="object"
res=$(node . '.data' '{ "data": {"a": 1, "b": 2, "c": 3} }' -t)
check_test

test="from file"
exp="[ 1, 2, 3 ]"
res=$(node . '.data' 'test.json')
check_test

test="from pipe"
exp="[ 1, 2, 3 ]"
res=$(echo '{ "data": [1, 2, 3] }' | node . '.data')
check_test

echo "all tests OK!"