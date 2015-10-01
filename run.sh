#!/usr/bin/env bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $DIR

npm install
node server/app.js &
node_modules/.bin/watchify client/*.js -o public/js/bundle.js -v