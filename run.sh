#!/bin/bash

echo "Building server's UI"

cd ../ui
npm run build

rm -rf ../network-initializer/static/server/emeliyanov/*
mv ./build/* ../network-initializer/static/server/emeliyanov/ && echo "Files moved successfully"

cd ../network-initializer/

sleep 2

echo "Running project"
cargo run
