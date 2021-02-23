import fs from 'fs'
import getModuleDependencies from './getModuleDependencies'

// 这个方法在 src/index.js 里叫做 registerConfigAsDependency
// 通过执行这个方法得到一个新的方法，然后push到了plugins里
export default function (configFilePath) {
  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Specified Tailwind config file "${configFilePath}" doesn't exist.`)
  }

  return function (css, opts) {
    // getModuleDependencies 收集从 configFilePath 开始的 所有依赖文件，以及依赖文件里的依赖关系，为一维数组
    /* 
[
  [ file: '/c/a.js', requires: ['./b','./c'] ],
  [ file: '/c/b.js', requires: ['./d'] ],
  [ file: '/c/c.js', requires: [] ],
  [ file: '/c/b/d.js', requires: [] ]
]
    */
    getModuleDependencies(configFilePath).forEach((mdl) => {
      opts.messages.push({
        type: 'dependency',
        parent: css.source.input.file,
        file: mdl.file,
      })
    })
  }
}
