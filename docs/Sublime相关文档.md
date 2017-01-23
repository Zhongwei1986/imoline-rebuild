## Sublime插件安装

### 安装Package Control
+ Package Control插件管理器（类似于Node的npm模块管理包）
+ 在sublime(以ST3为例)界面按快捷键 ctrl+` 打开控制台，粘贴下面的代码进去后回车

```
import urllib.request,os,hashlib; h = 'df21e130d211cfc94d9b0905775a7c0f' + '1e3d39e33b79698005270310898eea76'; pf = 'Package Control.sublime-package'; ipp = sublime.installed_packages_path(); urllib.request.install_opener( urllib.request.build_opener( urllib.request.ProxyHandler()) ); by = urllib.request.urlopen( 'http://packagecontrol.io/' + pf.replace(' ', '%20')).read(); dh = hashlib.sha256(by).hexdigest(); print('Error validating download (got %s instead of %s), please try manual install' % (dh, h)) if dh != h else open(os.path.join( ipp, pf), 'wb' ).write(by)
```
> 如果是Sublime Text2，复制的代码不同，请查看[官方网站](https://packagecontrol.io/installation)获取相关代码

### 安装其它插件的方法
+ 使用快捷键shift+ctrl+p，打开命令行面板，输入PCI（Package Control Install）进入插件库，然后输入插件名就可以安装插件了。

### 常用插件清单和基本说明
+ AutoFileName: 自动完成本地文件名，便于引用本地资源
+ Autoprefixer: 自动补全CSS
+ BracketHighlighter: 括号和标签高亮
+ Emmet: HTML神器，常用不常用的标签都有缩略代码，详见http://docs.emmet.io/cheat-sheet/
+ HTML-CSS-JS Prettify：自动调整三种文件的代码，集成在右键菜单
+ Sublimelinter: 基于NodeJS的代码检查框架
+ SublimeLinter-jshint JS语法检查，这个插件和下面的插件需要全局安装NODE模块，详情见https://gaohaoyang.github.io/2015/03/26/sublimeLinter/
+ SublimeLinter-csslint CSS语法检查
+ Terminal 直接从代码文件目录处启动CMD工具，快捷键shift+ctrl+T

## Sublime开启vim编辑模式方法
+ 1、打开sublime，Preference--Setting
+ 2、将Preferences.sublime-settings——User文件中的"Vintage"添加注释“//”，具体内容如下：
```
{
	"ignored_packages":
	[
		//"Vintage"
	]
}
```
+ 3、保存文件立即生效
+ 4、esc即可进入vim模式