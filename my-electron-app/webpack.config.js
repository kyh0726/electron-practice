const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = [
  {
    mode: 'development',
    entry: './src/main.ts',
    target: 'electron-main',
    node: {
      __dirname: false,
      __filename: false,
    },
    externals: {
      'active-win': 'commonjs active-win',
      'node-os-utils': 'commonjs node-os-utils'
    },
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY)
      })
    ]
  },
  {
    mode: 'development',
    entry: './src/preload.ts',
    target: 'electron-preload',
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    }
  },
  {
    mode: 'development',
    entry: './src/renderer/index.tsx',
    target: 'web',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html'
      }),
      new webpack.DefinePlugin({
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
        'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL)
      })
    ],
    devServer: {
      port: 3000,
      hot: true,
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      client: {
        logging: 'warn',
        overlay: {
          errors: true,
          warnings: false,
        },
      },
      allowedHosts: 'all',
      historyApiFallback: true,
    }
  },
  {
    mode: 'development',
    entry: './src/renderer/timer-index.tsx',
    target: 'web',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'timer.js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/timer.html',
        filename: 'timer.html'
      }),
      new webpack.DefinePlugin({
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
        'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL)
      })
    ]
  }
];