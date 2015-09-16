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
        t.settings = opt;
        t.parentNode = opt.element;
        t.initWidget();
      }
    },
    createBase:function() {
      var t = this;
      var s = t.settings;
      t.elm = hdl.newElm('div',{ classList:[s.dataset.color||t.color].concat(t.classList||[])}, t.parentNode);
      t.createIcon();
      t.createLabel();

      if (s.openhabItem.state)
        t.handleStateChange(s.openhabItem.state);
      if (!t.noStateCallback)
        t.hookChange();
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
    hookChange:function() {
      var t = this,
          s = t.settings;
      hdl.hookItemChange(s.openhabItem.name,function(d) {
        t.stateChange(d);
      });
    },
    initWidget:function() {

      var t = this;
      t.createBase();
      if (t.createInner)
        t.createInner();
      /*
      var	tp = s.itemData.type,
        data = elm.dataset,
        ie = EL('div',{classList:['itm',itemData.type.toLowerCase().replace('item',''),data.color||'inherit-color']},elm),
        icn = EL('div',{classList:['fa','fa-'+(data.icon||'lightbulb-o'),'symbol']},ie),
        lbl = EL('div',{innerHTML:data.label||itemData.name},ie),
        cl = ie.classList;

      var itemVal;
      data.state = itemData.state;
      //icn.classList.add('fa','fa-'+(data.icon||'lightbulb-o'),'symbol')
      ie.addEventListener('click',function() {
        setState(itemData.link,data.state=='ON'?'OFF':'ON')
      });
      switch(tp) {
        case 'SwitchItem':
          cl.add(itemData.state);
          break;
        case 'NumberItem':
          var nxt ='';
          var format = data.format||'{0}';
          var format2 = data.formatsecond||'{0}';
          if (data.itemsecond)
          {
            nxt = format2.replace('{0}',Math.round(allItems[data.itemsecond].state));
          }
          EL('span',{classList:['itemvalue'],innerHTML:format.replace('{0}',Math.round(itemData.state))+' '+nxt},ie);

          break;
        case 'GroupItem':
          urlCallback(itemData.link+'?type=jsonp',function(d) {
            console.log('groupdata',d);
            var all = d.members.length;
            var on = 0;
            d.members.forEach(function(v,i) {
              if (v.state=='ON')
                on++;
            });
            EL('span',{innerHTML:on+'/'+all,classList:['grp-lbl']},lbl);
          });
          break;
      }

      hookItemChange(itemData.name,function(d) {
        cl.remove(itemData.state);
        cl.add(d);
        itemData.state = d;
        data.state = d;
      });*/
    }
  });

  hdl.createType('GroupItem',hdl.types.baseitem,{
    color:'amethyst',
    createInner:function() {
      var t = this,
          s = t.settings;

          hdl.requestData(s.openhabItem.link+'?type=jsonp',function(d) {
            console.log('groupdata',d);
            var all = d.members.length;
            var on = 0;
            d.members.forEach(function(v,i) {
              if (v.state=='ON')
                on++;
            });
            hdl.newElm('span',{innerHTML:on+'/'+all,classList:['grp-lbl']},t.lblElm);
          });
    }
  });

  hdl.createType('SwitchItem',hdl.types.baseitem,{
    handleStateChange:function(newstate,laststate) {
      var t = this;
      if (laststate)
        t.elm.classList.remove(laststate);
      t.elm.classList.add(newstate);
    },
    createInner:function() {

    }
  });

  hdl.createType('NumberItem',hdl.types.baseitem,{
    color:'midnight-blue',
    icon:'umbrella',
    handleStateChange:function(newstate,laststate) {
      var t = this;
      t.lblElm.innerHTML = '{0} C'.format(Math.round(newstate));
    },
    createInner:function() {
      var t = this,
          s = t.settings;
      t.valueElm = hdl.newElm('span',{classList:['itemvalue'],innerHTML:s.openhabItem.state});
    }
  });

})(document,window,window.dataHandler);
