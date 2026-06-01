# ============================================================================
# Proguard / R8 rules for TrustWalletFork release build
# ----------------------------------------------------------------------------
# Goals
#   - Aggressive minification + obfuscation of Java/Kotlin sources.
#   - Keep RN, Nitro, Trust Wallet Core, and JNI surfaces intact (they rely
#     on reflection / native lookups).
#   - Strip debug/log calls.
# ============================================================================

# Strip log statements from release (Logger calls are no-ops post-R8).
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Strip System.out / System.err — defense in depth in case a third-party lib
# logs sensitive data through them.
-assumenosideeffects class java.io.PrintStream {
    public void println(%);
    public void println(**);
    public void print(%);
    public void print(**);
}

# Keep all native method declarations — JNI signatures must remain stable.
-keepclasseswithmembernames class * {
    native <methods>;
}

# React Native ----------------------------------------------------------------
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
    @com.facebook.jni.annotations.DoNotStrip *;
    @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}
-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }
-keep,includedescriptorclasses class com.facebook.react.uimanager.** { *; }
-keep,includedescriptorclasses class com.facebook.react.fabric.** { *; }
-keep,includedescriptorclasses class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# Nitro Modules ---------------------------------------------------------------
-keep class com.margelo.nitro.** { *; }
-keep class * implements com.margelo.nitro.core.HybridObject { *; }
-dontwarn com.margelo.nitro.**

# Trust Wallet Core JNI bindings ---------------------------------------------
-keep class wallet.core.jni.** { *; }
-keep class wallet.core.** { *; }
-dontwarn wallet.core.**

# react-native-keychain -------------------------------------------------------
-keep class com.oblador.keychain.** { *; }
-dontwarn com.oblador.keychain.**

# react-native-mmkv ----------------------------------------------------------
-keep class com.tencent.mmkv.** { *; }
-dontwarn com.tencent.mmkv.**

# Kotlin metadata is needed for the React Native plugin to introspect modules
-keep class kotlin.Metadata { *; }
-keepclassmembers class **$Companion { *; }

# Obfuscation aggression ------------------------------------------------------
-allowaccessmodification
-overloadaggressively
-repackageclasses ''
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable
