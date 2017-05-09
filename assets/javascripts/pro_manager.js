window.ysy = window.ysy || {};
ysy.proManager = ysy.proManager || {};
ysy.pro = ysy.pro || {};
$.extend(ysy.proManager, {
  proFunctionsMap: {},
  patch: function () {
    window.ysy = window.ysy || {};
    ysy.settings = ysy.settings || {};
    for (var key in ysy.pro) {
      if (!ysy.pro.hasOwnProperty(key)) continue;
      if (ysy.pro[key].patch) {
        ysy.pro[key].patch();
      }
    }
  },
  forEachPro: function (wrapperFunc, event) {
    var proFunctions = this.proFunctionsMap[event];
    if(!proFunctions) return;
    for (var i = 0; i < proFunctions.length; i++) {
      wrapperFunc.call(this,proFunctions[i]);
    }
  },
  fireEvent:function(event){
    var proFunctions = this.proFunctionsMap[event];
    if(!proFunctions) return;
    var slicedArgs = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < proFunctions.length; i++) {
      proFunctions[i].apply(this,slicedArgs);
    }
  },
  register:function(event,func){
    if(!this.proFunctionsMap[event]) this.proFunctionsMap[event] = [];
    this.proFunctionsMap[event].push(func);
  },
  showHelp: function () {
    var div = $(this).next();
    var x = div.clone().attr({"id": div[0].id + "_popup"}).appendTo($("body"));
    showModal(x[0].id);
  },
  closeAll: function (except) {
    this.forEachPro(function (func) {
      if (except.close !== func) func(except);
    }, "close");
  },
  eventFilterTask:function(id,task){
    var ret=true;
    this.forEachPro(function(func){
      if(ret) ret=func(id,task);
    },"filterTask");
    return ret;
  }
});
