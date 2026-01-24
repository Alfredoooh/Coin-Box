# === REGRAS PROGUARD AGRESSIVAS PARA REDUZIR TAMANHO ===

# Otimizações máximas
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose
-allowaccessmodification
-mergeinterfacesaggressively
-repackageclasses ''

# REMOVE LOGS COMPLETAMENTE EM PRODUÇÃO
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Remove System.out e System.err
-assumenosideeffects class java.io.PrintStream {
    public void println(%);
    public void println(**);
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# React Native - Mínimo necessário
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep,allowobfuscation @interface com.facebook.jni.annotations.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.jni.annotations.DoNotStrip class *

-keepclassmembers @com.facebook.proguard.annotations.DoNotStrip class * {
    *;
}

-keepclassmembers @com.facebook.common.internal.DoNotStrip class * {
    *;
}

-keepclassmembers @com.facebook.jni.annotations.DoNotStrip class * {
    *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo (mínimo)
-keep class expo.modules.** { *; }

# Remove reflection não usada
-dontwarn java.lang.invoke.**

# Otimizações agressivas
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*