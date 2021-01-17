const path = require('path'),
	webpack = require('webpack'),
	HtmlWebpackPlugin = require('html-webpack-plugin'),
	CopyPlugin = require('copy-webpack-plugin'),
	ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	resolve: {
		modules: [
			path.join(__dirname, "src"),
			"node_modules",
		],
		extensions: ['.js', '.ts'],
		fallback: {
			util: require.resolve("util/"),
		},
	},
	mode: 'development',
	devtool: "source-map",
	devServer: {
		hot: true,
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.ProvidePlugin({
			process: 'process/browser',
		}),
		new HtmlWebpackPlugin({
			title: 'Game',
			meta: {viewport: 'width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0'},
		}),
		new CopyPlugin({
			patterns: [ { from: 'assets', to: 'assets' }, { from: 'textures', to: 'textures' }, ],
		}),
		new ForkTsCheckerWebpackPlugin(),
	],
	module: {
		rules: [
			{
				test: /\.(js|ts)$/,
				include: path.resolve(__dirname, 'src'),
				exclude: /(node_modules|bower_components)/,
				loader: "babel-loader",
			},
			{ test: /\.glsl$/, loader: "webpack-glsl-loader" },
		]
	}
};
