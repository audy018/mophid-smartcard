angular.module('app').component('login', {
  templateUrl: './templates/login.html',
  controller: ($scope, $state, MophService, ngProgressFactory) => {
    $scope.username = null;
    $scope.password = null;
    $scope.logging = false;

    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setHeight('3px');

    $scope.doLogin = function () {
      if ($scope.username && $scope.password) {
        $scope.progressbar.start();
        $scope.logging = true;
        var request = require("request");

        var options = {
          method: 'POST',
          url: 'https://smarthealth.service.moph.go.th/phps/public/api/v2/gettoken',
          headers:
          { 'content-type': 'application/x-www-form-urlencoded' },
          form: { username: $scope.username, password: $scope.password }
        };

        request(options, function (error, response, body) {
          $scope.logging = false;
          $scope.progressbar.complete();
          if (error) {
            console.log(error);
            alert('เกิดข้อผิดพลาด ไม่สามารถเข้าสู่ระบบได้');
          } else {
            console.log(JSON.parse(body));
            let data = JSON.parse(body);
            console.log(data.jwt_token);
            sessionStorage.setItem('token', data.jwt_token);
            $state.go('main');
          }
        });
      } else {
        alert('กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน');
      }
    }
  }
});