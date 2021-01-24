const {src, dest, series, parallel, watch} = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')
const loadPlugins = require('gulp-load-plugins')//导出的是一个方法
const pagesConfig = require('../../02-01-03-12-zce-gulp-demo/pages.config')
const plugins = loadPlugins()
const bs = browserSync.create()//开发服务器
const cwd = process.cwd()//返回当前命令行的工作目录
let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}
try{
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({},config,loadConfig)
}catch(e){}

const clean = () => {
  return del([config.build.dist,config.build.temp])
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))//从当前模块依次往上找这个模块
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}


const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}
const serve = () =>{
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // watch('src/assets/images/**',image)
  // watch('src/assets/fonts/**',font)
  // watch('public/**',extra)
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify:false,//关闭提示
    //port:2080,//端口
    //files:'temp/**',
    //files:['temp','src','public'],
    server:{
      baseDir: [config.build.temp, config.build.dist, config.build.public],
      routes:{
        '/node_modules':'node_modules'
      }
    }
  })
}
const useref = () =>{
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    //js:gulp-uglify  html: gulp-htmlmin css:gulp-clean-css
    //是否以.js结尾
    .pipe(plugins.if(/\.js$/,plugins.uglify()))
    .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/,plugins.htmlmin({
      collapseWhitespace:true,//去除空格和换行
      minifyCSS:true,//压缩内联样式
      minifyJS:true//压缩内联js
    })))
    .pipe(dest(config.build.dist))
}
const compile = parallel(style, script, page)

//上线之前
const build = series(clean,parallel(series(compile,useref), image, font,extra)) 
const develop = series(compile, serve)
module.exports = {
  clean,
  build,
  develop,
}