var path = require('path')
var src = require('./src.js')

var root = path.resolve(__dirname, '../')

// 开始
function build(buildDir, viewDir){

	buildDir = path.resolve(buildDir)
	viewDir = path.resolve(viewDir)
	
    var filelist = src.scanFolder(buildDir, true, 'app', true, ['js'], true)
    var renamelist = src.getRenameList(filelist)
    var tpllist = src.scanFolder(viewDir, true, '/views', true, ['html', 'tpl'], true)
	
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