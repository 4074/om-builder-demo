
var gulp = require('gulp');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var fs = require('fs')
var path = require('path')
var builder = require('./build.js')
var src = require('./src.js')

gulp.task('less', function() {
    
    var buildDir = __dirname + '/../build/css/'
    
	return gulp.src([
		'./../src/less/*.less'
	])
    .pipe(less({
        compress: true
    }))
    
    .pipe(rename(function(filepath){
        
		var files = src.scanFolder(buildDir + (filepath.dirname == '.' ? '' : filepath.dirname))

		files.forEach(function(val, key){
			if(val.ext == filepath.extname && val.name.indexOf(filepath.basename + '_') >= 0){
				filepath.basename = val.name
				return false;
			}
		})
	}))
    
    .pipe(gulp.dest('./../build/css/'));
});

gulp.task('uglify', function() {
	
	var buildDir = __dirname + '/../build/app/'

	gulp.src(['./../src/js/*.js', './../src/js/*/*.js'])
    .pipe(uglify())
	.pipe(rename(function(filepath){
        
		var files = src.scanFolder(buildDir + (filepath.dirname == '.' ? '' : filepath.dirname))

		files.forEach(function(val, key){
			if(val.ext == filepath.extname && val.name.indexOf(filepath.basename + '_v') >= 0){
				filepath.basename = val.name
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
	builder.build(__dirname + '/../build', __dirname + '/../../../', {
        path: 'config[^\.]*\.js',
        force: true
    })
})

gulp.task('default', [
    'less',
    'uglify'
]);
