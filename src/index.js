import path from 'path'
import fs from 'fs'

import _ from 'lodash'

import getModuleDependencies from './lib/getModuleDependencies'
import registerConfigAsDependency from './lib/registerConfigAsDependency'
import processTailwindFeatures from './processTailwindFeatures'
import formatCSS from './lib/formatCSS'
import resolveConfig from './util/resolveConfig'
import getAllConfigs from './util/getAllConfigs'
import { supportedConfigFiles as defaultFilePaths } from './constants'
import defaultConfig from '../stubs/defaultConfig.stub.js'

// 处理项目配置文件, 如: tailwind.config.js，最终的结果是得到一条路径
// 下面的例子是在postcss插件配置里使用
/*
* postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: { config: './custom-config.js' },
  },
}
或者
plugins:[
  tailwindcss({
    config: "./custom.config.js"
  })
]
*/
// filePath 实际上是postcss自动传递过来的 配置参数
// 简单来说，要么直接传递文件，要么从 参数对象的config字段拿 路径字符串，要么从默认 tailwindcss.config.js 拿
function resolveConfigPath(filePath) {
  // require('tailwindcss')({ theme: ..., variants: ... })
  if (_.isObject(filePath) && !_.has(filePath, 'config') && !_.isEmpty(filePath)) {
    return undefined
  }

  // require('tailwindcss')({ config: 'custom-config.js' })
  if (_.isObject(filePath) && _.has(filePath, 'config') && _.isString(filePath.config)) {
    return path.resolve(filePath.config)
  }

  // require('tailwindcss')({ config: { theme: ..., variants: ... } })
  if (_.isObject(filePath) && _.has(filePath, 'config') && _.isObject(filePath.config)) {
    return undefined
  }

  // require('tailwindcss')('custom-config.js')
  if (_.isString(filePath)) {
    return path.resolve(filePath)
  }

  // require('tailwindcss') 如果用户没有自定义文件名或者路径，就返回默认的相对路径 ./tailwindcss.config.js[.cjs]
  for (const defaultPath of defaultFilePaths) {
    try {
      //暴力try catch 文件存不存在，个人非常喜欢这样的写法，简单有效，无副作用
      const configPath = path.resolve(defaultPath)
      fs.accessSync(configPath)
      return configPath
    } catch (err) {}
  }

  return undefined
}
// 注意这里是两个箭头函数哦，返回的是另一个函数
const getConfigFunction = (config) => {
  return () => {
    if (_.isUndefined(config)) {
      // 如果是undefined，有三种情况，
      /* 
      一，啥都没写，config.js没有
      二，写了配置参数，参数里没有用config指明配置文件，而是直接给的配置信息
      三，写了配置参数，但是参数里的config是直接传递的配置信息

      这样的话就要合并配置信息了
      */
      return resolveConfig([...getAllConfigs(defaultConfig)])
    }

    // Skip this if Jest is running: https://github.com/facebook/jest/pull/9841#issuecomment-621417584
    if (process.env.JEST_WORKER_ID === undefined) {
      if (!_.isObject(config)) {
        getModuleDependencies(config).forEach((mdl) => {
          delete require.cache[require.resolve(mdl.file)]
        })
      }
    }

    const configObject = _.isObject(config) ? _.get(config, 'config', config) : require(config)

    return resolveConfig([...getAllConfigs(configObject)])
  }
}
// PostCSS 插件入口
module.exports = function (config) {
  const plugins = []
  // 如果存在，最终获得是配置文件的绝对路径（path.resolve）
  const resolvedConfigPath = resolveConfigPath(config)

  if (!_.isUndefined(resolvedConfigPath)) {
    plugins.push(registerConfigAsDependency(resolvedConfigPath))
  }

  return {
    postcssPlugin: 'tailwindcss',
    plugins: [
      ...plugins,
      processTailwindFeatures(getConfigFunction(resolvedConfigPath || config)),
      formatCSS,
    ],
  }
}

module.exports.postcss = true
