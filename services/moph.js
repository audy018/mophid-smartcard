angular.module('app').service('MophService', function ($http) {
  var service = {
    getPerson: function (cid, token) {
      return $http.get('https://smarthealth.service.moph.go.th/phps/api/v1/person/findby/cid/' + cid,
        {
          cache: true,
          headers: {
            'jwt-token': token
          }
        }
      ).then(function (resp) {
        return resp.data;
      });
    },

    getAddress: function (cid, token) {
      return $http.get('https://smarthealth.service.moph.go.th/phps/api/address/v1/find_by_cid/?cid=' + cid, {
        cache: true,
        headers: {
          'jwt-token': token
        }
      }).then(function (resp) {
        return resp.data;
      });
    },

    doLogin: function (username, password) {
      let data = {
        username: username,
        password: password
      }
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
      }
      let url = 'https://smarthealth.service.moph.go.th/phps/public/api/v2/gettoken';
      return $http.post(url, data, config)
        .then(function (resp) {
          return resp.data;
        });
    }
  }

  return service;
})