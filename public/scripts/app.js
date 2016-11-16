'use strict';

var app = angular.module('myApp', []);

/* Controllers */

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
app.controller('AppCtrl', function ($scope, socket) {

  $scope.users = [];
  $scope.roomsx=0;
  $scope.curtrentUser = '';
  socket.on('connect', function () { });
  var roomId =0;

  socket.on('updatechat', function (username, data) {
    var user = {};
    user.username = username;
    user.message = data;
    if (user.username == 'SERVERon'){
  $scope.roomsx = user.message;
console.log( "dsds", $scope.roomsx);
    }
    user.date = new Date().getTime();
    user.image = 'http://dummyimage.com/250x250/000/fff&text=' + username.charAt(0).toUpperCase();
    $scope.users.push(user);
  });

  socket.on('roomcreated', function (data) {
    socket.emit('adduser', data);
  });

  $scope.createRoom = function (data) {
    $scope.curtrentUser = data.username;
    socket.emit('createroom', data);
  }

  $scope.joinRoom = function (data) {
    $scope.curtrentUser = data.username;
      $scope.roomsx = data.room;
      console.log( "sdsd", $scope.roomsx);
    socket.emit('adduser', data);
  }

  $scope.doPost = function (message1) {
    console.log($scope.roomsx);
 var message={};
     message.room=$scope.roomsx
     message.data=message1
     socket.emit('sendchat', message);
  }
});


/* Services */
app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});
