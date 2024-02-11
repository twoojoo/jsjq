#!/bin/bash

errors=()

remove_colors() {
    local input="$1"
    local plain_string=$(echo "$input" | sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g")
    echo "$plain_string"
}

check_test() {
	res=$(remove_colors "$res") 
	if [ "$res" != "$exp" ]; then
		errors+=("ERROR at \"$test\": \n\texpected \"$exp\",\n\treceived \"$res\"\n")
	fi
}

check_error_string() {
	if [ "$1" != "" ]; then
		errors+=("ERROR at \"$test\": \n\tunexpected error\n")
	fi
}

check_test_error() {
	if [ $? -eq 0 ]; then
		errors+=("ERROR at \"$test\": \n\texpected exit with error\n")
	fi
}

test="array compact"
exp="[ 1, 2, 3 ]" 
res=$(node . '.data.compact()' '{ "data": [1, 2, 2, 3] }')
check_test

test="disable custom methods - compact"
res=$(node . '.data.compact()' '{ "data": [1, 2, 2, 3] }' -m &> /dev/null)
check_test_error

test="disable custom methods (exended) - compact"
res=$(node . '.data.compact()' '{ "data": [1, 2, 2, 3] }' --disable-custom-methods &> /dev/null)
check_test_error

test="object listKeys"
exp="[ 'a', 'b', 'c' ]"
res=$(node . '.data.listKeys()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
check_test

test="disable custom methods - listKeys"
res=$(node . '.data.listKeys()' '{ "data": {"a": 1, "b": 2, "c": 3} }' -m &> /dev/null)
check_test_error

test="object listValues"
exp="[ 1, 2, 3 ]"
res=$(node . '.data.listValues()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
check_test

test="disable custom methods - listValues"
res=$(node . '.data.listValues()' '{ "data": {"a": 1, "b": 2, "c": 3} }' -m &> /dev/null)
check_test_error

test="object listEntries"
exp="[ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]"
res=$(node . '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }')
check_test

test="disable custom methods - listEntries"
res=$(node . '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }' -m &> /dev/null)
check_test_error

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

test="from pipe multiple"
exp="[ 1, 2, 3 ]"
err=$((
	echo '{ "data": [1, 2, 3] }'; sleep 1; 
	echo '{ "data": [1, 2, 3] }'; sleep 1; 
	echo '{ "data": [1, 2, 3] }'
) | node . '.data' 2>&1 >/dev/null)
check_error_string "$err"

test="compact option"
exp="[['a',1],['b',2],['c',3]]"
res=$(node . '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }' -c)
check_test

test="compact option extended"
exp="[['a',1],['b',2],['c',3]]"
res=$(node . '.data.listEntries()' '{ "data": {"a": 1, "b": 2, "c": 3} }' --compact-output)
check_test

test="no raw option"
exp="'string'"
res=$(node . '.data' '{ "data": "string" }')
check_test

test="raw option"
exp="string"
res=$(node . '.data' '{ "data": "string" }' -r)
check_test

test="raw option (extended)"
exp="string"
res=$(node . '.data' '{ "data": "string" }' --raw-output)
check_test

test="block interactive mode"
res=$(echo '{ "data": [1, 2, 3] }' | node . '.'  -i &> /dev/null)
check_test_error


if [ "${#errors[@]}" -ne "0" ]; then
	for err in "${errors[@]}"; do
	    printf "$err\n"
	done

	echo "some test failed!"
	exit 1
fi

echo "all tests OK!"