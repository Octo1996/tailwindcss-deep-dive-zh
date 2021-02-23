import fs from 'fs'
import path from 'path'
import resolve from 'resolve'
import detective from 'detective'

function createModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8')
  // 把文件里的所有请求的包 收集为 数组
  // 这个只是分析依赖，并不检测文件存不存在
  // 如果没有依赖什么库，就返回空数组
  /* 
  如果source里 require是如下：
  var a = require('a');
  var b = require('./b');
  var c = require('c/d');
  那么requires将会是一个 包的数组 [ 'a', './b', 'c/d' ]
  */
  const requires = detective(source) // default []

  return { file: filePath, requires }
}

// 递归收集文件的依赖关系，形成一维数组，key1【file】 是绝对路径，key2【requires】是依赖数组
// 每一个requires里的依赖文件拼接好file的路径后，都能在一维数组里找到对应的依赖关系
export default function getModuleDependencies(entryFilePath) {
  const rootModule = createModule(entryFilePath)
  const modules = [rootModule]

  // Iterate over the modules, even when new
  // ones are being added
  for (const mdl of modules) {
    mdl.requires
      .filter((dep) => {
        // Only track local modules, not node_modules
        return dep.startsWith('./') || dep.startsWith('../')
      })
      .forEach((dep) => {
        // dep 是依赖的路径（现在已经过滤了，只有相对路径）
        try {
          // 利用文件的位置关系拼接 完整路径，再次检测并收集 依赖的依赖关系
          const basedir = path.dirname(mdl.file)
          const depPath = resolve.sync(dep, { basedir })
          const depModule = createModule(depPath)

          // 不断的push 和for形成递归，这样就能收集所有 相关文件的依赖关系
          modules.push(depModule)
        } catch (_err) {
          // eslint-disable-next-line no-empty
        }
      })
  }

  return modules
}
