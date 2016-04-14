const path = require('path');

module.exports = {
    entry: "./src/main.js",
	resolve: {
		root: [
			path.resolve('./src'),
			path.resolve('./glsl'),
		],
	},
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
	debug: true,
	devtool: "source-map",
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
			{ test: /\.glsl$/, loader: "webpack-glsl" },
			{ test: /bitset/, loader: "exports?BitSet" },
			{ test: /fowl/, loader: "imports?BitSet=bitset!exports?fowl" },
			{ test: /flex\.js/, loader: "exports?flex" },
        ]
    }
};
