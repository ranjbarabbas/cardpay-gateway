# HonarHub Pay - Agent & Developer Workflow Rules

## Android Release & Publishing Workflow
Whenever making changes to the Android Companion Application:
1. **Version Bump**:
   - Increment `versionCode` and `versionName` in `android/app/build.gradle.kts`.
   - Update `ANDROID_APK_VERSION` in `backend/src/lib/version.ts`.
2. **Build and Host Distribution**:
   - Build signed APK using `JAVA_HOME=/home/abbas/jdk-21`.
   - Place output APK into `backend/public/downloads/honarhub-pay-sync.apk`.
   - Ensure old APK files (`cardpay-sync*.apk`) are cleaned from the host.
3. **GitHub Release Publication**:
   - Create git tag `v<versionName>` and push to GitHub.
   - Create an official GitHub Release with changelog notes.
   - Upload `honarhub-pay-sync.apk` as a release asset.
   - Keep the fallback URL in `backend/src/app/api/v1/download/apk/route.ts` synced.
   - Alternatively, execute `./scripts/publish-android-release.sh`.
