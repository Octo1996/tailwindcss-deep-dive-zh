import fs from 'fs'
import getModuleDependencies from './getModuleDependencies'

export default function (configFilePath) {
  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Specified Tailwind config file "${configFilePath}" doesn't exist.`)
  }

  return function (css, opts) {
    getModuleDependencies(configFilePath).forEach((mdl) => {
      opts.messages.push({
        type: 'dependency',
        parent: css.source.input.file,
        file: mdl.file,
      })
    })
  }
}
