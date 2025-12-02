try {
    console.log("Requiring expo/metro-config...");
    require("expo/metro-config");
    console.log("Success: expo/metro-config");

    console.log("Requiring nativewind/metro...");
    require("nativewind/metro");
    console.log("Success: nativewind/metro");

    console.log("Requiring ./metro.config.js...");
    const config = require("./metro.config.js");
    console.log("Success: ./metro.config.js loaded");
} catch (error) {
    console.error("Error requiring module:", error);
}
