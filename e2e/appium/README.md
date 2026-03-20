# Appium (Android APK) smoke test

This repo ships an Appium smoke test that installs the APK, launches it, waits briefly, and saves a screenshot.

## One-time setup

1. Install deps:

   - `npm i -D appium webdriverio`

2. Install the Appium Android driver:

   - `npx appium driver install uiautomator2`

3. Ensure the Android SDK is available:

   - Set `ANDROID_SDK_ROOT` (or `ANDROID_HOME`) to your SDK directory.
   - Make sure `platform-tools` is on your PATH so `adb` can run.

## Build an APK

- Debug (recommended for testing): `cd android; ./gradlew assembleDebug`

The default APK path used by the script is:

- `android/app/build/outputs/apk/debug/app-debug.apk`

## Run

1. Start an emulator or connect a device.
2. Start Appium server: `npx appium --port 4723`
3. Run the smoke test:

   - `npm run e2e:android:smoke`

### Windows convenience

On Windows, you can run a single command that:

- sets `ANDROID_SDK_ROOT` based on `android/local.properties`
- starts an emulator if none is connected
- starts Appium in the background
- runs the smoke test

Command:

- `npm run e2e:android:smoke:win`

## Useful env vars

- `APK_PATH` (default: debug APK path)
- `UDID` (if multiple devices)
- `APPIUM_HOST` (default: `127.0.0.1`)
- `APPIUM_PORT` (default: `4723`)
- `APPIUM_BASE_PATH` (default: `/`)
