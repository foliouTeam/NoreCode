var jsonfile = require("jsonfile");
var browserify = require("browserify");
var fs = require("fs");
var fse = require("fs-extra");
var path = require("path");
import Configs from './configs';
var juicer = require("juicer");
var babelify = require("babelify");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync'); // 有多种适配器可选择
import Files from './files';
class Projects {
    constructor() {}
    static getlist(callback) {
        if (!Configs.getItem('workshop')) {
            callback(false, '没有设置workshop');
            console.log('没有设置workshop');
            return;
        }
        var workshopdir = path.resolve(Configs.getItem('workshop'));
        Files.createdir(workshopdir, function () {
            Files.getList(workshopdir, callback);
        });
    }
    static getProject(actname, callback) {
        var actpath = path.join(
            __dirname,
            "../" + Configs.getItem('workshop') + "/" + actname + "/"
        );
        // var mainsrc = actpath + "main.json";
        // var logicsrc = actpath + "main.json";
        // var result = {};
        // try {
        //     result["main"] = jsonfile.readFileSync(mainsrc);
        //     result["logic"] = jsonfile.readFileSync(logicsrc);
        // } catch (e) {
        //     callback(false);
        // }
        callback(result);
    }
    static delete(actname, callback) {
        let projectDir = path.resolve(Configs.getItem('workshop'), actname);
        fse.remove(projectDir, err => {
            if (err) return callback(false)
            callback(true)
        })
    }
    static getTempList(callback) {
        var tempdir = path.resolve(__dirname, "../../template");
        Files.createdir(tempdir, function () {
            Files.getList(tempdir, callback);
        });
    }
    static openWithIed(actid) {
        var vcodedir = Configs.getItem('iedpath');
        if (!vcodedir) {

            return -1;
        }
        let project = this.getProjectDir(actid);
        if (project) {
            // shelljs.cd(path);
            let sh = vcodedir + ' ' + path;
            console.log(sh);
            // console.log(path);
            // shell.showItemInFolder(path)
            // return;
            var child = shelljs.exec(sh, {
                async: true,
                silent: true,
            }, function (code, stdout, stderr) {
                console.log(stderr);
                console.log(stdout);
                if (!!stderr) {
                    //resolve(false)
                } else {
                    //resolve(true)
                }
            });
            return true;
        }
        return -2;
    }
    static getProjectDir(actname) {
        let projectDir = path.resolve(Configs.getItem('workshop'), actname);
        return projectDir;
    }
}

class Project {
    constructor(config) {
        if (!config) {
            return;
        }

        if (typeof config == "string") {
            //项目已经存在
            this.actname = config;
            // this.path = path.resolve(Configs.getItem('workshop'), this.actname);
            // // console.log(1111);
            // // console.log(fs.existsSync("xxxx"));
            // if (fs.existsSync(this.path + "config.json")) {
            //     this.config = jsonfile.readFileSync(this.path + "config.json");
            // }
            this.config = {};
        } else {
            this.config = config;
            this.actname = config.actname;
            // if (!this.config.template) {
            //     this.config.template = "blank";
            // }
        }
        this.path = path.resolve(Configs.getItem('workshop'), this.actname);
        this.initDB();
        return true;
    }
    initDB(callback) {
        var self = this;
        let datadir = path.resolve(this.path, 'data');
        if (!fs.existsSync(this.path)) {
            return;
        }
        if (!!this.db) {
            callback(true);
            return;
        }

        Files.createdir(datadir, function (res) {
            if (!!res) {
                let adapter = new FileSync(path.resolve(self.path, 'data/db.json')); // 申明一个适配器
                self.db = low(adapter);
                self.db.defaults({
                        pages: [],
                        info: {}
                    })
                    .write();
                if (!!callback) {
                    callback(true, null);
                }
            } else {
                if (!!callback) {
                    callback(false, '创建数据目录失败');
                }
            }

        });
    }

    getPageList() {
        let pages = this.db.get('pages')
            .value();
        return pages;
    }
    addPage(config) {
        if (!config || !config.name) {
            return -1;
        }
        if (this.hasPage(name)) {
            return -2;
        }
        var id = this.db.get('pages').push(
            Object.assign({
                id: shortid.generate()
            }, config, {
                tree: null
            })
        ).write();
        return id;
    }
    delPage(name) {
        if (!name || !this.hasPage(name)) {
            return -1;
        }
        var res = this.db.get('pages')
            .remove({
                name: name
            })
            .write();
        return res;
    }
    hasPage(name) {
        var hasname = this.db.get({
            name: name
        }).size();
        return !!hasname;
    }
    savePage(name, tree) {
        if (!name || !tree || !this.hasPage(name)) {
            return -1;
        }
        var res = this.db.get('pages')
            .find({
                name: name
            })
            .assign({
                tree: tree
            }).write();
        return res;
    }
    saveToFile() {

    }
    parseFile() {

    }
    getinfo(callback) {
        var mainsrc = this.path + "main.json";
        //console.log(logicsrc);
        var logicsrc = this.path + "logic.json";
        var result = {};
        try {
            result["main"] = jsonfile.readFileSync(mainsrc);
            result["logic"] = jsonfile.readFileSync(logicsrc);
            callback(result);
        } catch (e) {
            callback(false);
        }
    }

