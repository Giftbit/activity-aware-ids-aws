#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR/..

# Build one or more lambda functions.
# eg: ./build rest rollup
# eg: ./build

BUILD_ARGS=""
for ((i=1;i<=$#;i++)); do
    BUILD_ARGS="$BUILD_ARGS --fxn=${!i}";
done

npm run build -- $BUILD_ARGS
