window.jQuery = $ = require('jquery');
require('tether');
require('angular')
require('angular-animate');
require('angular-aria');
// require('angular-material');
// require('angular-material-icons');
require('angular-ui-router');
require('./node_modules/ngprogress/build/ngProgress.js');
angular.module('app', [
 'ui.router', 'ngProgress'
])
  .config(($stateProvider, $urlRouterProvider) => {
    $urlRouterProvider.otherwise('/login');
    $stateProvider
      .state('main', {
        name: 'main',
        url: '/',
        component: 'main'
      })
      .state('login', {
        name: 'login',
        url: '/login',
        component: 'login'
      });
  });