    create(callback) {
        var result = {
            ret: 1
        };
        if (!this.config.actname) {
            result.msg = "请传入活动名称";
            result.ret = -1;
            callback(result);
            return result;
        }
        if (!this.config.game) {
            result.msg = "请选择游戏";
            result.ret = -1;
            callback(result);
            return result;
        }
        if (!this.config.title) {
            result.msg = "请填写项目标题标题";
            result.ret = -1;
            callback(result);
            return result;
        }
        if (!this.config.desc) {
            result.msg = "请填写项目描述";
            result.ret = -1;
            callback(result);
            return result;
        }
        var self = this;
        let projectDir = path.resolve(Configs.getItem('workshop'), this.config.actname);

        Files.createdirAsync(projectDir).then(function () {
            //保存基本信息
            self.initDB(function (res, msg) {
                if (!res) {
                    if (!!callback) {
                        callback({
                            ret: res,
                            msg: msg
                        });
                    }
                    return;
                }
                try {
                    self.db.set('info', self.config)
                        .write();
                    result.msg = "成功";
                    result.ret = 1;
                    callback(result);
                } catch (error) {
                    result.msg = "保存项目信息失败";
                    result.ret = -1;
                    callback(result);
                }

                // .then(function () {
                //     result.msg = "成功";
                //     result.ret = 1;
                //     callback(result);
                //     return;
                // }).catch(function () {
                //     result.msg = "保存项目信息失败";
                //     result.ret = -1;
                //     callback(result);
                // })
            });
        }).catch(function () {
            result.msg = "复制文件失败";
            result.ret = -1;
            callback(result);
            return result;
        });
    }


    getProjectDir(actname) {
        let projectDir = path.resolve(Configs.getItem('workshop'), actname);
        return projectDir;
    }
    isexit() {

    }
    save(data) {

    }
    saveMain(main, callback) {
        if (main) {
            var result = jsonfile.writeFileSync(this.path + "main.json", main);
            callback(true);
        } else {
            callback(false);
        }
    }
    saveHtml(canvasHtml, callback) {}
    saveLogic(logic, callback) {
        if (logic) {
            var result = jsonfile.writeFileSync(
                this.path + "logic.json",
                logic
            );
            callback(result);
        } else {
            callback(false);
        }
    }
    render(canvaData, canvashtml, callback) {
        var self = this;
        this.saveMain(canvaData.toJson(), function (res) {
            console.log("保存文件成功");
            var modulelist = canvaData.getModulslist();
            var b = browserify({
                // basedir: path.join(
                //     __dirname,
                //     './src/elements/views/'
                // ),
                //standalone:'statdalonename'
            }).transform(babelify, {
                presets: ["es2015"]
            });
            for (var i in modulelist) {
                b.require("./src/elements/" + modulelist[i] + '/index.js', {
                    expose: modulelist[i].replace(".js", "")
                });
            }
            b.bundle(function (err, buff) {
                console.log(err);
                if (err) {
                    callback(false);
                } else {
                    var bundlejs = buff.toString();
                    try {
                        fs.writeFileSync(
                            self.path + "assets/js/bundle.js",
                            bundlejs
                        );
                    } catch (error) {
                        callback(false);
                        return;
                    }
                    var result = console.log("保存数据");
                    console.log(res);
                    if (res) {
                        console.log("保存数据成功");
                        var template = fs.readFileSync(
                            self.path + "template.html",
                            "utf-8"
                        );
                        console.log("获取模版");
                        console.log(template);
                        if (!template) {
                            callback(false);
                            return;
                        }

                        var data = {
                            config: {
                                title: self.config.title,
                                keyword: [self.config.actname],
                                desc: self.config.desc
                            },
                            canvas: {
                                renderData: JSON.stringify(canvaData.toJson()),
                                html: canvashtml
                            }
                        };
                        var html = juicer(template, data);
                        console.log(html);
                        console.log("写文件");
                        console.log(result);
                        try {
                            var result = fs.writeFileSync(
                                self.path + "index.html",
                                html
                            );
                            //var result = fs.writeFileSync(self.path + 'index.html', html);
                            console.log("写文件");
                            console.log(true);
                            callback(true);
                        } catch (error) {
                            callback(false);
                        }
                    } else {
                        callback(false);
                    }
                }
            });
        });
    }
    runCmd() {}
    commitSvn() {}
    uploadToDev() {}
    addWorkTime() {}
}

class Page {
    constructor(name, template) {
        this.name = name;
        this.template = template;

    }
    save() {

    }
}
export {
    Project,
    Files,
    Projects,
    Page
};