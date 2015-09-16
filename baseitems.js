(function(d,w,hdl) {

  if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
  }

  var baseType = function () { }
  baseType.prototype.settings = {};
  baseType.prototype.init = function () { }

  var base = hdl.createType('baseitem',baseType,{
    color:'wet-asphalt', // Default color of this widget
    classList: ['itm'], // Default classes
    icon:'lightbulb-o', // Default icon
    init:function(opt) {
      if (opt) {
        var t = this;
        if (t.preInit)
          t.preInit(opt);
        t.settings = opt;
        t.parentNode = opt.element;
        t.initWidget();
      }
    },
    createBase:function() {
      var t = this,
          s = t.settings;

      t.elm = hdl.newElm('div',{ classList:[s.dataset.color||t.color].concat(t.classList||[])}, t.parentNode);
      t.createIcon();
      t.createLabel();

    },
    createIcon:function() {
      var t = this,
          s = t.settings;
      t.iconElm = hdl.newElm('div',{classList:['fa','fa-'+(s.dataset.icon||t.icon),'symbol']},t.elm);
    },
    createLabel:function() {
      var t = this,
          s = t.settings;
      t.lblElm = hdl.newElm('div',{innerHTML:s.dataset.label||s.openhabItem.name},t.elm);
    },
    handleStateChange:function(newstate,oldstate) {
      console.trace('state change unhandled, new state',newstate,'oldstate',oldstate);
    },
    stateChange:function(d) {
      var t = this,
          s = t.settings;

      t.handleStateChange(d,s.openhabItem.state);
      s.openhabItem.state = d;

    },
    setState:function(state,url) {
      hdl.setItemState(url||(this.settings.openhabItem.link),state);
    },
    hookChange:function(url) {
      var t = this,
          s = t.settings;
      hdl.hookItemChange(url,function(d) {
        t.stateChange(d);
      });
    },
    initWidget:function() {
      var t = this,
          s = t.settings;
      t.createBase();
      if (t.createInner)
        t.createInner();
      if (s.openhabItem) {
        if (s.openhabItem.state)
          t.handleStateChange(s.openhabItem.state);
        if (!t.noStateCallback)
          t.hookChange(s.openhabItem.link.replace('http:',''));
      }
    }
  });

  hdl.createType('GroupItem',hdl.types.baseitem,{
    color:'amethyst',
    updateGroup:function() {
      var t = this;
      hdl.requestData(t.settings.openhabItem.link+'?type=jsonp',function(d) {
        t.groupUpdated(d);
      });
    },
    groupUpdated:function(d) {
      var t = this,
          all = d.members.length,
          on = 0;

      d.members.forEach(function(v,i) {
        if (v.state=='ON')
          on++;
      });

      var lbl = on+'/'+all;

      if (!t.summaryElm)
        t.summaryElm = hdl.newElm('span',{innerHTML:lbl,classList:['grp-lbl']},t.lblElm);
      else
        t.summaryElm.innerHTML = lbl;
    },
    createInner:function() {
      var t = this,
          s = t.settings;

          t.updateGroup();
    }
  });

  hdl.createType('SwitchItem',hdl.types.baseitem,{
    handleStateChange:function(newstate,laststate) {
      console.log('settings new state on swtich',newstate);
      var t = this;
      if (laststate)
        t.elm.classList.remove(laststate);
      t.elm.classList.add(newstate);
    },
    createInner:function() {
      var t = this,
          s = t.settings;
      t.elm.addEventListener('click',function() {
        var oldState = s.openhabItem.state=='ON';
        t.setState(oldState?'OFF':'ON');
      });
    }
  });

  hdl.createType('NumberItem',hdl.types.baseitem,{
    color:'midnight-blue',
    icon:'umbrella',
    numberFormat:'{0} C',
    handleStateChange:function(newstate,laststate) {
      var t = this;
      t.valueElm.innerHTML = t.numberFormat.format(Math.round(newstate));
    },
    createInner:function() {
      var t = this,
          s = t.settings;
      t.valueElm = hdl.newElm('span',{classList:['itemvalue'],innerHTML:'...'},t.elm);

    }
  });

})(document,window,window.dataHandler);
