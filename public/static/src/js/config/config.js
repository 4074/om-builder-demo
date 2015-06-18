define(function (requirejs) {
    
    // error
    requirejs.onError = function (err) {

        if (err.requireType === 'timeout') {
            console.log('Error:' + 'modules: ' + err.requireModules);
        } else {
            console.log('Error:' + err.requireType);
        }
        throw err;
    };
    
    var config = {
        baseUrl: '/public/static/build/',
        paths: {
            jquery: 'lib/jquery',
            underscore: 'lib/underscore',
            main: 'app/main'
        },
        waitSeconds: 15,
        shim: {
            main: ['jquery', 'underscore'],
        }
    };
    
    require.config(config)
    
    return config
})