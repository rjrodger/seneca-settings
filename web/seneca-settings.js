(function(window, angular) {
"use strict";

var senecaSettingsModule = angular.module('senecaSettingsModule', [])

senecaSettingsModule.service('senecaSettingsAPI', ['$http',function($http){
  return {
    foo: function(){ return 'bar'; },
    /// "spec"
    spec: function(kind,done){
      $http({method:'GET',url:'/settings/spec?kind='+kind, cache:false})
        .success(function(out){
          done(out.spec)
        })
    },
    /// "load"
    load: function(kind,done){
      $http({method:'GET',url:'/settings/load?kind='+kind, cache:false})
        .success(function(out){
          done(out.settings)
        })
    },
    /// "save"
    save: function(kind,settings,done){
      $http({method:'POST',url:'/settings/save?kind='+kind, data:settings, cache:false})
        .success(function(out){
          done(out.settings)
        });
    }
  }
}])

senecaSettingsModule.directive('senecaSettings', ['senecaSettingsAPI', function (senecaSettingsAPI) {
  var def = {
    restrict:'A',
    scope:{
      kind:'@',
    },
    link: function( scope ){
      scope.$watch('kind', function(kind){
        senecaSettingsAPI.spec(kind, function(spec){
          scope.spec = spec

          senecaSettingsAPI.load(kind, function(settings){
            for (var setting_name in spec) {
                var default_value = spec[setting_name]['default'];
                if (default_value != undefined && settings[setting_name] == undefined) {
                    console.log("using default for " + setting_name + " " + spec[setting_name]['default'])
                    settings[setting_name] = default_value
                }
            }
            scope.settings = settings
          });
        })
      });
    },
    templateUrl: "/settings/_settings_template.html"
  }
  return def
}])

senecaSettingsModule.controller("Settings", ["$scope", "$timeout", 'senecaSettingsAPI', function($scope, $timeout, senecaSettingsAPI) {
    $scope.update_settings = function() {
        senecaSettingsAPI.save($scope.kind, $scope.settings, function (out) {
            $scope.status_message = "Settings updated successfully.";
            $scope.status_class = "alert-success";

            // Clear status message after a few seconds.
            $timeout(function() {
                $scope.status_message = "";
                $scope.status_class = "";
            }, 3000);
        });
    }

    $scope.status_message = "";
    $scope.status_class = "";

    $scope.range = function(n) {
        return new Array(n);
    };

    $scope.update_rating = function(setting_name, a, n) {
        var star_rating = n - a;
        $scope.settings[setting_name] = star_rating;
    }

    $scope.rating_class = function(setting_name, a, n) {
        if ($scope.settings) {
            var star_rating = n - a;
            var user_rating = $scope.settings[setting_name]
            if (star_rating <= user_rating) {
                return "star-active";
            }
        }
    }
}]);

}(window, angular));

