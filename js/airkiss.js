/**
 * Created by Zhang GuoYin on 2018/6/2.
 */
(function () {

    var PAGES = [
        {title: '配置设备上网', id: 'page_loading'},
        {title: '配置设备上网', id: 'page_warning'},
        {title: '配置设备上网', id: 'page_airkiss_guider'},
        {title: '搜索设备', id: 'page_scan_device'},
    ];

    var windowHistory = !hasNoLength(getRequestParameter('windowHistory'));
    var product = null;
    var wxDeviceLibReady = false;
    var wechatJsApiReady = false;
    var deviceScaned = [];

    function showPage(id) {

        var title = '';
        for(var i = 0; i < PAGES.length; i++) {

            var pageDom = $('#' + PAGES[i]['id']);
            if(id == PAGES[i]['id']) {
                title = PAGES[i]['title'];
                pageDom.css('display', 'block');
            }else {
                pageDom.css('display', 'none');
            }
        }

        document.title = title;
    };

    function showWarning(title, message) {

        showPage('page_warning');
        var page_warning = $('#page_warning');
        page_warning.find('.icon-box__title').text(title);
        page_warning.find('.icon-box__desc').text(message);
    }

    function renderAirKissGuider(guider) {

        var airKissGuiderDom = $('#airkiss_guider');
        airKissGuiderDom.find('li').not('.template').remove();

        var templateDom = airKissGuiderDom.find('.template');
        for(var i = 0; i < guider.length; i++) {

            var stepDom = templateDom.clone().removeClass('template').removeClass('hide');
            stepDom.find('label').text(i + 1);
            stepDom.find('span').text(guider[i]);

            if(i == guider.length - 1) {
                stepDom.find('space').hide();
            }

            airKissGuiderDom.append(stepDom);
        }
    };

    function setupAirKissGuider() {

        var airKissGuider = ["长按设备配网键3秒进入配网模式","打开手机Wi-Fi","输入Wi-Fi密码后连接"];

        httpGetEws2(EWS2_SERVICES.getProductProperties, function (response, data) {

            product = data;

            if($.isArray(data['airKissGuider']) && data['airKissGuider'].length) {
                airKissGuider = data['airKissGuider'];
            }

            showPage('page_airkiss_guider');
            renderAirKissGuider(airKissGuider);
        }, function () {

            showWarning('配网失败', '获取配网信息失败，可刷新重试')
        });
    };

    function setupUiListener() {

        $('.btn_exit').click(function () {

            if (!windowHistory && wechatJsApiReady) {
                wx.closeWindow();
            }else {
                window.history.back();
            }
        });

        $('#open_airkiss').click(function () {

            if(!$(this).hasClass('weui-btn_disabled')) {

                wx.invoke('configWXDeviceWiFi', null, function(res) {
                    console.log('configWXDeviceWiFi', res);

                    if(res['err_msg'] === 'configWXDeviceWiFi:ok') {
                        goScanDevicePage();
                        window.history.pushState('page_scan_device', '');
                    }
                });
            }
        });

        $('#scan_device').click(function () {

            if(!$(this).hasClass('weui-btn_disabled')) {
                goScanDevicePage();
                window.history.pushState('page_scan_device', '');
            }
        });
    }

    function openWxDeviceLibrary(callback) {

        wx.invoke('openWXDeviceLib', {'connType':'lan'}, function(res) {

            log('openWXDeviceLib:' + JSON.stringify(res));

            if (res['err_msg'] === 'openWXDeviceLib:ok') {

                wxDeviceLibReady = true;
                $('.wechat-jsapi').removeClass('weui-btn_disabled');

                if(typeof callback === 'function') {
                    callback();
                }
            }
        });
    }

    function CloseWXDeviceLibTask() {

        var _retryTimes = 0;
        var _closeWxDeviceLib = function () {

            wx.invoke('closeWXDeviceLib', {'connType':'lan'}, function(res) {
                log('closeWXDeviceLib' + JSON.stringify(res));
                if(res['err_msg'] === 'closeWXDeviceLib:fail' && _retryTimes < 3) {
                    _retryTimes++;
                    log('retry to closeWXDeviceLib');
                    _closeWxDeviceLib();
                }
            });
        };

        this.run = function () {
            _closeWxDeviceLib();
        };
    }

    function closeWXDeviceLib() {
        new CloseWXDeviceLibTask().run();
    }

    function goAirkissGuiderPage() {

        showPage('page_airkiss_guider');

        if(wxDeviceLibReady) {

            wx.invoke('stopScanWXDevice', {connType: 'lan'}, function(res) {
                console.log('stopScanWXDevice', res);
            });
        }
    }

    function goScanDevicePage() {

        showPage('page_scan_device');
        $('#device_list').empty();
        deviceScaned.length = 0;


        if(wxDeviceLibReady) {

            wx.invoke('startScanWXDevice', {connType: 'lan'}, function(res) {
                console.log('startScanWXDevice', res);
            });
        }
    }

    function onWxDeviceScaned(devices) {

        for(var i = 0; i < devices.length; i++) {

            var deviceId = devices[i]['deviceId'].toString().trim();
            var url = '/device/wechat/state?deviceId={0}&timestamp={1}'.format(deviceId, new Date().getTime());

            httpGetEws2(url, function (response, data) {

                log('valid deviceId-{0}'.format(deviceId));

                if(data['status'] > 0 && $.inArray(deviceId, deviceScaned) === -1) {

                    deviceScaned.push(deviceId);

                    var deviceDom = $('#device_template').clone().removeClass('hide').attr('deviceId', deviceId);
                    deviceDom.find('.weui-media-box__thumb').attr('src', product['logo']);
                    deviceDom.find('.weui-media-box__title').text(product['name']);
                    deviceDom.find('.weui-media-box__desc').text(deviceId);
                    deviceDom.click(function () {
                        bindWxDevice($(this).closest('.weui-media-box').attr('deviceId'));
                    });

                    $('#device_list').append(deviceDom);
                }
            });
        }
    }

    function bindWxDevice(deviceId) {

        var bindAction = function (ticket, deviceId) {

            httpPostEws2(EWS2_SERVICES.bindWechatDevice.format(OPEN_ID, ticket), {deviceId: deviceId}, function () {

                pushWxDeviceBindEvent(deviceId, function () {

                    setTimeout(function () {
                        wx.closeWindow();
                    }, 500);
                });

                showWxSuccessToast('绑定成功');
            }, function () {

                showWxWarningToast('绑定失败');
            });
        };

        var getWXDeviceTicket = function (deviceId) {

            wx.invoke('getWXDeviceTicket', {'deviceId': deviceId, 'type':'1', 'connType':'lan'}, function(res) {
                console.log('getWXDeviceTicket', res);
                if(res['err_msg'] === 'getWXDeviceTicket:ok') {
                    bindAction(res['ticket'], deviceId);
                }else {
                    showWxWarningToast('绑定失败');
                }
            });
        };

        getWXDeviceTicket(deviceId);
    }

    function pushWxDeviceBindEvent(deviceId, callback) {

        var body = '<xml>';
            body += '<ToUserName><![CDATA[{originalId}]]></ToUserName>';
            body += '<FromUserName><![CDATA[{openId}]]></FromUserName>';
            body += '<CreateTime>{time}</CreateTime>';
            body += '<MsgType><![CDATA[device_event]]></MsgType>';
            body += '<Event><![CDATA[bind]]></Event>';
            body += '<DeviceType><![CDATA[{originalId}]]></DeviceType>';
            body += '<DeviceID><![CDATA[{deviceId}]]></DeviceID>';
            body += '<Content><![CDATA[]]></Content>';
            body += '<SessionID>0</SessionID>';
            body += '<OpenID><![CDATA[{openId}]]></OpenID>';
            body += '</xml>';
        body = body.format({originalId: product['id'], openId: OPEN_ID, deviceId: deviceId, time: parseInt(new Date().getTime() / 1000)});

        var url = '/wechat?timestamp=' + new Date().getTime();

        var opt = {
            type: 'post',
            url: EWS2_URL + url,
            data: body,
            dataType: 'text',
            timeout: 5000,
            contentType: 'text/plain;charset=UTF-8',
            success: function(response){
                log(JSON.stringify(response));
                callback();
            },
            error: function(xhr, type){
                callback();
            }
        };

        $.ajax(opt);
    }

    $(document).on('ready', function () {

        window.addEventListener('popstate', function (e) {

            if(e.state === null) {
                goAirkissGuiderPage();
            }else if(e.state === 'page_scan_device') {
                goScanDevicePage();
            }
        }, true);

        requestWechatJsApis(['openWXDeviceLib', 'closeWXDeviceLib', 'startScanWXDevice', 'stopScanWXDevice', 'configWXDeviceWiFi', 'getWXDeviceTicket', 'onScanWXDeviceResult'], function () {

            wechatJsApiReady = true;

            openWxDeviceLibrary();

            // wx.on('onWXDeviceLanStateChange', function(res) {
            //     console.log('onWXDeviceLanStateChange', res);
            // });

            wx.on('onScanWXDeviceResult', function(res) {

                console.log('onScanWXDeviceResult', res);

                onWxDeviceScaned(res['devices']);
            });

            $('body').on('beforeunload', function () {
                closeWXDeviceLib();
            });
        });

        setupUiListener();
        setupAirKissGuider();
    });
})();