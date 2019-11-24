const path = require('path'),
	webpack = require('webpack'),
	ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	entry: ["@babel/polyfill", "./src/main.js"],
	resolve: {
		modules: [
			path.join(__dirname, "src"),
			"node_modules",
		],
		extensions: ['.wasm', '.mjs', '.js', '.json', '.ts'],
	},
	devtool: "source-map",
	devServer: {
		hot: true,
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new ForkTsCheckerWebpackPlugin(),
	],
	output: {
		// path: path.join(__dirname, 'build'),
		path: __dirname,
		filename: "bundle.js",
	},
	module: {
		rules: [
		{
			test: /\.(js|ts)$/,
			include: path.resolve(__dirname, 'src'),
			exclude: /(node_modules|bower_components)/,
			loader: "babel-loader",
			options: {
				presets: ["@babel/preset-env", "@babel/typescript"],
				plugins: ["@babel/plugin-syntax-dynamic-import"]
			}
		},
		{ test: /\.glsl$/, loader: "webpack-glsl-loader" },
		{ test: /BitSetModule/, loader: "exports-loader?BitSetModule" },
		{
			test: /fowl/,
			loader: "imports-loader?BitSetModule!exports-loader?fowl"
		},
		{ test: /flex\.js/, loader: "exports-loader?flex" },
		]
	}
};
