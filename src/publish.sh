#!/bin/bash
VERSION=$(grep version package.json  | grep -o "[0-9]\.[0-9]\.[0-9]")
yarn publish --new-version $VERSION --access public
