#!/bin/bash
set -e

# -------------------------------------------------------------
# HonarHub Pay - Automated Android Release & GitHub Sync Script
# -------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="$REPO_ROOT/android"
DOWNLOADS_DIR="$REPO_ROOT/backend/public/downloads"

export JAVA_HOME="/home/abbas/jdk-21"
export ANDROID_HOME="/home/abbas/android-sdk"
GRADLE_BIN="/home/abbas/gradle/gradle-8.7/bin/gradle"

# 1. Read Version
VERSION_NAME=$(grep 'versionName =' "$ANDROID_DIR/app/build.gradle.kts" | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/')
TAG_NAME="v$VERSION_NAME"

echo "=== [1/5] Building Android Release APK ($TAG_NAME) ==="
cd "$ANDROID_DIR"
$GRADLE_BIN assembleRelease --no-daemon

APK_SRC="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_SRC" ]; then
  echo "Error: Release APK not found at $APK_SRC"
  exit 1
fi

echo "=== [2/5] Updating Host Downloads Directory ==="
mkdir -p "$DOWNLOADS_DIR"
# Remove old APKs
rm -f "$DOWNLOADS_DIR"/cardpay-sync*.apk
# Copy current APK
cp "$APK_SRC" "$DOWNLOADS_DIR/honarhub-pay-sync.apk"

echo "=== [3/5] Git Tag & Push ==="
cd "$REPO_ROOT"
if ! git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  git tag -a "$TAG_NAME" -m "HonarHub Pay Android Companion $TAG_NAME"
  git push origin "$TAG_NAME"
else
  echo "Tag $TAG_NAME already exists, skipping tag creation."
fi

echo "=== [4/5] Creating GitHub Release & Uploading Asset ==="
GITHUB_TOKEN=$(git config remote.origin.url | sed -E 's/.*:([^@]+)@github\.com.*/\1/')

RELEASE_JSON=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/ranjbarabbas/cardpay-gateway/releases" \
  -d "{
    \"tag_name\": \"$TAG_NAME\",
    \"name\": \"HonarHub Pay Android Companion $TAG_NAME\",
    \"body\": \"Official release of HonarHub Pay Android Companion $TAG_NAME\",
    \"draft\": false,
    \"prerelease\": false
  }")

RELEASE_ID=$(echo "$RELEASE_JSON" | grep -o '"id": [0-9]*' | head -n 1 | awk '{print $2}')

if [ -n "$RELEASE_ID" ]; then
  echo "Uploading APK asset to Release ID: $RELEASE_ID..."
  curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/vnd.android.package-archive" \
    --data-binary "@$DOWNLOADS_DIR/honarhub-pay-sync.apk" \
    "https://uploads.github.com/repos/ranjbarabbas/cardpay-gateway/releases/$RELEASE_ID/assets?name=honarhub-pay-sync.apk" > /dev/null
  echo "Asset uploaded successfully!"
else
  echo "Release already exists or returned response without ID."
fi

echo "=== [5/5] Android Release $TAG_NAME Published Successfully! ==="
