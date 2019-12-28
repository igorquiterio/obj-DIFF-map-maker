(function() {
    'use strict';
    angular
        .module('APPname')
        .service('diffmaker', diffmaker);
    function diffmaker() {
        return {
            VALUE_CREATED: 'created',
            VALUE_UPDATED: 'updated',
            VALUE_DELETED: 'deleted',
            VALUE_UNCHANGED: 'unchanged',
            diffMap: function(obj1, obj2) {
                obj1 = JSON.parse(angular.toJson(obj1));
                obj2 = JSON.parse(angular.toJson(obj2));
                var diffmap = this.map(obj1, obj2);
                console.log(diffmap);
                diffmap = this.removeNull(diffmap);
                return this.pruneEmpty(diffmap);
            },
            pruneEmpty: function(obj) {
                return function prune(current) {
                  _.forOwn(current, function (value, key) {
                    if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
                      (_.isString(value) && _.isEmpty(value)) ||
                      (_.isObject(value) && _.isEmpty(prune(value)))) {
                      delete current[key];
                    }
                  });
                  // remove any leftover undefined values from the delete 
                  // operation on an array
                  if (_.isArray(current)) _.pull(current, undefined);
                  return current;
                }(_.cloneDeep(obj));  // Do not modify the original object, create a clone instead
            },
            removeNull: function(obj, key){
                if(this.isValue(obj) || (!!obj.hasOwnProperty('type') && !!obj.hasOwnProperty('data') )){
                    return obj;
                }
                var diff = angular.copy(obj);
                for (var key in obj) {
                    if((this.isValue(obj[key]) && obj[key] === null)){
                        delete diff[key];
                        continue;
                    }
                    diff[key] = this.removeNull(obj[key], key);
                }
                return diff;
            },
            map: function(obj1, obj2) {
                if (this.isFunction(obj1) || this.isFunction(obj2)) {
                    throw 'Invalid argument. Function given, object expected.';
                }
                if (this.isValue(obj1) || this.isValue(obj2)) {
                    if(this.compareValues(obj1, obj2) == 'unchanged'){
                        return null;
                    }else{
                        return {
                            type: this.compareValues(obj1, obj2),
                            data: (obj1 === undefined) ? obj2 : obj1
                        };
                    }
                }
                var diff = {};
                for (var key in obj1) {
                    if (this.isFunction(obj1[key])) {
                        continue;
                    }
                    var value2 = undefined;
                    if ('undefined' != typeof(obj2[key])) {
                        value2 = obj2[key];
                    }
                    diff[key] = this.map(obj1[key], value2);
                }
                for (var key in obj2) {
                    if (this.isFunction(obj2[key]) || ('undefined' != typeof(diff[key]))) {
                        continue;
                    }
                    diff[key] = this.map(undefined, obj2[key]);
                }
                return diff;
            },
            compareValues: function(value1, value2) {
                if (value1 === value2) {
                    return this.VALUE_UNCHANGED;
                }
                if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
                    return this.VALUE_UNCHANGED;
                }
                if ('undefined' == typeof(value1)) {
                    return this.VALUE_CREATED;
                }
                if ('undefined' == typeof(value2)) {
                    return this.VALUE_DELETED;
                }
                return this.VALUE_UPDATED;
            },
            isFunction: function(obj) {
                return {}.toString.apply(obj) === '[object Function]';
            },
            isArray: function(obj) {
                return {}.toString.apply(obj) === '[object Array]';
            },
            isDate: function(obj) {
                return {}.toString.apply(obj) === '[object Date]';
            },
            isObject: function(obj) {
                return {}.toString.apply(obj) === '[object Object]';
            },
            isValue: function(obj) {
                return !this.isObject(obj) && !this.isArray(obj);
            }
        }
    }
})();