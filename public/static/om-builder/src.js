
var fs = require('fs')
var path = require('path')
var crypto = require('crypto')

var root = path.resolve(__dirname, '../')
var logFolder = __dirname + path.sep + 'log'

// md5
function encrypt(str){
    return crypto.createHash('md5').update(str).digest('base64')
}

// 取文件摘要
function cryFile(filepath){
    var content = fs.readFileSync(filepath)
    return encrypt(content)
}

// 扫描文件夹
function scanFolder(folder, sub, patterns, reversal, exts, extre){
    
    var fileList = []
    
    function walk(filepath){
        var files = fs.readdirSync(filepath)
        
        files.forEach(function(item){
            var _path = filepath + path.sep + item
            var stats = fs.statSync(_path)
            
            if(sub && stats.isDirectory()){
                walk(_path)
            }else{
                
                extname = path.extname(_path)
                
                var match = true
                
                if(patterns){
                    match = !isIgnore(filepath, patterns, reversal)
                    if(match && exts && Array.isArray(exts)){
                        var inExt = exts.indexOf(extname.replace('.', '')) >= 0
                        match = extre ? inExt : !inExt
                    }
                }
                
//                match && fileList.push({
//                    folder: filepath,
//                    name: item,
//                    extname: extname
//                })
                
                match && fileList.push(path.parse(_path))
            }
        })
    }
    
    walk(folder)
    
    return fileList
}

// 判断路径是否匹配
function isIgnore(filepath, patterns, reversal){
    var hasMatch = false
    patterns = Array.isArray(patterns) ? patterns : [patterns]
    
    patterns.forEach(function(item){
        if(filepath.match(new RegExp(item.replace(/\//g, '\\' + path.sep)))){
            hasMatch = true
            return false;
        }
    })
    
    return reversal ? !hasMatch : hasMatch
}

function getFileRename(filepath, name){
    var newName = cryFile(filepath)
    newName = name.split('_')[0] + '_v' + newName.substr(0, 8).replace(/[\/\+]/g, '0')
    return newName
}

// 获取需要改名的文件列表
function getRenameList(list){
    var renameList = []
    
    list.forEach(function(item){
        
        if(!item.ext || item.ext == '.') return;
        
        var filepath = item.dir + path.sep + item.base
        var newName = getFileRename(filepath, item.name)
        
        if(item.name != newName){
            item.rename = newName
            renameList.push(item)
        }
    })
    
    return renameList
}

// 写日志
function writeLog(log, type){
    var now = new Date()
    var yearMonth = now.getFullYear() + '-' + (now.getMonth() + 1)
    var logPath = logFolder + path.sep + 'log-' + yearMonth + '.json'
    
    if(type == 'rebuild'){
        logPath = logFolder + path.sep + 'log-rebuild.json'
    }
    
    var logJson = []
    if(fs.existsSync(logPath)){
        logJson = JSON.parse(fs.readFileSync(logPath, 'utf-8') || '[]')
    }

    logJson.push({
        time: yearMonth + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '.' + now.getMilliseconds(),
        log: log || '',
        type: type,
        svndel: false
    })

    var err = fs.writeFileSync(logPath, JSON.stringify(logJson))
    err && console.log(err)
}

// 修改模版文件
function rewriteView(tpllist, renamelist){
    var log = []
    tpllist.forEach(function(item){
        var itempath = item.dir + path.sep + item.base
        var content = fs.readFileSync(itempath, {
            encoding: 'utf-8'
        })
        
        
        renamelist.forEach(function(re_item){
            
            var reg = new RegExp('\"([^"]*' + re_item.base + ')\"')
            var reg_repalce = new RegExp('(\"[^"]*)(' + re_item.base + ')(\")', 'g')
            var matches = content.match(reg)
            if(!matches || !matches.length || !matches[1]) return;
            
            matches[1] = transPathSep(matches[1])
            
            var re_path = path.isAbsolute(matches[1]) ? root + matches[1] : path.resolve(item.dir, matches[1])
            
            var filepath = transPathSep(re_item.dir + path.sep + re_item.base)

            if(re_path == filepath){
                content = content.replace(reg_repalce, function($1, $2, $3, $4){
                    return $2 + re_item.rename + re_item.ext + $4
                })
            }
            
            var err = fs.writeFileSync(itempath, content)
            
            log.push({
                filepath: itempath.replace(root, ''),
                name: re_item.name,
                rename: re_item.rename,
                ext: re_item.ext,
                result: err ? 'fail' : 'success',
                err: err
            })
        })
    })
    
    return log
}

// 重命名文件
function renameFile(renamelist){
    var log = []
    renamelist.forEach(function(item){
        var err = fs.renameSync(item.dir + path.sep + item.base, item.dir + path.sep + item.rename + item.ext)
        
        log.push({
            filepath: item.dir.replace(root, '') + path.sep + item.base,
            name: item.name,
            rename: item.rename,
            ext: item.ext,
            result: err ? 'fail' : 'success',
            err: err
        })
    })
    return log
}


function transPathSep(filepath){
    return filepath.replace(/\//g, '\\')
}


module.exports = {
    scanFolder: scanFolder,
    getRenameList: getRenameList,
    renameFile: renameFile,
    rewriteView: rewriteView,
    writeLog: writeLog,
    getFileRename: getFileRename
}
