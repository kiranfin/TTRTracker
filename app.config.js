const IS_DEV = process.env.APP_VARIANT === "development";

export default {
    expo: {
        name: IS_DEV ? "MyTTR Tracker Dev" : "MyTTR Tracker",
        slug: "tttracker",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: IS_DEV ? "tttracker-dev" : "tttracker",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,

        ios: {
            supportsTablet: true,
            bundleIdentifier: IS_DEV
                ? "com.kiranfin.tttracker.dev"
                : "com.kiranfin.tttracker",
        },

        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/icon.png",
                backgroundColor: "#082255",
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            package: IS_DEV
                ? "com.kiranfin.tttracker.dev"
                : "com.kiranfin.tttracker",
        },

        web: {
            output: "static",
            favicon: "./assets/images/favicon.png",
        },

        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/android-icon-foreground.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#0041B6",
                    dark: {
                        backgroundColor: "#082255",
                    },
                },
            ],
            "expo-secure-store",
        ],

        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },

        extra: {
            router: {},
            eas: {
                projectId: "82fe0152-f251-4543-859d-2afe28d80d5d",
            },
        },
    },
};