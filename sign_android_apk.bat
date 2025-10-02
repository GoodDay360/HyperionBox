@echo off
REM Create output directory for univeral build
mkdir src-tauri\gen\android\build\universal

REM Sign the APK
"%ANDROID_HOME%\build-tools\36.0.0\apksigner" sign --ks hyperionbox.jks --ks-key-alias hyperionbox --out src-tauri\gen\android\build\universal\hyperionbox-release.apk src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk

REM Verify the signed APK
"%ANDROID_HOME%\build-tools\36.0.0\apksigner" verify src-tauri\gen\android\build\universal\hyperionbox-release.apk