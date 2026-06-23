const path = require("path");

// Bundles src/move-to-bottom.ts (and the imported VSS SDK) into a single
// scripts/move-to-bottom.js that the hidden host page loads.
module.exports = {
    mode: "production",
    entry: "./src/move-to-bottom.ts",
    output: {
        filename: "move-to-bottom.js",
        path: path.resolve(__dirname, "scripts")
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: "ts-loader" }
        ]
    },
    stats: { warnings: false }
};
