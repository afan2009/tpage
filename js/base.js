/**
 * Created by Zhang GuoYin on 2017/6/7.
 */
// var EWS2_URL ='http://testeachoneweixin.iotworkshop.com/eachone/wechat/v2/';
// var EWS2_URL ='http://127.0.0.1:8080/eachone/wechat/v2/';

var EWS2_SERVICES = {
    jsapiConfig: '/pa/jsapi/config?url={0}&timestamp=' + new Date().getTime(),
    getHivsDevices: '/device/get?openId={0}&timestamp=' + new Date().getTime(),
    getHivsDeviceByDeviceId: '/device/getbyid?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    activeHivsDevice: '/device/active?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    deactiveHivsDevice: '/device/deactive?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    bindHivsDevice: '/device/bind?openId={0}',
    unbindHivsDevice: '/device/unbind?openId={0}',
    getWechatDevice: '/device/wechat/get?openId={0}&timestamp=' + new Date().getTime(),
    bindWechatDevice: '/device/wechat/bind?openId={0}&ticket={1}',
    unbindWechatDevice: '/device/wechat/unbind?openId={0}&ticket={1}',
    deleteDevice: '/device/delete?openId={0}&deviceId={1}&ticket={2}',
    getMyBaiduInfo: '/baidu/getinfo?access_token={0}&client_id={1}',
    getDeviceMoments: '/device/moments?openId={0}&timestamp=' + new Date().getTime(),
    modifyDeviceMomentsName: '/device/moments/name?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    modifyDeviceMomentsFollowerNickName: '/device/moments/followers/nickname?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    inviteDeviceMomentsFollower: '/device/moments/invite?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    quitDeviceMoments: '/device/moments/quit?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    deleteDeviceMomentsFollowers: '/device/moments/followers?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    modifyDeviceNickName: '/device/nickname?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    airSyncSuccess: '/device/airsync/success?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    getProductProperties: '/config/product?timestamp=' + new Date().getTime(),
    getBaiduClients: '/baidu/clients?openId={0}&timestamp=' + new Date().getTime(),
    baiduIndex: '/baidu/?openid={0}&client_id={1}&timestamp=' + new Date().getTime(),
    feedback: '/config/feedback?openId={0}&timestamp=' + new Date().getTime(),
    tenantInfo: '/config/tenant/info?openId={0}&timestamp=' + new Date().getTime(),
    getDeviceCircles: '/device/circles?openId={0}&timestamp=' + new Date().getTime(),
    inviteDeviceCircles: '/device/circles/invite?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    quitDeviceCircles: '/device/circles/quit?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    getDeviceCirclesInvitation: '/device/circles/invite/ticket?openId={0}&ticket={1}&timestamp=' + new Date().getTime(),
    joinDeviceCircles: '/device/circles/join?openId={0}&deviceId={1}&timestamp=' + new Date().getTime(),
    getDeviceState: '/device/state?openId={0}&timestamp=' + new Date().getTime(),
    setDeviceAction: '/device/action?openId={0}&timestamp=' + new Date().getTime(),
};

function clone(obj){
    function Clone(){}
    Clone.prototype = obj;
    var o = new Clone();
    for(var a in o){
        if(typeof o[a] == "object") {
            o[a] = clone(o[a]);
        }
    }
    return o;
}

function isEmpty(text) {
    return text === undefined || text == null;
}

function hasNoLength(text) {
    return isEmpty(text) || text.toString().trim().length === 0;
}

//是否含有中文（也包含日文和韩文）
function isChineseChar(str){
    var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/;
    return reg.test(str);
}

function error(msg) {
    console.error(msg);
}

function log(msg) {
    console.log(msg);
}

Date.prototype.format = function(fmt) {
    var o = {
        "M+" : this.getMonth() + 1, // 月份
        "d+" : this.getDate(), // 日
        "h+" : this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, // 小时
        "H+" : this.getHours(), // 小时
        "m+" : this.getMinutes(), // 分
        "s+" : this.getSeconds(), // 秒
        "q+" : Math.floor((this.getMonth() + 3) / 3), // 季度
        "S" : this.getMilliseconds()
        // 毫秒
    };
    var week = {
        "0" : "/u65e5",
        "1" : "/u4e00",
        "2" : "/u4e8c",
        "3" : "/u4e09",
        "4" : "/u56db",
        "5" : "/u4e94",
        "6" : "/u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
            .substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt
            .replace(
                RegExp.$1,
                ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f"
                    : "/u5468")
                    : "")
                + week[this.getDay() + ""]);
    }
    for ( var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
                : (("00" + o[k]).substr(("" + o[k]).length)));
        }
        ;
    }
    return fmt;
};

/**
 * var template1="I'm {0}，I'm {1} years old";
 * var template2="I'm {name}，I'm {age} years old";
 * var result1=template1.format("loogn",22);
 * var result2=template2.format({name:"loogn",age:22});
 * @param args
 * @returns {String}
 */
