(function(d,w) {


	function createClass(name, parent, func) {
			var initdata = {};
			if (!parent) {
					console.log(name, 'NO PARENT PROTOTYPE');
					return null;
			}

			var newf = function () {
					var t = this;

					for (i in initdata) {
							t[i] = initdata[i];
					}

					t.init.apply(t, arguments);

			};

			newf.prototype = new parent();
			newf.prototype.constructor = newf;
			newf.prototype.parent = parent.prototype;

			if (arguments.length > 3) {
					for (var i = 2; i < arguments.length; i++) {
							$.extend(func, arguments[i]);
					}
			}

			hdl.types[name] = newf;
			for (i in func) {
					var fnc = func[i];
					if (fnc.constructor == Function)
							newf.prototype[i] = fnc;
					else
							initdata[i] = fnc;
			}
			return newf;
	}

	var cbId = 0;

	function initItems() {
		var itemElms = d.getElementsByTagName('widget');
		for(var i=0;i<itemElms.length;i++) {
			var elm = itemElms[i],
				data = elm.dataset;
			if (data.item || data.type) {
				var ohData = {};
				if (data.item && allItems[data.item]) {
					ohData = allItems[data.item];
				}
				var type = data.type||(ohData.type || 'baseitem');
				if (!hdl.types[type])
					console.log('handler not found for ',type);
				else {
						//try {
							elm.dashboardItem = new hdl.types[type]({openhabItem:ohData,dataset:data,element:elm});
						/*}
						catch(err) {
							console.log('class not initiated',err,type);
						}*/
				}
			}
		}
	}

	function urlCallback(url,cb,cbparam) {
		var nm = 'jsonp_'+(cbId++);
		w[nm] = cb;
		var el = d.createElement('script');
		el.type = 'text/javascript';
		var ch = url.indexOf('?')==-1?'?':'&';
		el.src = url+ch+(cbparam||'jsoncallback')+'='+nm;
		d.body.appendChild(el);
	}

	var allItems = {};
	function findWidgets(skipitems) {
		if (skipitems) {
			initItems();
		}
		else {
			urlCallback('http:'+opt.host+'/rest/items?type=jsonp',function(d) {
				d.item.forEach(function(v,i) {
					console.log(v);
					allItems[v.name] = v;
				});
				w.dataHandler.items = allItems;
				initItems();
			});
		}
	}

	var opt = {};
	var hdl = w.dataHandler = {
		start:function(settings,skipitems) {
			opt = settings;
			if (!opt) {
				console.log('no settings in start please run dataHandler.start({host:"//ip:port"})');
				return;
			}
			hdl.settings = opt;
			findWidgets(skipitems);
		},
		items:[],
		types:{},
		createType:createClass,
		setItemState:function(link,val) {
			var xhReq = new XMLHttpRequest();
			xhReq.open("POST", link);
 			xhReq.setRequestHeader('Content-Type', 'text/plain');
 			xhReq.send(val);
		},
		newElm: function(nodeName,opt,prt) {
			var r = d.createElement(nodeName);
			if (opt)
				for(var i in opt) {
					var l = opt[i];
					if (i=='classList')
					{
						for(var j=0;j<l.length;j++) {
							r.classList.add(l[j]);
						}
					}
					r[i] = l;
				}
			if(prt)
				prt.appendChild(r);
			return r;
		},
		changePage:function(id) {
			var newpage = d.getElementById(id);
			var otherpages = d.getElementsByClassName('page');
			for(var i=0;i<otherpages.length;i++) {
				var oc = otherpages[i].classList;
				if (!oc.contains('hidden-page'))
					oc.add('hidden-page');
			}
			console.log('nya sidan',newpage);
			newpage.classList.remove('hidden-page');
		},
		hookItemChange:function(url,cb) {
			var io = new WebSocket('ws:'+url+'/state');
			io.onmessage = function(e) {
				cb(e.data);
			}
		},
		requestData:urlCallback
	};

})(document,window);
