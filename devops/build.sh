#!/usr/bin/bash

set -e

source ${HOME}/.bashrc

# Set CI env prevents the cordova telemetry prompt from showing up
export CI=true

rm -fr platforms plugins node_modules
cordova platform add android
cordova build android --release -- --packageType=bundle
# Sign android app bundle
cd platforms/android/app/build/outputs/bundle/release
jarsigner -conf /key/config app-release.aab smartchico-upload
/opt/android-sdk-linux/build-tools/34.0.0/zipalign -v 4 app-release.aab smartchico-release.aab
