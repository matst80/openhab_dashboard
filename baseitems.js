(function(doc,w,hdl) {

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
    addLink:function(link) {
      var t = this,
          s = t.settings;

      link = link || s.dataset.pagelink;
      if (!t.hasLink && link) {
        t.hasLink = true;
        t.elm.addEventListener('click',function() {
          hdl.changePage(link);
        });
      }
    },
    createBase:function() {
      var t = this,
          s = t.settings;

      t.elm = hdl.newElm('div',{ classList:[s.dataset.color||t.color].concat(t.classList||[])}, t.parentNode);
      t.createIcon();
      t.createLabel();
      t.addLink();
    },
    createIcon:function() {
      var t = this,
          s = t.settings;
      t.iconElm = hdl.newElm('div',{classList:['fa','fa-'+(s.dataset.icon||t.icon),'symbol']},t.elm);
    },
    createLabel:function() {
      var t = this,
          s = t.settings;
      //t.typeElm = hdl.newElm('div',{classList:['item-info'],innerHTML:'Klicka här?'},t.elm);
      t.lblElm = hdl.newElm('div',{classList:['item-label'],innerHTML:s.dataset.label||s.openhabItem.name},t.elm);
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
        if (!t.noStateCallback && s.openhabItem.link)
          t.hookChange(s.openhabItem.link.replace('http:','').replace('https:',''));
      }
    }
  });

  hdl.createType('GroupItem',hdl.types.baseitem,{
    color:'amethyst',
    updateGroup:function() {
      var t = this,
          s = t.settings;
      if (s.openhabItem.link) {
        hdl.requestData(s.openhabItem.link+'?type=jsonp',function(d) {
          t.groupUpdated(d);
        });
      }
    },
    groupUpdated:function(d) {
      var t = this,
          all = d.members.length,
          on = 0;

      t.members = d.members;
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

  hdl.createType('GroupLinkItem',hdl.types.GroupItem,{
    groupUpdated:function(d) {
      var t = this,
          s = t.settings,
          pid = 'pg-'+s.openhabItem.name.toLowerCase();
      t.parent.groupUpdated.apply(this,[d]);
      console.log('skapar sida',pid,doc.body);
      if (pid) {
        t.page = hdl.newElm('div',{id:pid,classList:['hidden-page','page','groupitems']},doc.body);
        s.dataset.pagelink = pid;
      }
      function getWidget(d) {
        var r = hdl.newElm('widget',{classList:['w1','h1','p']},t.page);
        r.dataset.item = d.name;
        hdl.initWidget(r);
      }
      d.members.forEach(function(v,i) {
        getWidget(v);
      });
      t.addLink(pid);
    },
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
    numberFormat:'{0}',
    handleStateChange:function(newstate,laststate) {
      var t = this;
      var fmt = t.settings.dataset.format||t.numberFormat;
      t.valueElm.innerHTML = fmt.format(Math.round(newstate));
    },
    createInner:function() {
      var t = this,
          s = t.settings;
      t.valueElm = hdl.newElm('span',{classList:['itemvalue'],innerHTML:'...'},t.elm);
      /*if (t.afterCreated)
        t.afterCreated();*/
    }
  });

  hdl.createType('Temperature',hdl.types.NumberItem,{
    color:'sun-flower',
    numberFormat:'{0} C'
  });

  hdl.createType('TemperatureForecast',hdl.types.Temperature,{
    color:'pomegranate',
    numberFormat:'Now {0} C',
    gotForecase:function(d) {
      var t = this;
      var str = '';
      var fc = d.forecast.txt_forecast.forecastday[0];
      str = fc.fcttext_metric;
      t.infoElm.innerHTML = str;
      t.dayElm.innerHTML = fc.title;
    },
    fetchForecast:function() {
      var t = this;

      hdl.requestData('http://api.wunderground.com/api/02058a98650d9760/forecast/q/zmw:00000.6.02435.json',function(d) {
        t.gotForecase(d);
      },'callback');
    },
    createInner:function() {
      var t = this;
      t.dayElm = hdl.newElm('div',{classList:['bginfo']},t.elm);
      t.parent.createInner.apply(this);
      t.fetchForecast();
      t.infoElm = hdl.newElm('div',{classList:['weatherinfo','itemvalue']},t.elm);
    }
  });


})(document,window,window.dataHandler);
