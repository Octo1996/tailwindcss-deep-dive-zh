import _ from 'lodash'
import chalk from 'chalk'
import log from './util/log'

const featureFlags = {
  future: [],
  experimental: [],
}

// 配置 key 是不是在实验阶段 （future 字段，旧， 将来不就会被废弃）
export function flagEnabled(config, flag) {
  if (featureFlags.future.includes(flag)) {
    return config.future === 'all' || _.get(config, ['future', flag], false)
  }

  if (featureFlags.experimental.includes(flag)) {
    return config.experimental === 'all' || _.get(config, ['experimental', flag], false)
  }

  return false
}

// 怎么说呢？ 实验字段我开放了，你用了吗？
function experimentalFlagsEnabled(config) {
  if (config.experimental === 'all') {
    return featureFlags.experimental
  }

  return Object.keys(_.get(config, 'experimental', {})).filter(
    (flag) => featureFlags.experimental.includes(flag) && config.experimental[flag]
  )
}

export function issueFlagNotices(config) {
  if (process.env.JEST_WORKER_ID !== undefined) {
    return
  }

  //当配置里使用实验字段，警告实验字段不稳定，随时会更改，chalk是一个快捷更改控制台输出颜色的库
  if (experimentalFlagsEnabled(config).length > 0) {
    const changes = experimentalFlagsEnabled(config)
      .map((s) => chalk.yellow(s))
      .join(', ')

    log.warn([
      `You have enabled experimental features: ${changes}`,
      'Experimental features are not covered by semver, may introduce breaking changes, and can change at any time.',
    ])
  }
}

export default featureFlags
