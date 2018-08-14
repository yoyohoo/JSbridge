//这里是天下通webview公共js调native的js
; (function (window, undefined) {
    window.App = {};
    /**
     * 常量定义
     */
    var ua = navigator.userAgent.toUpperCase(), callindex = 0;
    // 当前环境是否为Android平台
    App.IS_ANDROID = ua.indexOf('ANDROID') != -1;
    // 当前环境是否为IOS平台
    App.IS_IOS = ua.indexOf('IPHONE OS') != -1;

    /**
     * 调用一个Native方法
     * @param {String} name 方法名称
     */
    App.call = function (name) {
        // 获取传递给Native方法的参数
        var args = Array.prototype.slice.call(arguments, 1);
        var callback = '', item = null;

        // 遍历参数
        for (var i = 0, len = args.length; i < len; i++) {
            item = args[i];
            if (item === "undefined") {
                item = '';
            }

            // 如果参数是一个Function类型, 则将Function存储到window对象, 并将函数名传递给Native
            if (typeof (item) == 'function') {
                callback = name + 'Callback' + i;
                window[callback] = item;
                item = callback;
            }
            args[i] = item;
        }
        if (App.IS_ANDROID) {// Android平台
            //            if(name=="setTitle"){
            //                return;
            //            }
            try {
                for (var i = 0, len = args.length; i < len; i++) {
                    // args[i] = '"' + args[i] + '"';
                    args[i] = '\'' + args[i] + '\'';
                }
                eval('window.android.' + name + '(' + args.join(',') + ')');
            } catch (e) {
                console.log(e)
            }
        } else if (App.IS_IOS) {// IOS平台
            if (args.length) {
                args = '|' + args.join('|');
            }
            // IOS通过location.href调用Native方法, _call变量存储一个随机数确保每次调用时URL不一致
            callindex++;
            location.href = '#ios:' + name + args + '|' + callindex;

            /*var iframe = document.createElement("iframe");
            iframe.src = '#ios:' + name + args + '|' + callindex;
            iframe.style.display = "none";
            document.body.appendChild(iframe);
            iframe.parentNode.removeChild(iframe);
            iframe= null;*/
        } else {
            var fn = arguments[1];
            typeof fn === 'function' && fn.call(this, false);
        }
    }

}(window));

/**
 * Wap
 */
(function () {
    this.WXbridge = {},
        ua = navigator.userAgent.toUpperCase();

    this.WXbridge.IS_WX = ua.indexOf('MICROMESSENGER') != -1;
})();

/**
 * wx
 */
(function () {
    this.Wap = {},
        ua = navigator.userAgent.toUpperCase();
    /**
     * 是否android
     */
    Wap.IS_ANDROID = ua.indexOf('ANDROID') != -1;
    /**
     * 是否iphone
     */
    Wap.IS_IPHONE = ua.indexOf('IPHONE OS') != -1;
    /**
     * 是否ipad
     */
    Wap.IS_IPAD = ua.indexOf('IPAD') != -1;

    Wap.call = function () {
        let args = arguments,
            name = args[0],
            params = Array.prototype.slice.call(args, 1),
            fn = this.name || this[name];
        if (typeof fn === 'function') {
            fn.call(this, params);
        } else {
            console.error('不支持该方法：' + name)
        }
    }

    /**
     * 修改标题
     */
    Wap.setTitle = function (name) {
        document.title = name;
        console.log('[success]：', 'WAP调用函数：setTitle')
        log && log('WAP调用函数：setTitle')
    }


})();

/**
 * JSbridge
 */
(function () {

    /**
     * 变量定义
     */
    const version = '1.0.0';
    let platform;

    /**
     * 定义对象
     */
    JSbridge = this.JSbridge = new Object();

    /**
     * 插件扩展函数
     */
    JSbridge.extend = function () {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
        }
        if (typeof target !== "object" && !isFunction(target)) {
            target = {};
        }
        if (i === length) {
            target = this;
            i--;
        }
        for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];
                    if (target === copy) {
                        continue;
                    }
                    if (deep && copy && (jQuery.isPlainObject(copy) ||
                        (copyIsArray = Array.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && Array.isArray(src) ? src : [];
                        } else {
                            clone = src && jQuery.isPlainObject(src) ? src : {};
                        }
                        target[name] = jQuery.extend(deep, clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }
        return target;
    };


    if (WXbridge.IS_WX) {
        platform = 'wx';
        Object.assign(JSbridge, WeixinJSBridge);
    } else {
        platform = 'wap';
        Object.assign(JSbridge, Wap);
        try {
            App.call('isPamo', function (res) {
                res
                    && (platform = 'klpa')
                    && Object.assign(JSbridge, App);
            })
        } catch (ex) { }
    }

    /**
     * 封装call：支持降级匹配
     */
    JSbridge.call = function () {
        let args = arguments,
            name = args[0],
            params = Array.prototype.slice.call(args, 1),
            fn = JSbridge[name];
        if (typeof fn === 'function') {
            fn.call(this, params);
        } else if (platform !== 'wap') {
            console.info('[info]:', `平台${platform}不存在此函数：${name}，尝试降级寻找匹配函数：${name}，请稍后...`);
            log(`平台${platform}不存在此函数：${name}，尝试降级寻找匹配函数：${name}，请稍后...`)
            Wap.call(name, params);
        } else {
            console.error('不支持该方法：' + name)
            log('不支持该方法：' + name)
        }
    };

    JSbridge.extend({
        version: version,
        getPlatform: function () {
            return platform;
        }
    });

    return JSbridge;

})();