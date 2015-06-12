
var gulp = require('gulp');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var fs = require('fs')
var path = require('path')
var builder = require('./build.js')

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
                
                match && fileList.push(path.parse(_path))
            }
        })
    }
    
    walk(folder)
    
    return fileList
}

gulp.task('less', function() {
	return gulp.src([
		'./../src/less/*.less'
	])
		.pipe(less({
			compress: true
		}))
		.pipe(gulp.dest('./../build/css/'));
});

gulp.task('uglify', function() {
	
	var buildDir = __dirname + '/../build/app/'

	gulp.src('./../src/js/*.js')
    .pipe(uglify())
	.pipe(rename(function(path){
		var files = scanFolder(buildDir)
		files.forEach(function(val, key){
			if(val.ext == path.extname && val.name.indexOf(path.basename + '_') >= 0){
				path.basename = val.name
				return false;
			}
		})
	}))
    .pipe(gulp.dest('./../build/app/'));
});

gulp.task('watch', function () {
    gulp.watch('./../src/less/*.less', ['less'])
    gulp.watch('./../src/js/*.js', ['uglify'])
});

gulp.task('build', function(){
	builder.build(__dirname + '/../build', __dirname + '/../../../')
})

gulp.task('default', [
    'less',
    'uglify'
]);
