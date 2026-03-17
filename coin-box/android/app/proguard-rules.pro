# ===== React Native / Hermes =====
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# ===== Expo =====
-keep class expo.modules.** { *; }
-keep class versioned.host.exp.exponent.** { *; }

# ===== Kotlin =====
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# ===== Coroutines (se usado) =====
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**

# ===== OkHttp / Okio =====
-dontwarn okhttp3.**
-dontwarn okio.**

# ===== Remove logs em produção =====
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# ===== Otimizações seguras (sem flags que quebram New Architecture) =====
-optimizationpasses 3
-mergeinterfacesaggressively
