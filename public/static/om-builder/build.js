var path = require('path')
var src = require('./src.js')

var root = path.resolve(__dirname, '../../../')
var fs = require('fs')
var glob = require('glob')

// 开始
function build(buildDir, viewDir, requireOptions){

	buildDir = path.resolve(buildDir)
	viewDir = path.resolve(viewDir)
	
    var filelist = src.scanFolder(buildDir, true, ['app', 'css', 'lib'], true, ['js', 'css'], true)
    var renamelist = src.getRenameList(filelist)
    var tpllist = src.scanFolder(viewDir, true, '/views', true, ['html', 'tpl'], true)
    
    var requireFiles = src.scanFolder(buildDir, true, 'config', true, ['js'], true)
    var requireFile = ''
    var reg = {
        base: /baseUrl\:\"([^\,]*)\"/,
        path: /paths\:(\{[^\}]*\})/,
        shim: /shim\:(\{[^\}]*\})/
    }
    var matches = {}
    
    
    requireFiles.forEach(function(item){
        if(new RegExp(requireOptions.path).test(item.dir + path.sep + item.base)){
            requireFile = item
            return false
        }
    })
    
    var requireFilePath = path.resolve(requireFile.dir + path.sep + requireFile.base)
    var requireRenameIndex
    var requireContent = fs.readFileSync(requireFilePath, 'utf-8')
    
    
    if(requireContent){
        
        matches = {
            base: requireContent.match(reg.base),
            path: requireContent.match(reg.path),
            shim: requireContent.match(reg.shim),
        }
        
        
        matches = {
            base: matches.base && matches.base[1],
            path: matches.path && matches.path[1],
            shim: matches.shim && matches.shim[1],
        }
        
        var req_path = matches.path.match(/:"[^\"]*"/g)
        
        req_path.forEach(function(item, index){
            
            var _path =  item.replace(/[\"\:]/g, '') + '.js'
            
            if(requireOptions.force){
                // 强制将目录中的文件名写入配置
                
                _path =  item.replace(/[\"\:]/g, '').replace(/\_v.*/, '_v') + '*.js'
                var files = glob.sync(_path, {
                    cwd: root + matches.base
                })
                if(files){
                    files.forEach(function(_item){
                        requireContent = requireContent.replace(new RegExp(item.replace(/[\"\:]/g, ''), 'g'), _item.replace('.js', ''))
                    })
                }
                console.log(files)
            }else{
                // 根据renamelist来写入
                
                renamelist.forEach(function(_rename, _index){
                    var _reqPath = path.resolve(root + matches.base + _path)
                    var _renamePath = path.resolve(_rename.dir + path.sep + _rename.base)
                    
                    if(_reqPath == _renamePath){
                        //console.log(path.parse(_path))
                        var _pathParse = path.parse(_path)
                        requireContent = requireContent.replace(_path.replace('.js', ''), _pathParse.dir + '/' + _rename.rename)
                    }
                })
            }
            
        })
        
        
        var err = fs.writeFileSync(requireFilePath, requireContent)
        if(err){
            console.log(err)
            return;
        }
        
        var hasRequireRename = false
        renamelist.forEach(function(_reanme, _index){
            if(_reanme.dir + _reanme.base == requireFile.dir + requireFile.base){
                
                _reanme.rename = src.getFileRename(requireFilePath, requireFile.name)
                
                hasRequireRename = true
                return false
            }
        })
        
        if(!hasRequireRename){
            requireFile.rename = src.getFileRename(requireFilePath, requireFile.name)
            renamelist.push(requireFile)
        }
        
    }
    
    //console.log(renamelist)
    //console.log(requireContent)
    //return;
    
    var log = {}
    
    if(!renamelist.length){
        console.log('nothing be modify.')
        return
    }
    
    log.rename = src.renameFile(renamelist)
    console.log('rename done')
    
    log.rewrite = src.rewriteView(tpllist, renamelist)
    console.log('rewrite done')
    
    src.writeLog(log, 'build')
    console.log('log done')
    
    console.log('build is done.')
	return;
}

module.exports = {
	build: build
}