import defaultConfig from '../../stubs/defaultConfig.stub.js'
import { flagEnabled } from '../featureFlags'
import { flatMap, get, isFunction } from 'lodash'

export default function getAllConfigs(config) {
  // get 从config 里 拿presets，没有的话，使用 defaultConfig
  // 这里的preset 是指 配置里有没有指明别人 已经预先写好的配置，比如：

  /* 
* tailwind.config.js
这里的 acmecorp/tailwind-base 就是别人写好的，可以直接拿来用，相当于基础主题
module.exports = {
  presets: [
    require('@acmecorp/tailwind-base') // preset
  ],
  ...
}
  */

  // 递归获取第三方preset 的 依赖的 preset
  const configs = flatMap([...get(config, 'presets', [defaultConfig])].reverse(), (preset) => {
    return getAllConfigs(isFunction(preset) ? preset() : preset)
  })

  const features = {
    // Add experimental configs here...
  }

  Object.keys(features).forEach((feature) => {
    // 判断某个配置 是 以后加 还是说实验性质的
    // 如果更新了 某些新功能还在实验阶段，则会更新 featureFlags 和 上面的 features
    // * https://tailwindcss.com/docs/upgrading-to-v2#remove-future-and-experimental-configuration-options
    // future 属性应该会被 experimental 代替
    if (flagEnabled(config, feature)) {
      configs.unshift(features[feature])
    }
  })

  return [config, ...configs]
}