String.prototype.format = function(args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                if(args[key]!=undefined){
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] != undefined) {
                    var reg= new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

function clearArray(array) {
    if (array instanceof Array) {
        array.splice(0, array.length);
    }
}

function getFileNameWithoutExtension() {
    var path = location.href;
    var index_1 = path.lastIndexOf('/');
    var index_2 = path.indexOf('.html', index_1);
    if(index_2 == -1) {
        path = '';
    }else {
        path = path.substring(index_1 + 1, index_2);
    }
    return path;
}

function getCookie(key) {

    var items = document.cookie.split(";");
    for(var i in items) {
        var kv = items[i].split("=");
        if(kv.length > 1 && kv[0].trim() === key.trim()) {
            return decodeURIComponent(kv[1]);
        }
    }
    return null;
}

function setCookie(key, value) {

    value = encodeURIComponent(value);
    document.cookie = key + '=' + value;
}

function getRequestParameter(name) {

    var params = {},
        e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.search.substring(1);

    while (e = r.exec(q))
        params[d(e[1])] = d(e[2]);

    return params[name];
}

function intArray2HexString(intArray) {

    if (intArray instanceof Array) {

        var text = '';
        for (var i = 0; i < intArray.length; i++) {
            text += int2Hex(intArray[i]);
        }
        return text;
    }else {
        return '';
    }
}

function int2Hex(intValue) {

    intValue = parseInt(intValue);
    if (isNaN(intValue)) {
        return '';
    }else {
        var text = intValue.toString(16);
        if(text.length % 2 !== 0) {
            text = '0' + text;
        }
        return text;
    }
}

String.prototype.bool = function() {
    return (/^true$/i).test(this);
};

function _httpEws2(path, method, data, succeedCallback, failedCallback, options) {

    var opt = {
        type: method,
        url: EWS2_URL + path,
        data: data === undefined ? undefined : JSON.stringify(data),
        dataType: 'json',
        timeout: 5000,
        contentType: 'application/json;charset=UTF-8',
        success: function(response){
            if (typeof succeedCallback === 'function') {

                if (response) {
                    if(!response.hasOwnProperty('result') || response['result'] === 0) {
                        succeedCallback(response, response['data']);
                    }else if (typeof failedCallback === 'function') {
                        failedCallback(response);
                    }
                }
            }
        },
        error: function(xhr, type){
            if (typeof failedCallback === 'function') {
                failedCallback();
            }
        }
    };
    if(typeof options === 'object') {

        for(var i in options) {
            opt[i] = options[i];
        }
    }

    $.ajax(opt);
}

function httpGetEws2(path, succeedCallback, failedCallback, options) {
    _httpEws2(path, 'GET', undefined, succeedCallback, failedCallback, options);
}

function httpPostEws2(path, data, succeedCallback, failedCallback, options) {
    _httpEws2(path, 'POST', data, succeedCallback, failedCallback, options);
}

function httpDeleteEws2(path, data, succeedCallback, failedCallback, options) {
    _httpEws2(path, 'DELETE', data, succeedCallback, failedCallback, options);
}

function requestWechatJsApis(jsApiList, succeedCallback, failedCallback) {

    httpGetEws2(EWS2_SERVICES.jsapiConfig.format(Base64.encode(location.href)), function (data) {

        wx.config({
            debug: false,
            appId: data['appId'],
            timestamp: data['timestamp'],
            nonceStr: data['nonce'],
            signature: data['signature'],
            jsApiList: jsApiList,
            beta: true
        });
        wx.ready(function () {
            if (typeof succeedCallback === 'function') {
                succeedCallback();
            }
        });
    });
    wx.error(function () {
        if (typeof failedCallback === 'function') {
            failedCallback();
        }
    });
}

function setupWeUiListeners() {

    $('.weui-dialog_btn_cancel').on('click', function () {
        $(this).closest('.weui-dialog-panel').fadeOut(DEFAULT_FADE_TIME);
        $(this).closest('.weui-dialog-panel').find('.weui-dialog input').each(function () {
            $(this).val($(this).attr('eo-value'));
        });
    });
}

function showWxToast(message, iconCss) {

    var toast = $("#weui_toast");
    if(!toast.size()) {
        var html =
            '<div id="weui_toast">' +
                '<div class="weui-mask_transparent"></div>' +
                '<div class="weui-toast">' +
                    '<i class="weui-icon_toast"></i>' +
                    '<p class="weui-toast__content"></p>' +
                '</div>' +
            '</div>';
        $('body').append(html);
        toast = $("#weui_toast");
        toast.hide();
    }
    toast.find('.weui-toast__content').text(message);
    if (!isEmpty(iconCss)) {
        toast.find('.weui-icon_toast').attr('class', 'weui-icon_toast').addClass(iconCss);
    }
    if (toast.css('display') != 'none') return;
    toast.fadeIn(100);
    setTimeout(function () {
        toast.fadeOut(100);
    }, 2000);
}

function showWxSuccessToast(message){
    showWxToast(message, 'weui-icon-success-no-circle');
}

function showWxWarningToast(message){
    showWxToast(message, 'weui-icon-warn-no-circle');
}

function popupDialog(title, message, action) {

    var id = 'dialog-' + new Date().getTime();
    var html = '<div id="{0}" class="weui-dialog-panel">' +
                    '<div class="weui-mask"></div>' +
                    '<div class="weui-dialog">' +
                        '<div class="weui-dialog__hd"><strong class="weui-dialog__title">{1}</strong></div>' +
                        '<div class="weui-dialog__bd">{2}</div>' +
                        '<div class="weui-dialog__ft">' +
                            '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default weui-dialog_btn_cancel">取消</a>' +
                            '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>' +
                        '</div>' +
                    '</div>' +
                '</div>';
    $('body').append(html.format(id, title, message));

    $('#' + id + ' .weui-dialog_btn_cancel').on('click', function () {
        $(this).closest('.weui-dialog-panel').remove();
    });

    $('#' + id + ' .weui-dialog__btn_primary').on('click', function () {
        if (typeof action === 'function') {
            action($('#' + id));
        }
    });
}

window.OPEN_ID = getRequestParameter('openid');
if(typeof OPEN_ID === 'undefined') {
    OPEN_ID = getRequestParameter('openId');
}
window.DEFAULT_FADE_TIME = 200;

function getHashValue(url) {
    if (hasNoLength(url)) {
        return '';
    }else {
        var index = url.lastIndexOf('#');
        if (index == -1) {
            return '';
        }else {
            return url.substring(index + 1);
        }
    }
}