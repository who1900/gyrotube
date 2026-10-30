#!/usr/bin/env bash
# Gradle-free GyroView build: aapt2 → javac → d8 → zipalign → apksigner
#
# Requires JDK 17+, Android SDK build-tools 35.0.0, and platforms;android-34.
#   ANDROID_HOME or ANDROID_SDK_ROOT   SDK root (default /opt/android-sdk)
#   BUILD_TOOLS                        override build-tools directory
#   ANDROID_JAR                        override platforms/android-34/android.jar
#
# Signing: KEYSTORE, KEYSTORE_PASS, KEY_ALIAS, KEY_PASS.
# If KEYSTORE is unset, scripts/sign-apk.sh generates a local debug keystore.
# Never commit a keystore or a signing password.
#
# The web player is staged from ../web, then ../gvkit/gvkit.js is copied over
# the staged kit so the APK follows the canonical module. Sources are not modified.
# Output defaults to dist/GyroView.apk (pass another path as the first argument).
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/android-sdk}}"
BT="${BUILD_TOOLS:-$SDK/build-tools/35.0.0}"
JAR="${ANDROID_JAR:-$SDK/platforms/android-34/android.jar}"
OUT="${1:-dist/GyroView.apk}"

for cmd in javac keytool python3; do
  command -v "$cmd" >/dev/null || { echo "Missing $cmd" >&2; exit 1; }
done
if [[ ! -x "$BT/aapt2" || ! -x "$BT/d8" || ! -x "$BT/zipalign" || ! -x "$BT/apksigner" || ! -f "$JAR" ]]; then
  echo "Android SDK build-tools 35.0.0 and platform android-34 are required." >&2
  echo "  ANDROID_HOME=$SDK" >&2
  echo "  expected aapt2: $BT/aapt2" >&2
  echo "  expected jar:   $JAR" >&2
  exit 1
fi

# shellcheck source=../scripts/sign-apk.sh
source "$ROOT/scripts/sign-apk.sh"

rm -rf build
mkdir -p build/gen build/classes build/dex build/staged/www "$(dirname "$OUT")"

cp "$ROOT/web/index.html" "$ROOT/web/app.js" "$ROOT/web/style.css" "$ROOT/web/sample.mp4" build/staged/www/
cp "$ROOT/gvkit/gvkit.js" build/staged/www/gvkit.js

"$BT/aapt2" compile --dir res -o build/res.zip
"$BT/aapt2" link -I "$JAR" --manifest AndroidManifest.xml -o build/base.apk --java build/gen \
  --min-sdk-version 24 --target-sdk-version 34 --version-code 6 --version-name 1.5 \
  -A build/staged -0 mp4 -0 webm build/res.zip

mapfile -d '' java_files < <(find src build/gen -name '*.java' -print0)
javac -nowarn -Xlint:-options --release 8 -classpath "$JAR" -d build/classes "${java_files[@]}"

mapfile -d '' class_files < <(find build/classes -name '*.class' -print0)
"$BT/d8" --release --min-api 24 --lib "$JAR" --output build/dex "${class_files[@]}"

python3 - <<'PY'
import zipfile
with zipfile.ZipFile("build/base.apk", "a", zipfile.ZIP_DEFLATED) as z:
    z.write("build/dex/classes.dex", "classes.dex")
PY

"$BT/zipalign" -f -p 4 build/base.apk build/aligned.apk
sign_apk build/aligned.apk "$OUT"
echo "Built $OUT"
