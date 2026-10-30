#!/usr/bin/env bash
# Sourced by the Android build scripts. Defines sign_apk.
#
# sign_apk <aligned.apk> <output.apk>
#
# Release signing (nothing here is stored in the repo):
#   KEYSTORE       path to an existing keystore
#   KEYSTORE_PASS  store password (required when KEYSTORE is set)
#   KEY_ALIAS      key alias (required when KEYSTORE is set)
#   KEY_PASS       key password (defaults to KEYSTORE_PASS)
#
# When KEYSTORE is unset, a throwaway debug keystore is created at
# ./local-debug.keystore if it does not already exist. The passwords below
# are local-only debug credentials, the same idea as the Android debug
# keystore. They are not a secret and must not be used to ship a release.
# The keystore file is gitignored. Delete it and the next build gets a new
# signature, which Android will not install over the previous APK.
#
# Requires BT to point at the Android build-tools directory (apksigner).

sign_apk() {
  local aligned="$1" out="$2"
  local ks alias storepass keypass
  if [[ -n "${KEYSTORE:-}" ]]; then
    ks="$KEYSTORE"
    if [[ ! -f "$ks" ]]; then
      echo "KEYSTORE not found: $ks" >&2
      exit 1
    fi
    if [[ -z "${KEYSTORE_PASS:-}" ]]; then
      echo "KEYSTORE_PASS is required when KEYSTORE is set" >&2
      exit 1
    fi
    if [[ -z "${KEY_ALIAS:-}" ]]; then
      echo "KEY_ALIAS is required when KEYSTORE is set" >&2
      exit 1
    fi
    alias="$KEY_ALIAS"
    storepass="$KEYSTORE_PASS"
    keypass="${KEY_PASS:-$KEYSTORE_PASS}"
    echo "Signing with $ks (alias $alias)"
  else
    ks="$PWD/local-debug.keystore"
    alias="localdebug"
    # Clearly-local throwaway credentials. Not for release.
    storepass="local-debug"
    keypass="local-debug"
    if [[ ! -f "$ks" ]]; then
      echo "Generating local debug keystore (throwaway, gitignored): $ks"
      STORE_PASS="$storepass" KEY_PASS="$keypass" \
        keytool -genkeypair \
          -keystore "$ks" -storetype PKCS12 \
          -alias "$alias" -keyalg RSA -keysize 2048 -validity 10000 \
          -dname "CN=Local Debug, OU=Throwaway, O=Local Only, C=XX" \
          -storepass:env STORE_PASS -keypass:env KEY_PASS >/dev/null
    else
      echo "Using existing local debug keystore: $ks"
    fi
  fi
  mkdir -p "$(dirname "$out")"
  # apksigner's env: provider keeps the passwords off argv.
  KEYSTORE_PASS="$storepass" KEY_PASS="$keypass" \
    "$BT/apksigner" sign \
      --ks "$ks" \
      --ks-key-alias "$alias" \
      --ks-pass env:KEYSTORE_PASS \
      --key-pass env:KEY_PASS \
      --v1-signing-enabled true \
      --v2-signing-enabled true \
      --out "$out" \
      "$aligned"
  rm -f "$out.idsig"
}
