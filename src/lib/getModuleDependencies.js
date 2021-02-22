import fs from 'fs'
import path from 'path'
import resolve from 'resolve'
import detective from 'detective'

function createModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8')
  // 把文件里的所有请求的包 收集为 数组
  /* 
  如果source里 require是如下：
  var a = require('a');
  var b = require('b');
  var c = require('c');
  那么requires将会是一个 包的数组 [ 'a', 'b', 'c' ]
  */
  const requires = detective(source)

  return { file: filePath, requires }
}

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
        try {
          const basedir = path.dirname(mdl.file)
          const depPath = resolve.sync(dep, { basedir })
          const depModule = createModule(depPath)

          modules.push(depModule)
        } catch (_err) {
          // eslint-disable-next-line no-empty
        }
      })
  }

  return modules
}
